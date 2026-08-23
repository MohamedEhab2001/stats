import { randomUUID } from 'crypto'
import { dbConnect } from '@/lib/db/mongoose'
import { Tournament, type TournamentDoc } from '@/lib/models/Tournament'
import { Space } from '@/lib/models/Space'
import { listWeeks, toEngineWeek } from './matchWeeks'
import { listMembers } from './memberships'
import { ServiceError } from './errors'
import {
  monthKey,
  yearKey,
  todayStr,
  filterWeeksForTournament,
  tournamentStatus,
  computePrizes,
  canCreateCustom,
  activeBlockingCustom,
  listTournaments,
  progressFor,
  type TournamentRow,
  type PrizeResult
} from '@/lib/stats-engine/tournaments'
import { randomBadgeKey } from '@/lib/domain/badges'
import { randomBigTournamentId, randomCupId, findLeague } from '@/lib/domain/leagues'
import { randomTournamentName } from '@/lib/domain/tournament-names'

function isValidDateStr(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function mapToObj<T>(m: Map<string, T> | Record<string, T> | undefined | null): Record<string, T> {
  if (!m) return {}
  return m instanceof Map ? Object.fromEntries(m) : m
}

type RowWithId = TournamentRow & { id: string }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toRow(doc: any): RowWithId {
  return {
    id: String(doc._id),
    key: doc.key,
    kind: doc.kind,
    name: doc.name,
    badgeKey: doc.badgeKey,
    leagueId: doc.leagueId ?? null,
    monthKey: doc.monthKey ?? null,
    year: doc.year ?? null,
    startDate: doc.startDate ? new Date(doc.startDate).toISOString().slice(0, 10) : null,
    matchesRequired: doc.matchesRequired ?? null,
    revealed: !!doc.revealed,
    // `winners` is stored as ObjectId refs (see Tournament model), so a `.lean()` read hands back
    // real ObjectId instances here, not strings — stringify them or every winner-name lookup
    // downstream (nameById.get(userId), the trophy cabinet's memberId buckets) silently misses
    // and falls back to displaying the raw ObjectId.
    results: doc.results
      ? {
          prizes: Object.fromEntries(
            Object.entries(mapToObj<PrizeResult>(doc.results.prizes)).map(([key, prize]) => [
              key,
              { ...prize, winners: (prize.winners || []).map((w) => String(w)) }
            ])
          )
        }
      : null
  }
}

/** Loads every Tournament doc for a Space, decorated into the plain-row shape the stats-engine
 * tournament functions expect. Shared by the tournaments list/detail service functions and by
 * the trophy-cabinet service (which needs the same rows to compute cross-tournament winners). */
export async function getTournamentRows(spaceId: string) {
  await dbConnect()
  const docs = await Tournament.find({ spaceId }).lean()
  return { docs, rows: docs.map(toRow) }
}

/** For the given date, atomically upserts the current month's and year's calendar tournaments if
 * they don't already exist. Lazy-created on every tournaments-page visit — good enough for v1,
 * no need to backfill historical months/years that were never visited while current. */
export async function ensureCalendarTournaments(spaceId: string, dateStr: string = todayStr()) {
  await dbConnect()

  const mKey = monthKey(dateStr)
  const yKey = yearKey(dateStr)
  const yKeyNum = Number(yKey)

  const monthlyKey = `monthly-${mKey}`
  await Tournament.findOneAndUpdate(
    { spaceId, key: monthlyKey },
    {
      $setOnInsert: {
        spaceId,
        key: monthlyKey,
        kind: 'monthly',
        name: randomTournamentName(),
        badgeKey: randomBadgeKey(),
        leagueId: randomCupId(),
        monthKey: mKey
      }
    },
    { upsert: true, new: true }
  )

  const yearlyKey = `yearly-${yKey}`
  const yearlyLeagueId = randomBigTournamentId()
  const yearlyLeague = findLeague(yearlyLeagueId)
  await Tournament.findOneAndUpdate(
    { spaceId, key: yearlyKey },
    {
      $setOnInsert: {
        spaceId,
        key: yearlyKey,
        kind: 'yearly',
        name: yearlyLeague ? yearlyLeague.name : `Season ${yKey}`,
        badgeKey: 'wreath',
        leagueId: yearlyLeague ? yearlyLeagueId : null,
        year: yKeyNum
      }
    },
    { upsert: true, new: true }
  )
}

export async function listTournamentsForSpace(spaceId: string) {
  await dbConnect()

  const [{ docs, rows }, weekDocs] = await Promise.all([getTournamentRows(spaceId), listWeeks(spaceId)])
  const weeks = weekDocs.map(toEngineWeek)

  const idByKey = new Map(docs.map((d) => [d.key, String(d._id)]))
  const decorated = listTournaments(rows, weeks)

  return {
    canCreateCustom: canCreateCustom(rows, weeks),
    blockingCustom: activeBlockingCustom(rows, weeks),
    tournaments: decorated.map(({ row, status }) => ({
      id: idByKey.get(row.key)!,
      ...row,
      status,
      progress: progressFor(row, weeks)
    }))
  }
}

export async function getTournamentForSpace(spaceId: string, tournamentId: string) {
  await dbConnect()

  const doc = await Tournament.findOne({ _id: tournamentId, spaceId }).lean()
  if (!doc) throw new ServiceError(404, 'Tournament not found')

  const weekDocs = await listWeeks(spaceId)
  const weeks = weekDocs.map(toEngineWeek)
  const row = toRow(doc)

  return {
    ...row,
    status: tournamentStatus(row, weeks),
    progress: progressFor(row, weeks)
  }
}

export async function createCustomTournament(
  spaceId: string,
  { name, startDate, matchesRequired }: { name?: string; startDate: string; matchesRequired: number }
): Promise<TournamentDoc> {
  await dbConnect()

  if (!isValidDateStr(startDate)) throw new ServiceError(400, 'startDate must be in YYYY-MM-DD format')
  const required = Math.floor(Number(matchesRequired))
  if (!Number.isFinite(required) || required < 1) {
    throw new ServiceError(400, 'matchesRequired must be a positive number')
  }

  const [{ rows }, weekDocs] = await Promise.all([getTournamentRows(spaceId), listWeeks(spaceId)])
  const weeks = weekDocs.map(toEngineWeek)

  if (!canCreateCustom(rows, weeks)) {
    throw new ServiceError(409, 'A custom tournament is already live or upcoming for this space')
  }

  return Tournament.create({
    spaceId,
    kind: 'custom',
    key: `custom-${randomUUID()}`,
    name: name?.trim() || randomTournamentName(),
    badgeKey: randomBadgeKey(),
    leagueId: randomCupId(),
    startDate: new Date(startDate),
    matchesRequired: required,
    revealed: false
  })
}

/** Idempotent: revealing an already-revealed tournament just returns it unchanged. */
export async function revealTournament(spaceId: string, tournamentId: string) {
  await dbConnect()

  const doc = await Tournament.findOne({ _id: tournamentId, spaceId })
  if (!doc) throw new ServiceError(404, 'Tournament not found')
  if (doc.revealed) return doc

  const weekDocs = await listWeeks(spaceId)
  const weeks = weekDocs.map(toEngineWeek)
  const row = toRow(doc.toObject())

  if (tournamentStatus(row, weeks) !== 'finished') {
    throw new ServiceError(400, 'Not finished yet')
  }

  const space = await Space.findById(spaceId).lean()
  if (!space) throw new ServiceError(404, 'Space not found')

  const enabledDefs = space.statDefinitions.filter((s) => s.enabled)
  const resultKey = space.settings!.resultStatKey

  const members = await listMembers(spaceId)
  const memberIds = members.map((m) => m.userId)
  const names = Object.fromEntries(members.map((m) => [m.userId, m.nickname]))

  const eligible = filterWeeksForTournament(row, weeks)
  const prizes = computePrizes(eligible, memberIds, enabledDefs, resultKey, row.kind, names)

  doc.revealed = true
  // `results.prizes` is declared as a Mongoose Map, plain object is cast on save (same pattern
  // as MatchWeek entry.stats elsewhere in this codebase).
  type ResultsShape = NonNullable<TournamentDoc['results']>
  doc.results = { prizes: prizes as unknown as ResultsShape['prizes'], revealedAt: new Date() }
  await doc.save()
  return doc
}

/** Only custom, unrevealed tournaments can be edited — calendar rows are system-generated and
 * revealed results are permanent history, same restriction as deleteCustomTournament below. */
export async function updateCustomTournament(
  spaceId: string,
  tournamentId: string,
  { name, startDate, matchesRequired }: { name?: string; startDate?: string; matchesRequired?: number }
) {
  await dbConnect()

  const doc = await Tournament.findOne({ _id: tournamentId, spaceId })
  if (!doc) throw new ServiceError(404, 'Tournament not found')
  if (doc.kind !== 'custom') throw new ServiceError(400, 'Only custom tournaments can be edited')
  if (doc.revealed) throw new ServiceError(400, "Can't edit a revealed tournament")

  if (name !== undefined) {
    const trimmed = name.trim()
    if (!trimmed) throw new ServiceError(400, 'Name is required')
    doc.name = trimmed
  }
  if (startDate !== undefined) {
    if (!isValidDateStr(startDate)) throw new ServiceError(400, 'startDate must be in YYYY-MM-DD format')
    doc.startDate = new Date(startDate)
  }
  if (matchesRequired !== undefined) {
    const required = Math.floor(Number(matchesRequired))
    if (!Number.isFinite(required) || required < 1) {
      throw new ServiceError(400, 'matchesRequired must be a positive number')
    }
    doc.matchesRequired = required
  }

  await doc.save()
  return doc
}

/** Only custom, unrevealed tournaments can be deleted — calendar rows always exist and revealed
 * results are permanent history. */
export async function deleteCustomTournament(spaceId: string, tournamentId: string) {
  await dbConnect()

  const doc = await Tournament.findOne({ _id: tournamentId, spaceId })
  if (!doc) throw new ServiceError(404, 'Tournament not found')
  if (doc.kind !== 'custom') throw new ServiceError(400, 'Only custom tournaments can be deleted')
  if (doc.revealed) throw new ServiceError(400, "Can't delete a revealed tournament")

  await doc.deleteOne()
  return doc
}

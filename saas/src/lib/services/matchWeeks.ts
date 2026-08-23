import { Types } from 'mongoose'
import { dbConnect } from '@/lib/db/mongoose'
import { MatchWeek } from '@/lib/models/MatchWeek'
import { Space } from '@/lib/models/Space'
import { ActiveChallenge } from '@/lib/models/ActiveChallenge'
import {
  performanceIndex,
  standingsForMembers,
  sharedWeeks,
  computePairwiseRecord,
  pairwisePerStatRecord,
  type Week
} from '@/lib/stats-engine/core'
import { ServiceError } from './errors'
import { listMembers } from './memberships'

function isValidWeekKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

export async function findOrCreateWeek(spaceId: string, dateStr: string) {
  await dbConnect()
  if (!isValidWeekKey(dateStr)) throw new ServiceError(400, 'date must be in YYYY-MM-DD format')

  let week = await MatchWeek.findOne({ spaceId, weekKey: dateStr })
  if (!week) {
    week = await MatchWeek.create({ spaceId, weekKey: dateStr, date: new Date(dateStr), entries: [] })
  }
  return week
}

export async function listWeeks(spaceId: string, opts: { from?: string; to?: string } = {}) {
  await dbConnect()
  const query: Record<string, unknown> = { spaceId }
  const dateFilter: Record<string, Date> = {}
  if (opts.from) dateFilter.$gte = new Date(opts.from)
  if (opts.to) dateFilter.$lte = new Date(opts.to)
  if (Object.keys(dateFilter).length > 0) query.date = dateFilter

  return MatchWeek.find(query).sort({ date: -1 }).lean()
}

export async function getWeekById(spaceId: string, weekId: string) {
  await dbConnect()
  return MatchWeek.findOne({ _id: weekId, spaceId })
}

/** Converts a stored MatchWeek doc (with its `entries.stats` Map) into the plain-object shape
 * the stats-engine core functions expect. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toEngineWeek(week: any): Week {
  return {
    id: String(week._id),
    date: week.weekKey,
    entries: (week.entries ?? []).map((e: { userId: unknown; stats: unknown }) => ({
      userId: String(e.userId),
      stats: (e.stats instanceof Map ? Object.fromEntries(e.stats) : (e.stats as Record<string, number>)) ?? {}
    }))
  }
}

/** Upserts the calling member's own entry for a week, computed against the Space's *currently*
 * enabled stat definitions. Historical entries keep whatever keys existed when they were logged
 * even if an attribute is later disabled — only the write path is constrained to enabled keys. */
export async function upsertMyEntry(
  spaceId: string,
  weekId: string,
  userId: string,
  statsInput: Record<string, unknown>,
  challengeCompleted?: boolean
) {
  await dbConnect()

  const space = await Space.findById(spaceId)
  if (!space) throw new ServiceError(404, 'Space not found')

  const enabledDefs = space.statDefinitions.filter((s) => s.enabled)

  const stats: Record<string, number> = {}
  for (const def of enabledDefs) {
    const raw = Number(statsInput[def.key])
    stats[def.key] = Number.isFinite(raw) ? raw : 0
  }

  const pIndex = performanceIndex(stats, enabledDefs)

  const week = await MatchWeek.findOne({ _id: weekId, spaceId })
  if (!week) throw new ServiceError(404, 'Week not found')

  // Only touch challengeCompletion when the caller explicitly passed a boolean, and only if the
  // Space actually has an active challenge right now (a stale/missing one is silently ignored).
  let challengeCompletion: { challengeId: string; completed: boolean } | null = null
  if (typeof challengeCompleted === 'boolean') {
    const active = await ActiveChallenge.findOne({ spaceId }).lean()
    if (active) {
      challengeCompletion = { challengeId: active.challengeId, completed: challengeCompleted }
      if (!week.activeChallengeId) week.activeChallengeId = active.challengeId
    }
  }

  const now = new Date()
  const existing = week.entries.find((e) => String(e.userId) === userId)

  if (existing) {
    // `stats` is declared as a Mongoose Map, but assigning a plain object is fine — Mongoose
    // casts it on save. TypeScript doesn't know that, hence the cast.
    existing.stats = stats as unknown as typeof existing.stats
    existing.pIndex = pIndex
    existing.updatedAt = now
    if (challengeCompletion) existing.challengeCompletion = challengeCompletion
  } else {
    week.entries.push({
      userId: new Types.ObjectId(userId),
      stats: stats as unknown as Map<string, number>,
      pIndex,
      challengeCompletion,
      loggedAt: now,
      updatedAt: now
    })
  }

  await week.save()
  return week
}

type Window = 'month' | 'year' | 'all'

function windowRange(window: Window): { from?: string; to?: string } {
  const now = new Date()
  if (window === 'month') {
    return { from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString() }
  }
  if (window === 'year') {
    return { from: new Date(now.getFullYear(), 0, 1).toISOString() }
  }
  return {}
}

export async function getStandingsForSpace(spaceId: string, window: Window) {
  await dbConnect()

  const space = await Space.findById(spaceId).lean()
  if (!space) throw new ServiceError(404, 'Space not found')

  const enabledDefs = space.statDefinitions.filter((s) => s.enabled)
  const resultStatKey = space.settings!.resultStatKey

  const { from, to } = windowRange(window)
  const weekDocs = await listWeeks(spaceId, { from, to })
  const weeks = weekDocs.map(toEngineWeek)

  const members = await listMembers(spaceId)
  const memberIds = members.map((m) => m.userId)

  const standings = standingsForMembers(weeks, memberIds, enabledDefs, resultStatKey)

  const rows = members
    .map((m) => ({ ...standings[m.userId], userId: m.userId, nickname: m.nickname, name: m.name }))
    .sort((a, b) => b.pIndex - a.pIndex)

  return { statDefs: enabledDefs, resultStatKey, window, rows }
}

export async function getComparisonForSpace(spaceId: string, a: string, b: string) {
  await dbConnect()

  if (a === b) throw new ServiceError(400, 'Pick two different members')

  const space = await Space.findById(spaceId).lean()
  if (!space) throw new ServiceError(404, 'Space not found')

  const enabledDefs = space.statDefinitions.filter((s) => s.enabled)
  const resultStatKey = space.settings!.resultStatKey

  const members = await listMembers(spaceId)
  const memberA = members.find((m) => m.userId === a)
  const memberB = members.find((m) => m.userId === b)
  if (!memberA || !memberB) throw new ServiceError(404, 'Member not found in this space')

  const weekDocs = await listWeeks(spaceId)
  const weeks = weekDocs.map(toEngineWeek)
  const shared = sharedWeeks(weeks, a, b)

  const record = computePairwiseRecord(shared, a, b, resultStatKey)
  const perStat = pairwisePerStatRecord(shared, a, b, enabledDefs)

  return {
    a: { userId: memberA.userId, nickname: memberA.nickname, name: memberA.name },
    b: { userId: memberB.userId, nickname: memberB.nickname, name: memberB.name },
    resultStatKey,
    statDefs: enabledDefs,
    sharedWeeksCount: shared.length,
    record,
    perStat
  }
}

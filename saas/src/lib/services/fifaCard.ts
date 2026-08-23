import { dbConnect } from '@/lib/db/mongoose'
import { Space } from '@/lib/models/Space'
import { listWeeks, toEngineWeek } from './matchWeeks'
import { listMembers } from './memberships'
import { computeFifaCard, type FifaCard } from '@/lib/stats-engine/fifaCard'
import { ServiceError } from './errors'

// The six canonical stat keys the FIFA card formulas are defined against (see
// lib/stats-engine/fifaCard.ts). If a Space has disabled one of these attributes, it simply
// totals to 0 for everyone — the card still renders, just flatter on that axis.
const CARD_STAT_KEYS = ['goals', 'assists', 'dribbles', 'possessionWon', 'shotsOnTarget', 'shotsOffTarget']

function aggregateForMember(weeks: ReturnType<typeof toEngineWeek>[], userId: string) {
  const totals: Record<string, number> = Object.fromEntries(CARD_STAT_KEYS.map((k) => [k, 0]))
  let played = 0
  for (const week of weeks) {
    const entry = week.entries.find((e) => e.userId === userId)
    if (!entry) continue
    played++
    for (const key of CARD_STAT_KEYS) totals[key] += Number(entry.stats[key]) || 0
  }
  return { totals, played }
}

export type FifaCardResult = FifaCard & { userId: string; nickname: string; name: string; played: number }

/** One member's card, or every member's if `userId` is omitted. Every field on the card is
 * computed straight from logged match stats — no self-rating, nothing manually editable. */
export async function getFifaCardForSpace(
  spaceId: string,
  userId?: string
): Promise<Record<string, FifaCardResult>> {
  await dbConnect()

  const space = await Space.findById(spaceId).lean()
  if (!space) throw new ServiceError(404, 'Space not found')

  const members = await listMembers(spaceId)
  const targets = userId ? members.filter((m) => m.userId === userId) : members
  if (userId && targets.length === 0) throw new ServiceError(404, 'Member not found in this space')

  const weekDocs = await listWeeks(spaceId)
  const weeks = weekDocs.map(toEngineWeek)

  const out: Record<string, FifaCardResult> = {}
  for (const member of targets) {
    const { totals, played } = aggregateForMember(weeks, member.userId)
    const card = computeFifaCard({ played, totals })
    out[member.userId] = {
      ...card,
      userId: member.userId,
      nickname: member.nickname,
      name: member.name,
      played
    }
  }
  return out
}

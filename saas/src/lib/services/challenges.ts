import { dbConnect } from '@/lib/db/mongoose'
import { ActiveChallenge } from '@/lib/models/ActiveChallenge'
import { findChallenge, type Challenge } from '@/lib/domain/challenge-catalog'
import { listWeeks } from './matchWeeks'
import { listMembers } from './memberships'
import { ServiceError } from './errors'

export type ActiveChallengeInfo = {
  id: string
  challengeId: string
  setAt: Date
  setByUserId: string
  challenge: Challenge
}

/** Returns the Space's current active challenge joined with its catalog info, or null if none is
 * set (or the stored id no longer resolves to a catalog entry). */
export async function getActiveChallenge(spaceId: string): Promise<ActiveChallengeInfo | null> {
  await dbConnect()
  const doc = await ActiveChallenge.findOne({ spaceId }).lean()
  if (!doc) return null

  const challenge = findChallenge(doc.challengeId)
  if (!challenge) return null

  return {
    id: String(doc._id),
    challengeId: doc.challengeId,
    setAt: doc.setAt,
    setByUserId: String(doc.setByUserId),
    challenge
  }
}

/** Owner-only. Upserts the Space's one active challenge (unique on spaceId). */
export async function setActiveChallenge(
  spaceId: string,
  challengeId: string,
  userId: string,
  requesterRole: 'owner' | 'member'
) {
  await dbConnect()

  if (requesterRole !== 'owner') throw new ServiceError(403, 'Only the owner can set the active challenge')

  const challenge = findChallenge(challengeId)
  if (!challenge) throw new ServiceError(400, 'Unknown challenge')

  return ActiveChallenge.findOneAndUpdate(
    { spaceId },
    { $set: { challengeId, setAt: new Date(), setByUserId: userId } },
    { upsert: true, new: true }
  )
}

export type ChallengeHistoryRow = {
  weekId: string
  weekKey: string
  challengeId: string
  challenge: Challenge | null
  completions: { userId: string; nickname: string; completed: boolean }[]
}

/** Weeks where at least one entry recorded a challenge completion, decorated with catalog info
 * and which members completed it. Works off the raw week docs (not `toEngineWeek`, whose plain
 * shape drops `challengeCompletion`). */
export async function getChallengeHistory(spaceId: string): Promise<ChallengeHistoryRow[]> {
  await dbConnect()

  const [weekDocs, members] = await Promise.all([listWeeks(spaceId), listMembers(spaceId)])
  const nicknameById = new Map(members.map((m) => [m.userId, m.nickname]))

  const history: ChallengeHistoryRow[] = []

  for (const week of weekDocs) {
    const withChallenge = week.entries.filter((e) => e.challengeCompletion)
    if (withChallenge.length === 0) continue

    const byChallengeId = new Map<string, typeof withChallenge>()
    for (const entry of withChallenge) {
      const challengeId = entry.challengeCompletion!.challengeId
      if (!byChallengeId.has(challengeId)) byChallengeId.set(challengeId, [])
      byChallengeId.get(challengeId)!.push(entry)
    }

    for (const [challengeId, entries] of byChallengeId) {
      history.push({
        weekId: String(week._id),
        weekKey: week.weekKey,
        challengeId,
        challenge: findChallenge(challengeId),
        completions: entries.map((e) => ({
          userId: String(e.userId),
          nickname: nicknameById.get(String(e.userId)) ?? 'Unknown',
          completed: !!e.challengeCompletion!.completed
        }))
      })
    }
  }

  history.sort((a, b) => b.weekKey.localeCompare(a.weekKey))
  return history
}

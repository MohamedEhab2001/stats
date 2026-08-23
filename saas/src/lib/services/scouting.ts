import { dbConnect } from '@/lib/db/mongoose'
import { Space } from '@/lib/models/Space'
import { listWeeks, toEngineWeek } from './matchWeeks'
import { listMembers } from './memberships'
import { scoutAll, scoutPlayer, type ScoutReport } from '@/lib/stats-engine/scouting'
import { ServiceError } from './errors'

export type ScoutedMember = ScoutReport & { userId: string; nickname: string; name: string }

/** Scouts every member of a Space (or just `userId`, if given), using the Space's currently
 * enabled stat definitions and result stat. Mirrors the `getStandingsForSpace` data-loading
 * pattern in matchWeeks.ts. */
export async function getScoutingForSpace(
  spaceId: string,
  userId?: string
): Promise<{ reports: Record<string, ScoutedMember> }> {
  await dbConnect()

  const space = await Space.findById(spaceId).lean()
  if (!space) throw new ServiceError(404, 'Space not found')

  const enabledDefs = space.statDefinitions.filter((s) => s.enabled)
  const resultKey = space.settings!.resultStatKey

  const weekDocs = await listWeeks(spaceId)
  const weeks = weekDocs.map(toEngineWeek)

  const members = await listMembers(spaceId)

  if (userId) {
    const member = members.find((m) => m.userId === userId)
    if (!member) throw new ServiceError(404, 'Member not found in this space')

    const report = scoutPlayer(weeks, userId, enabledDefs, resultKey)
    return { reports: { [userId]: { ...report, userId, nickname: member.nickname, name: member.name } } }
  }

  const memberIds = members.map((m) => m.userId)
  const reports = scoutAll(weeks, memberIds, enabledDefs, resultKey)

  return {
    reports: Object.fromEntries(
      members.map((m) => [m.userId, { ...reports[m.userId], userId: m.userId, nickname: m.nickname, name: m.name }])
    )
  }
}

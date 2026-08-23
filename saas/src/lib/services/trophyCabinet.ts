import { dbConnect } from '@/lib/db/mongoose'
import { getTournamentRows } from './tournaments'
import { listMembers } from './memberships'
import { trophyCabinet } from '@/lib/stats-engine/tournaments'

export type TrophyCabinetMember = {
  userId: string
  nickname: string
  name: string
  trophies: Record<string, { key: string; name: string; kind: string; badge: string; leagueId: number | null }[]>
}

export async function getTrophyCabinetForSpace(spaceId: string): Promise<TrophyCabinetMember[]> {
  await dbConnect()

  const [{ rows }, members] = await Promise.all([getTournamentRows(spaceId), listMembers(spaceId)])
  const memberIds = members.map((m) => m.userId)
  const cabinet = trophyCabinet(rows, memberIds)

  return members.map((m) => ({
    userId: m.userId,
    nickname: m.nickname,
    name: m.name,
    trophies: cabinet[m.userId] ?? {}
  }))
}

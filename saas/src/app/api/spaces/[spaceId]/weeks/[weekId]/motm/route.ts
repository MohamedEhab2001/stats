import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getActiveMembership, listMembers } from '@/lib/services/memberships'
import { getWeekById, toEngineWeek } from '@/lib/services/matchWeeks'
import { computeMOTM } from '@/lib/stats-engine/motm'
import { errorResponse } from '@/lib/services/errors'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ spaceId: string; weekId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { spaceId, weekId } = await params

  try {
    const membership = await getActiveMembership(spaceId, session.user.id)
    if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const week = await getWeekById(spaceId, weekId)
    if (!week) return NextResponse.json({ error: 'Week not found' }, { status: 404 })

    const result = computeMOTM(toEngineWeek(week))
    if (!result) return NextResponse.json({ motm: null })

    const members = await listMembers(spaceId)
    const nicknameById = new Map(members.map((m) => [m.userId, m.nickname]))

    return NextResponse.json({
      motm: {
        winner: result.winner,
        winnerNickname: result.winner === 'tie' ? null : (nicknameById.get(result.winner) ?? null),
        scores: result.scores,
        reasons: result.reasons
      }
    })
  } catch (err) {
    return errorResponse(err)
  }
}

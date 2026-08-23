import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getActiveMembership } from '@/lib/services/memberships'
import { revealTournament } from '@/lib/services/tournaments'
import { errorResponse } from '@/lib/services/errors'

export const dynamic = 'force-dynamic'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ spaceId: string; tournamentId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { spaceId, tournamentId } = await params

  try {
    const membership = await getActiveMembership(spaceId, session.user.id)
    if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const doc = await revealTournament(spaceId, tournamentId)
    return NextResponse.json({ id: String(doc._id), revealed: doc.revealed })
  } catch (err) {
    return errorResponse(err)
  }
}

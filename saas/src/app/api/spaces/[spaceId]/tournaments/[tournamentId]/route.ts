import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getActiveMembership } from '@/lib/services/memberships'
import { getTournamentForSpace, updateCustomTournament, deleteCustomTournament } from '@/lib/services/tournaments'
import { errorResponse } from '@/lib/services/errors'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ spaceId: string; tournamentId: string }> }

export async function GET(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { spaceId, tournamentId } = await params

  try {
    const membership = await getActiveMembership(spaceId, session.user.id)
    if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const tournament = await getTournamentForSpace(spaceId, tournamentId)
    return NextResponse.json(tournament)
  } catch (err) {
    return errorResponse(err)
  }
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { spaceId, tournamentId } = await params

  const body = await req.json().catch(() => null)

  try {
    const membership = await getActiveMembership(spaceId, session.user.id)
    if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (membership.role !== 'owner') {
      return NextResponse.json({ error: 'Only the Space Manager can edit tournaments' }, { status: 403 })
    }

    const doc = await updateCustomTournament(spaceId, tournamentId, {
      name: typeof body?.name === 'string' ? body.name : undefined,
      startDate: typeof body?.startDate === 'string' ? body.startDate : undefined,
      matchesRequired: body?.matchesRequired !== undefined ? Number(body.matchesRequired) : undefined
    })
    return NextResponse.json({ id: String(doc._id) })
  } catch (err) {
    return errorResponse(err)
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { spaceId, tournamentId } = await params

  try {
    const membership = await getActiveMembership(spaceId, session.user.id)
    if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (membership.role !== 'owner') {
      return NextResponse.json({ error: 'Only the Space Manager can delete tournaments' }, { status: 403 })
    }

    await deleteCustomTournament(spaceId, tournamentId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return errorResponse(err)
  }
}

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getActiveMembership } from '@/lib/services/memberships'
import { ensureCalendarTournaments, listTournamentsForSpace, createCustomTournament } from '@/lib/services/tournaments'
import { todayStr } from '@/lib/stats-engine/tournaments'
import { errorResponse } from '@/lib/services/errors'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ spaceId: string }> }

export async function GET(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { spaceId } = await params

  try {
    const membership = await getActiveMembership(spaceId, session.user.id)
    if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await ensureCalendarTournaments(spaceId, todayStr())
    const result = await listTournamentsForSpace(spaceId)
    return NextResponse.json(result)
  } catch (err) {
    return errorResponse(err)
  }
}

export async function POST(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { spaceId } = await params

  const body = await req.json().catch(() => null)

  try {
    const membership = await getActiveMembership(spaceId, session.user.id)
    if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (membership.role !== 'owner') {
      return NextResponse.json({ error: 'Only the Space Manager can create tournaments' }, { status: 403 })
    }

    const doc = await createCustomTournament(spaceId, {
      name: typeof body?.name === 'string' ? body.name : undefined,
      startDate: String(body?.startDate || ''),
      matchesRequired: Number(body?.matchesRequired)
    })
    return NextResponse.json({ id: String(doc._id), key: doc.key }, { status: 201 })
  } catch (err) {
    return errorResponse(err)
  }
}

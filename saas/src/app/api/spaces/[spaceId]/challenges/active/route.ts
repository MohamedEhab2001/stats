import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getActiveMembership } from '@/lib/services/memberships'
import { getActiveChallenge, setActiveChallenge } from '@/lib/services/challenges'
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

    const active = await getActiveChallenge(spaceId)
    return NextResponse.json({ active })
  } catch (err) {
    return errorResponse(err)
  }
}

export async function PUT(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { spaceId } = await params

  const body = await req.json().catch(() => null)
  const challengeId = String(body?.challengeId || '')
  if (!challengeId) return NextResponse.json({ error: 'challengeId is required' }, { status: 400 })

  try {
    const membership = await getActiveMembership(spaceId, session.user.id)
    if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const doc = await setActiveChallenge(spaceId, challengeId, session.user.id, membership.role)
    return NextResponse.json({ id: String(doc._id), challengeId: doc.challengeId })
  } catch (err) {
    return errorResponse(err)
  }
}

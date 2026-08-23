import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getActiveMembership, updateMemberNickname, removeMember } from '@/lib/services/memberships'
import { errorResponse } from '@/lib/services/errors'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ spaceId: string; userId: string }> }

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { spaceId, userId } = await params

  const body = await req.json().catch(() => null)
  const nickname = String(body?.nickname || '').trim()
  if (!nickname) return NextResponse.json({ error: 'Nickname is required' }, { status: 400 })

  try {
    const requesterMembership = await getActiveMembership(spaceId, session.user.id)
    if (!requesterMembership) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const updated = await updateMemberNickname(
      spaceId,
      userId,
      { userId: session.user.id, role: requesterMembership.role },
      nickname
    )
    return NextResponse.json({ userId, nickname: updated.nickname })
  } catch (err) {
    return errorResponse(err)
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { spaceId, userId } = await params

  try {
    const requesterMembership = await getActiveMembership(spaceId, session.user.id)
    if (!requesterMembership) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await removeMember(spaceId, userId, { userId: session.user.id, role: requesterMembership.role })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return errorResponse(err)
  }
}

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getActiveMembership, listMembers } from '@/lib/services/memberships'
import { createInvite } from '@/lib/services/invites'
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

    const members = await listMembers(spaceId)
    // Access codes are permanent login credentials — only the owner may see anyone's (owners
    // never have one themselves, so this is a no-op for them either way).
    const isOwner = membership.role === 'owner'
    const visibleMembers = isOwner
      ? members
      : members.map((m) => ({ ...m, accessCode: null }))
    return NextResponse.json({ members: visibleMembers })
  } catch (err) {
    return errorResponse(err)
  }
}

/** Owner-only: adds a Space Member directly (email + nickname) and returns their permanent access
 * code immediately — there's no separate invite-redemption step anymore. */
export async function POST(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { spaceId } = await params

  const body = await req.json().catch(() => null)
  const email = String(body?.email || '').trim()
  const nickname = String(body?.nickname || '').trim()
  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  if (!nickname) return NextResponse.json({ error: 'Nickname is required' }, { status: 400 })

  try {
    const membership = await getActiveMembership(spaceId, session.user.id)
    if (!membership || membership.role !== 'owner') {
      return NextResponse.json({ error: 'Only the owner can add members' }, { status: 403 })
    }

    const result = await createInvite(spaceId, session.user.id, { email, nickname })
    return NextResponse.json(
      {
        inviteId: String(result.invite._id),
        email,
        nickname: result.invite.nickname,
        accessCode: result.accessCode,
        billable: result.billable
      },
      { status: 201 }
    )
  } catch (err) {
    return errorResponse(err)
  }
}

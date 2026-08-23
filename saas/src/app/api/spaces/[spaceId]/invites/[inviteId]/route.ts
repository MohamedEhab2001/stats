import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getActiveMembership } from '@/lib/services/memberships'
import { revokeInvite } from '@/lib/services/invites'
import { errorResponse } from '@/lib/services/errors'

export const dynamic = 'force-dynamic'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ spaceId: string; inviteId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { spaceId, inviteId } = await params

  try {
    const membership = await getActiveMembership(spaceId, session.user.id)
    if (!membership || membership.role !== 'owner') {
      return NextResponse.json({ error: 'Only the owner can revoke invites' }, { status: 403 })
    }

    const invite = await revokeInvite(spaceId, inviteId)
    return NextResponse.json({ id: String(invite._id), status: invite.status })
  } catch (err) {
    return errorResponse(err)
  }
}

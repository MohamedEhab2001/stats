import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getActiveMembership } from '@/lib/services/memberships'
import { listInvites } from '@/lib/services/invites'
import { errorResponse } from '@/lib/services/errors'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ spaceId: string }> }

// Audit/history only now — adding a member is POST /api/spaces/[spaceId]/members, which creates
// the Membership (and its access code) immediately instead of a pending, separately-redeemed
// invite. This still lists the Invite records those calls leave behind.
export async function GET(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { spaceId } = await params

  try {
    const membership = await getActiveMembership(spaceId, session.user.id)
    if (!membership || membership.role !== 'owner') {
      return NextResponse.json({ error: 'Only the owner can view invites' }, { status: 403 })
    }

    const invites = await listInvites(spaceId)
    return NextResponse.json({ invites })
  } catch (err) {
    return errorResponse(err)
  }
}

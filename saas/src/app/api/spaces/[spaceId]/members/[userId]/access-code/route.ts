import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getActiveMembership } from '@/lib/services/memberships'
import { regenerateAccessCode } from '@/lib/services/invites'
import { errorResponse } from '@/lib/services/errors'

export const dynamic = 'force-dynamic'

/** Owner-only: "I lost the code, resend it" — rotates a member's permanent access code. */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ spaceId: string; userId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { spaceId, userId } = await params

  try {
    const requesterMembership = await getActiveMembership(spaceId, session.user.id)
    if (!requesterMembership) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const accessCode = await regenerateAccessCode(spaceId, userId, {
      userId: session.user.id,
      role: requesterMembership.role
    })
    return NextResponse.json({ userId, accessCode })
  } catch (err) {
    return errorResponse(err)
  }
}

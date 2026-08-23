import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getActiveMembership } from '@/lib/services/memberships'
import { errorResponse } from '@/lib/services/errors'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ spaceId: string }> }

/**
 * Stub for the EasyKash "buy more seats" flow — owner-only, not implemented yet.
 *
 * The real flow, once wired up:
 *   1. Compute the price for the requested extra seat count.
 *   2. Create a `Payment` doc: { spaceId, customerReference: `space_${spaceId}_seat_${Date.now()}`,
 *      amount, currency: 'EGP', status: 'NEW' }.
 *   3. POST to EasyKash's Direct Payment Hosted endpoint (`/api/directpayv1/pay`) with that
 *      customerReference, amount, and a return/callback URL pointing at
 *      `/api/webhooks/easykash`.
 *   4. Return `{ redirectUrl }` from EasyKash's response so the client can send the owner there
 *      to complete payment.
 *   5. `Space.plan.memberCap` is only bumped once the webhook below confirms a PAID status —
 *      never optimistically here.
 */
export async function POST(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { spaceId } = await params

  try {
    const membership = await getActiveMembership(spaceId, session.user.id)
    if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (membership.role !== 'owner') {
      return NextResponse.json({ error: 'Only the space owner can upgrade billing' }, { status: 403 })
    }

    return NextResponse.json(
      { error: 'Billing is not available yet — contact the space owner to upgrade manually.' },
      { status: 501 }
    )
  } catch (err) {
    return errorResponse(err)
  }
}

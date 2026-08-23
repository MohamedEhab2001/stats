import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Stub for the EasyKash payment callback. Not implemented yet — always acknowledges with 200 so
 * EasyKash doesn't retry, but does nothing else.
 *
 * The real implementation, once wired up:
 *   1. Read the raw body (already done below) and parse its fields: `ProductCode`, `Amount`,
 *      `ProductType`, `PaymentMethod`, `status`, `easykashRef`, `customerReference`,
 *      `signatureHash`.
 *   2. Recompute the signature: HMAC-SHA512, keyed with our EasyKash secret, over those six core
 *      fields (excluding `signatureHash` itself) sorted alphabetically by field name and
 *      concatenated. Compare against `signatureHash` with a constant-time comparison — reject
 *      (but still 200, per EasyKash's expectations) if it doesn't match.
 *   3. Look up the `Payment` doc by `customerReference`. If `status === 'PAID'` and the
 *      signature verified: mark the Payment doc `paid` (status, easykashRef, signatureVerified,
 *      rawCallback, paidAt), then bump the owning `Space.plan.memberCap` by the seat count that
 *      payment was for.
 *   4. Any other status (FAILED/EXPIRED/CANCELED/...) just updates the Payment doc's status for
 *      bookkeeping — no plan change.
 */
export async function POST(request: Request) {
  const _rawBody = await request.text()
  void _rawBody // placeholder until signature verification + Payment lookup are implemented

  return NextResponse.json({ ok: true })
}

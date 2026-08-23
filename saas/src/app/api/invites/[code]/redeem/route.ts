import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { redeemInvite } from '@/lib/services/invites'
import { errorResponse } from '@/lib/services/errors'

export const dynamic = 'force-dynamic'

export async function POST(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { code } = await params

  try {
    const result = await redeemInvite(code, session.user.id)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    return NextResponse.json({
      spaceId: result.spaceId,
      spaceSlug: result.spaceSlug,
      alreadyMember: result.alreadyMember
    })
  } catch (err) {
    return errorResponse(err)
  }
}

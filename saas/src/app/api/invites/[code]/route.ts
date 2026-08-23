import { NextResponse } from 'next/server'
import { getInviteInfo } from '@/lib/services/invites'
import { errorResponse } from '@/lib/services/errors'

export const dynamic = 'force-dynamic'

// Public: resolves just enough info (space name + nickname) for the /join/[code] landing page.
// Never leaks membership lists, plan details, or anything else about the Space.
export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params

  try {
    const invite = await getInviteInfo(code)
    if (!invite) return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    return NextResponse.json(invite)
  } catch (err) {
    return errorResponse(err)
  }
}

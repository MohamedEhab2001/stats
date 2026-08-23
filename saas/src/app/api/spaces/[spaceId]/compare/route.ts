import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getActiveMembership } from '@/lib/services/memberships'
import { getComparisonForSpace } from '@/lib/services/matchWeeks'
import { errorResponse } from '@/lib/services/errors'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: Promise<{ spaceId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { spaceId } = await params

  const url = new URL(req.url)
  const a = url.searchParams.get('a')
  const b = url.searchParams.get('b')
  if (!a || !b) return NextResponse.json({ error: 'a and b query params are required' }, { status: 400 })

  try {
    const membership = await getActiveMembership(spaceId, session.user.id)
    if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const comparison = await getComparisonForSpace(spaceId, a, b)
    return NextResponse.json(comparison)
  } catch (err) {
    return errorResponse(err)
  }
}

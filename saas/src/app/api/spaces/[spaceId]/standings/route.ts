import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getActiveMembership } from '@/lib/services/memberships'
import { getStandingsForSpace } from '@/lib/services/matchWeeks'
import { errorResponse } from '@/lib/services/errors'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: Promise<{ spaceId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { spaceId } = await params

  const url = new URL(req.url)
  const windowParam = url.searchParams.get('window')
  const window = windowParam === 'month' || windowParam === 'year' ? windowParam : 'all'

  try {
    const membership = await getActiveMembership(spaceId, session.user.id)
    if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const standings = await getStandingsForSpace(spaceId, window)
    return NextResponse.json(standings)
  } catch (err) {
    return errorResponse(err)
  }
}

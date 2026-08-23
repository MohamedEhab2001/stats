import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getActiveMembership } from '@/lib/services/memberships'
import { getScoutingForSpace } from '@/lib/services/scouting'
import { errorResponse } from '@/lib/services/errors'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: Promise<{ spaceId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { spaceId } = await params

  const url = new URL(req.url)
  const userId = url.searchParams.get('userId') ?? undefined

  try {
    const membership = await getActiveMembership(spaceId, session.user.id)
    if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const result = await getScoutingForSpace(spaceId, userId)
    return NextResponse.json(result)
  } catch (err) {
    return errorResponse(err)
  }
}

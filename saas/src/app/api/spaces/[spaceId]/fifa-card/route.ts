import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getActiveMembership } from '@/lib/services/memberships'
import { getFifaCardForSpace } from '@/lib/services/fifaCard'
import { errorResponse } from '@/lib/services/errors'

export const dynamic = 'force-dynamic'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { spaceId } = await params

  try {
    const membership = await getActiveMembership(spaceId, session.user.id)
    if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const userId = new URL(req.url).searchParams.get('userId') ?? undefined
    const cards = await getFifaCardForSpace(spaceId, userId)
    return NextResponse.json({ cards })
  } catch (err) {
    return errorResponse(err)
  }
}

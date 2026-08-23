import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getActiveMembership } from '@/lib/services/memberships'
import { getTrophyCabinetForSpace } from '@/lib/services/trophyCabinet'
import { errorResponse } from '@/lib/services/errors'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ spaceId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { spaceId } = await params

  try {
    const membership = await getActiveMembership(spaceId, session.user.id)
    if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const members = await getTrophyCabinetForSpace(spaceId)
    return NextResponse.json({ members })
  } catch (err) {
    return errorResponse(err)
  }
}

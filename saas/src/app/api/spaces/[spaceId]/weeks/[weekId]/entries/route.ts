import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getActiveMembership } from '@/lib/services/memberships'
import { upsertMyEntry } from '@/lib/services/matchWeeks'
import { errorResponse } from '@/lib/services/errors'

export const dynamic = 'force-dynamic'

// Body is a Record<string, number> of stat values keyed by the Space's enabled stat keys, plus
// an optional `challengeCompleted: boolean` — unknown stat keys are ignored and disabled keys
// are never persisted here.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ spaceId: string; weekId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { spaceId, weekId } = await params

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid stats payload' }, { status: 400 })
  }

  const { challengeCompleted, ...statsBody } = body as Record<string, unknown>

  try {
    const membership = await getActiveMembership(spaceId, session.user.id)
    if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const week = await upsertMyEntry(
      spaceId,
      weekId,
      session.user.id,
      statsBody,
      typeof challengeCompleted === 'boolean' ? challengeCompleted : undefined
    )
    const myEntry = week.entries.find((e) => String(e.userId) === session.user.id)

    return NextResponse.json({
      weekId: String(week._id),
      pIndex: myEntry?.pIndex ?? 0
    })
  } catch (err) {
    return errorResponse(err)
  }
}

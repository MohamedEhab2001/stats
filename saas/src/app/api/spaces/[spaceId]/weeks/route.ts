import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getActiveMembership } from '@/lib/services/memberships'
import { findOrCreateWeek, listWeeks } from '@/lib/services/matchWeeks'
import { errorResponse } from '@/lib/services/errors'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ spaceId: string }> }

export async function GET(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { spaceId } = await params

  try {
    const membership = await getActiveMembership(spaceId, session.user.id)
    if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const url = new URL(req.url)
    const from = url.searchParams.get('from') ?? undefined
    const to = url.searchParams.get('to') ?? undefined

    const weeks = await listWeeks(spaceId, { from, to })
    return NextResponse.json({
      weeks: weeks.map((w) => ({
        id: String(w._id),
        weekKey: w.weekKey,
        date: w.date,
        entries: w.entries.map((e) => ({ userId: String(e.userId), pIndex: e.pIndex }))
      }))
    })
  } catch (err) {
    return errorResponse(err)
  }
}

export async function POST(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { spaceId } = await params

  const body = await req.json().catch(() => null)
  const date = String(body?.date || '')

  try {
    const membership = await getActiveMembership(spaceId, session.user.id)
    if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const week = await findOrCreateWeek(spaceId, date)
    return NextResponse.json({ id: String(week._id), weekKey: week.weekKey, date: week.date })
  } catch (err) {
    return errorResponse(err)
  }
}

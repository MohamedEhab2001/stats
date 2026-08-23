import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getActiveMembership } from '@/lib/services/memberships'
import { listStatDefinitions, addCustomStatDefinition } from '@/lib/services/statDefinitions'
import { errorResponse } from '@/lib/services/errors'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ spaceId: string }> }

export async function GET(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { spaceId } = await params

  try {
    const membership = await getActiveMembership(spaceId, session.user.id)
    if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const statDefinitions = await listStatDefinitions(spaceId)
    return NextResponse.json({ statDefinitions })
  } catch (err) {
    return errorResponse(err)
  }
}

export async function POST(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { spaceId } = await params

  const body = await req.json().catch(() => null)

  try {
    const membership = await getActiveMembership(spaceId, session.user.id)
    if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const def = await addCustomStatDefinition(
      spaceId,
      {
        key: String(body?.key || ''),
        label: String(body?.label || ''),
        short: String(body?.short || ''),
        max: Number(body?.max),
        weight: Number(body?.weight),
        higherIsBetter: Boolean(body?.higherIsBetter ?? true),
        blurb: body?.blurb ? String(body.blurb) : ''
      },
      membership.role
    )
    return NextResponse.json({ statDefinition: def }, { status: 201 })
  } catch (err) {
    return errorResponse(err)
  }
}

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getSpaceById, updateSpaceName, deleteSpace } from '@/lib/services/spaces'
import { getActiveMembership } from '@/lib/services/memberships'
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

    const space = await getSpaceById(spaceId)
    if (!space) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({
      id: String(space._id),
      name: space.name,
      slug: space.slug,
      plan: space.plan,
      statDefinitions: space.statDefinitions,
      settings: space.settings,
      role: membership.role
    })
  } catch (err) {
    return errorResponse(err)
  }
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { spaceId } = await params

  const body = await req.json().catch(() => null)
  const name = String(body?.name || '').trim()
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  try {
    const membership = await getActiveMembership(spaceId, session.user.id)
    if (!membership || membership.role !== 'owner') {
      return NextResponse.json({ error: 'Only the owner can rename this space' }, { status: 403 })
    }

    const space = await updateSpaceName(spaceId, name)
    return NextResponse.json({ id: String(space._id), name: space.name, slug: space.slug })
  } catch (err) {
    return errorResponse(err)
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { spaceId } = await params

  try {
    const membership = await getActiveMembership(spaceId, session.user.id)
    if (!membership || membership.role !== 'owner') {
      return NextResponse.json({ error: 'Only the owner can delete this space' }, { status: 403 })
    }

    await deleteSpace(spaceId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return errorResponse(err)
  }
}

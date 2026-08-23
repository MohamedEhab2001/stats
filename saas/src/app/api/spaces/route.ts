import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createSpace, listMySpaces } from '@/lib/services/spaces'
import { errorResponse } from '@/lib/services/errors'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const rows = await listMySpaces(session.user.id)
    return NextResponse.json({
      spaces: rows.map(({ space, membership }) => ({
        id: String(space._id),
        name: space.name,
        slug: space.slug,
        role: membership.role,
        nickname: membership.nickname,
        plan: space.plan
      }))
    })
  } catch (err) {
    return errorResponse(err)
  }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const name = String(body?.name || '').trim()
  if (!name) return NextResponse.json({ error: 'Space name is required' }, { status: 400 })

  const secondMemberEmail = String(body?.secondMemberEmail || '').trim()
  const secondMemberNickname = String(body?.secondMemberNickname || '').trim()

  try {
    const { space, secondMember } = await createSpace({
      ownerId: session.user.id,
      ownerNickname: session.user.name || 'Owner',
      name,
      secondMember: secondMemberEmail
        ? { email: secondMemberEmail, nickname: secondMemberNickname }
        : undefined
    })
    return NextResponse.json(
      { id: String(space._id), name: space.name, slug: space.slug, secondMember },
      { status: 201 }
    )
  } catch (err) {
    return errorResponse(err)
  }
}

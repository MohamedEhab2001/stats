import crypto from 'crypto'
import { dbConnect } from '@/lib/db/mongoose'
import { Space, type SpaceDoc } from '@/lib/models/Space'
import { Membership } from '@/lib/models/Membership'
import { Invite } from '@/lib/models/Invite'
import { MatchWeek } from '@/lib/models/MatchWeek'
import { seedStatDefinitions } from '@/lib/domain/stat-catalog'
import { createInvite } from './invites'
import { ServiceError } from './errors'

function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
  return slug || 'space'
}

function randomSuffix(length = 4): string {
  return crypto.randomBytes(length).toString('hex').slice(0, length)
}

// Always suffixed with a short random tag rather than a sequential -2/-3/... — keeps the URL
// readable without ever looking guessable/enumerable, even when several Spaces share a name.
async function uniqueSlug(base: string): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const slug = `${base}-${randomSuffix()}`
    if (!(await Space.exists({ slug }))) return slug
  }
  throw new ServiceError(500, 'Could not generate a unique Space URL — please try again')
}

export type CreateSpaceSecondMemberResult = {
  email: string
  nickname: string
  accessCode: string
  billable: boolean
}

/** `secondMember` is the onboarding "add your first member" step — optional, a manager can skip
 * it and add someone later from Settings instead. When given, it goes through the exact same
 * `createInvite` path (and seat-cap rules) as adding a member from Settings would. */
export async function createSpace({
  ownerId,
  ownerNickname,
  name,
  secondMember
}: {
  ownerId: string
  ownerNickname: string
  name: string
  secondMember?: { email: string; nickname: string }
}): Promise<{ space: SpaceDoc; secondMember: CreateSpaceSecondMemberResult | null }> {
  await dbConnect()

  const trimmedName = name.trim()
  if (!trimmedName) throw new ServiceError(400, 'Space name is required')

  const slug = await uniqueSlug(slugify(trimmedName))

  const space = await Space.create({
    name: trimmedName,
    slug,
    ownerId,
    plan: { tier: 'free', memberCap: 2, status: 'active' },
    statDefinitions: seedStatDefinitions(),
    settings: { timezone: 'UTC', resultStatKey: 'goals' }
  })

  await Membership.create({
    spaceId: space._id,
    userId: ownerId,
    role: 'owner',
    nickname: ownerNickname.trim() || 'Owner',
    status: 'active'
  })

  let secondMemberResult: CreateSpaceSecondMemberResult | null = null
  if (secondMember && secondMember.email.trim()) {
    const result = await createInvite(String(space._id), ownerId, {
      email: secondMember.email,
      nickname: secondMember.nickname
    })
    secondMemberResult = {
      email: secondMember.email.toLowerCase().trim(),
      nickname: result.invite.nickname,
      accessCode: result.accessCode,
      billable: result.billable
    }
  }

  return { space, secondMember: secondMemberResult }
}

/** All Spaces a user is an active member of, paired with their membership row for that Space. */
export async function listMySpaces(userId: string) {
  await dbConnect()
  const memberships = await Membership.find({ userId, status: 'active' }).lean()
  if (memberships.length === 0) return []

  const spaceIds = memberships.map((m) => m.spaceId)
  const spaces = await Space.find({ _id: { $in: spaceIds } }).lean()
  const membershipBySpaceId = new Map(memberships.map((m) => [String(m.spaceId), m]))

  return spaces
    .map((space) => ({ space, membership: membershipBySpaceId.get(String(space._id))! }))
    .filter((row) => row.membership)
}

export async function getSpaceById(spaceId: string) {
  await dbConnect()
  return Space.findById(spaceId)
}

export async function getSpaceBySlug(slug: string) {
  await dbConnect()
  return Space.findOne({ slug })
}

export async function updateSpaceName(spaceId: string, name: string) {
  await dbConnect()
  const trimmedName = name.trim()
  if (!trimmedName) throw new ServiceError(400, 'Space name is required')

  const space = await Space.findById(spaceId)
  if (!space) throw new ServiceError(404, 'Space not found')

  space.name = trimmedName
  await space.save()
  return space
}

/** Owner-only, irreversible: removes the Space and everything scoped to it. */
export async function deleteSpace(spaceId: string) {
  await dbConnect()
  const space = await Space.findById(spaceId)
  if (!space) throw new ServiceError(404, 'Space not found')

  await Promise.all([
    Membership.deleteMany({ spaceId }),
    Invite.deleteMany({ spaceId }),
    MatchWeek.deleteMany({ spaceId })
  ])
  await space.deleteOne()
}

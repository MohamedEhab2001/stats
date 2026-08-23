import { dbConnect } from '@/lib/db/mongoose'
import { Membership } from '@/lib/models/Membership'
import { User } from '@/lib/models/User'
import { ServiceError } from './errors'

export async function getActiveMembership(spaceId: string, userId: string) {
  await dbConnect()
  return Membership.findOne({ spaceId, userId, status: 'active' })
}

export async function countActiveMembers(spaceId: string) {
  await dbConnect()
  return Membership.countDocuments({ spaceId, status: 'active' })
}

/** Active members of a Space, joined with their User display info. */
export async function listMembers(spaceId: string) {
  await dbConnect()
  const memberships = await Membership.find({ spaceId, status: 'active' }).sort({ createdAt: 1 }).lean()
  if (memberships.length === 0) return []

  const userIds = memberships.map((m) => m.userId)
  const users = await User.find({ _id: { $in: userIds } }).select('name email').lean()
  const userById = new Map(users.map((u) => [String(u._id), u]))

  return memberships.map((m) => {
    const user = userById.get(String(m.userId))
    return {
      userId: String(m.userId),
      role: m.role,
      nickname: m.nickname,
      avatarUrl: m.avatarUrl ?? null,
      name: user?.name ?? m.nickname,
      email: user?.email ?? '',
      accessCode: m.accessCode ?? null
    }
  })
}

export async function updateMemberNickname(
  spaceId: string,
  targetUserId: string,
  requester: { userId: string; role: 'owner' | 'member' },
  nickname: string
) {
  await dbConnect()

  if (requester.userId !== targetUserId && requester.role !== 'owner') {
    throw new ServiceError(403, 'Not allowed')
  }

  const trimmed = nickname.trim()
  if (!trimmed) throw new ServiceError(400, 'Nickname is required')

  const membership = await Membership.findOne({ spaceId, userId: targetUserId, status: 'active' })
  if (!membership) throw new ServiceError(404, 'Member not found')

  membership.nickname = trimmed
  await membership.save()
  return membership
}

/** Owner-only. Soft-removes a member; can't remove yourself or the owner. */
export async function removeMember(
  spaceId: string,
  targetUserId: string,
  requester: { userId: string; role: 'owner' | 'member' }
) {
  await dbConnect()

  if (requester.role !== 'owner') throw new ServiceError(403, 'Only the owner can remove members')
  if (targetUserId === requester.userId) throw new ServiceError(400, "You can't remove yourself")

  const target = await Membership.findOne({ spaceId, userId: targetUserId, status: 'active' })
  if (!target) throw new ServiceError(404, 'Member not found')
  if (target.role === 'owner') throw new ServiceError(400, "Can't remove the space owner")

  target.status = 'removed'
  await target.save()
  return target
}

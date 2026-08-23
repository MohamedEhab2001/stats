import crypto from 'crypto'
import mongoose, { Types } from 'mongoose'
import { dbConnect } from '@/lib/db/mongoose'
import { Invite } from '@/lib/models/Invite'
import { Space } from '@/lib/models/Space'
import { Membership } from '@/lib/models/Membership'
import { User } from '@/lib/models/User'
import { ServiceError } from './errors'

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000

export function generateInviteCode(): string {
  return crypto.randomBytes(16).toString('base64url')
}

/**
 * Owner-only. Adds a Space Member directly — there's no separate "redeem a link" step anymore:
 * a Membership (with a permanent login `accessCode`) is created immediately, and an `Invite` doc
 * is still written alongside it purely for audit/history (already marked `redeemed`).
 *
 * Seat-cap logic:
 *  - At `plan.maxMemberCap` (hard ceiling) → rejected outright, no upgrade possible.
 *  - At/above `plan.memberCap` (included seats) but below the hard ceiling → still succeeds, but
 *    the returned `billable` flag tells the caller to show "this seat costs extra" messaging.
 *
 * Re-inviting an email that already has a Membership in this Space (including a previously
 * `removed` one) rotates their `accessCode` and updates their nickname instead of erroring on the
 * unique `(spaceId, userId)` index — this doubles as the "resend/regenerate" path for that case.
 */
export async function createInvite(
  spaceId: string,
  createdByUserId: string,
  { email, nickname }: { email: string; nickname: string }
) {
  await dbConnect()

  const trimmedNickname = nickname.trim()
  if (!trimmedNickname) throw new ServiceError(400, 'Nickname is required')

  const normalizedEmail = email.toLowerCase().trim()
  if (!normalizedEmail) throw new ServiceError(400, 'Email is required')

  const space = await Space.findById(spaceId)
  if (!space) throw new ServiceError(404, 'Space not found')

  const activeCount = await Membership.countDocuments({ spaceId, status: 'active' })

  if (activeCount >= space.plan!.maxMemberCap!) {
    throw new ServiceError(409, 'This space is completely full.')
  }
  const billable = activeCount >= space.plan!.memberCap!

  let user = await User.findOne({ email: normalizedEmail })
  if (!user) {
    const fallbackName = trimmedNickname || normalizedEmail.split('@')[0]
    user = await User.create({ email: normalizedEmail, name: fallbackName, passwordHash: null })
  }

  const accessCode = generateInviteCode()

  const existingMembership = await Membership.findOne({ spaceId, userId: user._id })
  if (existingMembership) {
    existingMembership.accessCode = accessCode
    existingMembership.nickname = trimmedNickname
    existingMembership.status = 'active'
    await existingMembership.save()
  } else {
    await Membership.create({
      spaceId,
      userId: user._id,
      role: 'member',
      nickname: trimmedNickname,
      status: 'active',
      accessCode
    })
  }

  const now = new Date()
  const invite = await Invite.create({
    spaceId,
    createdByUserId,
    nickname: trimmedNickname,
    code: generateInviteCode(),
    status: 'redeemed',
    redeemedByUserId: user._id,
    redeemedAt: now,
    expiresAt: new Date(now.getTime() + INVITE_TTL_MS)
  })

  return { invite, accessCode, spaceSlug: space.slug, billable }
}

/** Owner-only. Generates a fresh access code for an existing member — the "I lost my code, resend
 * it" path. Doesn't touch the seat cap (no new seat is being added). */
export async function regenerateAccessCode(
  spaceId: string,
  targetUserId: string,
  requester: { userId: string; role: 'owner' | 'member' }
) {
  await dbConnect()

  if (requester.role !== 'owner') {
    throw new ServiceError(403, 'Only the space owner can regenerate access codes')
  }

  const membership = await Membership.findOne({ spaceId, userId: targetUserId, status: 'active' })
  if (!membership) throw new ServiceError(404, 'Member not found')
  if (membership.role === 'owner') {
    throw new ServiceError(400, "The space owner doesn't use an access code")
  }

  const accessCode = generateInviteCode()
  membership.accessCode = accessCode
  await membership.save()
  return accessCode
}

export async function listInvites(spaceId: string) {
  await dbConnect()
  return Invite.find({ spaceId }).sort({ createdAt: -1 }).lean()
}

/** Owner-only. Since membership is created the moment an Invite is issued, revoking one now also
 * removes the access it granted (rather than just marking an already-fulfilled record). */
export async function revokeInvite(spaceId: string, inviteId: string) {
  await dbConnect()
  const invite = await Invite.findOne({ _id: inviteId, spaceId })
  if (!invite) throw new ServiceError(404, 'Invite not found')

  if (invite.status !== 'revoked') {
    invite.status = 'revoked'
    await invite.save()
  }

  if (invite.redeemedByUserId) {
    await Membership.updateOne(
      { spaceId, userId: invite.redeemedByUserId, status: 'active' },
      { status: 'removed' }
    )
  }

  return invite
}

/** Public, minimal info for the /join/[code] landing page — purely informational now (membership
 * already exists by the time this link is shared), no other Space data leaks. */
export async function getInviteInfo(code: string) {
  await dbConnect()
  const invite = await Invite.findOne({ code }).lean()
  if (!invite) return null

  const space = await Space.findById(invite.spaceId).select('name').lean()
  if (!space) return null

  let email: string | null = null
  if (invite.redeemedByUserId) {
    const user = await User.findById(invite.redeemedByUserId).select('email').lean()
    email = user?.email ?? null
  }

  const isExpired = invite.status === 'pending' && invite.expiresAt.getTime() < Date.now()

  return {
    code: invite.code,
    nickname: invite.nickname,
    spaceName: space.name,
    email,
    status: (isExpired ? 'expired' : invite.status) as 'pending' | 'redeemed' | 'revoked' | 'expired'
  }
}

export type RedeemResult =
  | { ok: true; spaceId: string; spaceSlug: string; alreadyMember: boolean }
  | { ok: false; status: number; error: string }

/**
 * NOTE: no longer part of the active add-member flow — membership is created synchronously in
 * `createInvite` now, so there's nothing left to "redeem" on link visit. Kept only because
 * `src/app/api/invites/[code]/redeem/route.ts` still calls it and removing it isn't worth the
 * blast radius; it degrades gracefully to its own "already a member" idempotent-success branch.
 *
 * NOTE: `session.withTransaction` requires MongoDB multi-document transactions, which need
 * `MONGODB_URI` to point at a replica set (e.g. MongoDB Atlas, or a local replica-set-enabled
 * mongod) — a standalone `mongod` does not support transactions and this will throw.
 */
export async function redeemInvite(code: string, userId: string): Promise<RedeemResult> {
  await dbConnect()

  const session = await mongoose.startSession()
  try {
    let result: RedeemResult = { ok: false, status: 500, error: 'Something went wrong' }

    await session.withTransaction(async () => {
      const invite = await Invite.findOne({ code }).session(session)
      if (!invite) {
        result = { ok: false, status: 404, error: 'Invite not found' }
        return
      }

      const space = await Space.findById(invite.spaceId).session(session)
      if (!space) {
        result = { ok: false, status: 404, error: 'Space not found' }
        return
      }

      const existingMembership = await Membership.findOne({
        spaceId: invite.spaceId,
        userId
      }).session(session)

      // Idempotent success: re-visiting a link you've already redeemed shouldn't error.
      if (existingMembership && existingMembership.status === 'active') {
        result = { ok: true, spaceId: String(space._id), spaceSlug: space.slug, alreadyMember: true }
        return
      }

      if (invite.status === 'redeemed' || invite.status === 'revoked') {
        result = { ok: false, status: 410, error: 'This invite is no longer valid' }
        return
      }

      if (invite.status === 'expired' || invite.expiresAt.getTime() < Date.now()) {
        if (invite.status !== 'expired') {
          invite.status = 'expired'
          await invite.save({ session })
        }
        result = { ok: false, status: 410, error: 'This invite has expired' }
        return
      }

      // Hard re-check: time has passed since createInvite's soft pre-check.
      const activeCount = await Membership.countDocuments({
        spaceId: invite.spaceId,
        status: 'active'
      }).session(session)

      if (activeCount >= space.plan!.memberCap!) {
        result = {
          ok: false,
          status: 409,
          error: 'This space is full. Ask the owner to upgrade for more seats.'
        }
        return
      }

      if (existingMembership) {
        existingMembership.status = 'active'
        existingMembership.nickname = invite.nickname
        await existingMembership.save({ session })
      } else {
        await Membership.create(
          [
            {
              spaceId: invite.spaceId,
              userId,
              role: 'member',
              nickname: invite.nickname,
              status: 'active'
            }
          ],
          { session }
        )
      }

      invite.status = 'redeemed'
      invite.redeemedByUserId = new Types.ObjectId(userId)
      invite.redeemedAt = new Date()
      await invite.save({ session })

      result = { ok: true, spaceId: String(space._id), spaceSlug: space.slug, alreadyMember: false }
    })

    return result
  } finally {
    await session.endSession()
  }
}

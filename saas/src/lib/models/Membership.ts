import { Schema, model, models, Types, type InferSchemaType, type Model } from 'mongoose'

const membershipSchema = new Schema(
  {
    spaceId: { type: Schema.Types.ObjectId, ref: 'Space', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['owner', 'member'], required: true, default: 'member' },
    nickname: { type: String, required: true, trim: true },
    avatarUrl: { type: String, default: null },
    status: { type: String, enum: ['active', 'removed'], default: 'active' },
    // Permanent login credential for Space Members (role: 'member') who were added directly by
    // the manager and never set a password — they log in with email + this code, indefinitely
    // (not a one-time invite token). Absent (not merely `null`) for owners, who always use email
    // + password — this must stay *unset* rather than explicitly `null`, because the sparse
    // unique index below only excludes documents missing the field entirely, not documents that
    // explicitly store `null` (Mongo doesn't special-case `null` there). `default: undefined`
    // tells Mongoose not to write the key at all when no code is given.
    accessCode: { type: String, default: undefined }
  },
  { timestamps: true }
)

membershipSchema.index({ spaceId: 1, userId: 1 }, { unique: true })
membershipSchema.index({ userId: 1 })
membershipSchema.index({ accessCode: 1 }, { unique: true, sparse: true })

export type MembershipDoc = InferSchemaType<typeof membershipSchema> & { _id: Types.ObjectId }
export const Membership =
  (models.Membership as Model<MembershipDoc>) || model<MembershipDoc>('Membership', membershipSchema)

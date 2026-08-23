import { Schema, model, models, Types, type InferSchemaType, type Model } from 'mongoose'

const inviteSchema = new Schema(
  {
    spaceId: { type: Schema.Types.ObjectId, ref: 'Space', required: true },
    createdByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    nickname: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ['pending', 'redeemed', 'revoked', 'expired'],
      default: 'pending'
    },
    redeemedByUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    redeemedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
)

inviteSchema.index({ spaceId: 1, status: 1 })

export type InviteDoc = InferSchemaType<typeof inviteSchema> & { _id: Types.ObjectId }
export const Invite = (models.Invite as Model<InviteDoc>) || model<InviteDoc>('Invite', inviteSchema)

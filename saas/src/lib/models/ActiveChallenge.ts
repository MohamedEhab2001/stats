import { Schema, model, models, Types, type InferSchemaType, type Model } from 'mongoose'

const activeChallengeSchema = new Schema(
  {
    spaceId: { type: Schema.Types.ObjectId, ref: 'Space', required: true, unique: true },
    challengeId: { type: String, required: true },
    setAt: { type: Date, default: Date.now },
    setByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
)

export type ActiveChallengeDoc = InferSchemaType<typeof activeChallengeSchema> & { _id: Types.ObjectId }
export const ActiveChallenge =
  (models.ActiveChallenge as Model<ActiveChallengeDoc>) ||
  model<ActiveChallengeDoc>('ActiveChallenge', activeChallengeSchema)

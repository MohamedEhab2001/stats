import { Schema, model, models, Types, type InferSchemaType, type Model } from 'mongoose'

const entrySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    stats: { type: Map, of: Number, default: {} },
    pIndex: { type: Number, default: 0 },
    challengeCompletion: {
      type: new Schema(
        { challengeId: { type: String, required: true }, completed: { type: Boolean, required: true } },
        { _id: false }
      ),
      default: null
    },
    loggedAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { _id: false }
)

const matchWeekSchema = new Schema(
  {
    spaceId: { type: Schema.Types.ObjectId, ref: 'Space', required: true },
    weekKey: { type: String, required: true }, // 'YYYY-MM-DD'
    date: { type: Date, required: true },
    entries: { type: [entrySchema], default: [] },
    activeChallengeId: { type: String, default: null }
  },
  { timestamps: true }
)

matchWeekSchema.index({ spaceId: 1, weekKey: 1 }, { unique: true })
matchWeekSchema.index({ spaceId: 1, date: 1 })
matchWeekSchema.index({ spaceId: 1, 'entries.userId': 1 })

export type MatchWeekDoc = InferSchemaType<typeof matchWeekSchema> & { _id: Types.ObjectId }
export const MatchWeek =
  (models.MatchWeek as Model<MatchWeekDoc>) || model<MatchWeekDoc>('MatchWeek', matchWeekSchema)

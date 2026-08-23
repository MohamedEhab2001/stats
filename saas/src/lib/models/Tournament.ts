import { Schema, model, models, Types, type InferSchemaType, type Model } from 'mongoose'

const prizeResultSchema = new Schema(
  {
    winners: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    why: { type: String, required: true }
  },
  { _id: false }
)

const tournamentSchema = new Schema(
  {
    spaceId: { type: Schema.Types.ObjectId, ref: 'Space', required: true },
    kind: { type: String, enum: ['monthly', 'yearly', 'custom'], required: true },
    key: { type: String, required: true }, // 'monthly-2026-07' | 'yearly-2026' | 'custom-<uuid>'
    name: { type: String, required: true },
    badgeKey: { type: String, required: true },
    leagueId: { type: Number, default: null },
    // monthly
    monthKey: { type: String, default: null },
    // yearly
    year: { type: Number, default: null },
    // custom
    startDate: { type: Date, default: null },
    matchesRequired: { type: Number, default: null },
    revealed: { type: Boolean, default: false },
    results: {
      type: new Schema(
        {
          prizes: { type: Map, of: prizeResultSchema, default: {} },
          revealedAt: { type: Date, default: Date.now }
        },
        { _id: false }
      ),
      default: null
    }
  },
  { timestamps: true }
)

tournamentSchema.index({ spaceId: 1, key: 1 }, { unique: true })
tournamentSchema.index({ spaceId: 1, kind: 1, revealed: 1 })

export type TournamentDoc = InferSchemaType<typeof tournamentSchema> & { _id: Types.ObjectId }
export const Tournament =
  (models.Tournament as Model<TournamentDoc>) || model<TournamentDoc>('Tournament', tournamentSchema)

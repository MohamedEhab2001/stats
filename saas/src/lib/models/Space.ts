import { Schema, model, models, Types, type InferSchemaType, type Model } from 'mongoose'

const statDefinitionSchema = new Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    short: { type: String, required: true },
    max: { type: Number, required: true },
    weight: { type: Number, required: true },
    higherIsBetter: { type: Boolean, required: true, default: true },
    blurb: { type: String, default: '' },
    enabled: { type: Boolean, required: true, default: true },
    isCustom: { type: Boolean, required: true, default: false },
    order: { type: Number, required: true, default: 0 }
  },
  { _id: false }
)

const spaceSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    plan: {
      tier: { type: String, enum: ['free', 'pro'], default: 'free' },
      // "Included" seats — the manager + this many members before an upgrade is needed.
      memberCap: { type: Number, default: 2 },
      // Hard ceiling regardless of payment — a Space can never exceed this many active members.
      maxMemberCap: { type: Number, default: 5 },
      // Display/billing price for each seat beyond memberCap. EasyKash charging is still a stub
      // (see app/api/spaces/[spaceId]/billing/checkout) — this field only drives the pricing copy
      // and the seat-cap upgrade message for now.
      pricePerExtraSeatEGP: { type: Number, default: 150 },
      status: { type: String, enum: ['active', 'past_due', null], default: 'active' }
    },
    statDefinitions: { type: [statDefinitionSchema], default: [] },
    settings: {
      timezone: { type: String, default: 'UTC' },
      resultStatKey: { type: String, default: 'goals' }
    }
  },
  { timestamps: true }
)

spaceSchema.index({ ownerId: 1 })

export type SpaceDoc = InferSchemaType<typeof spaceSchema> & { _id: Types.ObjectId }
export const Space = (models.Space as Model<SpaceDoc>) || model<SpaceDoc>('Space', spaceSchema)

import { Schema, model, models, Types, type InferSchemaType, type Model } from 'mongoose'

// One doc per EasyKash payment attempt (seat-upgrade purchase). EasyKash has no native
// subscription billing — every purchase is a one-time payment link confirmed via a webhook
// callback. See https://easykash.gitbook.io/easykash-apis-documentation/ (Direct Payment Hosted).
const paymentSchema = new Schema(
  {
    spaceId: { type: Schema.Types.ObjectId, ref: 'Space', required: true },
    customerReference: { type: String, required: true, unique: true }, // e.g. space_<id>_seat_<ts>
    easykashRef: { type: String, default: null },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: 'EGP' },
    status: {
      type: String,
      enum: ['NEW', 'PAID', 'FAILED', 'PENDING', 'EXPIRED', 'REFUNDED', 'CANCELED'],
      default: 'NEW'
    },
    paymentMethod: { type: String, default: null },
    voucher: { type: String, default: null },
    signatureVerified: { type: Boolean, default: false },
    rawCallback: { type: Schema.Types.Mixed, default: null },
    paidAt: { type: Date, default: null }
  },
  { timestamps: true }
)

paymentSchema.index({ spaceId: 1 })

export type PaymentDoc = InferSchemaType<typeof paymentSchema> & { _id: Types.ObjectId }
export const Payment = (models.Payment as Model<PaymentDoc>) || model<PaymentDoc>('Payment', paymentSchema)

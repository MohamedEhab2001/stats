import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose'

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Optional: Space Members created by a manager (see Membership.accessCode) never set a
    // password — they authenticate with email + their Membership's access code instead. Only
    // Space Managers (who sign up directly) have a passwordHash.
    passwordHash: { type: String, required: false, default: null },
    name: { type: String, required: true, trim: true },
    image: { type: String, default: null }
  },
  { timestamps: true }
)

export type UserDoc = InferSchemaType<typeof userSchema>
export const User = (models.User as Model<UserDoc>) || model<UserDoc>('User', userSchema)

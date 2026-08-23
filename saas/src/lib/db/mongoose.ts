import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

declare global {
  var _mongooseConn: {
    conn: typeof mongoose | null
    promise: Promise<typeof mongoose> | null
  } | undefined
}

const cached = global._mongooseConn ?? { conn: null, promise: null }
global._mongooseConn = cached

export async function dbConnect() {
  if (cached.conn) return cached.conn
  if (!MONGODB_URI) {
    throw new Error('Missing MONGODB_URI environment variable')
  }
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false })
  }
  try {
    cached.conn = await cached.promise
  } catch (err) {
    cached.promise = null
    throw err
  }
  return cached.conn
}

import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { dbConnect } from '@/lib/db/mongoose'
import { User } from '@/lib/models/User'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const email = String(body?.email || '').toLowerCase().trim()
  const password = String(body?.password || '')
  const name = String(body?.name || '').trim()

  if (!email || !password || !name) {
    return NextResponse.json({ error: 'name, email, and password are required' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  await dbConnect()

  const existing = await User.findOne({ email })
  if (existing) {
    return NextResponse.json({ error: 'An account with that email already exists' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await User.create({ email, name, passwordHash })

  return NextResponse.json({ id: user._id.toString(), email: user.email, name: user.name }, { status: 201 })
}

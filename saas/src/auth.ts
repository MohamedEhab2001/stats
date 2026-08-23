import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { dbConnect } from '@/lib/db/mongoose'
import { User } from '@/lib/models/User'
import { Membership } from '@/lib/models/Membership'

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  // Static config can't know the current request's locale, so this points at the default
  // locale's (Arabic) login page. src/proxy.ts is what actually redirects unauthenticated /app
  // visits — it builds the login URL per-request and always preserves the visitor's locale, so
  // this value only matters as NextAuth's own fallback (e.g. hitting /api/auth/signin directly).
  pages: { signIn: '/ar/login' },
  providers: [
    // Space Managers: email + password, the "real" account (the one that pays/subscribes).
    Credentials({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        const email = String(credentials?.email || '').toLowerCase().trim()
        const password = String(credentials?.password || '')
        if (!email || !password) return null

        await dbConnect()
        const user = await User.findOne({ email })
        if (!user || !user.passwordHash) return null

        const valid = await bcrypt.compare(password, user.passwordHash)
        if (!valid) return null

        return { id: user._id.toString(), email: user.email, name: user.name, image: user.image ?? undefined }
      }
    }),
    // Space Members: email + a permanent per-Membership access code, no password at all. The
    // code identifies a specific Membership; we authenticate as that Membership's User.
    Credentials({
      id: 'member-code',
      name: 'member-code',
      credentials: {
        email: { label: 'Email', type: 'email' },
        code: { label: 'Access code', type: 'text' }
      },
      async authorize(credentials) {
        const email = String(credentials?.email || '').toLowerCase().trim()
        const code = String(credentials?.code || '').trim()
        if (!email || !code) return null

        await dbConnect()
        const membership = await Membership.findOne({ accessCode: code, status: 'active' })
        if (!membership) return null

        const user = await User.findById(membership.userId)
        if (!user || user.email !== email) return null

        return { id: user._id.toString(), email: user.email, name: user.name, image: user.image ?? undefined }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
      }
      return session
    }
  }
})

import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { authenticateUser, findOrCreateOAuthUser, ensureDefaultUser } from './index'

export const authOptions: NextAuthOptions = {
  providers: [
    // Username + Password
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null
        await ensureDefaultUser()
        const user = await authenticateUser(credentials.username, credentials.password)
        if (!user) return null
        return { id: user.id, name: user.name, email: user.email || undefined, image: user.image || undefined }
      },
    }),

    // Google OAuth — only enabled if env vars are set
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],

  callbacks: {
    async signIn({ user, account }) {
      // For OAuth providers, create/find user in our file store
      if (account?.provider === 'google' && user.email) {
        await findOrCreateOAuthUser({
          email: user.email,
          name: user.name || 'User',
          provider: 'google',
          image: user.image || undefined,
        })
      }
      return true
    },

    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as any).id = token.sub
      }
      return session
    },

    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
      }
      return token
    },
  },

  pages: {
    signIn: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET || 'brain-dev-secret-change-in-production',
}

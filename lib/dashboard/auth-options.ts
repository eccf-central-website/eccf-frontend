/**
 * NextAuth Configuration Options — lib/dashboard/auth-options.ts
 *
 * Implements SDD §4.2 & §6.2: Authentication & RBAC.
 * - Credentials provider authenticates against Sanity Worker documents
 * - Enforces Admin Approval Gate before issuing dashboard JWT
 * - Encodes exactly { id, role, team } into the JWT session token
 */

import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { sanityWriteClient } from '@/lib/sanity'
import type { WorkerRole } from '@/types'

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        identifier: { label: 'Email or Phone Number', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error('Please enter both your email/phone number and password.')
        }

        const rawIdentifier = credentials.identifier.trim()
        const cleanEmail = rawIdentifier.toLowerCase()
        const cleanPhone = rawIdentifier.replace(/\s+/g, '')

        // Look up Worker in Sanity by email or phoneNumber
        const worker = await sanityWriteClient.fetch<{
          _id: string
          fullName: string
          email?: string
          phoneNumber?: string
          role?: WorkerRole
          requestedRole?: WorkerRole
          excoPosition?: string
          isExcoApproved?: boolean
          passwordHash?: string
          team?: string | { name?: string }
        }>(
          `*[_type == "worker" && (lower(email) == $cleanEmail || phoneNumber == $cleanPhone)][0]{
            _id,
            fullName,
            email,
            phoneNumber,
            role,
            requestedRole,
            excoPosition,
            isExcoApproved,
            passwordHash,
            team
          }`,
          { cleanEmail, cleanPhone }
        )

        if (!worker) {
          throw new Error('No worker account found matching those credentials.')
        }

        if (!worker.passwordHash) {
          throw new Error('This account does not have a dashboard password set up.')
        }

        const isValid = await bcrypt.compare(credentials.password, worker.passwordHash)
        if (!isValid) {
          throw new Error('Incorrect password. Please try again.')
        }

        // Admin Approval Gate (SDD §7.3)
        if (worker.isExcoApproved === false) {
          throw new Error('Your Exco account is awaiting administrator approval.')
        }

        const effectiveRole = worker.role || (worker.isExcoApproved ? worker.requestedRole : undefined)
        if (!effectiveRole) {
          throw new Error('This account does not have active Exco dashboard privileges.')
        }

        const resolvedTeam =
          typeof worker.team === 'object' && worker.team !== null && 'name' in worker.team
            ? worker.team.name || 'General'
            : typeof worker.team === 'string'
              ? worker.team
              : 'General'

        return {
          id: worker._id,
          name: worker.fullName,
          email: worker.email || '',
          role: effectiveRole,
          team: resolvedTeam,
          excoPosition: worker.excoPosition || '',
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as unknown as { role: WorkerRole }).role
        token.team = (user as unknown as { team: string }).team
        token.excoPosition = (user as unknown as { excoPosition?: string }).excoPosition
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as unknown as { id: string }).id = token.id as string
        ;(session.user as unknown as { role: WorkerRole }).role = token.role as WorkerRole
        ;(session.user as unknown as { team: string }).team = token.team as string
        ;(session.user as unknown as { excoPosition?: string }).excoPosition = token.excoPosition as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'eccf-secret-session-key-production-fallback',
}

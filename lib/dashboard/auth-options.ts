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
import { decrypt, createBlindIndex, getCandidateBlindIndexes } from '@/lib/encryption'
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
        const candidateBlindIndexes = getCandidateBlindIndexes(cleanPhone)
        const primaryBlindIndex = createBlindIndex(cleanPhone)
        const allBlindIndexes = Array.from(new Set([primaryBlindIndex, ...candidateBlindIndexes]))

        // Look up Worker in Sanity by email, phoneNumber, or candidate phoneBlindIndexes
        // Order by defined(passwordHash) desc, _updatedAt desc so populated credentials take priority
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
          hall?: string
          teams?: (string | { name?: string })[]
        }>(
          `*[_type == "worker" && (
            lower(email) == $cleanEmail ||
            phoneNumber == $cleanPhone ||
            phoneBlindIndex in $allBlindIndexes
          )] | order(defined(passwordHash) desc, _updatedAt desc)[0]{
            _id,
            fullName,
            email,
            phoneNumber,
            role,
            requestedRole,
            excoPosition,
            isExcoApproved,
            passwordHash,
            team,
            hall,
            "teams": coalesce(teams[]->name, teams, [coalesce(team->name, team)])
          }`,
          { cleanEmail, cleanPhone, allBlindIndexes }
        )

        if (!worker) {
          throw new Error('No worker account found matching those credentials.')
        }

        if (!worker.passwordHash) {
          throw new Error('This account does not have a dashboard password set up.')
        }

        const storedHash = decrypt(worker.passwordHash)
        const isValid = await bcrypt.compare(credentials.password, storedHash)
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

        const rawTeams = Array.isArray(worker.teams) ? worker.teams : []
        const resolvedTeams: string[] = rawTeams
          .map((t) => (typeof t === 'object' && t !== null && 'name' in t ? (t as { name: string }).name : String(t)))
          .filter(Boolean)

        const singleTeam =
          typeof worker.team === 'object' && worker.team !== null && 'name' in worker.team
            ? worker.team.name || ''
            : typeof worker.team === 'string'
              ? worker.team
              : ''

        const finalTeams = resolvedTeams.length > 0 ? resolvedTeams : (singleTeam ? [singleTeam] : ['General'])
        const resolvedTeam = finalTeams.join(', ')

        return {
          id: worker._id,
          name: worker.fullName,
          email: worker.email || '',
          role: effectiveRole,
          team: resolvedTeam,
          teams: finalTeams,
          excoPosition: worker.excoPosition || '',
          hall: worker.hall || '',
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
        token.teams = (user as unknown as { teams?: string[] }).teams
        token.excoPosition = (user as unknown as { excoPosition?: string }).excoPosition
        token.hall = (user as unknown as { hall?: string }).hall
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as unknown as { id: string }).id = token.id as string
        ;(session.user as unknown as { role: WorkerRole }).role = token.role as WorkerRole
        ;(session.user as unknown as { team: string }).team = token.team as string
        ;(session.user as unknown as { teams?: string[] }).teams = token.teams as string[] | undefined
        ;(session.user as unknown as { excoPosition?: string }).excoPosition = token.excoPosition as string
        ;(session.user as unknown as { hall?: string }).hall = token.hall as string
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

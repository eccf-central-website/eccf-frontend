/**
 * NextAuth Configuration Options — lib/dashboard/auth-options.ts
 *
 * Implements SDD §4.2 & §6.2: Authentication & RBAC.
 * - Credentials provider authenticates against Sanity Worker documents
 * - Enforces Admin Approval Gate before issuing dashboard JWT
 * - Encodes exactly { id, role, team } into the JWT session token
 */

import type { NextAuthOptions } from 'next-auth'
import 'server-only'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { sanityPrivateClient } from '@/lib/sanity'
import { decrypt, createBlindIndex, getCandidateBlindIndexes } from '@/lib/encryption'
import type { WorkerRole } from '@/types'

const authSecret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET
if (process.env.NODE_ENV === 'production' && (!authSecret || Buffer.byteLength(authSecret, 'utf8') < 32)) {
  throw new Error('NEXTAUTH_SECRET must be configured before production authentication can start.')
}

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
          throw new Error('Sign-in failed.')
        }

        const rawIdentifier = credentials.identifier.trim()
        const cleanEmail = rawIdentifier.toLowerCase()
        const cleanPhone = rawIdentifier.replace(/\s+/g, '')
        const candidateBlindIndexes = getCandidateBlindIndexes(cleanPhone)
        const primaryBlindIndex = createBlindIndex(cleanPhone)
        const allBlindIndexes = Array.from(new Set([primaryBlindIndex, ...candidateBlindIndexes]))

        // Look up Worker in Sanity by email, phoneNumber, or candidate phoneBlindIndexes
        // Order by defined(passwordHash) desc, _updatedAt desc so populated credentials take priority
        const worker = await sanityPrivateClient.fetch<{
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
          leadingTeam?: string | { name?: string }
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
            "team": coalesce(team->name, team),
            hall,
            "leadingTeam": coalesce(leadingTeam->name, leadingTeam),
            "teams": coalesce(teams[]->name, teams, [coalesce(team->name, team)])
          }`,
          { cleanEmail, cleanPhone, allBlindIndexes }
        )

        if (!worker) {
          throw new Error('Sign-in failed.')
        }

        if (!worker.passwordHash) {
          throw new Error('Sign-in failed.')
        }

        const storedHash = decrypt(worker.passwordHash)
        const isValid = await bcrypt.compare(credentials.password, storedHash)
        if (!isValid) {
          throw new Error('Sign-in failed.')
        }

        // Admin Approval Gate (SDD §7.3)
        if (worker.isExcoApproved === false) {
          throw new Error('Sign-in failed.')
        }

        const effectiveRole = worker.role || (worker.isExcoApproved ? worker.requestedRole : undefined)
        if (!effectiveRole) {
          throw new Error('Sign-in failed.')
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

        const resolvedLeadingTeam =
          typeof worker.leadingTeam === 'object' && worker.leadingTeam !== null && 'name' in worker.leadingTeam
            ? worker.leadingTeam.name || ''
            : typeof worker.leadingTeam === 'string'
              ? worker.leadingTeam
              : ''

        const finalTeams = resolvedTeams.length > 0 ? resolvedTeams : (singleTeam ? [singleTeam] : ['General'])
        const resolvedTeam = resolvedLeadingTeam || singleTeam || (finalTeams.length > 0 ? finalTeams[0] : 'General')

        return {
          id: worker._id,
          name: worker.fullName,
          email: worker.email || '',
          role: effectiveRole,
          team: resolvedTeam,
          teams: finalTeams,
          leadingTeam: resolvedLeadingTeam || undefined,
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
        token.name = user.name
        token.role = (user as unknown as { role: WorkerRole }).role
        token.team = (user as unknown as { team: string }).team
        token.teams = (user as unknown as { teams?: string[] }).teams
        token.leadingTeam = (user as unknown as { leadingTeam?: string }).leadingTeam
        token.excoPosition = (user as unknown as { excoPosition?: string }).excoPosition
        token.hall = (user as unknown as { hall?: string }).hall
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as unknown as { id: string }).id = token.id as string
        session.user.name = token.name as string
        ;(session.user as unknown as { role: WorkerRole }).role = token.role as WorkerRole
        ;(session.user as unknown as { team: string }).team = token.team as string
        ;(session.user as unknown as { teams?: string[] }).teams = token.teams as string[] | undefined
        ;(session.user as unknown as { leadingTeam?: string }).leadingTeam = token.leadingTeam as string | undefined
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
  secret: authSecret,
}

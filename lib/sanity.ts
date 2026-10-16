/**
 * Sanity Client — eccf-frontend
 *
 * This is the ONLY place the Sanity client is configured.
 * - `token` is the server-side write token — loaded from env, never exposed to the browser.
 * - `useCdn: false` ensures instant, real-time reflection of Sanity Studio edits.
 * - For mutations (writes), always call from Server Actions, never Client Components.
 *
 * Project: eccf-backend (Sanity Studio)
 * Docs: https://www.sanity.io/docs/js-client
 */

import 'server-only'

import { randomUUID } from 'crypto'
import {createClient} from '@sanity/client'
export { urlForImage } from '@/lib/sanity-image'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ynnot4j0'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'

/** Anonymous published-content client. Never use this for operational records. */
export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion: '2025-02-19',
  perspective: 'published',
  useCdn: false,
})

/**
 * Authenticated write client — SERVER-SIDE ONLY.
 * Never call this from a Client Component or expose the token to the browser.
 * Use exclusively inside Server Actions and API route handlers.
 */
export const sanityWriteClient = createClient({
  projectId,
  dataset,
  apiVersion: '2025-02-19',
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN, // ⚠️ Server-side only — never prefix with NEXT_PUBLIC_
})

/**
 * Authenticated view for operational documents kept as unpublished drafts.
 * Unauthenticated public Sanity queries cannot retrieve these records.
 */
export const sanityPrivateClient = createClient({
  projectId,
  dataset,
  apiVersion: '2025-02-19',
  perspective: 'drafts',
  useCdn: false,
  token: process.env.SANITY_READ_TOKEN,
})

/** Draft IDs must be used for private operational document mutations. */
export function privateDocumentId(id: string): string {
  const cleanId = id.replace(/^drafts\./, '')
  return `drafts.${cleanId}`
}

/** Create operational documents as private drafts; callers must keep the returned ID server-side. */
export async function createPrivateDocument<T extends Record<string, unknown> & { _type: string }>(doc: T) {
  const id = `drafts.${randomUUID().replace(/-/g, '')}`
  return sanityWriteClient.create({ ...doc, _id: id })
}

/** Patch operational documents as drafts so public published data is not changed. */
export function patchPrivateDocument(id: string) {
  return sanityWriteClient.patch(privateDocumentId(id))
}

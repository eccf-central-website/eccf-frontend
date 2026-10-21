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

/**
 * Published-content client for public site pages.
 * Includes authenticated token to read from private dataset in server-side Next.js context.
 */
export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion: '2025-02-19',
  perspective: 'published',
  useCdn: false,
  token: process.env.SANITY_READ_TOKEN,
})

/**
 * Preview client for Draft Mode and Sanity Studio live preview.
 * Queries unpublished drafts in real-time, falling back to published content.
 */
export const sanityPreviewClient = createClient({
  projectId,
  dataset,
  apiVersion: '2025-02-19',
  perspective: 'drafts',
  useCdn: false,
  token: process.env.SANITY_READ_TOKEN,
})

/** Return the appropriate Sanity client based on preview / draft mode status. */
export function getSanityClient(preview?: boolean) {
  return preview ? sanityPreviewClient : sanityClient
}

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
 * Authenticated view for operational documents.
 * Queries with drafts perspective to access both published and pending draft edits.
 */
export const sanityPrivateClient = createClient({
  projectId,
  dataset,
  apiVersion: '2025-02-19',
  perspective: 'drafts',
  useCdn: false,
  token: process.env.SANITY_READ_TOKEN || process.env.SANITY_WRITE_TOKEN,
})

/** Document ID helper for private operational document mutations. */
export function privateDocumentId(id: string): string {
  return id
}

/** Create operational documents in the private dataset. */
export async function createPrivateDocument<T extends Record<string, unknown> & { _type: string }>(doc: T) {
  const id = doc._id || randomUUID().replace(/-/g, '')
  return sanityWriteClient.create({ ...doc, _id: id })
}

/** Patch operational documents in the private dataset. */
export function patchPrivateDocument(id: string) {
  return sanityWriteClient.patch(id)
}

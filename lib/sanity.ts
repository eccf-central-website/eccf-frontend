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

import {createClient} from '@sanity/client'
import {createImageUrlBuilder} from '@sanity/image-url'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ynnot4j0'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'

/** Public read-only client — safe for React Server Components */
export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: false, // Set false for immediate live preview of Sanity Studio edits
})

/** Image URL builder with automatic hotspot and crop support */
const imageBuilder = createImageUrlBuilder({
  projectId,
  dataset,
})

export function urlForImage(source: unknown): string | undefined {
  if (!source) return undefined
  if (typeof source === 'string') return source
  try {
    return imageBuilder.image(source as Parameters<typeof imageBuilder.image>[0]).auto('format').fit('max').url()
  } catch (err) {
    console.error('[urlForImage] Failed to generate URL:', err)
    return undefined
  }
}

/**
 * Authenticated write client — SERVER-SIDE ONLY.
 * Never call this from a Client Component or expose the token to the browser.
 * Use exclusively inside Server Actions and API route handlers.
 */
export const sanityWriteClient = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN, // ⚠️ Server-side only — never prefix with NEXT_PUBLIC_
})

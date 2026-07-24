/**
 * Sanity Client — eccf-frontend
 *
 * This is the ONLY place the Sanity client is configured.
 * - `token` is the server-side write token — loaded from env, never exposed to the browser.
 * - `useCdn` is true for public read queries (fast edge cache).
 * - For mutations (writes), always call from Server Actions, never Client Components.
 *
 * Project: eccf-backend (Sanity Studio)
 * Docs: https://www.sanity.io/docs/js-client
 */

import {createClient} from '@sanity/client'

if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
  throw new Error('Missing env: NEXT_PUBLIC_SANITY_PROJECT_ID')
}
if (!process.env.NEXT_PUBLIC_SANITY_DATASET) {
  throw new Error('Missing env: NEXT_PUBLIC_SANITY_DATASET')
}

/** Public read-only client — safe for React Server Components */
export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-01-01',
  useCdn: true,
})

/**
 * Authenticated write client — SERVER-SIDE ONLY.
 * Never call this from a Client Component or expose the token to the browser.
 * Use exclusively inside Server Actions and API route handlers.
 */
export const sanityWriteClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN, // ⚠️ Server-side only — never prefix with NEXT_PUBLIC_
})

import { createImageUrlBuilder } from '@sanity/image-url'

const imageBuilder = createImageUrlBuilder({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ynnot4j0',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
})

/** Public image formatting helper. It contains no authenticated Sanity client or token. */
export function urlForImage(source: unknown): string | undefined {
  if (!source) return undefined
  if (typeof source === 'string') return source
  try {
    return imageBuilder.image(source as Parameters<typeof imageBuilder.image>[0]).auto('format').fit('max').url()
  } catch (error) {
    console.error('[urlForImage] Failed to generate URL:', error)
    return undefined
  }
}

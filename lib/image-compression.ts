/**
 * Client-Side Image Compression & Base64 Encoder
 * 
 * System Design Reference: SDD §3.2, §4.6, §6.4
 * Resizes and compresses user-uploaded images in the browser before network transmission.
 * Reduces 5MB-15MB camera portraits to ~150KB-300KB JPEG Base64 payloads,
 * completely eliminating Vercel payload limit issues (4.5MB threshold)
 * and ensuring lightning-fast uploads to Google Drive via Google Apps Script.
 */

export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  mimeType?: 'image/jpeg' | 'image/png' | 'image/webp'
}

export interface CompressedImageResult {
  dataUrl: string
  base64: string
  mimeType: string
  cleanFileName: string
  originalSizeBytes: number
  compressedSizeBytes: number
  width: number
  height: number
}

/**
 * Normalizes full name and team into the SDD-standard filename:
 * ${fullName}_${team}_BirthdayPic.jpg
 */
export function createCleanFileName(fullName?: string, team?: string, ext = 'jpg'): string {
  const cleanName = (fullName || 'Worker')
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '_')
  const cleanTeam = (team || 'General')
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '_')
  return `${cleanName}_${cleanTeam}_BirthdayPic.${ext}`
}

/**
 * Compresses an image File or Blob in the browser using HTML5 Canvas.
 * Returns both the complete data URL (for instant preview) and clean Base64.
 */
export async function compressImage(
  file: File | Blob,
  options: CompressionOptions = {},
  metadata: { fullName?: string; team?: string } = {}
): Promise<CompressedImageResult> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.82,
    mimeType = 'image/jpeg',
  } = options

  const cleanFileName = createCleanFileName(metadata.fullName, metadata.team, mimeType === 'image/png' ? 'png' : 'jpg')

  // If in SSR or environment without Canvas/DOM, fallback to basic FileReader
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result as string
        const base64 = dataUrl.split(',')[1] || dataUrl
        resolve({
          dataUrl,
          base64,
          mimeType: file.type || mimeType,
          cleanFileName,
          originalSizeBytes: file.size,
          compressedSizeBytes: file.size,
          width: 0,
          height: 0,
        })
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      let { width, height } = img

      // Compute aspect ratio scaling
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        // Fallback if canvas 2D context is unavailable
        const reader = new FileReader()
        reader.onload = () => {
          const dataUrl = reader.result as string
          const base64 = dataUrl.split(',')[1] || dataUrl
          resolve({
            dataUrl,
            base64,
            mimeType: file.type || mimeType,
            cleanFileName,
            originalSizeBytes: file.size,
            compressedSizeBytes: file.size,
            width: img.width,
            height: img.height,
          })
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
        return
      }

      // Draw with smooth image interpolation
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, width, height)

      // Export compressed Data URL
      const dataUrl = canvas.toDataURL(mimeType, quality)
      const base64 = dataUrl.split(',')[1] || dataUrl
      const compressedSizeBytes = Math.round((base64.length * 3) / 4)

      resolve({
        dataUrl,
        base64,
        mimeType,
        cleanFileName,
        originalSizeBytes: file.size,
        compressedSizeBytes,
        width,
        height,
      })
    }

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image for processing: ' + err))
    }

    img.src = objectUrl
  })
}

import 'server-only'

import { createHmac } from 'crypto'
import { NextResponse } from 'next/server'
import { patchPrivateDocument, sanityPrivateClient, sanityWriteClient } from '@/lib/sanity'

const MAX_IMAGE_BYTES = 2 * 1024 * 1024
const MAX_BODY_BYTES = 3 * 1024 * 1024

function getImageMimeType(bytes: Buffer): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg'
  }
  if (
    bytes.length >= 8 &&
    bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return 'image/png'
  }
  if (bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') {
    return 'image/webp'
  }
  return null
}

function safeFileName(fullName: unknown, teamOrTeams: unknown): string {
  const cleanName = String(fullName || 'Worker')
    .normalize('NFKD')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]+/g, '')
    .replace(/^_+|_+$/g, '') || 'Worker'

  const cleanTeam = (val: string) =>
    val
      .normalize('NFKD')
      .trim()
      .replace(/[/\\|]+/g, '-')
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_-]+/g, '')
      .replace(/^_+|_+$/g, '')

  const allTeams: string[] = []
  const addUnique = (name?: unknown) => {
    if (!name || typeof name !== 'string') return
    const cleaned = cleanTeam(name)
    if (cleaned && !allTeams.includes(cleaned)) {
      allTeams.push(cleaned)
    }
  }

  if (Array.isArray(teamOrTeams)) {
    for (const t of teamOrTeams) addUnique(t)
  } else if (typeof teamOrTeams === 'string') {
    addUnique(teamOrTeams)
  }

  const teamsPart = allTeams.length > 0 ? allTeams.join('_and_') : 'Workforce'
  return `${cleanName}_${teamsPart}`.slice(0, 105).replace(/^_+|_+$/g, '')
}

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return false
  try {
    return new URL(origin).host === new URL(request.url).host
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request) || request.headers.get('sec-fetch-site') === 'cross-site') {
    return NextResponse.json({ ok: false, error: 'Origin check failed.' }, { status: 403 })
  }

  const declaredLength = Number(request.headers.get('content-length') || 0)
  if (declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: 'Image must be 2 MB or smaller.' }, { status: 413 })
  }

  try {
    const rawBody = await request.text()
    if (Buffer.byteLength(rawBody, 'utf8') > MAX_BODY_BYTES) {
      return NextResponse.json({ ok: false, error: 'Image must be 2 MB or smaller.' }, { status: 413 })
    }

    const body = JSON.parse(rawBody) as {
      base64?: unknown
      fullName?: unknown
      team?: unknown
      uploadGrant?: unknown
    }
    if (typeof body.base64 !== 'string' || !body.base64 || body.base64.length > MAX_IMAGE_BYTES * 1.5) {
      return NextResponse.json({ ok: false, error: 'A valid image is required.' }, { status: 400 })
    }

    // Tolerate a data-URL prefix; strip it so decoding is always clean Base64.
    const cleanBase64 = body.base64.includes('base64,')
      ? body.base64.slice(body.base64.indexOf('base64,') + 7).replace(/\s/g, '')
      : body.base64
    const imageBytes = Buffer.from(cleanBase64, 'base64')
    const mimeType = getImageMimeType(imageBytes)
    if (!mimeType || imageBytes.length === 0 || imageBytes.length > MAX_IMAGE_BYTES) {
      return NextResponse.json({ ok: false, error: 'Use a JPEG, PNG, or WebP image up to 2 MB.' }, { status: 400 })
    }

    if (typeof body.uploadGrant !== 'string' || !/^[A-Za-z0-9_-]{40,60}$/.test(body.uploadGrant)) {
      return NextResponse.json({ ok: false, error: 'This upload request is not authorized.' }, { status: 401 })
    }
    const worker = await sanityPrivateClient.fetch<{ _id: string; _rev: string } | null>(
      `*[_type == "worker" && false][0]{_id, _rev}`,
      {}
    )
    if (!worker) {
      return NextResponse.json({ ok: false, error: 'This upload request is not authorized or has expired.' }, { status: 401 })
    }

    try {
      await patchPrivateDocument(worker._id)
        .ifRevisionId(worker._rev)
        .commit()
    } catch {
      return NextResponse.json({ ok: false, error: 'This upload request has already been used. Reopen the form to try again.' }, { status: 409 })
    }

    const cleanFileName = safeFileName(body.fullName, body.team)
    const fileExtension = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg'

    let uploadedUrl = ''

    // 1. Primary Storage: Sanity Asset Store (ultra-fast CDN with image transformations)
    try {
      const sanityAsset = await sanityWriteClient.assets.upload('image', imageBytes, {
        filename: `${cleanFileName}.${fileExtension}`,
        contentType: mimeType,
      })

      if (sanityAsset?.url) {
        uploadedUrl = sanityAsset.url
        await patchPrivateDocument(worker._id)
          .set({
            profileImageUrl: sanityAsset.url,
            headshot: {
              _type: 'image',
              asset: {
                _type: 'reference',
                _ref: sanityAsset._id,
              },
            },
            updatedAt: new Date().toISOString(),
          })
          .append('updateLog', [`Uploaded official headshot to Sanity CDN on ${new Date().toISOString().slice(0, 10)}`])
          .commit()
      }
    } catch (sanityErr) {
      console.error('[/api/upload-drive] Sanity asset upload failed:', sanityErr)
    }

    // 2. Secondary Storage: Google Drive (if Google Apps Script webhook is configured)
    const appScriptUrl = process.env.GOOGLE_APPS_SCRIPT_WEBHOOK_URL
    const signingSecret = process.env.GOOGLE_APPS_SCRIPT_WEBHOOK_SECRET
    if (appScriptUrl && signingSecret && Buffer.byteLength(signingSecret, 'utf8') >= 32) {
      try {
        const timestamp = Date.now().toString()
        // Sign exactly what the body sends — the Apps Script hashes the
        // payload's fields verbatim, so the filename (with extension) must
        // be consistent in both places.
        const signedFileName = `${cleanFileName}.${fileExtension}`
        const signaturePayload = `${timestamp}\n${signedFileName}\n${mimeType}\n${cleanBase64}`
        const signature = createHmac('sha256', signingSecret).update(signaturePayload).digest('hex')

        const gasResponse = await fetch(appScriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64: cleanBase64,
            cleanFileName: signedFileName,
            mimeType,
            timestamp,
            signature,
          }),
          redirect: 'follow',
          cache: 'no-store',
        })

        if (gasResponse.ok) {
          const data = (await gasResponse.json()) as { ok?: boolean; fileUrl?: string }
          if (data.ok && data.fileUrl && !uploadedUrl) {
            uploadedUrl = data.fileUrl
            await patchPrivateDocument(worker._id)
              .set({ profileImageUrl: uploadedUrl, updatedAt: new Date().toISOString() })
              .commit()
          } else {
            console.warn('[/api/upload-drive] Google Drive webhook did not save the file:', JSON.stringify(data ?? 'non-JSON response'))
          }
        } else {
          console.warn(`[/api/upload-drive] Google Drive webhook returned HTTP ${gasResponse.status}`)
        }
      } catch (gasErr) {
        console.warn('[/api/upload-drive] Optional Google Drive backup skipped:', gasErr)
      }
    }

    if (!uploadedUrl) {
      return NextResponse.json({ ok: false, error: 'The image upload service could not save the file.' }, { status: 502 })
    }

    return NextResponse.json({ ok: true, fileUrl: uploadedUrl })
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid upload request.' }, { status: 400 })
  }
}

import { NextResponse } from 'next/server'

/**
 * API Route: /api/upload-drive
 *
 * System Design Reference: SDD §4.6, §6.4, §7.1
 * Proxies Base64 image payloads from the client to the Google Apps Script Webhook.
 * Prevents browser CORS limitations (Google Apps Script does not support OPTIONS preflights)
 * and keeps Google Drive folder IDs and webhook keys secured.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { base64, cleanFileName, fullName, team, mimeType } = body

    if (!base64) {
      return NextResponse.json(
        { ok: false, error: 'No Base64 image data provided' },
        { status: 400 }
      )
    }

    const webhookUrl =
      process.env.GOOGLE_APPS_SCRIPT_WEBHOOK_URL ||
      process.env.NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_WEBHOOK_URL

    if (!webhookUrl) {
      console.warn(
        '[/api/upload-drive] GOOGLE_APPS_SCRIPT_WEBHOOK_URL is not configured in environment.'
      )
      return NextResponse.json(
        {
          ok: false,
          error:
            'Google Apps Script webhook is not configured. Please add GOOGLE_APPS_SCRIPT_WEBHOOK_URL to .env.local.',
        },
        { status: 503 }
      )
    }

    // Forward to Google Apps Script Webhook
    const gasResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base64,
        cleanFileName,
        fullName,
        team,
        mimeType: mimeType || 'image/jpeg',
      }),
      // Follow redirects automatically (Google Apps Script redirects via 302 to script.googleusercontent.com)
      redirect: 'follow',
    })

    if (!gasResponse.ok) {
      const errText = await gasResponse.text()
      console.error('[/api/upload-drive] Google Apps Script returned error:', gasResponse.status, errText)
      return NextResponse.json(
        { ok: false, error: `Google Apps Script returned status ${gasResponse.status}` },
        { status: 502 }
      )
    }

    const data = (await gasResponse.json()) as {
      ok?: boolean
      fileUrl?: string
      url?: string
      directUrl?: string
      driveViewUrl?: string
      error?: string
    }

    if (data.ok === false || data.error) {
      console.error('[/api/upload-drive] Google Apps Script failure payload:', data.error)
      return NextResponse.json(
        { ok: false, error: data.error || 'Failed to save image to Google Drive' },
        { status: 500 }
      )
    }

    const fileUrl = data.fileUrl || data.directUrl || data.url

    return NextResponse.json({
      ok: true,
      fileUrl,
      driveViewUrl: data.driveViewUrl,
    })
  } catch (error) {
    console.error('[/api/upload-drive] Exception processing upload:', error)
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Internal server error processing image upload',
      },
      { status: 500 }
    )
  }
}

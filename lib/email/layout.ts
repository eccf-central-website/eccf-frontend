import 'server-only'

/**
 * Shared ECCF email design system.
 *
 * Every transactional and broadcast email is composed from these helpers so the
 * fellowship speaks with one visual voice: a white sheet on a soft background,
 * a quiet masthead, editorial serif headlines, hairline detail rows, and no
 * stacks of bordered boxes (which break in dark mode and on narrow screens).
 *
 * Rules of the road:
 * - Email clients only understand table layout and inline CSS.
 * - Never nest a bordered/filled container inside the content. Use the
 *   `emailDetails`, `emailNotice`, `emailCodeBlock` and `emailButton` helpers
 *   instead; they rely on hairlines and whitespace rather than boxes.
 * - Always pass user-supplied values through `escapeHtml`.
 */

export const ECCF_EMAIL = {
  organisation: 'Edo State University Christian Campus Fellowship',
  shortName: 'ECCF',
  motto: 'Raising Spiritual Dynamites and Academic Giants.',
  venue: 'NLT 5, Faculty of Law, ESUI',
  address: 'Edo State University Iyamho (ESUI), Edo State, Nigeria',
  services: 'Sunday Worship Encounter 08:00 AM · Wednesday Bible Study 04:50 PM',
  siteUrl: 'https://eccffamily.org',
  logoPath: '/logos/eccf-email-logo.png',
} as const

const FONT_SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
const FONT_SERIF = "Georgia, 'Times New Roman', Times, serif"
const FONT_MONO =
  "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace"

const INK = '#0f172a'
const BODY = '#3d4c63'
const MUTED = '#71809a'
const FAINT = '#94a3b8'
const HAIRLINE = '#e6ecf4'
const BRAND = '#0077cc'
const BRAND_LIGHT = '#0095ff'

/** Resolve the public site URL used for links and hosted images. */
export function resolveSiteUrl(preferred?: string | null): string {
  // A localhost value is useful for development previews but must never leak
  // into a real inbox.
  const isPublic = (value?: string | null): value is string =>
    Boolean(value && /^https?:\/\//i.test(value) && !/localhost|127\.0\.0\.1/i.test(value))
  if (isPublic(preferred)) return preferred.replace(/\/$/, '')
  const configured = (
    process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || ''
  ).replace(/\/$/, '')
  if (isPublic(configured)) return configured
  return ECCF_EMAIL.siteUrl
}

export function emailLogoUrl(siteUrl?: string): string {
  return `${siteUrl || resolveSiteUrl()}${ECCF_EMAIL.logoPath}`
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function absoluteUrl(href: string, siteUrl: string): string {
  if (/^https?:\/\//i.test(href) || href.startsWith('mailto:')) return href
  return `${siteUrl}${href.startsWith('/') ? '' : '/'}${href}`
}

/* -------------------------------------------------------------------------- */
/* Content primitives                                                          */
/* -------------------------------------------------------------------------- */

export function emailParagraph(
  html: string,
  options: { muted?: boolean; small?: boolean; last?: boolean } = {}
): string {
  const size = options.small ? '13px' : '15px'
  const color = options.muted ? MUTED : BODY
  const margin = options.last ? '0' : '0 0 16px 0'
  return `<p style="margin:${margin};font-family:${FONT_SANS};font-size:${size};line-height:1.72;color:${color};">${html}</p>`
}

export function emailLead(html: string): string {
  return `<p style="margin:0 0 20px 0;font-family:${FONT_SANS};font-size:17px;line-height:1.65;color:${BODY};">${html}</p>`
}

export function emailSectionTitle(text: string): string {
  return `<h2 style="margin:0 0 12px 0;font-family:${FONT_SERIF};font-size:19px;line-height:1.35;color:${INK};font-weight:700;">${text}</h2>`
}

export function emailDivider(): string {
  return `<div style="height:1px;line-height:1px;font-size:0;background-color:${HAIRLINE};margin:24px 0;">&nbsp;</div>`
}

export interface EmailDetailRow {
  label: string
  value: string
  /** Highlight the value in ECCF blue (teams, roles, key facts). */
  accent?: boolean
  /** Render the value in the muted tone (secondary facts). */
  muted?: boolean
}

/**
 * A definition list with generous label/value separation and hairline rules.
 * Values may contain escaped HTML. Long values wrap instead of overflowing.
 */
export function emailDetails(rows: EmailDetailRow[]): string {
  if (rows.length === 0) return ''
  const body = rows
    .map((row, index) => {
      const last = index === rows.length - 1
      const border = last ? '' : `border-bottom:1px solid ${HAIRLINE};`
      const valueColor = row.accent ? BRAND : row.muted ? MUTED : '#27364c'
      return `
        <tr>
          <td width="38%" class="eccf-detail-label" style="width:38%;padding:12px 20px 12px 0;${border}vertical-align:top;font-family:${FONT_SANS};font-size:10.5px;line-height:1.6;letter-spacing:0.09em;text-transform:uppercase;color:${MUTED};font-weight:700;word-break:break-word;">
            ${row.label}
          </td>
          <td class="eccf-detail-value" style="padding:12px 0;${border}vertical-align:top;font-family:${FONT_SANS};font-size:14px;line-height:1.6;color:${valueColor};font-weight:600;word-break:break-word;overflow-wrap:anywhere;">
            ${row.value}
          </td>
        </tr>`
    })
    .join('')

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;table-layout:fixed;border-collapse:collapse;margin:4px 0 26px 0;"><tbody>${body}</tbody></table>`
}

/**
 * Verification codes. Hairlines above and below instead of a dashed box so the
 * digits stay legible in every client.
 */
export function emailCodeBlock({
  code,
  caption,
  note,
}: {
  code: string
  caption: string
  note?: string
}): string {
  return `
    <div style="margin:0 0 28px 0;padding:24px 0 22px 0;border-top:1px solid #d8e5f2;border-bottom:1px solid #d8e5f2;text-align:center;">
      <p style="margin:0 0 12px 0;font-family:${FONT_SANS};font-size:10.5px;line-height:1.5;letter-spacing:0.14em;text-transform:uppercase;color:${BRAND};font-weight:700;">${caption}</p>
      <p class="eccf-code" style="margin:0;padding-left:8px;font-family:${FONT_MONO};font-size:36px;line-height:1.15;letter-spacing:8px;color:${INK};font-weight:700;">${escapeHtml(code)}</p>
      ${note ? `<p style="margin:12px 0 0 0;font-family:${FONT_SANS};font-size:12px;line-height:1.6;color:${MUTED};">${note}</p>` : ''}
    </div>`
}

/** A single primary action. The raw URL is repeated underneath for clients that strip buttons. */
export function emailButton({
  href,
  label,
  siteUrl,
  showFallback = true,
}: {
  href: string
  label: string
  siteUrl?: string
  showFallback?: boolean
}): string {
  const url = absoluteUrl(href, siteUrl || resolveSiteUrl())
  const fallback = showFallback
    ? `<p style="margin:14px 0 0 0;font-family:${FONT_SANS};font-size:12px;line-height:1.6;color:${MUTED};word-break:break-all;">
        If the button does not work, copy this link into your browser:<br />
        <a href="${escapeHtml(url)}" style="color:${BRAND};text-decoration:underline;">${escapeHtml(url)}</a>
      </p>`
    : ''
  return `
    <div style="margin:0 0 26px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;">
        <tr>
          <td bgcolor="${BRAND}" style="border-radius:10px;">
            <a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 28px;font-family:${FONT_SANS};font-size:14px;line-height:1.2;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">${label}</a>
          </td>
        </tr>
      </table>
      ${fallback}
    </div>`
}

type NoticeTone = 'info' | 'success' | 'warning' | 'neutral'

const NOTICE_COLORS: Record<NoticeTone, { rule: string; title: string; text: string }> = {
  info: { rule: BRAND_LIGHT, title: '#0b4f82', text: BODY },
  success: { rule: '#10b981', title: '#0f6f4f', text: BODY },
  warning: { rule: '#f59e0b', title: '#8a4b06', text: BODY },
  neutral: { rule: '#c3cfdf', title: INK, text: BODY },
}

/**
 * A quiet callout: a single coloured rule on the left, no card, no fill.
 */
export function emailNotice({
  title,
  body,
  tone = 'info',
}: {
  title?: string
  body: string
  tone?: NoticeTone
}): string {
  const colors = NOTICE_COLORS[tone]
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 0 26px 0;">
      <tr>
        <td style="border-left:3px solid ${colors.rule};padding:2px 0 2px 16px;">
          ${title ? `<p style="margin:0 0 5px 0;font-family:${FONT_SANS};font-size:13px;line-height:1.5;font-weight:700;color:${colors.title};">${title}</p>` : ''}
          <p style="margin:0;font-family:${FONT_SANS};font-size:13px;line-height:1.7;color:${colors.text};">${body}</p>
        </td>
      </tr>
    </table>`
}

export function emailList(
  items: string[],
  options: { ordered?: boolean } = {}
): string {
  const tag = options.ordered ? 'ol' : 'ul'
  const list = items
    .map(
      (item, index) =>
        `<li style="margin:0 0 ${index === items.length - 1 ? '0' : '9px'} 0;padding-left:2px;font-family:${FONT_SANS};font-size:14px;line-height:1.68;color:${BODY};">${item}</li>`
    )
    .join('')
  return `<${tag} style="margin:0 0 26px 0;padding-left:20px;">${list}</${tag}>`
}

/** Escape + paragraph-split a plain-text body while preserving single line breaks. */
export function emailPlainBody(text: string): string {
  return text
    .split(/\n{2,}|\r\n\r\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => emailParagraph(escapeHtml(paragraph).replace(/\n/g, '<br />')))
    .join('')
}

/**
 * Minimal rich-text renderer for Sanity portable text used by bulletins.
 */
export function emailRichText(blocks: unknown): string {
  if (!blocks) return ''
  if (typeof blocks === 'string') return emailPlainBody(blocks)
  if (!Array.isArray(blocks)) return ''

  let html = ''
  let inList = false

  const closeList = () => {
    if (inList) {
      html += '</ul>'
      inList = false
    }
  }

  for (const block of blocks) {
    if (!block || block._type !== 'block' || !block.children) continue
    const text = (block.children as Array<{ text?: string; marks?: string[] }>)
      .map((child) => {
        let value = escapeHtml(child.text || '')
        if (child.marks?.includes('strong')) value = `<strong>${value}</strong>`
        if (child.marks?.includes('em')) value = `<em>${value}</em>`
        if (child.marks?.includes('underline')) value = `<u>${value}</u>`
        return value
      })
      .join('')

    if (block.listItem === 'bullet' || block.listItem === 'number') {
      if (!inList) {
        html += `<ul style="margin:0 0 20px 0;padding-left:20px;">`
        inList = true
      }
      html += `<li style="margin-bottom:8px;font-family:${FONT_SANS};font-size:15px;line-height:1.7;color:${BODY};">${text}</li>`
      continue
    }

    closeList()

    if (block.style === 'h2' || block.style === 'h3') {
      html += `<h3 style="margin:22px 0 10px 0;font-family:${FONT_SERIF};font-size:18px;line-height:1.4;color:${INK};font-weight:700;">${text}</h3>`
    } else if (block.style === 'blockquote') {
      html += `<blockquote style="margin:0 0 18px 0;padding:0 0 0 16px;border-left:3px solid ${HAIRLINE};font-family:${FONT_SANS};font-size:15px;line-height:1.7;color:${MUTED};">${text}</blockquote>`
    } else {
      html += `<p style="margin:0 0 15px 0;font-family:${FONT_SANS};font-size:15px;line-height:1.72;color:${BODY};">${text}</p>`
    }
  }

  closeList()
  return html
}

/* -------------------------------------------------------------------------- */
/* Layout                                                                      */
/* -------------------------------------------------------------------------- */

export interface EmailLayoutOptions {
  /** Hidden inbox preview line. */
  preheader?: string
  /** Small uppercase label above the headline. */
  eyebrow?: string
  title: string
  /** Body HTML built from the primitives above. */
  content: string
  /** Optional sign-off block (name, role). */
  signature?: { name: string; role?: string }
  /** Fine print in the footer, e.g. why the recipient got this email. */
  footerNote?: string
  /** Keep a plain "official communication" line. Defaults to true. */
  official?: boolean
  siteUrl?: string
  logoUrl?: string
}

function renderSignature(signature?: EmailLayoutOptions['signature']): string {
  if (!signature) return ''
  return `
    <div style="margin:28px 0 4px 0;padding-top:20px;border-top:1px solid ${HAIRLINE};">
      <p style="margin:0;font-family:${FONT_SANS};font-size:14px;line-height:1.6;font-weight:700;color:${INK};">${signature.name}</p>
      ${signature.role ? `<p style="margin:2px 0 0 0;font-family:${FONT_SANS};font-size:12px;line-height:1.6;color:${MUTED};">${signature.role}</p>` : ''}
    </div>`
}

export function renderEmailLayout({
  preheader,
  eyebrow,
  title,
  content,
  signature,
  footerNote,
  official = true,
  siteUrl = resolveSiteUrl(),
  logoUrl = emailLogoUrl(siteUrl),
}: EmailLayoutOptions): string {
  const footerReason =
    footerNote ||
    (official
      ? 'This is an official communication from Edo State University Christian Campus Fellowship.'
      : '')
  const siteLabel = siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" style="color-scheme:light;">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <title>${escapeHtml(title)}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, p, a { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
  <style type="text/css">
    html, body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    body { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; background-color: #f4f7fb; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    a { color: ${BRAND}; }
    @media screen and (max-width: 600px) {
      .eccf-shell { padding: 14px 10px !important; }
      .eccf-pad { padding-left: 22px !important; padding-right: 22px !important; }
      .eccf-title { font-size: 24px !important; line-height: 1.28 !important; }
      .eccf-code { font-size: 30px !important; letter-spacing: 5px !important; }
      .eccf-wordmark { font-size: 14px !important; line-height: 1.35 !important; }
    }
    @media screen and (max-width: 400px) {
      .eccf-detail-label {
        display: block !important;
        width: 100% !important;
        padding: 12px 0 1px 0 !important;
        border-bottom: 0 !important;
        font-size: 10px !important;
        letter-spacing: 0.08em !important;
      }
      .eccf-detail-value {
        display: block !important;
        width: 100% !important;
        padding: 2px 0 12px 0 !important;
        font-size: 14px !important;
      }
    }
  </style>
</head>
<body bgcolor="#f4f7fb" style="margin:0;padding:0;background-color:#f4f7fb;">
  ${
    preheader
      ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#f4f7fb;opacity:0;">${escapeHtml(preheader)}&#8199;&#65279;&#8199;&#65279;&#8199;&#65279;&#8199;&#65279;</div>`
      : ''
  }
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f4f7fb" style="width:100%;background-color:#f4f7fb;">
    <tr>
      <td align="center" class="eccf-shell" style="padding:36px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="width:100%;max-width:600px;background-color:#ffffff;border:1px solid #e7edf5;border-radius:16px;overflow:hidden;">
          <tr>
            <td class="eccf-pad" style="padding:26px 34px 0 34px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="48" valign="middle" style="width:48px;">
                    <img src="${escapeHtml(logoUrl)}" width="44" height="44" alt="ECCF" style="display:block;width:44px;height:44px;border:0;border-radius:50%;" />
                  </td>
                  <td valign="middle" style="padding-left:14px;">
                    <p class="eccf-wordmark" style="margin:0;font-family:${FONT_SERIF};font-size:17px;line-height:1.25;font-weight:700;color:${INK};letter-spacing:-0.01em;">Edo State University Christian Campus Fellowship</p>
                    <p style="margin:5px 0 0 0;font-family:${FONT_SANS};font-size:9.5px;line-height:1.4;letter-spacing:0.16em;text-transform:uppercase;color:${FAINT};font-weight:700;">ECCF &middot; Official Mail</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="eccf-pad" style="padding:22px 34px 0 34px;">
              <div style="height:1px;line-height:1px;font-size:0;background-color:${HAIRLINE};">&nbsp;</div>
            </td>
          </tr>
          <tr>
            <td class="eccf-pad" style="padding:28px 34px 4px 34px;">
              ${eyebrow ? `<p style="margin:0 0 10px 0;font-family:${FONT_SANS};font-size:10.5px;line-height:1.5;letter-spacing:0.14em;text-transform:uppercase;color:${BRAND};font-weight:700;">${eyebrow}</p>` : ''}
              <h1 class="eccf-title" style="margin:0 0 20px 0;font-family:${FONT_SERIF};font-size:28px;line-height:1.28;font-weight:700;color:${INK};letter-spacing:-0.015em;">${title}</h1>
              ${content}
              ${renderSignature(signature)}
            </td>
          </tr>
          <tr>
            <td class="eccf-pad" style="padding:26px 34px 0 34px;">
              <div style="height:1px;line-height:1px;font-size:0;background-color:${HAIRLINE};">&nbsp;</div>
            </td>
          </tr>
          <tr>
            <td class="eccf-pad" style="padding:20px 34px 30px 34px;">
              <p style="margin:0 0 7px 0;font-family:${FONT_SANS};font-size:12px;line-height:1.65;font-weight:700;color:#54637a;">
                ${ECCF_EMAIL.organisation}
              </p>
              <p style="margin:0 0 5px 0;font-family:${FONT_SANS};font-size:12px;line-height:1.65;color:${MUTED};">
                ${ECCF_EMAIL.address}<br />
                ${ECCF_EMAIL.venue}
              </p>
              <p style="margin:0 0 12px 0;font-family:${FONT_SANS};font-size:12px;line-height:1.65;color:${MUTED};">
                ${ECCF_EMAIL.services}
              </p>
              <p style="margin:0;font-family:${FONT_SANS};font-size:11px;line-height:1.65;color:${FAINT};">
                ${footerReason ? `${footerReason}<br />` : ''}
                <a href="${siteUrl}" style="color:${FAINT};text-decoration:underline;">${siteLabel}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

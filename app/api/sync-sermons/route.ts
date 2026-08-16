/**
 * RSS Auto-Sync API Handler — /api/sync-sermons
 *
 * Implements ADR-002: Ingests open RSS feeds from Spotify for Podcasters (Anchor)
 * and YouTube channel feeds, and auto-upserts sermonVault documents into Sanity CMS.
 */

import { NextResponse } from 'next/server'
import { sanityWriteClient } from '@/lib/sanity'

export const dynamic = 'force-dynamic'

// RSS Feed URLs — populated from env or defaults
const SPOTIFY_RSS_URL = process.env.SPOTIFY_RSS_URL || ''
const YOUTUBE_RSS_URL = process.env.YOUTUBE_RSS_URL || ''

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const secret = process.env.CRON_SECRET

    // Validate Cron Secret header if configured
    if (secret && authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results = {
      spotify: { itemsFetched: 0, created: 0, updated: 0, skipped: 0 },
      youtube: { itemsFetched: 0, created: 0, updated: 0, skipped: 0 },
    }

    // 1. Process Spotify RSS Feed
    if (SPOTIFY_RSS_URL) {
      const res = await fetch(SPOTIFY_RSS_URL, { cache: 'no-store' })
      if (res.ok) {
        const xmlText = await res.text()
        const items = parseRssItems(xmlText)
        results.spotify.itemsFetched = items.length

        for (const item of items) {
          const spotifyEmbedId = extractSpotifyId(item.link || item.guid)
          const existing = await sanityWriteClient.fetch(
            `*[_type == "sermonVault" && (spotifyEmbedId == $id || title == $title)][0]`,
            { id: spotifyEmbedId, title: item.title }
          )

          if (!existing) {
            await sanityWriteClient.create({
              _type: 'sermonVault',
              title: item.title,
              preacher: item.author || 'ECCF Media',
              series: 'Sermon Series',
              topics: ['Faith', 'Sermon'],
              datePreached: item.pubDate ? new Date(item.pubDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              scriptureReference: 'Scripture Reference',
              spotifyUrl: item.link,
              spotifyEmbedId,
              isAutoSynced: true,
            })
            results.spotify.created++
          } else if (existing.isAutoSynced !== false) {
            await sanityWriteClient.patch(existing._id).set({
              spotifyUrl: item.link,
              spotifyEmbedId,
            }).commit()
            results.spotify.updated++
          } else {
            results.spotify.skipped++
          }
        }
      }
    }

    // 2. Process YouTube RSS Feed
    if (YOUTUBE_RSS_URL) {
      const res = await fetch(YOUTUBE_RSS_URL, { cache: 'no-store' })
      if (res.ok) {
        const xmlText = await res.text()
        const items = parseRssItems(xmlText)
        results.youtube.itemsFetched = items.length

        for (const item of items) {
          const youtubeVideoId = extractYoutubeId(item.link || item.guid)
          const youtubeMusicUrl = youtubeVideoId ? `https://music.youtube.com/watch?v=${youtubeVideoId}` : undefined

          const existing = await sanityWriteClient.fetch(
            `*[_type == "sermonVault" && (youtubeVideoId == $id || title == $title)][0]`,
            { id: youtubeVideoId, title: item.title }
          )

          if (!existing) {
            await sanityWriteClient.create({
              _type: 'sermonVault',
              title: item.title,
              preacher: 'ECCF Media',
              series: 'Sermon Series',
              topics: ['Faith', 'Sermon'],
              datePreached: item.pubDate ? new Date(item.pubDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              scriptureReference: 'Scripture Reference',
              youtubeUrl: item.link,
              youtubeVideoId,
              youtubeMusicUrl,
              isAutoSynced: true,
            })
            results.youtube.created++
          } else if (existing.isAutoSynced !== false) {
            await sanityWriteClient.patch(existing._id).set({
              youtubeUrl: item.link,
              youtubeVideoId,
              youtubeMusicUrl,
            }).commit()
            results.youtube.updated++
          } else {
            results.youtube.skipped++
          }
        }
      }
    }

    return NextResponse.json({
      status: 'success',
      syncedAt: new Date().toISOString(),
      results,
    })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Internal Server Error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function GET(request: Request) {
  return POST(request)
}

function parseRssItems(xml: string) {
  const items: Array<{ title: string; link: string; guid: string; pubDate: string; author: string }> = []
  const matches = xml.match(/<item>([\s\S]*?)<\/item>/g) || []

  for (const match of matches) {
    const titleMatch = match.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)
    const linkMatch = match.match(/<link>(.*?)<\/link>/)
    const guidMatch = match.match(/<guid.*?>(.*?)<\/guid>/)
    const pubDateMatch = match.match(/<pubDate>(.*?)<\/pubDate>/)
    const authorMatch = match.match(/<itunes:author>(.*?)<\/itunes:author>/)

    if (titleMatch) {
      items.push({
        title: titleMatch[1].trim(),
        link: linkMatch ? linkMatch[1].trim() : '',
        guid: guidMatch ? guidMatch[1].trim() : '',
        pubDate: pubDateMatch ? pubDateMatch[1].trim() : '',
        author: authorMatch ? authorMatch[1].trim() : '',
      })
    }
  }

  return items
}

function extractSpotifyId(urlStr: string) {
  const match = urlStr.match(/episode\/([a-zA-Z0-9]+)/)
  return match ? match[1] : ''
}

function extractYoutubeId(urlStr: string) {
  const match = urlStr.match(/(?:v=|\/embed\/|\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return match ? match[1] : ''
}

import { NextResponse } from 'next/server'

export const dynamic = 'force-static'
export const revalidate = 86400 // Cache for 24 hours

export async function GET() {
  const manifestData = {
    name: 'ECCF Exco Dashboard',
    short_name: 'ECCF Exco Dashboard',
    description:
      'Official Management & Operational Portal for Edo State University Christian Campus Fellowship Exco Members.',
    start_url: '/dashboard',
    scope: '/dashboard',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#020617',
    theme_color: '#0077cc',
    categories: ['productivity', 'management', 'education'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    shortcuts: [
      {
        name: 'Record Attendance',
        short_name: 'Attendance',
        description: 'Mark attendance for weekly services and fellowship meetings',
        url: '/dashboard/attendance',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Worker CRM',
        short_name: 'Workers',
        description: 'Manage fellowship personnel, departments, and halls',
        url: '/dashboard/workers',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'First Timers Ledger',
        short_name: 'First Timers',
        description: 'Review new student arrivals and follow-up assignments',
        url: '/dashboard/first-timers',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Finance Ledger',
        short_name: 'Finances',
        description: 'Inspect income, tithes, and fellowship expenses',
        url: '/dashboard/finance',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
    ],
  }

  return NextResponse.json(manifestData, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}

/**
 * PlatformIcons — Clean, authentic SVG icons for Spotify, YouTube Music, and YouTube
 */

import React from 'react'

export function SpotifyIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.5 17.3c-.2.3-.6.4-.9.2-2.5-1.5-5.6-1.9-9.3-1-.4.1-.7-.2-.8-.5-.1-.4.2-.7.5-.8 4.1-1 7.6-.5 10.3 1.2.4.2.4.6.2.9zm1.5-3.3c-.3.4-.8.5-1.2.3-2.9-1.8-7.3-2.3-10.7-1.3-.5.1-.9-.2-1-.6-.1-.5.2-.9.6-1 4-1.2 8.8-.7 12 1.3.4.3.5.8.3 1.3zm.1-3.4C15.6 8.5 9.1 8.3 5.3 9.4c-.6.2-1.2-.2-1.3-.7-.2-.6.2-1.2.7-1.3 4.5-1.4 11.6-1.1 16 1.5.5.3.7 1 .4 1.5-.3.5-1 .7-1.5.4z" />
    </svg>
  )
}

export function YouTubeMusicIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm0 19.2c-3.97 0-7.2-3.23-7.2-7.2s3.23-7.2 7.2-7.2 7.2 3.23 7.2 7.2-3.23 7.2-7.2 7.2zm0-11.4c-2.32 0-4.2 1.88-4.2 4.2s1.88 4.2 4.2 4.2 4.2-1.88 4.2-4.2-1.88-4.2-4.2-4.2zm-1.2 6V10.2l3.6 1.8-3.6 1.8z" />
    </svg>
  )
}

export function YouTubeIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

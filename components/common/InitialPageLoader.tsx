'use client'

import { useState, useEffect } from 'react'
import LoadingState from './LoadingState'

export default function InitialPageLoader() {
  const [mounted, setMounted] = useState(false)
  const [active, setActive] = useState(true)

  useEffect(() => {
    setMounted(true)
    // Hold the loading animation for 2.2 seconds so visitors can enjoy the branded transition
    const timer = setTimeout(() => {
      setActive(false)
    }, 2200)

    return () => clearTimeout(timer)
  }, [])

  if (!mounted || !active) return null

  return (
    <LoadingState
      fullscreen
      size="md"
      theme="light"
      message="Welcome to ECCF Family"
      subtext="Preparing fellowship space..."
    />
  )
}

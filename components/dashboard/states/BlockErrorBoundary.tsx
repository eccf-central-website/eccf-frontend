/**
 * BlockErrorBoundary — contains a failure to one streamed block of a page
 * (e.g. one overview widget), so the header and sibling blocks stay usable
 * instead of the whole page falling through to dashboard/error.tsx.
 *
 * Wrap it around a <Suspense> boundary. An error thrown by the async Server
 * Component inside is caught here and shown as an inline ErrorState; Retry
 * refreshes Server Component data and clears the boundary in one
 * transition (see ErrorState). Like ErrorState it never renders
 * error.message, only the digest. Next's redirect()/notFound() signals are
 * rethrown so the router still handles them.
 */

'use client'

import { Component } from 'react'
import ErrorState from './ErrorState'

type BoundaryError = Error & { digest?: string }

interface BlockErrorBoundaryProps {
  title?: string
  description?: string
  headingLevel?: 'h2' | 'h3'
  className?: string
  children: React.ReactNode
}

interface BlockErrorBoundaryState {
  error: BoundaryError | null
}

function isNextRouterSignal(error: unknown): boolean {
  const digest = (error as BoundaryError | null)?.digest
  return typeof digest === 'string' && (digest.startsWith('NEXT_REDIRECT') || digest === 'NEXT_NOT_FOUND')
}

export default class BlockErrorBoundary extends Component<BlockErrorBoundaryProps, BlockErrorBoundaryState> {
  state: BlockErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: BoundaryError): BlockErrorBoundaryState {
    if (isNextRouterSignal(error)) throw error
    return { error }
  }

  componentDidCatch(error: BoundaryError) {
    // Dev visibility only; the UI never shows error.message.
    console.error(error)
  }

  reset = () => this.setState({ error: null })

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    const { title = "This section couldn't load", description, headingLevel = 'h3', className } = this.props
    return (
      <ErrorState
        title={title}
        description={description ?? 'Something went wrong while fetching it. The rest of the page is unaffected.'}
        digest={error.digest}
        reset={this.reset}
        backHref={null}
        headingLevel={headingLevel}
        className={className ?? 'py-8 sm:py-10'}
      />
    )
  }
}

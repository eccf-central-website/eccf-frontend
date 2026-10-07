/**
 * LoadingRegion — shared wrapper for every dashboard skeleton.
 *
 * Announces a single "Loading…" message to screen readers (role="status",
 * aria-busy) and hides the decorative skeleton shapes from them. When a
 * route composes several skeletons, only one should announce: pass
 * `announce={false}` to the others and they render as plain hidden markup.
 */

export interface LoadingRegionProps {
  /** Screen-reader text, e.g. "Loading workers…". */
  label?: string
  /** false = decorative only (another skeleton on the page announces). */
  announce?: boolean
  className?: string
  children: React.ReactNode
}

export default function LoadingRegion({
  label = 'Loading…',
  announce = true,
  className,
  children,
}: LoadingRegionProps) {
  if (!announce) {
    return (
      <div aria-hidden="true" className={className}>
        {children}
      </div>
    )
  }

  return (
    <div role="status" aria-busy="true" aria-live="polite" className={className}>
      <span className="sr-only">{label}</span>
      <div aria-hidden="true">{children}</div>
    </div>
  )
}

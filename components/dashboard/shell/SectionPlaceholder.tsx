/**
 * SectionPlaceholder — stub body for dashboard sections whose feature
 * branch hasn't landed yet. Lets nav links resolve and direct-URL RBAC be
 * tested before the real pages exist.
 *
 * Stubs already fetch their section's data so the loading, empty and error
 * states run for real; `count` reports how many records came back (only
 * the number crosses to the browser, never the rows).
 */

import Link from 'next/link'
import { ArrowLeft, Construction } from 'lucide-react'
import { SECTION_PATHS, type DashboardSection } from '@/lib/dashboard/rbac'
import { Button } from '@/components/dashboard/ui/button'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/dashboard/ui/card'
import PageContainer from './PageContainer'
import { navItemForSection } from './nav-items'

interface SectionPlaceholderProps {
  section: DashboardSection
  /** Branch that will deliver this page, e.g. `feature/dashboard-data-tables`. */
  branch: string
  description: string
  /** Records the section's data function returned. */
  count?: number
  /** Optional custom CTA slot; defaults to a 44px link back to Overview. */
  action?: React.ReactNode
}

export default function SectionPlaceholder({
  section,
  branch,
  description,
  count,
  action,
}: SectionPlaceholderProps) {
  const { label, icon: Icon } = navItemForSection(section)

  return (
    <PageContainer>
      <Card className="border-0">
        <CardHeader className="gap-3">
          <div
            aria-hidden="true"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground"
          >
            <Icon className="h-5 w-5 shrink-0" />
          </div>
          <CardTitle className="font-sans text-xl font-semibold leading-snug text-foreground sm:text-2xl">
            <h2>{label}</h2>
          </CardTitle>
          <CardDescription className="max-w-prose text-sm leading-relaxed text-pretty">
            {description}
          </CardDescription>
          {count !== undefined && (
            <p className="text-sm text-foreground">
              {count} {count === 1 ? 'record' : 'records'} loaded and ready for this view.
            </p>
          )}
          <p className="flex flex-wrap items-center gap-2 pt-1 text-sm text-muted-foreground">
            <Construction aria-hidden="true" className="h-4 w-4 shrink-0 text-warning" />
            Coming in
            <code className="break-all rounded bg-muted px-2 py-0.5 font-mono text-[13px] text-foreground">
              {branch}
            </code>
          </p>
        </CardHeader>
        <CardFooter className="flex flex-wrap gap-3 [&_a]:min-h-11 [&_button]:min-h-11">
          {action ?? (
            <Button asChild variant="outline" className="h-auto min-h-11 px-5 py-2.5 focus-visible:ring-2">
              <Link href={SECTION_PATHS.overview}>
                <ArrowLeft aria-hidden="true" />
                Back to Overview
              </Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </PageContainer>
  )
}

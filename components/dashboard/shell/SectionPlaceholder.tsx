/**
 * SectionPlaceholder — stub body for dashboard sections whose feature
 * branch hasn't landed yet. Lets nav links resolve and direct-URL RBAC be
 * tested before the real pages exist.
 */

import { Construction } from 'lucide-react'
import type { DashboardSection } from '@/lib/dashboard/rbac'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/dashboard/ui/card'
import { navItemForSection } from './nav-items'

interface SectionPlaceholderProps {
  section: DashboardSection
  /** Branch that will deliver this page, e.g. `feature/dashboard-data-tables`. */
  branch: string
  description: string
}

export default function SectionPlaceholder({ section, branch, description }: SectionPlaceholderProps) {
  const { label, icon: Icon } = navItemForSection(section)

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:py-10">
      <Card>
        <CardHeader className="gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Icon aria-hidden="true" className="h-5 w-5" />
          </div>
          <CardTitle className="font-serif text-2xl">
            <h2>{label}</h2>
          </CardTitle>
          <CardDescription>{description}</CardDescription>
          <p className="flex flex-wrap items-center gap-2 pt-1 text-sm text-muted-foreground">
            <Construction aria-hidden="true" className="h-4 w-4 text-warning" />
            Coming in
            <code className="break-all rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">{branch}</code>
          </p>
        </CardHeader>
      </Card>
    </div>
  )
}

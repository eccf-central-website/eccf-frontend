/**
 * Dashboard Overview — /dashboard
 *
 * Placeholder from feature/dashboard-foundation: proves the auth boundary,
 * RBAC filtering and data boundary end to end. The real overview (stat
 * cards, recent activity) arrives in feature/dashboard-overview.
 */

import { requireSession } from '@/lib/dashboard/auth'
import { getOverviewStats } from '@/lib/dashboard/data'
import { ROLE_LABELS } from '@/lib/dashboard/rbac'
import { Badge } from '@/components/dashboard/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/dashboard/ui/card'

export const dynamic = 'force-dynamic'

export default async function DashboardOverviewPage() {
  const session = await requireSession()
  const stats = await getOverviewStats(session)

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="font-serif text-2xl">Exco Dashboard</CardTitle>
            <Badge>{ROLE_LABELS[session.role]}</Badge>
          </div>
          <CardDescription>Foundation in place — the dashboard shell arrives next.</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs text-muted-foreground">
            {JSON.stringify(stats, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}

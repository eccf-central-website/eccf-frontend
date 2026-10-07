/**
 * SectionEmpty — "nothing yet" state for a whole section page, using the
 * section's nav icon. Rendered on the server, so the icon element never
 * has to cross into a Client Component.
 */

import type { DashboardSection } from '@/lib/dashboard/rbac'
import EmptyState from '@/components/dashboard/states/EmptyState'
import PageContainer from './PageContainer'
import { navItemForSection } from './nav-items'

interface SectionEmptyProps {
  section: DashboardSection
  title: string
  description: string
  action?: React.ReactNode
}

export default function SectionEmpty({ section, title, description, action }: SectionEmptyProps) {
  const { icon: Icon } = navItemForSection(section)

  return (
    <PageContainer>
      <EmptyState title={title} description={description} icon={<Icon />} action={action} />
    </PageContainer>
  )
}

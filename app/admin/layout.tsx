import { RoleShell } from '@/components/layout/role-shell'
import { requireRole } from '@/lib/auth'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole('admin')
  return <RoleShell>{children}</RoleShell>
}

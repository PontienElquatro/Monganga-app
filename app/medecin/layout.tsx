import { RoleShell } from '@/components/layout/role-shell'
import { requireRole } from '@/lib/auth'

export default async function MedecinLayout({ children }: { children: React.ReactNode }) {
  await requireRole('medecin')
  return <RoleShell>{children}</RoleShell>
}

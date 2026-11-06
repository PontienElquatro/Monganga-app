import { PatientShell } from '@/components/layout/patient-shell'
import { ModeBanner } from '@/components/layout/mode-banner'
import { requireRole } from '@/lib/auth'
import { unreadCount } from '@/lib/notifications'

export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole('patient')
  const unread = await unreadCount()
  return (
    <PatientShell userId={session.userId} unread={unread} banner={<ModeBanner />}>
      {children}
    </PatientShell>
  )
}

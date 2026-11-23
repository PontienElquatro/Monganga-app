import 'server-only'
import { redirect } from 'next/navigation'
import { PatientShell } from './patient-shell'
import { ProShell } from './pro-shell'
import { ModeBanner } from './mode-banner'
import { adminNavFor, DOCTOR_NAV } from './navs'
import { adminRolesLabel } from '@/lib/admin-roles'
import { getSession, homeFor } from '@/lib/auth'
import { unreadCount } from '@/lib/notifications'
import { doctorName, fullName } from '@/lib/format'

/** Choisit la coque de l'espace selon le rôle (pages communes comme les notifications). */
export async function RoleShell({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/connexion')
  if (session.profile.suspended_at) redirect('/compte-suspendu')
  const unread = await unreadCount()
  const { role } = session.profile
  if (role === 'patient') {
    return <PatientShell userId={session.userId} unread={unread} banner={<ModeBanner />}>{children}</PatientShell>
  }
  if (role === 'medecin' && session.doctor?.status !== 'valide') redirect(homeFor(session))
  const isAdmin = role === 'admin'
  return (
    <ProShell
      space={isAdmin ? 'Administration' : 'Espace médecin'}
      nav={isAdmin ? adminNavFor(session.profile.admin_roles) : DOCTOR_NAV}
      user={{
        name: isAdmin ? fullName(session.profile) : doctorName({ title: session.doctor?.title, ...session.profile }),
        detail: isAdmin ? adminRolesLabel(session.profile.admin_roles) : session.doctor?.specialty ?? '',
        avatar: session.profile.avatar_url,
        href: isAdmin ? '/admin' : '/medecin/profil',
      }}
      userId={session.userId}
      unread={unread}
      banner={<ModeBanner />}
    >
      {children}
    </ProShell>
  )
}

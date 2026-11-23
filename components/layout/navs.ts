import type { ProNavItem } from './pro-shell'
import type { AdminRole } from '@/lib/types'
import { holdsAdminRole } from '@/lib/admin-roles'

export const DOCTOR_NAV: ProNavItem[] = [
  { href: '/medecin', label: 'Tableau de bord', icon: 'layout-dashboard', exact: true },
  { href: '/medecin/agenda', label: 'Agenda', icon: 'calendar-days' },
  { href: '/medecin/disponibilites', label: 'Disponibilités', icon: 'calendar-clock' },
  { href: '/medecin/patients', label: 'Patients', icon: 'users' },
  { href: '/medecin/ordonnances', label: 'Ordonnances', icon: 'file-text' },
  { href: '/medecin/revenus', label: 'Revenus', icon: 'wallet' },
  { href: '/medecin/profil', label: 'Mon profil', icon: 'user' },
]

/** Menu de l'administration : chaque entrée indique les rôles qui la voient (vide = tous). */
const ADMIN_NAV: (ProNavItem & { roles: AdminRole[] })[] = [
  { href: '/admin', label: 'Vue d’ensemble', icon: 'layout-dashboard', exact: true, roles: [] },
  { href: '/admin/validations', label: 'Validations', icon: 'badge-check', roles: ['validation'] },
  { href: '/admin/medecins', label: 'Médecins', icon: 'stethoscope', roles: ['validation', 'support', 'finance'] },
  { href: '/admin/utilisateurs', label: 'Utilisateurs', icon: 'users', roles: ['support'] },
  { href: '/admin/transactions', label: 'Transactions', icon: 'receipt', roles: ['finance'] },
  { href: '/admin/versements', label: 'Versements', icon: 'hand-coins', roles: ['finance'] },
  { href: '/admin/rapports', label: 'Rapports', icon: 'trending-up', roles: ['finance'] },
  { href: '/admin/equipe', label: 'Équipe', icon: 'shield-check', roles: ['super'] },
  { href: '/admin/parametres', label: 'Paramètres', icon: 'settings', roles: ['super'] },
]

export function adminNavFor(roles: readonly AdminRole[] | null | undefined): ProNavItem[] {
  return ADMIN_NAV.filter((item) => !item.roles.length || item.roles.some((r) => holdsAdminRole(roles, r)))
    .map(({ roles: _roles, ...item }) => item)
}

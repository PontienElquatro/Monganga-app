import type { ProNavItem } from './pro-shell'

export const DOCTOR_NAV: ProNavItem[] = [
  { href: '/medecin', label: 'Tableau de bord', icon: 'layout-dashboard', exact: true },
  { href: '/medecin/agenda', label: 'Agenda', icon: 'calendar-days' },
  { href: '/medecin/disponibilites', label: 'Disponibilités', icon: 'calendar-clock' },
  { href: '/medecin/patients', label: 'Patients', icon: 'users' },
  { href: '/medecin/ordonnances', label: 'Ordonnances', icon: 'file-text' },
  { href: '/medecin/revenus', label: 'Revenus', icon: 'wallet' },
  { href: '/medecin/profil', label: 'Mon profil', icon: 'user' },
]

export const ADMIN_NAV: ProNavItem[] = [
  { href: '/admin', label: 'Vue d’ensemble', icon: 'layout-dashboard', exact: true },
  { href: '/admin/validations', label: 'Validations', icon: 'badge-check' },
  { href: '/admin/medecins', label: 'Médecins', icon: 'stethoscope' },
  { href: '/admin/utilisateurs', label: 'Utilisateurs', icon: 'users' },
  { href: '/admin/transactions', label: 'Transactions', icon: 'receipt' },
  { href: '/admin/versements', label: 'Versements', icon: 'hand-coins' },
  { href: '/admin/rapports', label: 'Rapports', icon: 'trending-up' },
  { href: '/admin/parametres', label: 'Paramètres', icon: 'settings' },
]

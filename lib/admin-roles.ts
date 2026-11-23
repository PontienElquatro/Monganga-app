import type { AdminRole } from '@/lib/types'

/** Rôles de l'équipe d'administration (vérifiés aussi dans la base de données). */
export const ADMIN_ROLES: { value: AdminRole; label: string; description: string }[] = [
  { value: 'super', label: 'Super administrateur', description: 'Tout voir, gérer l’équipe, les paramètres et les commissions.' },
  { value: 'finance', label: 'Finance', description: 'Transactions, remboursements, versements, rendez-vous à trancher, rapports.' },
  { value: 'support', label: 'Support utilisateurs', description: 'Comptes des patients et médecins, suspension, rendez-vous sans montants.' },
  { value: 'validation', label: 'Validation des médecins', description: 'Dossiers de candidature et pièces justificatives.' },
]

export const ADMIN_ROLE_LABEL = Object.fromEntries(ADMIN_ROLES.map((r) => [r.value, r.label])) as Record<AdminRole, string>

/** Le super administrateur a tous les rôles. */
export function holdsAdminRole(roles: readonly AdminRole[] | null | undefined, role: AdminRole): boolean {
  return Boolean(roles?.includes('super') || roles?.includes(role))
}

export function adminRolesLabel(roles: readonly AdminRole[] | null | undefined): string {
  if (!roles?.length) return 'Administrateur'
  if (roles.includes('super')) return ADMIN_ROLE_LABEL.super
  return roles.map((r) => ADMIN_ROLE_LABEL[r]).join(' · ')
}

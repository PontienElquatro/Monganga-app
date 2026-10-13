// Traduction du modèle Supabase (profiles) vers le contrat du front (Session).
// Pure : aucune dépendance, testable seule.

export type DbRole = 'patient' | 'medecin' | 'admin'
export type ApiRole = 'patient' | 'doctor' | 'admin'

export type ApiSession = {
  id: string
  role: ApiRole
  name: string
  email: string
  doctorId?: string
  expiresAt: string
}

/** Le backend dit « medecin », le front dit « doctor ». */
export function toApiRole(role: string): ApiRole | null {
  if (role === 'patient' || role === 'admin') return role
  if (role === 'medecin') return 'doctor'
  return null
}

export function toApiSession(input: {
  id: string
  role: string
  fullName: string | null
  email: string | null | undefined
  expiresAtSeconds: number | null | undefined
}): ApiSession | null {
  const role = toApiRole(input.role)
  if (!role) return null
  const email = input.email ?? ''
  const name = (input.fullName ?? '').trim() || email.split('@')[0] || 'Utilisateur'
  const expiresAt = new Date((input.expiresAtSeconds ?? Math.floor(Date.now() / 1000) + 3600) * 1000).toISOString()
  // doctor_profiles.id = profiles.id : l'identifiant médecin est celui du compte.
  return { id: input.id, role, name, email, ...(role === 'doctor' ? { doctorId: input.id } : {}), expiresAt }
}

/** Un identifiant sans « @ » est traité comme un numéro de téléphone. */
export function classifyIdentifier(raw: string): { kind: 'email'; value: string } | { kind: 'phone'; value: string } | null {
  const value = raw.trim()
  if (!value || value.length > 254) return null
  if (value.includes('@')) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? { kind: 'email', value: value.toLowerCase() } : null
  const digits = normalizePhone(value)
  return digits ? { kind: 'phone', value: digits } : null
}

/** Numéro stocké et recherché sous une seule forme : sans espaces ni ponctuation, « + » conservé. */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[\s().-]/g, '')
  return /^\+?[0-9]{9,15}$/.test(digits) ? digits : null
}

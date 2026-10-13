// Validation de l'inscription patient (email + mot de passe, téléphone facultatif).
// Pure : aucune dépendance, testable seule.
import { normalizePhone } from './session.ts'

export type RegisterInput = { name: string; email: string; phone: string | null; password: string; consent: true }
export type RegisterResult = { ok: true; value: RegisterInput } | { ok: false; fields: Record<string, string> }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_RE = /^(?=.*[A-Z])(?=.*\d).{8,128}$/

export function validateRegistration(body: Record<string, unknown> | null): RegisterResult {
  const fields: Record<string, string> = {}
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const phoneRaw = typeof body?.phone === 'string' ? body.phone.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!name || name.length > 120) fields.name = 'Renseignez votre nom (120 caractères maximum).'
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) fields.email = 'Un email valide est obligatoire.'
  const phone = phoneRaw ? normalizePhone(phoneRaw) : null
  if (phoneRaw && !phone) fields.phone = 'Numéro de téléphone invalide.'
  if (!PASSWORD_RE.test(password)) fields.password = 'Mot de passe : 8 caractères minimum, une majuscule et un chiffre.'
  if (body?.consent !== true) fields.consent = 'Le consentement est obligatoire.'

  if (Object.keys(fields).length) return { ok: false, fields }
  return { ok: true, value: { name, email, phone, password, consent: true } }
}

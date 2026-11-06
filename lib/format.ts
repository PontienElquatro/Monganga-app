// Mise en forme pour l'affichage (heure de Kinshasa, dollars, libellés).
import type { AppointmentStatus, DocumentKind, DoctorStatus, PaymentMethod, PayoutMethod } from '@/lib/types'

export const TZ = 'Africa/Kinshasa'

export function usd(cents: number | null | undefined): string {
  const value = (cents ?? 0) / 100
  return value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' $'
}

export function usdShort(cents: number): string {
  return cents % 100 === 0 ? `${cents / 100} $` : usd(cents)
}

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('fr-FR', { timeZone: TZ, ...opts })

export const dateLong = (iso: string) => capitalize(fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso)))
export const dateShort = (iso: string) => fmt({ weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(iso))
export const dateNumeric = (iso: string) => fmt({ day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso))
export const time = (iso: string) => fmt({ hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
export const dateTime = (iso: string) => `${dateShort(iso)} · ${time(iso)}`

/** Date du jour à Kinshasa au format AAAA-MM-JJ. */
export function todayKinshasa(offsetDays = 0): string {
  const d = new Date(Date.now() + offsetDays * 86400000)
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
  return parts
}

/** Début d'une journée à Kinshasa (UTC+1, sans heure d'été) en ISO. */
export function kinDayStart(day: string): string {
  return new Date(`${day}T00:00:00+01:00`).toISOString()
}

/** Premier jour du mois en cours à Kinshasa (AAAA-MM-01). */
export function kinMonthStart(): string {
  return todayKinshasa().slice(0, 8) + '01'
}

/** Clé de regroupement par jour (AAAA-MM-JJ, heure de Kinshasa). */
export function dayKey(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso))
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function initials(name: string): string {
  return name
    .replace(/^Dr\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

export function fullName(p: { first_name?: string | null; last_name?: string | null }): string {
  return [p.first_name, p.last_name].filter(Boolean).join(' ').trim()
}

export function doctorName(d: { title?: string | null; first_name?: string | null; last_name?: string | null }): string {
  return `${d.title || 'Dr'} ${fullName(d)}`.trim()
}

export const APPOINTMENT_STATUS: Record<AppointmentStatus, { label: string; tone: string }> = {
  en_attente_acompte: { label: 'Acompte à payer', tone: 'pending' },
  confirme: { label: 'Confirmé', tone: 'confirmed' },
  en_cours: { label: 'En cours', tone: 'active' },
  terminee: { label: 'Terminée', tone: 'completed' },
  annulee_patient: { label: 'Annulé par le patient', tone: 'cancelled' },
  annulee_medecin: { label: 'Annulé par le médecin', tone: 'cancelled' },
  absence_patient: { label: 'Patient absent', tone: 'cancelled' },
  absence_medecin: { label: 'Médecin absent', tone: 'cancelled' },
  expiree: { label: 'Réservation expirée', tone: 'neutral' },
  a_examiner: { label: 'À examiner', tone: 'pending' },
}

export const DOCTOR_STATUS: Record<DoctorStatus, { label: string; tone: string }> = {
  en_attente: { label: 'À examiner', tone: 'pending' },
  complement_demande: { label: 'Complément demandé', tone: 'pending' },
  valide: { label: 'Validé', tone: 'approved' },
  refuse: { label: 'Refusé', tone: 'rejected' },
  suspendu: { label: 'Suspendu', tone: 'suspended' },
}

export const PAYMENT_METHODS: { value: PaymentMethod; label: string; logo: string | null; hint?: string }[] = [
  { value: 'mpesa', label: 'M-Pesa', logo: '/images/paiement/mpesa.png' },
  { value: 'orange_money', label: 'Orange Money', logo: '/images/paiement/orange-money.png' },
  { value: 'airtel_money', label: 'Airtel Money', logo: '/images/paiement/airtel-money.png' },
  { value: 'carte', label: 'Carte bancaire', logo: null, hint: 'Visa · Mastercard' },
]

export const PAYOUT_METHODS: { value: PayoutMethod; label: string }[] = [
  { value: 'mpesa', label: 'M-Pesa' },
  { value: 'orange_money', label: 'Orange Money' },
  { value: 'airtel_money', label: 'Airtel Money' },
  { value: 'banque', label: 'Virement bancaire' },
]

export const payoutLabel = (m: PayoutMethod) => PAYOUT_METHODS.find((x) => x.value === m)?.label ?? m
export const paymentLabel = (m: PaymentMethod) => PAYMENT_METHODS.find((x) => x.value === m)?.label ?? m

/** Masque un numéro de versement : +243 81 ••• ••12 */
export function maskAccount(account: string): string {
  const clean = account.trim()
  if (clean.length <= 4) return '••••'
  return clean.slice(0, Math.min(7, clean.length - 4)) + ' ••• ••' + clean.slice(-2)
}

export const SPECIALTIES = [
  'Médecine générale', 'Pédiatrie', 'Gynécologie-obstétrique', 'Cardiologie', 'Dermatologie', 'Ophtalmologie',
  'ORL', 'Psychiatrie', 'Neurologie', 'Gastro-entérologie', 'Endocrinologie', 'Pneumologie', 'Rhumatologie',
  'Urologie', 'Néphrologie', 'Infectiologie', 'Nutrition', 'Autre spécialité',
]

export const COMMUNES = [
  'Bandalungwa', 'Barumbu', 'Bumbu', 'Gombe', 'Kalamu', 'Kasa-Vubu', 'Kimbanseke', 'Kinshasa', 'Kintambo',
  'Kisenso', 'Lemba', 'Limete', 'Lingwala', 'Makala', 'Maluku', 'Masina', 'Matete', 'Mont-Ngafula', 'Ndjili',
  'Ngaba', 'Ngaliema', 'Ngiri-Ngiri', 'Nsele', 'Selembao', 'Hors Kinshasa',
]

export const DOCUMENT_LABELS: Record<DocumentKind, string> = {
  photo: 'Photo professionnelle',
  identite: 'Pièce d’identité',
  diplome: 'Diplôme de médecine',
  ordre: 'Attestation de l’Ordre des médecins',
  cv: 'Curriculum vitæ',
  specialisation: 'Diplôme de spécialisation',
  autre: 'Autre document',
}

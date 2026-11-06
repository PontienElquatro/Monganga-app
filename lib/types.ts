// Types des données de la base (écrits à la main, alignés sur supabase/migrations).

export type UserRole = 'patient' | 'medecin' | 'admin'
export type DoctorStatus = 'en_attente' | 'complement_demande' | 'valide' | 'refuse' | 'suspendu'
export type DocumentKind = 'photo' | 'identite' | 'diplome' | 'ordre' | 'cv' | 'specialisation' | 'autre'
export type SlotStatus = 'libre' | 'reserve' | 'bloque'
export type AppointmentStatus =
  | 'en_attente_acompte' | 'confirme' | 'en_cours' | 'terminee' | 'annulee_patient' | 'annulee_medecin'
  | 'absence_patient' | 'absence_medecin' | 'expiree' | 'a_examiner'
export type PaymentKind = 'acompte' | 'solde'
export type PaymentStatus = 'en_attente' | 'reussi' | 'echoue' | 'annule'
export type PaymentMethod = 'mpesa' | 'orange_money' | 'airtel_money' | 'carte'
export type PayoutMethod = 'mpesa' | 'orange_money' | 'airtel_money' | 'banque'
export type RefundStatus = 'a_traiter' | 'effectue'

export interface Profile {
  id: string
  role: UserRole
  first_name: string
  last_name: string
  email: string
  phone: string | null
  avatar_url: string | null
  birth_date: string | null
  sex: 'F' | 'M' | null
  commune: string | null
  suspended_at: string | null
  created_at: string
}

export interface DoctorProfile {
  id: string
  title: string
  specialty: string
  bio: string
  languages: string[]
  years_experience: number | null
  commune: string | null
  fee_cents: number
  status: DoctorStatus
  payout_method: PayoutMethod
  payout_account: string
  payout_holder: string | null
  admin_message: string | null
  submitted_at: string
  decided_at: string | null
}

export interface PublicDoctor {
  id: string
  title: string
  first_name: string
  last_name: string
  avatar_url: string | null
  specialty: string
  bio: string
  languages: string[]
  years_experience: number | null
  commune: string | null
  fee_cents: number
  next_slot_at: string | null
}

export interface Slot {
  id: string
  doctor_id: string
  starts_at: string
  ends_at: string
  status: SlotStatus
}

export interface PatientAppointment {
  id: string
  reference: string
  status: AppointmentStatus
  starts_at: string
  ends_at: string
  fee_cents: number
  deposit_cents: number
  deposit_due_at: string
  balance_paid_at: string | null
  doctor_id: string
  doctor_name: string
  doctor_specialty: string
  doctor_avatar: string | null
  has_prescription: boolean
  has_rating: boolean
  cancel_reason: string | null
  refund_status: RefundStatus | null
}

export interface AgendaItem {
  id: string
  reference: string
  status: AppointmentStatus
  starts_at: string
  ends_at: string
  balance_paid: boolean
  reason: string | null
  patient_id: string
  patient_name: string
  patient_age: number | null
  patient_sex: string | null
  patient_commune: string | null
  patient_avatar: string | null
  has_prescription: boolean
}

export interface ConsultationContext {
  id: string
  reference: string
  status: AppointmentStatus
  starts_at: string
  ends_at: string
  closes_at: string
  balance_paid: boolean
  viewer: 'patient' | 'medecin'
  other_name: string
  other_avatar: string | null
  other_detail: string | null
  reason: string | null
}

export interface PrescriptionItem {
  name: string
  dosage?: string
  duration?: string
}

export interface Prescription {
  id: string
  code: string
  appointment_id: string
  doctor_id: string
  patient_id: string
  items: PrescriptionItem[]
  instructions: string | null
  issued_at: string
  expires_at: string
}

export interface NotificationRow {
  id: string
  kind: string
  title: string
  body: string
  link: string | null
  read_at: string | null
  created_at: string
}

/** Résultat d'une action de formulaire. */
export interface ActionState {
  ok?: boolean
  error?: string
  message?: string
}

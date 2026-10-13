// Traduction des lignes Supabase (français, euros décimaux) vers le contrat du front (anglais, centimes).
// Pure : aucune dépendance. Les règles sont celles du README backend (statuts de `appointments`, paiement mock).

export type ApiBookingStatus = 'draft' | 'payment_pending' | 'payment_failed' | 'requested' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
export type ApiPaymentStatus = 'unpaid' | 'pending' | 'paid' | 'failed' | 'refund_pending' | 'refunded'
export type ApiTransactionStatus = 'paid' | 'pending' | 'failed' | 'refund_pending' | 'refunded'

export const one = <T,>(value: T | T[] | null | undefined): T | null => (Array.isArray(value) ? (value[0] ?? null) : (value ?? null))

export function eurosToCents(value: number | string | null | undefined): number {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0
}

export function toApiBookingStatus(status: string): ApiBookingStatus {
  switch (status) {
    case 'en_attente': return 'payment_pending' // créneau retenu, réservation (1 $) pas encore payée
    case 'confirme': return 'confirmed'
    case 'termine': return 'completed'
    case 'refuse': case 'annule': case 'non_honore': return 'cancelled'
    default: return 'payment_pending'
  }
}

export function toApiPaymentStatus(status: string | null | undefined): ApiPaymentStatus {
  switch (status) {
    case 'reussi': return 'paid'
    case 'en_attente': return 'pending'
    case 'echoue': return 'failed'
    case 'rembourse': return 'refunded'
    default: return 'unpaid'
  }
}

export const toApiTransactionStatus = (status: string): ApiTransactionStatus => {
  const mapped = toApiPaymentStatus(status)
  return mapped === 'unpaid' ? 'pending' : (mapped as ApiTransactionStatus)
}

export type PaymentRow = { type: string; amount: number | string; status: string; provider?: string | null; provider_reference?: string | null; created_at: string }
export type AppointmentRow = {
  id: string; patient_id: string; doctor_id: string; status: string
  reservation_fee: number | string | null; consultation_fee: number | string | null; created_at: string
  availabilities?: { start_time: string; end_time: string } | { start_time: string; end_time: string }[] | null
  payments?: PaymentRow[] | null
}

/** Dernier paiement de réservation : c'est lui qui décrit l'état de paiement affiché. */
export function latestReservationPayment(payments: PaymentRow[] | null | undefined): PaymentRow | null {
  const list = (payments ?? []).filter(p => p.type === 'reservation').sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
  return list[0] ?? null
}

export function toApiBooking(row: AppointmentRow, ctx: { doctorName: string; patientName: string; doctorFee: number | string | null }) {
  const slot = one(row.availabilities)
  const payment = latestReservationPayment(row.payments)
  const priceCents = eurosToCents(row.consultation_fee ?? ctx.doctorFee)
  const feeCents = eurosToCents(row.reservation_fee)
  const paymentStatus = toApiPaymentStatus(payment?.status)
  return {
    id: row.id,
    doctorId: row.doctor_id,
    patientId: row.patient_id,
    doctorName: ctx.doctorName,
    patientName: ctx.patientName,
    slot: slot ? new Date(slot.start_time).toISOString() : new Date(row.created_at).toISOString(),
    status: toApiBookingStatus(row.status),
    paymentStatus,
    priceCents,
    feeCents,
    totalCents: priceCents + feeCents,
    ...(payment?.provider ? { method: payment.provider } : {}),
    ...(payment?.provider_reference ? { reference: payment.provider_reference } : {}),
    createdAt: new Date(row.created_at).toISOString(),
    ...(paymentStatus === 'paid' && payment ? { confirmedAt: new Date(payment.created_at).toISOString() } : {}),
  }
}

export type PaymentFullRow = PaymentRow & { id: string; appointment_id: string; payer_id: string; appointments?: { doctor_id: string } | { doctor_id: string }[] | null }

export function toApiTransaction(row: PaymentFullRow, patientName: string) {
  const amountCents = eurosToCents(row.amount)
  const appointment = one(row.appointments)
  return {
    id: row.id,
    bookingId: row.appointment_id,
    patientId: row.payer_id,
    patientName,
    ...(appointment ? { doctorId: appointment.doctor_id } : {}),
    amountCents,
    // Seule la réservation (1 $) revient à la plateforme ; aucune commission n'est exposée au médecin (voir route).
    feeCents: row.type === 'reservation' ? amountCents : 0,
    status: toApiTransactionStatus(row.status),
    method: row.provider ?? 'mock',
    ...(row.provider_reference ? { reference: row.provider_reference } : {}),
    createdAt: new Date(row.created_at).toISOString(),
  }
}

export type PrescriptionRow = {
  id: string; doctor_id: string; patient_id: string; content: string; created_at: string
  consultations?: { appointment_id: string } | { appointment_id: string }[] | null
}

/** La base stocke un seul champ `content` : première ligne = médicament, le reste = consignes. */
export function splitPrescription(content: string): { medication: string; instructions: string } {
  const [first, ...rest] = content.split('\n')
  const medication = first.trim()
  const instructions = rest.join('\n').trim()
  return { medication, instructions: instructions || medication }
}

export function toApiPrescription(row: PrescriptionRow, names: { doctorName: string; patientName: string }) {
  const { medication, instructions } = splitPrescription(row.content)
  return {
    id: row.id,
    bookingId: one(row.consultations)?.appointment_id ?? '',
    doctorId: row.doctor_id,
    doctorName: names.doctorName,
    patientId: row.patient_id,
    patientName: names.patientName,
    issuedAt: new Date(row.created_at).toISOString(),
    medication,
    instructions,
    status: 'active' as const, // les ordonnances expirées sont déjà exclues par la RLS (expires_at > now())
  }
}

export type NotificationRow = { id: string; title: string; body: string | null; is_read: boolean; created_at: string }
export const toApiNotification = (row: NotificationRow) => ({
  id: row.id, title: row.title, message: row.body ?? '', read: row.is_read, createdAt: new Date(row.created_at).toISOString(),
})

import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { fullNames } from './names'
import { toApiBooking, type AppointmentRow } from './mappers'
import type { ApiSession } from './session'

export const BOOKING_SELECT =
  'id, patient_id, doctor_id, status, reservation_fee, consultation_fee, created_at, availabilities(start_time, end_time), payments(type, amount, status, provider, provider_reference, created_at)'

/**
 * Rendez-vous du compte au format du front. La RLS de `appointments` fait foi : patient = les siens,
 * médecin = ses patients, admin = tous. Avec `id`, renvoie au plus un élément (vide si absent ou interdit).
 */
export async function loadBookings(session: ApiSession, id?: string) {
  const supabase = await createClient()
  let query = supabase.from('appointments').select(BOOKING_SELECT).order('created_at', { ascending: false })
  if (id) query = query.eq('id', id)
  const { data, error } = await query
  if (error) throw new Error('bookings_unavailable')
  const rows = (data ?? []) as unknown as AppointmentRow[]
  if (!rows.length) return []

  const { data: doctors } = await supabase.from('doctors_public').select('id, full_name, consultation_fee').in('id', [...new Set(rows.map(r => r.doctor_id))])
  const doctorById = new Map((doctors ?? []).map(d => [d.id, d]))
  const patientNames = session.role === 'patient'
    ? new Map([[session.id, session.name]])
    : await fullNames(rows.map(r => r.patient_id))

  return rows.map(row => {
    const doctor = doctorById.get(row.doctor_id)
    return toApiBooking(row, {
      doctorName: row.doctor_id === session.id ? session.name : (doctor?.full_name?.trim() || 'Médecin'),
      patientName: patientNames.get(row.patient_id) || 'Patient',
      doctorFee: doctor?.consultation_fee ?? null,
    })
  })
}

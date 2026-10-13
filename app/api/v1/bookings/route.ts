import { apiJson, notImplemented } from '@/lib/api/http'
import { requireApiSession, unavailable } from '@/lib/api/guard'
import { createClient } from '@/lib/supabase/server'
import { fullNames } from '@/lib/api/names'
import { toApiBooking, type AppointmentRow } from '@/lib/api/mappers'

export const dynamic = 'force-dynamic'

// GET /bookings -> Booking[] : uniquement les rendez-vous du compte (la RLS de `appointments` fait foi :
// patient = les siens, médecin = ses patients, admin = tous).
export async function GET() {
  const auth = await requireApiSession()
  if ('denied' in auth) return auth.denied
  const { session } = auth

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('appointments')
    .select('id, patient_id, doctor_id, status, reservation_fee, consultation_fee, created_at, availabilities(start_time, end_time), payments(type, amount, status, provider, provider_reference, created_at)')
    .order('created_at', { ascending: false })
  if (error) return unavailable()
  const rows = (data ?? []) as unknown as AppointmentRow[]
  if (!rows.length) return apiJson([])

  const { data: doctors } = await supabase.from('doctors_public').select('id, full_name, consultation_fee').in('id', [...new Set(rows.map(r => r.doctor_id))])
  const doctorById = new Map((doctors ?? []).map(d => [d.id, d]))
  const patientNames = session.role === 'patient'
    ? new Map([[session.id, session.name]])
    : await fullNames(rows.map(r => r.patient_id))

  return apiJson(rows.map(row => {
    const doctor = doctorById.get(row.doctor_id)
    return toApiBooking(row, {
      doctorName: row.doctor_id === session.id ? session.name : (doctor?.full_name?.trim() || 'Médecin'),
      patientName: patientNames.get(row.patient_id) || 'Patient',
      doctorFee: doctor?.consultation_fee ?? null,
    })
  }))
}

// Création de réservation : module suivant (RPC book_appointment / pay_reservation_mock).
export { notImplemented as POST }

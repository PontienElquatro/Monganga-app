import { apiJson, notImplemented } from '@/lib/api/http'
import { requireApiSession, unavailable } from '@/lib/api/guard'
import { createClient } from '@/lib/supabase/server'
import { fullNames } from '@/lib/api/names'
import { toApiPrescription, type PrescriptionRow } from '@/lib/api/mappers'

export const dynamic = 'force-dynamic'

// GET /prescriptions -> Prescription[] : la RLS ne renvoie que les ordonnances du patient ou du médecin concerné,
// et exclut celles de plus de 30 jours (expires_at).
export async function GET() {
  const auth = await requireApiSession()
  if ('denied' in auth) return auth.denied
  const { session } = auth

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('prescriptions')
    .select('id, doctor_id, patient_id, content, created_at, consultations(appointment_id)')
    .order('created_at', { ascending: false })
  if (error) return unavailable()
  const rows = (data ?? []) as unknown as PrescriptionRow[]
  if (!rows.length) return apiJson([])

  const { data: doctors } = await supabase.from('doctors_public').select('id, full_name').in('id', [...new Set(rows.map(r => r.doctor_id))])
  const doctorName = new Map((doctors ?? []).map(d => [d.id, d.full_name?.trim() || 'Médecin']))
  const patientNames = session.role === 'patient' ? new Map([[session.id, session.name]]) : await fullNames(rows.map(r => r.patient_id))

  return apiJson(rows.map(row => toApiPrescription(row, {
    doctorName: row.doctor_id === session.id ? session.name : (doctorName.get(row.doctor_id) ?? 'Médecin'),
    patientName: patientNames.get(row.patient_id) || 'Patient',
  })))
}

// Rédaction d'ordonnance : module Consultation.
export { notImplemented as POST }

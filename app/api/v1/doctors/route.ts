import { apiError, apiJson } from '@/lib/api/http'
import { createClient } from '@/lib/supabase/server'
import { firstSlotByDoctor, toApiDoctor, type DoctorRow, type SlotRow } from '@/lib/api/doctors'

export const dynamic = 'force-dynamic'

// GET /doctors -> Doctor[] (médecins validés uniquement, via la vue doctors_public, jamais profiles)
export async function GET() {
  const supabase = await createClient()
  const { data: doctors, error } = await supabase.from('doctors_public').select('id, full_name, specialty, bio, consultation_fee')
  if (error) return apiError(503, 'UNAVAILABLE', 'Service indisponible. Réessayez dans quelques instants.')
  if (!doctors?.length) return apiJson([])

  const { data: slots } = await supabase
    .from('availabilities')
    .select('id, doctor_id, start_time, end_time')
    .in('doctor_id', doctors.map(d => d.id))
    .eq('is_booked', false)
    .gt('start_time', new Date().toISOString())
    .order('start_time', { ascending: true })
  const next = firstSlotByDoctor((slots ?? []) as SlotRow[])

  return apiJson((doctors as DoctorRow[]).map(d => toApiDoctor(d, next.get(d.id) ?? null)))
}

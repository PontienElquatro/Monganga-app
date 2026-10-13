import { type NextRequest } from 'next/server'
import { apiError, apiJson } from '@/lib/api/http'
import { createClient } from '@/lib/supabase/server'
import { UUID_RE, toApiSlot, type SlotRow } from '@/lib/api/doctors'

export const dynamic = 'force-dynamic'

// GET /doctors/{doctorId}/slots -> Slot[] (créneaux libres à venir)
// `excludeBooking` (déplacement d'un rendez-vous) sera géré avec le module Réservation.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ doctorId: string }> }) {
  const { doctorId } = await params
  if (!UUID_RE.test(doctorId)) return apiError(404, 'NOT_FOUND', 'Médecin introuvable.')

  const supabase = await createClient()
  // Le médecin doit être validé (présent dans doctors_public), sinon 404.
  const { data: doctor } = await supabase.from('doctors_public').select('id').eq('id', doctorId).maybeSingle()
  if (!doctor) return apiError(404, 'NOT_FOUND', 'Médecin introuvable.')

  const { data, error } = await supabase
    .from('availabilities')
    .select('id, doctor_id, start_time, end_time')
    .eq('doctor_id', doctorId)
    .eq('is_booked', false)
    .gt('start_time', new Date().toISOString())
    .order('start_time', { ascending: true })
  if (error) return apiError(503, 'UNAVAILABLE', 'Service indisponible. Réessayez dans quelques instants.')
  return apiJson(((data ?? []) as SlotRow[]).map(toApiSlot))
}

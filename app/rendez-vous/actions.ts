'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function payerReservation(appointmentId: string) {
  const supabase = await createClient()
  const { error } = await supabase.rpc('pay_reservation_mock', {
    p_appointment_id: appointmentId,
  })
  if (error) console.error(error.message)
  revalidatePath('/rendez-vous')
}

export async function refuserRendezVous(appointmentId: string) {
  const supabase = await createClient()
  const { error } = await supabase.rpc('refuse_appointment', {
    p_appointment_id: appointmentId,
    p_reason: 'Indisponibilité du médecin',
  })
  if (error) console.error(error.message)
  revalidatePath('/rendez-vous')
}

export async function annulerRendezVous(appointmentId: string) {
  const supabase = await createClient()
  const { error } = await supabase.rpc('cancel_appointment', {
    p_appointment_id: appointmentId,
    p_reason: "Annulation depuis l'écran de test",
  })
  if (error) console.error(error.message)
  revalidatePath('/rendez-vous')
}
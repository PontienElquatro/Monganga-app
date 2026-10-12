'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function reserverCreneau(doctorId: string, availabilityId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('book_appointment', {
    p_availability_id: availabilityId,
  })

  if (error) {
    redirect(`/medecins/${doctorId}?erreur=${encodeURIComponent(error.message)}`)
  }

  redirect(`/rendez-vous?reserve=${data}`)
}
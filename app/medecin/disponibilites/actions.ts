'use server'

import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/supabase/require-role'
import { getCurrentUser } from '@/lib/supabase/get-user'
import { revalidatePath } from 'next/cache'

export async function creerDisponibilite(formData: FormData) {
  await requireRole(['medecin'])
  const user = await getCurrentUser()
  const supabase = await createClient()

  const date = formData.get('date') as string
  const heureDebut = formData.get('heure_debut') as string
  const heureFin = formData.get('heure_fin') as string

  const start_time = new Date(`${date}T${heureDebut}:00`).toISOString()
  const end_time = new Date(`${date}T${heureFin}:00`).toISOString()

  const { error } = await supabase.from('availabilities').insert({
    doctor_id: user!.id,
    start_time,
    end_time,
  })

  if (error) {
    if (error.code === '23P01') {
      return { error: 'Ce créneau chevauche un créneau déjà existant.' }
    }
    return { error: error.message }
  }

  revalidatePath('/medecin/disponibilites')
  return { success: true }
}

export async function supprimerDisponibilite(id: string) {
  await requireRole(['medecin'])
  const supabase = await createClient()

  const { error } = await supabase
    .from('availabilities')
    .delete()
    .eq('id', id)
    .eq('is_booked', false)

  if (error) {
    if (error.code === '23503') {
      return { error: 'Impossible : ce créneau a déjà un rendez-vous.' }
    }
    return { error: error.message }
  }

  revalidatePath('/medecin/disponibilites')
  return { success: true }
}

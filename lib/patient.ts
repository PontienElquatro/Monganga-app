import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getSettings } from '@/lib/settings'
import type { Timing } from '@/lib/appointments'
import type { PatientAppointment } from '@/lib/types'

/** Tous les rendez-vous du patient connecté (fonction patient_appointments, sans coordonnées du médecin). */
export const getPatientAppointments = cache(async (): Promise<PatientAppointment[]> => {
  const supabase = await createClient()
  const { data } = await supabase.rpc('patient_appointments')
  return (data ?? []) as PatientAppointment[]
})

export async function getPatientAppointment(id: string): Promise<PatientAppointment | null> {
  return (await getPatientAppointments()).find((a) => a.id === id) ?? null
}

export async function getTiming(): Promise<Timing> {
  const s = await getSettings()
  return {
    ouvertureSoldeMinutes: s.ouverture_solde_minutes,
    absenceMinutes: s.absence_minutes,
    fermetureSalleMinutes: s.fermeture_salle_minutes,
    annulationGratuiteHeures: s.annulation_gratuite_heures,
  }
}

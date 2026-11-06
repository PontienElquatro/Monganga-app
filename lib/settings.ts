import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export interface Settings {
  acompte_centimes: number
  commission_defaut: number
  duree_consultation_minutes: number
  delai_min_reservation_minutes: number
  delai_paiement_acompte_minutes: number
  ouverture_solde_minutes: number
  annulation_gratuite_heures: number
  absence_minutes: number
  fermeture_salle_minutes: number
  conservation_jours: number
  tarif_min_centimes: number
  tarif_max_centimes: number
}

const DEFAULTS: Settings = {
  acompte_centimes: 100, commission_defaut: 30, duree_consultation_minutes: 30, delai_min_reservation_minutes: 120,
  delai_paiement_acompte_minutes: 15, ouverture_solde_minutes: 60, annulation_gratuite_heures: 24, absence_minutes: 10,
  fermeture_salle_minutes: 10, conservation_jours: 30, tarif_min_centimes: 500, tarif_max_centimes: 50000,
}

/** Paramètres de la plateforme (table settings, modifiables par l'administration). */
export const getSettings = cache(async (): Promise<Settings> => {
  const supabase = await createClient()
  const { data } = await supabase.from('settings').select('key, value')
  const s = { ...DEFAULTS }
  for (const row of (data ?? []) as { key: keyof Settings; value: number }[]) {
    if (row.key in s) s[row.key] = Number(row.value)
  }
  return s
})

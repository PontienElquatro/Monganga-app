import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { getSettings } from '@/lib/settings'
import type { PublicDoctor, Slot } from '@/lib/types'

export interface DoctorFilters { q?: string; specialite?: string; commune?: string; dispo?: string; tri?: string }

/** Annuaire public : uniquement les médecins validés (vue doctors_public). */
export async function listDoctors(f: DoctorFilters): Promise<PublicDoctor[]> {
  const supabase = await createClient()
  let query = supabase.from('doctors_public').select('*')
  if (f.specialite) query = query.eq('specialty', f.specialite)
  if (f.commune) query = query.eq('commune', f.commune)
  if (f.q) {
    const q = f.q.replace(/[%,()]/g, ' ').trim()
    if (q) query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,specialty.ilike.%${q}%`)
  }
  const { data } = await query.limit(200)
  let doctors = (data ?? []) as PublicDoctor[]
  if (f.dispo === '48h') {
    const limit = Date.now() + 48 * 3600 * 1000
    doctors = doctors.filter((d) => d.next_slot_at && Date.parse(d.next_slot_at) <= limit)
  } else if (f.dispo === '7j') {
    const limit = Date.now() + 7 * 86400 * 1000
    doctors = doctors.filter((d) => d.next_slot_at && Date.parse(d.next_slot_at) <= limit)
  }
  const tri = f.tri || 'dispo'
  doctors.sort((a, b) => {
    if (tri === 'tarif') return a.fee_cents - b.fee_cents
    if (tri === 'nom') return a.last_name.localeCompare(b.last_name, 'fr')
    return (a.next_slot_at ? Date.parse(a.next_slot_at) : Infinity) - (b.next_slot_at ? Date.parse(b.next_slot_at) : Infinity)
  })
  return doctors
}

export async function getPublicDoctor(id: string): Promise<PublicDoctor | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const supabase = await createClient()
  const { data } = await supabase.from('doctors_public').select('*').eq('id', id).maybeSingle<PublicDoctor>()
  return data ?? null
}

/** Créneaux réservables des 14 prochains jours. */
export async function getBookableSlots(doctorId: string): Promise<Slot[]> {
  const supabase = await createClient()
  const settings = await getSettings()
  const from = new Date(Date.now() + settings.delai_min_reservation_minutes * 60000).toISOString()
  const to = new Date(Date.now() + 14 * 86400000).toISOString()
  const { data } = await supabase
    .from('availability_slots')
    .select('id, doctor_id, starts_at, ends_at, status')
    .eq('doctor_id', doctorId)
    .eq('status', 'libre')
    .gte('starts_at', from)
    .lt('starts_at', to)
    .order('starts_at')
    .limit(300)
  return (data ?? []) as Slot[]
}

export async function getSpecialtiesAndCommunes(): Promise<{ specialties: string[]; communes: string[] }> {
  const supabase = await createClient()
  const { data } = await supabase.from('doctors_public').select('specialty, commune')
  const rows = (data ?? []) as { specialty: string; commune: string | null }[]
  const specialties = [...new Set(rows.map((r) => r.specialty))].sort((a, b) => a.localeCompare(b, 'fr'))
  const communes = [...new Set(rows.map((r) => r.commune).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, 'fr'))
  return { specialties, communes }
}

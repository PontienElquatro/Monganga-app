// Traduction doctors_public / availabilities (Supabase) -> Doctor / Slot (contrat du front).
// Pure et testable. Aucun champ privé du médecin (email, téléphone) n'est lu ni exposé.

export type DoctorRow = { id: string; full_name: string | null; specialty: string; bio: string | null; consultation_fee: number | string | null }
export type SlotRow = { id: string; doctor_id: string; start_time: string; end_time: string }

export const DEFAULT_DURATION_MINUTES = 30
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function toCents(fee: number | string | null | undefined): number {
  const value = Number(fee)
  return Number.isFinite(value) && value > 0 ? Math.round(value * 100) : 0
}

export function initials(name: string): string {
  const parts = name.replace(/^(dr|docteur)\.?\s+/i, '').split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

export function slotMinutes(slot: Pick<SlotRow, 'start_time' | 'end_time'>): number {
  const minutes = Math.round((Date.parse(slot.end_time) - Date.parse(slot.start_time)) / 60000)
  return Number.isFinite(minutes) && minutes > 0 ? minutes : DEFAULT_DURATION_MINUTES
}

export function toApiSlot(slot: SlotRow) {
  return { id: slot.id, doctorId: slot.doctor_id, start: new Date(slot.start_time).toISOString(), durationMinutes: slotMinutes(slot), booked: false }
}

/**
 * commune / languages / rating n'existent pas encore en base : valeurs neutres, jamais inventées
 * (voir docs/frontend/INTEGRATION_PLAN.md, écarts à valider avec Junior).
 */
export function toApiDoctor(row: DoctorRow, nextSlot: SlotRow | null) {
  const name = (row.full_name ?? '').trim() || 'Médecin'
  return {
    id: row.id,
    name,
    initials: initials(name),
    specialty: row.specialty,
    commune: '',
    bio: row.bio ?? '',
    languages: [] as string[],
    priceCents: toCents(row.consultation_fee),
    durationMinutes: nextSlot ? slotMinutes(nextSlot) : DEFAULT_DURATION_MINUTES,
    rating: null as number | null,
    reviews: 0,
    nextSlot: nextSlot ? new Date(nextSlot.start_time).toISOString() : null,
  }
}

/** Premier créneau libre de chaque médecin (les lignes doivent déjà être triées par date). */
export function firstSlotByDoctor(rows: SlotRow[]): Map<string, SlotRow> {
  const map = new Map<string, SlotRow>()
  for (const row of rows) if (!map.has(row.doctor_id)) map.set(row.doctor_id, row)
  return map
}

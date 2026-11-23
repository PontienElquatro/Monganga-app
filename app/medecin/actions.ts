'use server'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { friendlyError } from '@/lib/errors'
import { COMMUNES, PAYOUT_METHODS } from '@/lib/format'
import { dollarsToCents, str } from '@/lib/validation'
import { flushEmailsSoon } from '@/lib/services/notifications'
import type { ActionState, PayoutMethod, PrescriptionItem } from '@/lib/types'

const UUID = /^[0-9a-f-]{36}$/i
const DAY = /^\d{4}-\d{2}-\d{2}$/
const HOUR = /^\d{2}:\d{2}$/

function addDays(day: string, n: number): string {
  const d = new Date(`${day}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** Ouvre des créneaux de 30 min sur une plage horaire, éventuellement chaque semaine. */
export async function createSlotsAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole('medecin')
  const date = str(fd, 'date', 10)
  const from = str(fd, 'from', 5)
  const to = str(fd, 'to', 5)
  const weeks = Math.min(8, Math.max(1, Number(str(fd, 'weeks', 1)) || 1))
  if (!DAY.test(date) || !HOUR.test(from) || !HOUR.test(to)) return { error: 'Indiquez une date, une heure de début et une heure de fin.' }
  if (to <= from) return { error: 'L’heure de fin doit être après l’heure de début.' }
  const supabase = await createClient()
  let created = 0
  for (let w = 0; w < weeks; w++) {
    const { data, error } = await supabase.rpc('doctor_create_slots', { p_date: addDays(date, w * 7), p_from: from, p_to: to })
    if (error) return { error: friendlyError(error), message: created ? `${created} créneau(x) créé(s) avant l’erreur.` : undefined }
    created += Number(data ?? 0)
  }
  revalidatePath('/medecin', 'layout')
  return created
    ? { ok: true, message: `${created} créneau${created > 1 ? 'x' : ''} de 30 minutes ouvert${created > 1 ? 's' : ''}.` }
    : { error: 'Aucun créneau créé : la plage est passée, trop courte ou déjà couverte.' }
}

export async function deleteSlotAction(fd: FormData): Promise<void> {
  await requireRole('medecin')
  const id = str(fd, 'slot_id', 40)
  if (!UUID.test(id)) return
  const supabase = await createClient()
  await supabase.rpc('doctor_delete_slot', { p_slot: id })
  revalidatePath('/medecin/disponibilites')
}

/** Annulation par le médecin : le patient est remboursé de tout et l'administration alertée. */
export async function cancelByDoctorAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole('medecin')
  const id = str(fd, 'appointment_id', 40)
  const reason = str(fd, 'reason', 300)
  if (!UUID.test(id)) return { error: 'Demande invalide.' }
  if (!reason) return { error: 'Indiquez le motif : il est transmis au patient.' }
  const supabase = await createClient()
  const { error } = await supabase.rpc('cancel_by_doctor', { p_appointment: id, p_reason: reason })
  if (error) return { error: friendlyError(error) }
  flushEmailsSoon()
  revalidatePath('/medecin', 'layout')
  return { ok: true, message: 'Rendez-vous annulé. Le patient est prévenu et sera remboursé intégralement.' }
}

/** Notes privées : visibles par le médecin seul, supprimées 30 jours après la consultation. */
export async function saveNoteAction(appointmentId: string, content: string): Promise<ActionState> {
  await requireRole('medecin')
  if (!UUID.test(appointmentId)) return { error: 'Demande invalide.' }
  const supabase = await createClient()
  const { error } = await supabase.rpc('save_doctor_note', { p_appointment: appointmentId, p_content: content.slice(0, 5000) })
  if (error) return { error: friendlyError(error) }
  return { ok: true, message: 'Notes enregistrées.' }
}

export async function issuePrescriptionAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole('medecin')
  const id = str(fd, 'appointment_id', 40)
  if (!UUID.test(id)) return { error: 'Demande invalide.' }
  const names = fd.getAll('name').map((v) => String(v).trim())
  const dosages = fd.getAll('dosage').map((v) => String(v).trim())
  const durations = fd.getAll('duration').map((v) => String(v).trim())
  const items: PrescriptionItem[] = names
    .map((name, i) => ({ name: name.slice(0, 120), dosage: dosages[i]?.slice(0, 200) || undefined, duration: durations[i]?.slice(0, 80) || undefined }))
    .filter((it) => it.name)
  if (!items.length) return { error: 'Ajoutez au moins un médicament.' }
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('issue_prescription', {
    p_appointment: id, p_items: items, p_instructions: str(fd, 'instructions', 1500) || null,
  })
  if (error) return { error: friendlyError(error) }
  flushEmailsSoon()
  revalidatePath('/medecin', 'layout')
  return { ok: true, message: `Ordonnance ${data as string} envoyée au patient.` }
}

export async function endConsultationAction(appointmentId: string): Promise<ActionState> {
  await requireRole('medecin')
  if (!UUID.test(appointmentId)) return { error: 'Demande invalide.' }
  const supabase = await createClient()
  const { error } = await supabase.rpc('end_consultation', { p_appointment: appointmentId })
  if (error) return { error: friendlyError(error) }
  flushEmailsSoon()
  revalidatePath('/medecin', 'layout')
  return { ok: true, message: 'Consultation terminée. Votre part a été ajoutée à vos revenus.' }
}

/** Profil professionnel : présentation, tarif et compte de versement. */
export async function updateDoctorProfileAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const session = await requireRole('medecin')
  const fee = dollarsToCents(str(fd, 'fee', 10))
  const yearsRaw = str(fd, 'years', 3)
  const years = yearsRaw ? Number(yearsRaw) : null
  const commune = str(fd, 'commune', 60)
  const method = str(fd, 'payout_method', 20) as PayoutMethod
  const account = str(fd, 'payout_account', 60)
  const languages = fd.getAll('languages').map((v) => String(v).trim()).filter(Boolean).slice(0, 8)
  if (!fee) return { error: 'Indiquez votre tarif en dollars.' }
  if (years !== null && (!Number.isInteger(years) || years < 0 || years > 70)) return { error: 'Années d’expérience invalides.' }
  if (commune && !COMMUNES.includes(commune)) return { error: 'Choisissez une commune dans la liste.' }
  if (!PAYOUT_METHODS.some((m) => m.value === method)) return { error: 'Choisissez un moyen de versement.' }
  if (account.length < 6) return { error: 'Indiquez le numéro ou le compte sur lequel recevoir vos versements.' }
  if (!languages.length) return { error: 'Choisissez au moins une langue de consultation.' }
  const supabase = await createClient()
  const { error } = await supabase.from('doctor_profiles').update({
    bio: str(fd, 'bio', 1200),
    languages,
    years_experience: years,
    commune: commune || null,
    fee_cents: fee,
    payout_method: method,
    payout_account: account,
    payout_holder: str(fd, 'payout_holder', 120) || null,
  }).eq('id', session.userId)
  if (error) return { error: friendlyError(error) }
  revalidatePath('/', 'layout')
  return { ok: true, message: 'Profil professionnel enregistré. Le nouveau tarif s’applique aux prochaines réservations.' }
}

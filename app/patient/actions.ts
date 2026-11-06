'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/auth'
import { env } from '@/lib/config'
import { friendlyError } from '@/lib/errors'
import { isPhone, str } from '@/lib/validation'
import { currentProvider } from '@/lib/services/paiement'
import { flushEmailsSoon } from '@/lib/services/notifications'
import { PAYMENT_METHODS } from '@/lib/format'
import type { ActionState, PaymentKind, PaymentMethod } from '@/lib/types'

const UUID = /^[0-9a-f-]{36}$/i

/** Réserve un créneau, puis envoie vers le paiement de l'acompte. */
export async function bookAppointmentAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole('patient')
  const slot = str(fd, 'slot_id', 40)
  if (!UUID.test(slot)) return { error: 'Choisissez un créneau.' }
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('book_appointment', { p_slot: slot, p_reason: str(fd, 'reason', 500) || null })
  if (error) return { error: friendlyError(error) }
  redirect(`/patient/paiement/${data as string}`)
}

/** Crée le paiement (acompte ou solde) puis passe la main au prestataire. */
export async function startPaymentAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole('patient')
  const appointmentId = str(fd, 'appointment_id', 40)
  const kind = str(fd, 'kind', 10) as PaymentKind
  const method = str(fd, 'method', 20) as PaymentMethod
  const phone = str(fd, 'phone', 25)
  if (!UUID.test(appointmentId) || !['acompte', 'solde'].includes(kind)) return { error: 'Demande invalide.' }
  if (!PAYMENT_METHODS.some((m) => m.value === method)) return { error: 'Choisissez un moyen de paiement.' }
  if (method !== 'carte' && !isPhone(phone)) return { error: 'Indiquez le numéro Mobile Money à débiter (ex. +243 81 234 5678).' }

  const provider = currentProvider()
  const supabase = await createClient()
  const { data, error } = await supabase
    .rpc('create_payment', { p_appointment: appointmentId, p_kind: kind, p_method: method, p_phone: method === 'carte' ? null : phone, p_provider: provider.name })
    .single<{ payment_id: string; amount_cents: number }>()
  if (error || !data) return { error: friendlyError(error) }

  const site = env.siteUrl()
  let target: string
  try {
    const result = await provider.initiate({
      paymentId: data.payment_id,
      appointmentId,
      kind,
      amountCents: data.amount_cents,
      method,
      phone: method === 'carte' ? null : phone,
      description: kind === 'acompte' ? 'MONGANGA — acompte de réservation' : 'MONGANGA — solde de la consultation',
      returnUrl: `${site}/patient/paiement/${appointmentId}?retour=${data.payment_id}`,
      callbackUrl: `${site}/api/paiements/webhook/${provider.name}`,
    })
    if (result.providerRef) {
      await createAdminClient().rpc('set_payment_provider_ref', { p_payment: data.payment_id, p_ref: result.providerRef })
    }
    target = result.kind === 'redirect' ? result.url : `/patient/paiement/${appointmentId}?attente=${data.payment_id}`
  } catch (e) {
    console.error('[paiement] initiation', e)
    await createAdminClient().rpc('fail_payment', { p_payment: data.payment_id, p_reason: 'initiation impossible' })
    return { error: 'Le service de paiement ne répond pas. Réessayez dans un instant ou choisissez un autre moyen.' }
  }
  redirect(target)
}

/** Annulation par le patient : la base applique la règle des 24 h. */
export async function cancelAppointmentAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole('patient')
  const id = str(fd, 'appointment_id', 40)
  if (!UUID.test(id)) return { error: 'Demande invalide.' }
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('cancel_by_patient', { p_appointment: id, p_reason: str(fd, 'reason', 300) || null })
  if (error) return { error: friendlyError(error) }
  flushEmailsSoon()
  revalidatePath('/patient', 'layout')
  const messages: Record<string, string> = {
    sans_frais: 'Réservation annulée, sans frais.',
    acompte_rembourse: 'Rendez-vous annulé. Votre acompte va vous être remboursé.',
    acompte_conserve: 'Rendez-vous annulé. Comme prévu dans les conditions, l’acompte reste acquis.',
  }
  return { ok: true, message: messages[data as string] ?? 'Rendez-vous annulé.' }
}

/** Note de 1 à 5 : visible uniquement par l'administration. */
export async function rateAppointmentAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole('patient')
  const id = str(fd, 'appointment_id', 40)
  const stars = Number(str(fd, 'stars', 1))
  if (!UUID.test(id)) return { error: 'Demande invalide.' }
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) return { error: 'Choisissez une note de 1 à 5 étoiles.' }
  const supabase = await createClient()
  const { error } = await supabase.rpc('rate_appointment', { p_appointment: id, p_stars: stars, p_comment: str(fd, 'comment', 1000) || null })
  if (error) return { error: friendlyError(error) }
  revalidatePath('/patient/rendez-vous')
  return { ok: true, message: 'Merci ! Votre avis a été transmis à l’équipe MONGANGA.' }
}

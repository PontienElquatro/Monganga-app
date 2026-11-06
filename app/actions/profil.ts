'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth'
import { modes } from '@/lib/config'
import { friendlyError } from '@/lib/errors'
import { COMMUNES } from '@/lib/format'
import { isPhone, str } from '@/lib/validation'
import { isOwnCloudinaryUrl, signAvatarUpload } from '@/lib/services/cloudinary'
import type { ActionState } from '@/lib/types'

/** Informations personnelles du compte connecté (tous rôles). Le rôle et l'e-mail ne sont pas modifiables ici. */
export async function updateMyProfileAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const session = await getSession()
  if (!session) return { error: 'Session expirée. Reconnectez-vous.' }
  const first = str(fd, 'first_name', 80)
  const last = str(fd, 'last_name', 80)
  const phone = str(fd, 'phone', 25)
  const birth = str(fd, 'birth_date', 10)
  const sex = str(fd, 'sex', 1)
  const commune = str(fd, 'commune', 60)
  if (!first || !last) return { error: 'Indiquez votre prénom et votre nom.' }
  if (phone && !isPhone(phone)) return { error: 'Numéro de téléphone invalide.' }
  if (birth && (!/^\d{4}-\d{2}-\d{2}$/.test(birth) || birth > new Date().toISOString().slice(0, 10) || birth < '1900-01-01')) {
    return { error: 'Date de naissance invalide.' }
  }
  if (sex && !['F', 'M'].includes(sex)) return { error: 'Sexe invalide.' }
  if (commune && !COMMUNES.includes(commune)) return { error: 'Choisissez une commune dans la liste.' }
  const supabase = await createClient()
  const { error } = await supabase.from('profiles').update({
    first_name: first, last_name: last, phone: phone || null, birth_date: birth || null, sex: sex || null, commune: commune || null,
  }).eq('id', session.userId)
  if (error) return { error: friendlyError(error) }
  revalidatePath('/', 'layout')
  return { ok: true, message: 'Profil enregistré.' }
}

/** Paramètres signés pour envoyer la photo directement à Cloudinary (le secret reste sur le serveur). */
export async function avatarSignatureAction() {
  const session = await getSession()
  if (!session) return { error: 'Session expirée. Reconnectez-vous.' }
  if (!modes.photosEnabled()) return { error: 'L’envoi de photos sera disponible une fois Cloudinary branché.' }
  return { ok: true as const, params: signAvatarUpload(session.userId) }
}

export async function saveAvatarAction(url: string | null): Promise<ActionState> {
  const session = await getSession()
  if (!session) return { error: 'Session expirée. Reconnectez-vous.' }
  if (url !== null && !isOwnCloudinaryUrl(url)) return { error: 'Adresse de photo refusée.' }
  const supabase = await createClient()
  const { error } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', session.userId)
  if (error) return { error: friendlyError(error) }
  revalidatePath('/', 'layout')
  return { ok: true, message: url ? 'Photo mise à jour.' : 'Photo retirée.' }
}

/** Marque des notifications comme lues (toutes si aucune liste). */
export async function markNotificationsReadAction(ids: string[] | null): Promise<void> {
  const session = await getSession()
  if (!session) return
  const clean = ids?.filter((id) => /^[0-9a-f-]{36}$/i.test(id)).slice(0, 100) ?? null
  const supabase = await createClient()
  await supabase.rpc('mark_notifications_read', { p_ids: clean })
  revalidatePath('/', 'layout')
}

'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin, requireRole } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { env } from '@/lib/config'
import { createClient } from '@/lib/supabase/server'
import { friendlyError } from '@/lib/errors'
import { dollarsToCents, str } from '@/lib/validation'
import { flushEmailsSoon } from '@/lib/services/notifications'
import type { ActionState, AdminRole } from '@/lib/types'

const UUID = /^[0-9a-f-]{36}$/i

async function run(fn: string, args: Record<string, unknown>, ok: string, paths: string[] = ['/admin']): Promise<ActionState> {
  await requireRole('admin')
  const supabase = await createClient()
  const { error } = await supabase.rpc(fn, args)
  if (error) return { error: friendlyError(error) }
  flushEmailsSoon()
  for (const p of paths) revalidatePath(p, 'layout')
  return { ok: true, message: ok }
}

const id = (fd: FormData, key = 'id') => {
  const v = str(fd, key, 40)
  return UUID.test(v) ? v : null
}

// ----- Candidatures -----
export async function decideApplicationAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const doctor = id(fd, 'doctor_id')
  const decision = str(fd, 'decision', 20)
  const message = str(fd, 'message', 1000)
  if (!doctor) return { error: 'Dossier introuvable.' }
  if (decision === 'valider') return run('admin_validate_doctor', { p_doctor: doctor }, 'Dossier validé. Le médecin est prévenu par e-mail et peut ouvrir ses créneaux.')
  if (!message) return { error: decision === 'refuser' ? 'Indiquez le motif du refus : le médecin le verra.' : 'Indiquez les pièces ou informations à compléter.' }
  if (decision === 'completer') return run('admin_request_complement', { p_doctor: doctor, p_message: message }, 'Demande de complément envoyée au médecin.')
  if (decision === 'refuser') return run('admin_refuse_doctor', { p_doctor: doctor, p_message: message }, 'Dossier refusé. Le médecin voit le motif et peut soumettre à nouveau.')
  return { error: 'Décision invalide.' }
}

// ----- Médecins et utilisateurs -----
export async function setCommissionAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const doctor = id(fd, 'doctor_id')
  const rate = Number(str(fd, 'rate', 6).replace(',', '.'))
  if (!doctor) return { error: 'Médecin introuvable.' }
  if (!Number.isFinite(rate) || rate < 0 || rate > 100) return { error: 'La commission doit être comprise entre 0 et 100 %.' }
  return run('admin_set_commission', { p_doctor: doctor, p_rate: Math.round(rate * 100) / 100 }, `Commission fixée à ${rate} % pour les prochaines réservations.`)
}

export async function setSuspendedAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = id(fd, 'user_id')
  const suspend = str(fd, 'suspend', 5) === 'true'
  if (!user) return { error: 'Utilisateur introuvable.' }
  return run('admin_set_suspended', { p_user: user, p_suspended: suspend },
    suspend ? 'Compte suspendu. Ses rendez-vous à venir sont annulés et remboursés.' : 'Compte réactivé.')
}

/**
 * Suppression d'un compte (super administrateur) : vérification, effacement des pièces du dossier,
 * puis suppression définitive (aucune activité) ou anonymisation (historique conservé sans nom).
 */
export async function deleteUserAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = id(fd, 'user_id')
  if (!user) return { error: 'Utilisateur introuvable.' }
  await requireAdmin('super')
  const supabase = await createClient()
  const check = await supabase.rpc('admin_delete_user', { p_user: user, p_check_only: true })
  if (check.error) return { error: friendlyError(check.error) }

  const admin = createAdminClient()
  const { data: files, error: listError } = await admin.storage.from('candidatures').list(user, { limit: 100 })
  if (listError) {
    console.error('[suppression] liste des pièces', listError.message)
    return { error: 'Impossible d’effacer les pièces du dossier pour le moment. Réessayez dans un instant.' }
  }
  if (files?.length) {
    const { error: removeError } = await admin.storage.from('candidatures').remove(files.map((f) => `${user}/${f.name}`))
    if (removeError) {
      console.error('[suppression] effacement des pièces', removeError.message)
      return { error: 'Impossible d’effacer les pièces du dossier pour le moment. Réessayez dans un instant.' }
    }
  }

  const { data: mode, error } = await supabase.rpc('admin_delete_user', { p_user: user })
  if (error) return { error: friendlyError(error) }
  revalidatePath('/admin', 'layout')
  if (mode === 'definitif') redirect('/admin/utilisateurs?supprime=1')
  return { ok: true, message: 'Compte supprimé. Ses données personnelles sont effacées ; ses rendez-vous et paiements restent dans l’historique, sans nom.' }
}

// ----- Argent -----
export async function markRefundDoneAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const refund = id(fd, 'refund_id')
  const reference = str(fd, 'reference', 100)
  if (!refund) return { error: 'Remboursement introuvable.' }
  if (!reference) return { error: 'Indiquez la référence de l’opération de remboursement.' }
  return run('admin_mark_refund_done', { p_refund: refund, p_reference: reference }, 'Remboursement marqué comme effectué. Le patient est prévenu.')
}

export async function resolveAppointmentAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const appt = id(fd, 'appointment_id')
  const decision = str(fd, 'decision', 20)
  if (!appt) return { error: 'Rendez-vous introuvable.' }
  if (!['terminee', 'absence_patient', 'absence_medecin'].includes(decision)) return { error: 'Choisissez une décision.' }
  return run('admin_resolve_appointment', { p_appointment: appt, p_decision: decision }, 'Décision enregistrée et appliquée aux paiements.')
}

export async function preparePayoutsAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const period = str(fd, 'period_end', 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(period)) return { error: 'Date de fin de période invalide.' }
  await requireRole('admin')
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('admin_prepare_payouts', { p_period_end: period })
  if (error) return { error: friendlyError(error) }
  revalidatePath('/admin', 'layout')
  const n = Number(data ?? 0)
  return { ok: true, message: n ? `${n} versement${n > 1 ? 's' : ''} préparé${n > 1 ? 's' : ''}.` : 'Rien à verser pour cette période.' }
}

export async function markPayoutPaidAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const payout = id(fd, 'payout_id')
  const feesRaw = str(fd, 'fees', 10)
  const fees = feesRaw ? dollarsToCents(feesRaw) ?? (Number(feesRaw.replace(',', '.')) === 0 ? 0 : null) : 0
  const reference = str(fd, 'reference', 100)
  if (!payout) return { error: 'Versement introuvable.' }
  if (fees === null) return { error: 'Frais de transfert invalides.' }
  if (!reference) return { error: 'Indiquez la référence du transfert.' }
  return run('admin_mark_payout_paid', { p_payout: payout, p_fees_cents: fees, p_reference: reference }, 'Versement enregistré. Le médecin est prévenu.')
}

// ----- Paramètres -----
export async function updateSettingAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const key = str(fd, 'key', 60)
  const unit = str(fd, 'unit', 10)
  const raw = str(fd, 'value', 12).replace(',', '.')
  const n = Number(raw)
  if (!key || !Number.isFinite(n) || n < 0) return { error: 'Valeur invalide.' }
  if (unit === '%' && n > 100) return { error: 'Un pourcentage ne peut pas dépasser 100 %.' }
  const value = unit === 'usd' ? Math.round(n * 100) : Math.round(n)
  return run('admin_update_setting', { p_key: key, p_value: value }, 'Paramètre enregistré.', ['/'])
}

// ----- Équipe (super administrateur) -----
const TEAM_ROLES: AdminRole[] = ['super', 'finance', 'support', 'validation']

export async function setTeamRolesAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const email = str(fd, 'email', 254).toLowerCase()
  const roles = fd.getAll('roles').map(String).filter((r): r is AdminRole => (TEAM_ROLES as string[]).includes(r))
  if (!email || !email.includes('@')) return { error: 'Indiquez l’adresse e-mail du compte.' }
  return run('admin_set_team_roles', { p_email: email, p_roles: roles },
    roles.length ? 'Rôles enregistrés. Ils s’appliquent à sa prochaine page ouverte.' : 'Cette personne ne fait plus partie de l’équipe.', ['/admin'])
}

// ----- Comptes : confirmation de l'adresse e-mail -----
async function userEmail(fd: FormData): Promise<{ id: string; email: string } | null> {
  const user = id(fd, 'user_id')
  if (!user) return null
  const { data } = await createAdminClient().from('profiles').select('email').eq('id', user).maybeSingle<{ email: string }>()
  return data?.email ? { id: user, email: data.email } : null
}

export async function resendUserConfirmationAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin('support')
  const u = await userEmail(fd)
  if (!u) return { error: 'Utilisateur introuvable.' }
  const supabase = await createClient()
  const { error } = await supabase.auth.resend({ type: 'signup', email: u.email, options: { emailRedirectTo: `${env.siteUrl()}/auth/confirm` } })
  if (error) return { error: friendlyError(error) }
  return { ok: true, message: `Nouveau lien de confirmation envoyé à ${u.email}.` }
}

export async function confirmUserEmailAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin('super')
  const u = await userEmail(fd)
  if (!u) return { error: 'Utilisateur introuvable.' }
  const { error } = await createAdminClient().auth.admin.updateUserById(u.id, { email_confirm: true })
  if (error) return { error: friendlyError(error) }
  revalidatePath(`/admin/utilisateurs/${u.id}`)
  return { ok: true, message: 'Adresse e-mail confirmée. La personne peut se connecter.' }
}

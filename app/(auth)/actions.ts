'use server'
import { redirect } from 'next/navigation'
import { createHmac } from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { env } from '@/lib/config'
import { friendlyError } from '@/lib/errors'
import { getSession, homeFor } from '@/lib/auth'
import { dollarsToCents, isEmail, isPhone, passwordProblem, safeNext, str } from '@/lib/validation'
import { flushEmailsSoon } from '@/lib/services/notifications'
import type { ActionState, DocumentKind, PayoutMethod } from '@/lib/types'

// ---------------------------------------------------------------------
// Connexion
// ---------------------------------------------------------------------
export async function loginAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const email = str(fd, 'email', 254).toLowerCase()
  const password = String(fd.get('password') ?? '')
  if (!isEmail(email) || !password) return { error: 'Indiquez votre adresse e-mail et votre mot de passe.' }
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: friendlyError(error) }
  const session = await getSession()
  const next = safeNext(str(fd, 'suite', 300))
  redirect(next && session && !session.profile.suspended_at ? next : session ? homeFor(session) : '/')
}

// ---------------------------------------------------------------------
// Inscription patient
// ---------------------------------------------------------------------
export async function registerPatientAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const firstName = str(fd, 'first_name', 80)
  const lastName = str(fd, 'last_name', 80)
  const email = str(fd, 'email', 254).toLowerCase()
  const phone = str(fd, 'phone', 20)
  const password = String(fd.get('password') ?? '')
  if (!firstName || !lastName) return { error: 'Indiquez votre prénom et votre nom.' }
  if (!isEmail(email)) return { error: 'Adresse e-mail invalide.' }
  if (phone && !isPhone(phone)) return { error: 'Numéro de téléphone invalide.' }
  const pw = passwordProblem(password)
  if (pw) return { error: pw }
  if (fd.get('terms') !== 'on') return { error: 'Acceptez les conditions d’utilisation et la politique de confidentialité.' }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${env.siteUrl()}/auth/confirm`,
      data: { first_name: firstName, last_name: lastName, phone: phone || null, account_type: 'patient', accepted_terms: 'true' },
    },
  })
  if (error) return { error: friendlyError(error) }
  if (data.user && data.user.identities?.length === 0) return { error: 'Un compte existe déjà avec cette adresse e-mail.' }
  if (data.session) redirect('/patient')
  redirect(`/verification-email?email=${encodeURIComponent(email)}`)
}

// ---------------------------------------------------------------------
// Inscription médecin : compte + candidature + pièces, en un seul formulaire.
// Étape 1 (serveur) : crée le compte et le dossier, prépare des adresses d'envoi signées.
// Étape 2 (navigateur) : envoie les fichiers directement au stockage privé.
// Étape 3 (serveur) : vérifie les fichiers reçus et les rattache au dossier.
// ---------------------------------------------------------------------
const DOC_KINDS: DocumentKind[] = ['photo', 'identite', 'diplome', 'ordre', 'cv', 'specialisation']
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 10 * 1024 * 1024
const PAYOUTS: PayoutMethod[] = ['mpesa', 'orange_money', 'airtel_money', 'banque']

export interface DocMeta { kind: DocumentKind; name: string; size: number; type: string }
export interface UploadTicket { kind: DocumentKind; path: string; token: string; name: string; size: number }
export interface DoctorSignupResult { ok?: boolean; error?: string; userId?: string; proof?: string; uploads?: UploadTicket[] }

function sign(value: string): string {
  return createHmac('sha256', env.serviceRoleKey()).update(value).digest('hex')
}

function extension(type: string): string {
  return ({ 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' } as Record<string, string>)[type] ?? 'bin'
}

function readApplication(fd: FormData) {
  const languages = fd.getAll('languages').map((l) => String(l).trim()).filter(Boolean).slice(0, 6)
  const payout = str(fd, 'payout_method', 20) as PayoutMethod
  return {
    specialty: str(fd, 'specialty', 80),
    bio: str(fd, 'bio', 1200),
    fee: dollarsToCents(str(fd, 'fee', 10)),
    languages: languages.length ? languages : ['Français', 'Lingala'],
    years: str(fd, 'years', 3) ? Number(str(fd, 'years', 3)) : null,
    commune: str(fd, 'commune', 60),
    payout: PAYOUTS.includes(payout) ? payout : null,
    account: str(fd, 'payout_account', 60),
    holder: str(fd, 'payout_holder', 120),
  }
}

function checkDocs(docs: DocMeta[], requireAll: boolean): string | null {
  for (const d of docs) {
    if (!DOC_KINDS.includes(d.kind)) return 'Type de pièce inconnu.'
    if (!ALLOWED_TYPES.includes(d.type)) return `« ${d.name} » : formats acceptés PDF, JPG, PNG ou WebP.`
    if (d.size <= 0 || d.size > MAX_SIZE) return `« ${d.name} » dépasse 10 Mo.`
  }
  if (requireAll) {
    const missing = (['photo', 'identite', 'diplome', 'ordre', 'cv'] as DocumentKind[]).filter((k) => !docs.some((d) => d.kind === k))
    if (missing.length) return 'Ajoutez toutes les pièces obligatoires : photo, pièce d’identité, diplôme, attestation de l’Ordre et CV.'
  }
  return null
}

export async function startDoctorSignupAction(fd: FormData, docs: DocMeta[]): Promise<DoctorSignupResult> {
  const firstName = str(fd, 'first_name', 80)
  const lastName = str(fd, 'last_name', 80)
  const email = str(fd, 'email', 254).toLowerCase()
  const phone = str(fd, 'phone', 20)
  const password = String(fd.get('password') ?? '')
  const app = readApplication(fd)

  if (!firstName || !lastName) return { error: 'Indiquez votre prénom et votre nom.' }
  if (!isEmail(email)) return { error: 'Adresse e-mail invalide.' }
  if (phone && !isPhone(phone)) return { error: 'Numéro de téléphone invalide.' }
  const pw = passwordProblem(password)
  if (pw) return { error: pw }
  if (!app.specialty) return { error: 'Choisissez votre spécialité.' }
  if (!app.fee) return { error: 'Indiquez votre tarif en dollars.' }
  if (!app.payout || app.account.length < 6) return { error: 'Indiquez comment recevoir vos versements.' }
  if (fd.get('terms') !== 'on') return { error: 'Acceptez les conditions d’utilisation et la politique de confidentialité.' }
  const docProblem = checkDocs(docs, true)
  if (docProblem) return { error: docProblem }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${env.siteUrl()}/auth/confirm?suite=/dossier`,
      data: { first_name: firstName, last_name: lastName, phone: phone || null, account_type: 'medecin', accepted_terms: 'true' },
    },
  })
  if (error) return { error: friendlyError(error) }
  if (!data.user || data.user.identities?.length === 0) return { error: 'Un compte existe déjà avec cette adresse e-mail. Connectez-vous pour suivre votre dossier.' }

  const admin = createAdminClient()
  const userId = data.user.id
  const { error: appError } = await admin.rpc('service_submit_application', {
    p_user: userId, p_specialty: app.specialty, p_bio: app.bio, p_fee_cents: app.fee, p_languages: app.languages,
    p_years: app.years, p_commune: app.commune, p_payout_method: app.payout, p_payout_account: app.account, p_payout_holder: app.holder,
  })
  if (appError) return { error: friendlyError(appError) }

  const uploads: UploadTicket[] = []
  for (const d of docs) {
    const path = `${userId}/${d.kind}-${crypto.randomUUID().slice(0, 8)}.${extension(d.type)}`
    const { data: signed, error: signError } = await admin.storage.from('candidatures').createSignedUploadUrl(path)
    if (signError || !signed) return { error: 'Impossible de préparer l’envoi des pièces. Réessayez.' }
    uploads.push({ kind: d.kind, path, token: signed.token, name: d.name.slice(0, 120), size: d.size })
  }
  const expires = Date.now() + 30 * 60 * 1000
  return { ok: true, userId, uploads, proof: `${expires}.${sign(`${userId}.${expires}`)}` }
}

export async function finishDoctorSignupAction(userId: string, proof: string, uploaded: UploadTicket[]): Promise<{ error?: string }> {
  const [expires, mac] = proof.split('.')
  if (!expires || !mac || Number(expires) < Date.now() || sign(`${userId}.${expires}`) !== mac) {
    return { error: 'Session d’envoi expirée. Connectez-vous pour compléter votre dossier.' }
  }
  const admin = createAdminClient()
  const { data: files } = await admin.storage.from('candidatures').list(userId, { limit: 50 })
  const present = new Set((files ?? []).map((f) => `${userId}/${f.name}`))
  const rows = uploaded
    .filter((u) => u.path.startsWith(`${userId}/`) && present.has(u.path) && DOC_KINDS.includes(u.kind))
    .map((u) => ({ doctor_id: userId, kind: u.kind, storage_path: u.path, file_name: u.name, size_bytes: Math.max(1, Math.min(u.size, MAX_SIZE)) }))
  if (rows.length) {
    const { error } = await admin.from('doctor_documents').upsert(rows, { onConflict: 'storage_path' })
    if (error) return { error: friendlyError(error) }
  }
  flushEmailsSoon()
  return {}
}

// ---------------------------------------------------------------------
// Nouvelle soumission par un médecin connecté (après refus ou complément demandé).
// Les fichiers sont envoyés directement par le navigateur (session + règles de stockage).
// ---------------------------------------------------------------------
export async function resubmitApplicationAction(fd: FormData, uploaded: { kind: DocumentKind; path: string; name: string; size: number }[]): Promise<{ error?: string }> {
  const session = await getSession()
  if (!session || session.profile.role !== 'medecin') return { error: 'Connectez-vous avec votre compte médecin.' }
  const app = readApplication(fd)
  if (!app.specialty || !app.fee || !app.payout) return { error: 'Complétez la spécialité, le tarif et le moyen de versement.' }
  const supabase = await createClient()
  if (uploaded.length) {
    const rows = uploaded
      .filter((u) => u.path.startsWith(`${session.userId}/`) && DOC_KINDS.includes(u.kind))
      .map((u) => ({ doctor_id: session.userId, kind: u.kind, storage_path: u.path, file_name: u.name.slice(0, 120), size_bytes: Math.max(1, Math.min(u.size, MAX_SIZE)) }))
    const { error } = await supabase.from('doctor_documents').insert(rows)
    if (error) return { error: friendlyError(error) }
  }
  const { error } = await supabase.rpc('submit_application', {
    p_specialty: app.specialty, p_bio: app.bio, p_fee_cents: app.fee, p_languages: app.languages, p_years: app.years,
    p_commune: app.commune, p_payout_method: app.payout, p_payout_account: app.account, p_payout_holder: app.holder,
  })
  if (error) return { error: friendlyError(error) }
  flushEmailsSoon()
  return {}
}

// ---------------------------------------------------------------------
// Mot de passe
// ---------------------------------------------------------------------
export async function forgotPasswordAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const email = str(fd, 'email', 254).toLowerCase()
  if (!isEmail(email)) return { error: 'Adresse e-mail invalide.' }
  const supabase = await createClient()
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${env.siteUrl()}/auth/confirm?suite=/reinitialiser` })
  // Même réponse que l'adresse existe ou non (on ne révèle pas qui est inscrit).
  return { ok: true, message: 'Si un compte existe avec cette adresse, vous allez recevoir un lien pour choisir un nouveau mot de passe.' }
}

export async function resetPasswordAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const password = String(fd.get('password') ?? '')
  const confirm = String(fd.get('confirm') ?? '')
  const pw = passwordProblem(password)
  if (pw) return { error: pw }
  if (password !== confirm) return { error: 'Les deux mots de passe ne sont pas identiques.' }
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: friendlyError(error, 'Le lien a expiré. Recommencez depuis « Mot de passe oublié ».') }
  const session = await getSession()
  redirect(session ? homeFor(session) : '/connexion')
}

export async function resendConfirmationAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const email = str(fd, 'email', 254).toLowerCase()
  if (!isEmail(email)) return { error: 'Adresse e-mail invalide.' }
  const supabase = await createClient()
  const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: `${env.siteUrl()}/auth/confirm` } })
  if (error) return { error: friendlyError(error) }
  return { ok: true, message: 'Un nouveau lien vient de vous être envoyé.' }
}

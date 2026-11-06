'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/avatar'
import { Icon } from '@/components/ui/icon'
import { joinConsultationAction } from '@/app/actions/consultation'
import { time } from '@/lib/format'
import type { ConsultationContext } from '@/lib/types'

export interface ChatMessage { id: string; sender_id: string; body: string; created_at: string }
export interface SharedFile { id: string; uploader_id: string; storage_path: string; file_name: string; size_bytes: number; created_at: string }

const MIN = 60_000
const MAX_FILE = 10 * 1024 * 1024
const TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']

const clock = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = String(s % 60).padStart(2, '0')
  return h ? `${h} h ${String(m).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${r}`
}
const size = (b: number) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1).replace('.', ',')} Mo` : `${Math.max(1, Math.round(b / 1024))} Ko`)

/**
 * Salle de consultation partagée (patient et médecin) : vidéo Daily.co, minuteur de 30 min
 * avec alerte 5 min avant la fin, messages et documents en temps réel.
 * Le panneau du médecin (notes, ordonnance, fin) est passé en « aside ».
 */
export function ConsultationRoom({ ctx, me, meName, meAvatar, initialMessages, initialFiles, aside, leaveHref }: {
  ctx: ConsultationContext
  me: string
  meName: string
  meAvatar: string | null
  initialMessages: ChatMessage[]
  initialFiles: SharedFile[]
  aside?: React.ReactNode
  leaveHref: string
}) {
  const router = useRouter()
  const isDoctor = ctx.viewer === 'medecin'
  const start = new Date(ctx.starts_at).getTime()
  const end = new Date(ctx.ends_at).getTime()
  const closes = new Date(ctx.closes_at).getTime()

  const [now, setNow] = useState(() => Date.now())
  const [joining, setJoining] = useState(false)
  const [visio, setVisio] = useState<{ mode: 'daily' | 'test'; url: string | null } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [files, setFiles] = useState<SharedFile[]>(initialFiles)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [tip, setTip] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement | null>(null)
  const stage = useRef<HTMLDivElement | null>(null)
  const chatEnd = useRef<HTMLDivElement | null>(null)

  // Horloge (1 s) et rafraîchissement de l'état du rendez-vous (30 s).
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    const r = setInterval(() => router.refresh(), 30_000)
    return () => { clearInterval(t); clearInterval(r) }
  }, [router])

  // Messages et documents en temps réel.
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`consultation-${ctx.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'consultation_messages', filter: `appointment_id=eq.${ctx.id}` },
        (p) => setMessages((list) => (list.some((m) => m.id === p.new.id) ? list : [...list, p.new as ChatMessage])))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'consultation_files', filter: `appointment_id=eq.${ctx.id}` },
        (p) => setFiles((list) => (list.some((f) => f.id === p.new.id) ? list : [...list, p.new as SharedFile])))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [ctx.id])

  useEffect(() => { chatEnd.current?.scrollIntoView({ block: 'nearest' }) }, [messages.length])

  const ended = ctx.status === 'terminee'
  const closed = now > closes || !['confirme', 'en_cours', 'terminee'].includes(ctx.status)
  const canEnter = now >= start - 5 * MIN && !closed && !ended
  const canWrite = now >= start - 15 * MIN && now <= closes && (ctx.status === 'confirme' || ctx.status === 'en_cours')
  const remaining = end - now
  const warn = remaining > 0 && remaining <= 5 * MIN

  async function join() {
    setJoining(true)
    setError(null)
    const res = await joinConsultationAction(ctx.id)
    setJoining(false)
    if (!res.ok) {
      if (res.code === 'SOLDE_NON_PAYE') { router.push(`/patient/paiement/${ctx.id}?etape=solde`); return }
      setError(res.error)
      return
    }
    setVisio({ mode: res.mode, url: res.url })
    router.refresh()
  }

  async function send(e: FormEvent) {
    e.preventDefault()
    const body = draft.trim()
    if (!body || sending) return
    setSending(true)
    const supabase = createClient()
    const { data, error: err } = await supabase.from('consultation_messages')
      .insert({ appointment_id: ctx.id, sender_id: me, body: body.slice(0, 2000) })
      .select('id, sender_id, body, created_at').single<ChatMessage>()
    setSending(false)
    if (err || !data) { setError('Message non envoyé. Vérifiez votre connexion.'); return }
    setDraft('')
    setMessages((list) => (list.some((m) => m.id === data.id) ? list : [...list, data]))
  }

  async function upload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!TYPES.includes(file.type)) { setError('Formats acceptés : PDF, JPG, PNG ou WEBP.'); return }
    if (file.size > MAX_FILE) { setError('Fichier trop lourd (10 Mo maximum).'); return }
    setUploading(true)
    setError(null)
    const supabase = createClient()
    const clean = file.name.normalize('NFD').replace(/[^\w.-]+/g, '-').slice(-80)
    const path = `${ctx.id}/${Date.now()}-${clean}`
    const up = await supabase.storage.from('consultations').upload(path, file, { contentType: file.type, upsert: false })
    if (up.error) { setUploading(false); setError('Envoi du document impossible. Réessayez.'); return }
    const { data, error: err } = await supabase.from('consultation_files')
      .insert({ appointment_id: ctx.id, uploader_id: me, storage_path: path, file_name: file.name.slice(0, 120), size_bytes: file.size })
      .select('id, uploader_id, storage_path, file_name, size_bytes, created_at').single<SharedFile>()
    setUploading(false)
    if (err || !data) { setError('Document envoyé mais non enregistré. Réessayez.'); return }
    setFiles((list) => (list.some((f) => f.id === data.id) ? list : [...list, data]))
  }

  async function open(f: SharedFile) {
    const supabase = createClient()
    const { data } = await supabase.storage.from('consultations').createSignedUrl(f.storage_path, 120)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener')
    else setError('Ce document n’est plus disponible.')
  }

  function fullscreen() {
    const el = stage.current
    if (!el) return
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    else el.requestFullscreen?.().catch(() => {})
  }

  const timer = ended ? null : now < start
    ? <span className="v3-timer"><Icon name="clock" /> Début dans {clock(start - now)}</span>
    : remaining > 0
      ? <span className={`v3-timer${warn ? ' warn' : ''}`}><Icon name="timer" /> {clock(remaining)} restantes</span>
      : <span className="v3-timer warn"><Icon name="timer" /> Temps écoulé · fermeture à {time(ctx.closes_at)}</span>

  const chat = (
    <div className="panel v3-chat" id="chat">
      <h2><Icon name="message-circle" /> Messages et documents</h2>
      {!messages.length && !files.length ? <p className="meta">Aucun message pour l’instant.</p> : null}
      {[...messages.map((m) => ({ t: m.created_at, el: (
        <div key={m.id} className={`v3-msg ${m.sender_id === me ? 'me' : 'them'}`}>
          <span>{m.sender_id === me ? 'Vous' : ctx.other_name} · {time(m.created_at)}</span>{m.body}
        </div>
      ) })), ...files.map((f) => ({ t: f.created_at, el: (
        <button key={f.id} type="button" className={`v3-file ${f.uploader_id === me ? '' : 'them'}`} onClick={() => open(f)}>
          <Icon name="file-text" /> {f.file_name} · {size(f.size_bytes)}
        </button>
      ) }))].sort((a, b) => a.t.localeCompare(b.t)).map((x) => x.el)}
      <div ref={chatEnd} />
      {canWrite ? (
        <form className="chat-form" onSubmit={send}>
          <button className="btn btn-ghost btn-icon" type="button" onClick={() => fileInput.current?.click()} disabled={uploading} aria-label="Joindre un document (PDF ou image, 10 Mo max.)">
            <Icon name={uploading ? 'loader' : 'paperclip'} className={uploading ? 'spin' : undefined} />
          </button>
          <label className="sr-only" htmlFor="chat-input">Votre message</label>
          <input id="chat-input" className="form-input" value={draft} onChange={(e: ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)} maxLength={2000} placeholder="Écrire un message…" autoComplete="off" />
          <button className="btn btn-primary btn-icon" type="submit" disabled={sending || !draft.trim()} aria-label="Envoyer"><Icon name={sending ? 'loader' : 'send'} className={sending ? 'spin' : undefined} /></button>
        </form>
      ) : <p className="meta">Les messages sont fermés en dehors de la consultation.</p>}
      <input ref={fileInput} type="file" hidden accept="application/pdf,image/jpeg,image/png,image/webp" onChange={upload} />
      <p className="meta"><Icon name="clock" /> Messages et documents supprimés 30 jours après la consultation.</p>
    </div>
  )

  const head = (
    <div className="v3-call-head">
      <div>
        <p className="eyebrow">{ended ? 'Consultation terminée' : visio ? 'Consultation en cours' : isDoctor ? 'Consultation' : 'Salle d’attente'}</p>
        <h1>{ctx.other_name}</h1>
        <span className="meta">{ctx.other_detail ? `${ctx.other_detail} · ` : ''}{time(ctx.starts_at)} – {time(ctx.ends_at)} · réf. {ctx.reference}</span>
      </div>
      {timer}
    </div>
  )

  const errorNotice = error ? <p className="notice danger" role="alert"><Icon name="circle-alert" /> {error}</p> : null

  // Avant l'entrée : salle d'attente.
  if (!visio) {
    return (
      <>
        {head}
        {errorNotice}
        <div className="layout-two">
          <section className="stack">
            <div className="panel stack">
              <div className="v3-preview">
                <div className="v3-preview-self"><Avatar name={meName} url={meAvatar} size="xl" /><span>{meName}</span></div>
                <div className="v3-preview-bar">
                  <span className="v3-ok"><Icon name="mic" /> Micro</span>
                  <span className="v3-ok"><Icon name="video" /> Caméra</span>
                  <span className="v3-ok"><Icon name="wifi" /> Connexion</span>
                </div>
              </div>
              {ended ? (
                <p className="notice success"><Icon name="circle-check" /> Cette consultation est terminée.</p>
              ) : closed ? (
                <p className="notice"><Icon name="lock" /> La salle de consultation est fermée.</p>
              ) : (
                <button className="btn btn-primary btn-lg btn-block v3-start" type="button" onClick={join} disabled={!canEnter || joining}>
                  <Icon name={joining ? 'loader' : 'video'} className={joining ? 'spin' : undefined} />
                  {joining ? 'Connexion…' : canEnter ? 'Démarrer la consultation' : `La salle ouvre à ${time(new Date(start - 5 * MIN).toISOString())}`}
                </button>
              )}
              <p className="meta">Votre navigateur vous demandera l’accès à la caméra et au micro. Vous pouvez entrer jusqu’à 5 minutes avant l’heure.</p>
            </div>
            {chat}
          </section>
          {aside ?? (
            <aside className="panel stack">
              <h2>Avant de commencer</h2>
              <ul className="v3-checklist big">
                <li className="ok"><Icon name="circle-check" /> Acompte payé</li>
                <li className={ctx.balance_paid ? 'ok' : ''}><Icon name={ctx.balance_paid ? 'circle-check' : 'clock'} /> Solde {ctx.balance_paid ? 'payé' : 'à payer avant de démarrer'}</li>
                <li><Icon name="wifi" /> Installez-vous dans un endroit calme, avec une bonne connexion.</li>
                <li><Icon name="file-up" /> Préparez vos documents (analyses, photos) : vous pourrez les envoyer pendant l’appel.</li>
              </ul>
              {ended ? <Link className="btn btn-secondary" href="/patient/rendez-vous"><Icon name="star" /> Donner mon avis</Link> : null}
            </aside>
          )}
        </div>
      </>
    )
  }

  return (
    <>
      {head}
      {errorNotice}
      {ended ? <p className="notice success"><Icon name="circle-check" /> Le médecin a terminé la consultation.{isDoctor ? '' : ' Votre ordonnance, s’il y en a une, est dans « Ordonnances ».'}</p> : null}
      <div className={aside ? 'layout-two' : ''}>
        <section className="stack">
          <div className="v3-stage" ref={stage}>
            {visio.mode === 'daily' && visio.url && !closed ? (
              <iframe className="daily-frame" src={visio.url} title="Visio de la consultation"
                      allow="camera; microphone; fullscreen; display-capture; autoplay" />
            ) : (
              <div className="v3-remote placeholder">
                <Avatar name={ctx.other_name} url={ctx.other_avatar} size="xl" />
                <span>{ctx.other_name}</span>
                <small className="test-video-note">{closed ? 'La salle est fermée.' : 'Mode test : la vidéo Daily.co n’est pas encore branchée. Le minuteur, les messages et les documents fonctionnent.'}</small>
              </div>
            )}
            {warn ? <div className="v3-warn"><Icon name="clock" /> Il reste 5 minutes. La salle se fermera à {time(ctx.closes_at)}.</div> : null}
          </div>
          <div className="v3-controls">
            <button type="button" className="audio" onClick={() => setTip('Connexion faible : coupez votre caméra avec le bouton caméra de la vidéo. L’appel continue en audio, sans raccrocher.')}><Icon name="phone" /><span>Passer en audio</span></button>
            <button type="button" onClick={() => document.getElementById('chat-input')?.focus()}><Icon name="message-circle" /><span>Chat</span></button>
            <button type="button" onClick={() => fileInput.current?.click()} disabled={!canWrite || uploading}><Icon name={uploading ? 'loader' : 'paperclip'} className={uploading ? 'spin' : undefined} /><span>Documents</span></button>
            <button type="button" onClick={fullscreen}><Icon name="square" /><span>Plein écran</span></button>
            <button type="button" onClick={() => router.refresh()}><Icon name="refresh-cw" /><span>Actualiser</span></button>
            <Link className="leave" href={leaveHref}><Icon name="log-out" /><span>Quitter</span></Link>
          </div>
          {tip ? <p className="notice"><Icon name="info" /> {tip}</p> : null}
          {chat}
        </section>
        {aside}
      </div>
    </>
  )
}

'use client'
import { useRouter } from 'next/navigation'
import { useRef, useState, type ChangeEvent } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { Icon } from '@/components/ui/icon'
import { avatarSignatureAction, saveAvatarAction } from '@/app/actions/profil'

/** Photo de profil : envoi direct et signé vers Cloudinary, puis enregistrement de l'adresse. */
export function AvatarUpload({ name, url, enabled }: { name: string; url: string | null; enabled: boolean }) {
  const router = useRouter()
  const input = useRef<HTMLInputElement | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function pick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return setMsg({ ok: false, text: 'Choisissez une image JPG, PNG ou WEBP.' })
    if (file.size > 5 * 1024 * 1024) return setMsg({ ok: false, text: 'Image trop lourde (5 Mo maximum).' })
    setBusy(true); setMsg(null)
    try {
      const sig = await avatarSignatureAction()
      if (!('ok' in sig) || !sig.ok) throw new Error(sig.error)
      const { cloudName, apiKey, signature, ...params } = sig.params
      const body = new FormData()
      body.append('file', file)
      body.append('api_key', apiKey)
      body.append('signature', signature)
      for (const [k, v] of Object.entries(params)) body.append(k, String(v))
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body })
      const json = (await res.json()) as { secure_url?: string; error?: { message: string } }
      if (!res.ok || !json.secure_url) throw new Error(json.error?.message ?? 'Envoi refusé')
      const saved = await saveAvatarAction(json.secure_url)
      if (saved.error) throw new Error(saved.error)
      setMsg({ ok: true, text: 'Photo mise à jour.' })
      router.refresh()
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Envoi impossible.' })
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    setBusy(true)
    const r = await saveAvatarAction(null)
    setBusy(false)
    setMsg({ ok: !r.error, text: r.error ?? 'Photo retirée.' })
    router.refresh()
  }

  return (
    <div className="avatar-upload">
      <Avatar name={name} url={url} size="xl" />
      <div className="stack-sm">
        <strong>Photo de profil</strong>
        <span className="meta">{enabled ? 'Facultative. JPG, PNG ou WEBP, 5 Mo maximum.' : 'L’envoi de photos sera activé une fois Cloudinary branché.'}</span>
        <div className="actions">
          <button className="btn btn-secondary btn-sm" type="button" onClick={() => input.current?.click()} disabled={!enabled || busy}>
            <Icon name={busy ? 'loader' : 'camera'} className={busy ? 'spin' : undefined} /> {url ? 'Changer' : 'Ajouter une photo'}
          </button>
          {url ? <button className="btn btn-ghost btn-sm" type="button" onClick={remove} disabled={busy}><Icon name="trash" /> Retirer</button> : null}
        </div>
        {msg ? <p className={`notice ${msg.ok ? 'success' : 'danger'}`} role="status">{msg.text}</p> : null}
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={pick} />
    </div>
  )
}

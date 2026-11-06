'use client'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useRef, useState, useTransition, type ChangeEvent } from 'react'
import { Icon } from '@/components/ui/icon'
import { FormMessage, SubmitButton } from '@/components/ui/form'
import { endConsultationAction, issuePrescriptionAction, saveNoteAction } from '@/app/medecin/actions'
import { time } from '@/lib/format'
import type { ActionState, AppointmentStatus, PrescriptionItem } from '@/lib/types'

/** Panneau du médecin pendant la consultation : notes privées, ordonnance, fin de consultation. */
export function ConsultPanel({ appointmentId, status, closesAt, initialNote, prescription, canPrescribe }: {
  appointmentId: string
  status: AppointmentStatus
  closesAt: string
  initialNote: string
  prescription: { code: string; items: PrescriptionItem[]; instructions: string | null } | null
  canPrescribe: boolean
}) {
  const router = useRouter()
  const [note, setNote] = useState(initialNote)
  const [noteState, setNoteState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const saved = useRef(initialNote)
  const [items, setItems] = useState<PrescriptionItem[]>(prescription?.items.length ? prescription.items : [{ name: '', dosage: '', duration: '' }])
  const [rxState, rxAction] = useActionState<ActionState, FormData>(issuePrescriptionAction, {})
  const [endState, setEndState] = useState<ActionState>({})
  const [ending, startEnding] = useTransition()
  const [confirmEnd, setConfirmEnd] = useState(false)

  // Enregistrement automatique des notes (2 s après la dernière frappe).
  useEffect(() => {
    if (note === saved.current) return
    const t = setTimeout(async () => {
      setNoteState('saving')
      const r = await saveNoteAction(appointmentId, note)
      if (r.error) setNoteState('error')
      else { saved.current = note; setNoteState('saved') }
    }, 2000)
    return () => clearTimeout(t)
  }, [note, appointmentId])

  const update = (i: number, key: keyof PrescriptionItem, value: string) =>
    setItems((list) => list.map((it, j) => (j === i ? { ...it, [key]: value } : it)))

  function end() {
    startEnding(async () => {
      const r = await endConsultationAction(appointmentId)
      setEndState(r)
      setConfirmEnd(false)
      router.refresh()
    })
  }

  return (
    <aside className="stack">
      <section className="panel stack">
        <h2><Icon name="notebook-pen" /> Notes privées</h2>
        <textarea className="form-input" rows={5} maxLength={5000} value={note}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNote(e.target.value)}
                  placeholder="Symptômes, antécédents, conduite à tenir…" />
        <p className="meta">
          {noteState === 'saving' ? 'Enregistrement…' : noteState === 'saved' ? 'Enregistré.' : noteState === 'error' ? 'Non enregistré, vérifiez votre connexion.' : 'Visibles par vous seul. Enregistrement automatique.'}
          {' '}Supprimées 30 jours après la consultation.
        </p>
      </section>

      <section className="panel stack">
        <h2><Icon name="stamp" /> Ordonnance {prescription ? <small className="meta">n° {prescription.code}</small> : null}</h2>
        {canPrescribe ? (
          <form action={rxAction} className="stack">
            <input type="hidden" name="appointment_id" value={appointmentId} />
            {items.map((it, i) => (
              <div className="rx-editor-row" key={i}>
                <input className="form-input" name="name" value={it.name} onChange={(e: ChangeEvent<HTMLInputElement>) => update(i, 'name', e.target.value)} placeholder="Médicament et dosage (ex. Paracétamol 500 mg)" maxLength={120} required={i === 0} aria-label={`Médicament ${i + 1}`} />
                <input className="form-input" name="dosage" value={it.dosage ?? ''} onChange={(e: ChangeEvent<HTMLInputElement>) => update(i, 'dosage', e.target.value)} placeholder="Posologie (ex. 1 comprimé 3 fois par jour)" maxLength={200} aria-label={`Posologie ${i + 1}`} />
                <input className="form-input" name="duration" value={it.duration ?? ''} onChange={(e: ChangeEvent<HTMLInputElement>) => update(i, 'duration', e.target.value)} placeholder="Durée (ex. 5 jours)" maxLength={80} aria-label={`Durée ${i + 1}`} />
                {items.length > 1 ? (
                  <button className="btn btn-ghost btn-icon btn-sm" type="button" onClick={() => setItems((l) => l.filter((_, j) => j !== i))} aria-label={`Retirer la ligne ${i + 1}`}><Icon name="trash" /></button>
                ) : null}
              </div>
            ))}
            {items.length < 20 ? (
              <button className="btn btn-secondary" type="button" onClick={() => setItems((l) => [...l, { name: '', dosage: '', duration: '' }])}><Icon name="plus" /> Ajouter un médicament</button>
            ) : null}
            <div className="field"><label htmlFor="rx-instructions">Recommandations <small>(facultatif)</small></label>
              <textarea className="form-input" id="rx-instructions" name="instructions" rows={2} maxLength={1500} defaultValue={prescription?.instructions ?? ''} /></div>
            <FormMessage state={rxState} />
            <SubmitButton icon="send">{prescription ? 'Mettre à jour l’ordonnance' : 'Émettre l’ordonnance'}</SubmitButton>
            <p className="meta">Le patient la reçoit immédiatement, avec un QR code de vérification. Possible pendant la consultation et jusqu’à 24 h après.</p>
          </form>
        ) : (
          <p className="meta">{prescription ? 'Ordonnance émise.' : 'L’ordonnance s’émet une fois la consultation démarrée (les deux participants connectés).'}</p>
        )}
      </section>

      {status === 'en_cours' ? (
        confirmEnd ? (
          <div className="panel stack">
            <p><strong>Terminer la consultation ?</strong> Le patient sera prévenu et votre part sera ajoutée à vos revenus.</p>
            <div className="actions">
              <button className="btn btn-danger" type="button" onClick={end} disabled={ending}><Icon name={ending ? 'loader' : 'square'} className={ending ? 'spin' : undefined} /> Oui, terminer</button>
              <button className="btn btn-ghost" type="button" onClick={() => setConfirmEnd(false)}>Continuer</button>
            </div>
          </div>
        ) : (
          <button className="btn btn-danger btn-block" type="button" onClick={() => setConfirmEnd(true)}><Icon name="square" /> Terminer la consultation</button>
        )
      ) : null}
      <FormMessage state={endState} />
      {status === 'en_cours' || status === 'confirme' ? (
        <p className="meta">Seul le médecin peut terminer. Si personne ne termine, la salle se ferme à {time(closesAt)}.</p>
      ) : null}
    </aside>
  )
}

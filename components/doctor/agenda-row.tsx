import Link from 'next/link'
import { Avatar } from '@/components/ui/avatar'
import { Icon } from '@/components/ui/icon'
import { AppointmentBadge, Badge } from '@/components/ui/status'
import { time } from '@/lib/format'
import type { AgendaItem } from '@/lib/types'

/** Une ligne d'agenda : heure, patient (sans coordonnées), motif, état du paiement, actions. */
export function AgendaRow({ a, open, actions }: { a: AgendaItem; open: boolean; actions?: React.ReactNode }) {
  const detail = [a.patient_age ? `${a.patient_age} ans` : null, a.patient_sex === 'F' ? 'Femme' : a.patient_sex === 'M' ? 'Homme' : null, a.patient_commune].filter(Boolean).join(' · ')
  const waitingBalance = (a.status === 'confirme' || a.status === 'en_cours') && !a.balance_paid
  return (
    <article className="agenda-row">
      <div className="agenda-time"><strong>{time(a.starts_at)}</strong><span>{time(a.ends_at)}</span></div>
      <div className="person">
        <Avatar name={a.patient_name} url={a.patient_avatar} />
        <div>
          <strong>{a.patient_name}</strong>
          <span className="meta">{detail || 'Patient'}</span>
          {a.reason ? <span className="agenda-reason"><Icon name="clipboard-list" /> {a.reason}</span> : null}
        </div>
      </div>
      <div className="agenda-state">
        {waitingBalance ? <Badge tone="pending">Solde non payé</Badge> : <AppointmentBadge status={a.status} />}
        {a.has_prescription ? <Badge tone="completed">Ordonnance émise</Badge> : null}
      </div>
      <div className="actions">
        {open || a.status === 'terminee' ? (
          <Link className={`btn ${open ? 'btn-primary' : 'btn-secondary'} btn-sm`} href={`/medecin/consultation/${a.id}`}>
            <Icon name={open ? 'video' : 'file-text'} /> {open ? 'Ouvrir la salle' : 'Dossier'}
          </Link>
        ) : null}
        {actions}
      </div>
    </article>
  )
}

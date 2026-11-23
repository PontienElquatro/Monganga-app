import Link from 'next/link'
import type { Metadata } from 'next'
import { Icon } from '@/components/ui/icon'
import { Badge } from '@/components/ui/status'
import { RdvCard } from '@/components/patient/rdv-card'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getPatientAppointments, getTiming } from '@/lib/patient'
import { isUpcoming, patientStep } from '@/lib/appointments'
import { unreadCount } from '@/lib/notifications'
import { dateShort, time } from '@/lib/format'

export const metadata: Metadata = { title: 'Mon espace' }

export default async function PatientDashboard() {
  const session = await requireRole('patient')
  const supabase = await createClient()
  const [appointments, timing, unread, rx] = await Promise.all([
    getPatientAppointments(),
    getTiming(),
    unreadCount(),
    supabase.from('prescriptions').select('id', { count: 'exact', head: true }).gt('expires_at', new Date().toISOString()),
  ])
  const now = Date.now()
  const upcoming = appointments.filter((a) => isUpcoming(a, now)).sort((a, b) => a.starts_at.localeCompare(b.starts_at))
  const done = appointments.filter((a) => a.status === 'terminee').length
  const next = upcoming[0]
  const step = next ? patientStep(next, timing, now) : null

  const kpis = [
    { icon: 'calendar-check' as const, label: 'Prochains RDV', value: upcoming.length, note: next ? `${dateShort(next.starts_at)} à ${time(next.starts_at)}` : 'Aucun prévu' },
    { icon: 'file-text' as const, label: 'Ordonnances', value: rx.count ?? 0, note: 'Disponibles 30 jours' },
    { icon: 'stethoscope' as const, label: 'Consultations', value: done, note: 'Terminées' },
    { icon: 'bell' as const, label: 'Notifications', value: unread, note: unread ? 'Non lues' : 'Tout est lu' },
  ]

  return (
    <>
      <div className="fade-in" style={{ marginBottom: 32 }}>
        <h1 className="pat-page-title">Bonjour {session.profile.first_name || 'et bienvenue'} 👋</h1>
        <p className="pat-page-sub">Que puis-je faire pour vous aujourd’hui ?</p>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 32 }}>
        {kpis.map((k) => (
          <div className="kpi-card" key={k.label}>
            <div className="kpi-label"><Icon name={k.icon} /> {k.label}</div>
            <div className="kpi-value">{k.value}</div>
            <span className="kpi-trend up">{k.note}</span>
          </div>
        ))}
      </div>

      <div className="card card-block mb-6 slide-up">
        <div className="card-header-row">
          <div>
            <div className="card-title">Prochain rendez-vous</div>
            <div className="card-subtitle">{next ? `${dateShort(next.starts_at)} · ${time(next.starts_at)} – ${time(next.ends_at)}` : 'Aucun rendez-vous prévu'}</div>
          </div>
          {step?.badge ? <Badge tone={step.badge.tone}>{step.badge.label}</Badge> : null}
        </div>
        {next && step ? (
          <>
            <RdvCard a={next} extra={step.href ? (
              <Link className="btn btn-primary" href={step.href}><Icon name={step.icon} /> {step.label}</Link>
            ) : null} />
            {step.hint ? <p className="v3-hint"><Icon name="info" /> {step.hint}</p> : null}
          </>
        ) : (
          <div className="empty-state">
            <Icon name="calendar" />
            <h2>Rien de prévu pour l’instant</h2>
            <p>Trouvez un médecin et réservez une consultation en visio avec un acompte de 1 $.</p>
            <Link className="btn btn-primary" href="/patient/recherche"><Icon name="search" /> Trouver un médecin</Link>
          </div>
        )}
      </div>

      <div className="card card-block slide-up">
        <div className="card-header-row"><div className="card-title">Actions rapides</div></div>
        <div className="grid-3">
          <Link className="btn btn-secondary quick-action" href="/patient/recherche"><Icon name="search" /> Trouver un médecin</Link>
          <Link className="btn btn-secondary quick-action" href="/patient/rendez-vous"><Icon name="calendar" /> Voir mes RDV</Link>
          <Link className="btn btn-secondary quick-action" href="/patient/ordonnances"><Icon name="file-text" /> Mes ordonnances</Link>
        </div>
      </div>
    </>
  )
}

import Link from 'next/link'
import type { Metadata } from 'next'
import { Icon } from '@/components/ui/icon'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeading } from '@/components/ui/page-heading'
import { AgendaRow } from '@/components/doctor/agenda-row'
import { requireRole } from '@/lib/auth'
import { getAgenda, getEarnings, nextSaturday, roomOpen } from '@/lib/doctor'
import { getSettings } from '@/lib/settings'
import { createClient } from '@/lib/supabase/server'
import { dateLong, dayKey, kinMonthStart, todayKinshasa, usd } from '@/lib/format'

export const metadata: Metadata = { title: 'Tableau de bord' }

export default async function MedecinDashboard() {
  const session = await requireRole('medecin')
  const supabase = await createClient()
  const today = todayKinshasa()
  const [week, earnings, settings, freeSlots] = await Promise.all([
    getAgenda(today, todayKinshasa(7)),
    getEarnings(),
    getSettings(),
    supabase.from('availability_slots').select('id', { count: 'exact', head: true }).eq('doctor_id', session.userId).eq('status', 'libre').gt('starts_at', new Date().toISOString()),
  ])
  const active = week.filter((a) => ['confirme', 'en_cours', 'terminee', 'absence_patient'].includes(a.status))
  const todayList = active.filter((a) => dayKey(a.starts_at) === today)
  const month = kinMonthStart()
  const monthCents = earnings.ledger.filter((l) => dayKey(l.created_at) >= month).reduce((s, l) => s + l.amount_cents, 0)
  const pendingCents = earnings.ledger.filter((l) => !l.payout_id).reduce((s, l) => s + l.amount_cents, 0)
    + earnings.payouts.filter((p) => p.status === 'a_verser').reduce((s, p) => s + p.amount_cents, 0)
  const now = Date.now()

  const kpis = [
    { icon: 'calendar-check' as const, label: 'Aujourd’hui', value: String(todayList.filter((a) => a.status !== 'absence_patient').length), note: 'consultations prévues' },
    { icon: 'calendar-days' as const, label: '7 prochains jours', value: String(active.filter((a) => a.status === 'confirme').length), note: 'rendez-vous confirmés' },
    { icon: 'wallet' as const, label: 'Ma part ce mois', value: usd(monthCents), note: 'consultations et acomptes' },
    { icon: 'hand-coins' as const, label: 'Prochain versement', value: usd(pendingCents), note: `samedi ${dateLong(`${nextSaturday()}T12:00:00+01:00`).split(' ').slice(1, 3).join(' ')}` },
  ]

  return (
    <>
      <PageHeading space="Espace médecin" title={`Bonjour ${session.doctor?.title ?? 'Dr'} ${session.profile.last_name}`}
                   description="Vos consultations du jour, vos créneaux et vos revenus."
                   actions={<Link className="btn btn-primary" href="/medecin/disponibilites"><Icon name="plus" /> Ouvrir des créneaux</Link>} />
      <div className="kpi-grid" style={{ marginBottom: 28 }}>
        {kpis.map((k) => (
          <div className="kpi-card" key={k.label}>
            <div className="kpi-label"><Icon name={k.icon} /> {k.label}</div>
            <div className="kpi-value">{k.value}</div>
            <span className="kpi-trend up">{k.note}</span>
          </div>
        ))}
      </div>
      {!freeSlots.count ? (
        <p className="notice warning"><Icon name="calendar-clock" /> Vous n’avez aucun créneau libre à venir : les patients ne peuvent pas vous réserver. <Link href="/medecin/disponibilites">Ouvrir des créneaux</Link></p>
      ) : null}
      <section className="panel stack">
        <div className="card-header-row">
          <div><div className="card-title">Aujourd’hui</div><div className="card-subtitle">{dateLong(new Date().toISOString())} · heure de Kinshasa</div></div>
          <Link className="btn btn-ghost btn-sm" href="/medecin/agenda">Tout l’agenda <Icon name="chevron-right" /></Link>
        </div>
        {todayList.length ? todayList.map((a) => <AgendaRow key={a.id} a={a} open={roomOpen(a, settings.fermeture_salle_minutes, now)} />) : (
          <EmptyState icon="calendar" title="Aucune consultation aujourd’hui" text="Les rendez-vous confirmés (acompte payé) apparaissent ici." />
        )}
      </section>
    </>
  )
}

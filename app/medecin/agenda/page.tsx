import Link from 'next/link'
import type { Metadata } from 'next'
import { Icon } from '@/components/ui/icon'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeading } from '@/components/ui/page-heading'
import { AgendaRow } from '@/components/doctor/agenda-row'
import { DoctorCancelForm } from '@/components/doctor/doctor-cancel-form'
import { getAgenda, roomOpen } from '@/lib/doctor'
import { getSettings } from '@/lib/settings'
import { dateLong, dayKey, todayKinshasa } from '@/lib/format'
import type { AgendaItem } from '@/lib/types'

export const metadata: Metadata = { title: 'Agenda' }

export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ vue?: string }> }) {
  const { vue } = await searchParams
  const past = vue === 'passe'
  const [items, settings] = await Promise.all([
    past ? getAgenda(todayKinshasa(-30), todayKinshasa(1)) : getAgenda(todayKinshasa(), todayKinshasa(61)),
    getSettings(),
  ])
  const now = Date.now()
  const list = past
    ? items.filter((a) => new Date(a.starts_at).getTime() < now).reverse()
    : items.filter((a) => new Date(a.ends_at).getTime() + settings.fermeture_salle_minutes * 60_000 >= now)
  const days = new Map<string, AgendaItem[]>()
  for (const a of list) days.set(dayKey(a.starts_at), [...(days.get(dayKey(a.starts_at)) ?? []), a])

  return (
    <>
      <PageHeading space="Espace médecin" title="Agenda" description="Rendez-vous confirmés après paiement de l’acompte. Heure de Kinshasa."
                   actions={<Link className="btn btn-secondary" href="/medecin/disponibilites"><Icon name="calendar-clock" /> Mes créneaux</Link>} />
      <nav className="v3-tabs" aria-label="Période">
        <Link className={!past ? 'active' : ''} href="/medecin/agenda">À venir</Link>
        <Link className={past ? 'active' : ''} href="/medecin/agenda?vue=passe">30 derniers jours</Link>
      </nav>
      {days.size ? [...days.entries()].map(([day, rows]) => (
        <section key={day}>
          <h2 className="agenda-day">{dateLong(rows[0].starts_at)}</h2>
          {rows.map((a) => (
            <AgendaRow key={a.id} a={a} open={roomOpen(a, settings.fermeture_salle_minutes, now)}
                       actions={(a.status === 'confirme' || a.status === 'en_attente_acompte') && new Date(a.ends_at).getTime() > now ? <DoctorCancelForm appointmentId={a.id} /> : null} />
          ))}
        </section>
      )) : (
        <EmptyState icon="calendar" title={past ? 'Aucune consultation ces 30 derniers jours' : 'Aucun rendez-vous à venir'}
                    text={past ? undefined : 'Ouvrez des créneaux pour que les patients puissent vous réserver.'}
                    action={past ? null : <Link className="btn btn-primary" href="/medecin/disponibilites"><Icon name="plus" /> Ouvrir des créneaux</Link>} />
      )}
    </>
  )
}

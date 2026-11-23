import type { Metadata } from 'next'
import { Icon } from '@/components/ui/icon'
import { Badge } from '@/components/ui/status'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeading } from '@/components/ui/page-heading'
import { SlotsForm } from '@/components/doctor/slots-form'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { deleteSlotAction } from '@/app/medecin/actions'
import { dateLong, dayKey, time, todayKinshasa } from '@/lib/format'
import type { Slot } from '@/lib/types'

export const metadata: Metadata = { title: 'Disponibilités' }

const LABEL: Record<Slot['status'], { label: string; tone: string }> = {
  libre: { label: 'Libre', tone: 'active' },
  reserve: { label: 'Réservé', tone: 'confirmed' },
  bloque: { label: 'Bloqué', tone: 'neutral' },
}

export default async function DisponibilitesPage() {
  const session = await requireRole('medecin')
  const supabase = await createClient()
  const { data } = await supabase.from('availability_slots').select('id, doctor_id, starts_at, ends_at, status')
    .eq('doctor_id', session.userId).gt('starts_at', new Date().toISOString()).order('starts_at').limit(600)
  const slots = (data ?? []) as Slot[]
  const days = new Map<string, Slot[]>()
  for (const s of slots) days.set(dayKey(s.starts_at), [...(days.get(dayKey(s.starts_at)) ?? []), s])

  return (
    <>
      <PageHeading space="Espace médecin" title="Disponibilités" description="Ouvrez vos créneaux de consultation (30 minutes, heure de Kinshasa), jusqu’à 60 jours à l’avance." />
      <div className="layout-two">
        <section className="panel stack">
          <h2>Ouvrir des créneaux</h2>
          <SlotsForm minDate={todayKinshasa()} maxDate={todayKinshasa(60)} />
        </section>
        <section className="panel stack">
          <h2>Créneaux à venir <small className="meta">({slots.filter((s) => s.status === 'libre').length} libres)</small></h2>
          {days.size ? [...days.entries()].map(([day, list]) => (
            <div key={day} className="stack-sm">
              <h3 className="agenda-day">{dateLong(list[0].starts_at)}</h3>
              <ul className="slot-list">
                {list.map((s) => (
                  <li key={s.id} className="slot-pill">
                    <span>{time(s.starts_at)}</span>
                    <Badge tone={LABEL[s.status].tone}>{LABEL[s.status].label}</Badge>
                    {s.status === 'libre' ? (
                      <form action={deleteSlotAction}>
                        <input type="hidden" name="slot_id" value={s.id} />
                        <button className="btn btn-ghost btn-icon btn-sm" type="submit" aria-label={`Supprimer le créneau de ${time(s.starts_at)}`}><Icon name="trash" /></button>
                      </form>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          )) : <EmptyState icon="calendar-clock" title="Aucun créneau ouvert" text="Les patients ne voient que vos créneaux libres. Ouvrez-en pour être réservable." />}
        </section>
      </div>
    </>
  )
}

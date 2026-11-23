import { Avatar } from '@/components/ui/avatar'
import { Icon } from '@/components/ui/icon'
import { dateLong, time } from '@/lib/format'
import type { PatientAppointment } from '@/lib/types'

/** Résumé d'un rendez-vous : médecin, spécialité, date et heure (Kinshasa). */
export function RdvCard({ a, extra }: { a: PatientAppointment; extra?: React.ReactNode }) {
  return (
    <div className="v3-rdv">
      <Avatar name={a.doctor_name} url={a.doctor_avatar} size="lg" />
      <div>
        <strong>{a.doctor_name}</strong>
        <span>{a.doctor_specialty} · Visio 30 min</span>
        <span className="v3-rdv-when"><Icon name="calendar-days" /> {dateLong(a.starts_at)} · {time(a.starts_at)} – {time(a.ends_at)}</span>
      </div>
      {extra}
    </div>
  )
}

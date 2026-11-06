import Link from 'next/link'
import { Avatar } from '@/components/ui/avatar'
import { Icon } from '@/components/ui/icon'
import { dateTime, doctorName, usd } from '@/lib/format'
import type { PublicDoctor } from '@/lib/types'

export function DoctorCard({ doctor, href }: { doctor: PublicDoctor; href: string }) {
  const name = doctorName(doctor)
  return (
    <article className="doctor-card">
      <div className="person">
        <Avatar name={name} url={doctor.avatar_url} size="lg" />
        <div>
          <h3>{name}</h3>
          <p className="meta">{doctor.specialty}</p>
        </div>
      </div>
      <div className="detail-lines">
        {doctor.commune ? <span><Icon name="map-pin" /> {doctor.commune}</span> : null}
        <span><Icon name="languages" /> {doctor.languages.join(', ')}</span>
        <span><Icon name="calendar-clock" /> {doctor.next_slot_at ? `Prochain créneau : ${dateTime(doctor.next_slot_at)}` : 'Aucun créneau ouvert pour le moment'}</span>
      </div>
      <div className="card-footer">
        <div className="price">{usd(doctor.fee_cents)}<small>tarif du médecin · 30 min</small></div>
        <Link className="btn btn-primary" href={href}>Voir les créneaux</Link>
      </div>
    </article>
  )
}

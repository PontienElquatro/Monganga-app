import { Avatar } from '@/components/ui/avatar'
import { Icon } from '@/components/ui/icon'
import { doctorName, usd } from '@/lib/format'
import type { PublicDoctor } from '@/lib/types'

/** En-tête du profil public d'un médecin (sans coordonnées personnelles, sans note). */
export function DoctorProfile({ doctor, depositCents }: { doctor: PublicDoctor; depositCents: number }) {
  const name = doctorName(doctor)
  return (
    <section className="panel stack">
      <div className="person">
        <Avatar name={name} url={doctor.avatar_url} size="xl" />
        <div>
          <p className="eyebrow">Médecin vérifié <Icon name="badge-check" size={12} /></p>
          <h1 style={{ fontSize: 26, letterSpacing: '-.6px' }}>{name}</h1>
          <p className="meta">{doctor.specialty}</p>
        </div>
      </div>
      {doctor.bio ? <p className="muted" style={{ whiteSpace: 'pre-line' }}>{doctor.bio}</p> : null}
      <div className="detail-lines">
        {doctor.commune ? <span><Icon name="map-pin" /> {doctor.commune}</span> : null}
        <span><Icon name="languages" /> {doctor.languages.join(', ')}</span>
        {doctor.years_experience != null ? <span><Icon name="briefcase" /> {doctor.years_experience} ans d’expérience</span> : null}
        <span><Icon name="video" /> Consultation en visio de 30 minutes</span>
      </div>
      <div className="fee-box">
        <div><span>Tarif fixé par le médecin</span><strong>{usd(doctor.fee_cents)}</strong><small>Consultation vidéo de 30 min</small></div>
        <div className="fee-split">
          <span><b>{usd(depositCents)}</b> à la réservation</span>
          <span><b>{usd(doctor.fee_cents - depositCents)}</b> le jour de la visio</span>
        </div>
      </div>
    </section>
  )
}

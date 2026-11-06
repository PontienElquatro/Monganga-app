import Link from 'next/link'
import type { Metadata } from 'next'
import { Icon } from '@/components/ui/icon'
import { PageHeading } from '@/components/ui/page-heading'
import { AvatarUpload } from '@/components/profile/avatar-upload'
import { ProfileForm } from '@/components/profile/profile-form'
import { DoctorProForm } from '@/components/doctor/doctor-pro-form'
import { requireRole } from '@/lib/auth'
import { modes } from '@/lib/config'
import { getSettings } from '@/lib/settings'
import { doctorName, fullName } from '@/lib/format'

export const metadata: Metadata = { title: 'Mon profil' }

export default async function MedecinProfilPage() {
  const session = await requireRole('medecin')
  const settings = await getSettings()
  const doctor = session.doctor!
  return (
    <>
      <PageHeading space="Espace médecin" title="Mon profil" description="Ce que voient les patients, votre tarif et votre compte de versement."
                   actions={<Link className="btn btn-secondary" href={`/medecins/${session.userId}`}><Icon name="eye" /> Voir ma fiche publique</Link>} />
      <div className="layout-two">
        <section className="panel stack">
          <AvatarUpload name={doctorName({ title: doctor.title, ...session.profile })} url={session.profile.avatar_url} enabled={modes.photosEnabled()} />
          <p className="meta">Spécialité : <strong>{doctor.specialty}</strong>. Pour la modifier, écrivez à l’équipe MONGANGA (elle est vérifiée avec vos diplômes).</p>
          <ProfileForm profile={session.profile} showHealthFields={false} />
          <p className="meta">Votre e-mail et votre téléphone ne sont jamais montrés aux patients.</p>
        </section>
        <section className="panel">
          <DoctorProForm doctor={doctor} feeMin={settings.tarif_min_centimes} feeMax={settings.tarif_max_centimes} />
        </section>
      </div>
      <p className="meta mt-4">Connecté en tant que {fullName(session.profile)} · {session.email}</p>
    </>
  )
}

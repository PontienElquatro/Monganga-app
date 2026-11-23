import type { Metadata } from 'next'
import { Icon } from '@/components/ui/icon'
import { EMAILS, mailto } from '@/lib/contact'
import { PageHeading } from '@/components/ui/page-heading'
import { AvatarUpload } from '@/components/profile/avatar-upload'
import { ProfileForm } from '@/components/profile/profile-form'
import { PasswordForm } from '@/components/profile/password-form'
import { requireRole } from '@/lib/auth'
import { modes } from '@/lib/config'
import { fullName } from '@/lib/format'

export const metadata: Metadata = { title: 'Mon profil' }

export default async function PatientProfilPage() {
  const session = await requireRole('patient')
  return (
    <>
      <PageHeading title="Mon profil" description="Vos informations personnelles et la sécurité de votre compte." />
      <div className="layout-two">
        <section className="panel stack">
          <AvatarUpload name={fullName(session.profile)} url={session.profile.avatar_url} enabled={modes.photosEnabled()} />
          <ProfileForm profile={session.profile} />
        </section>
        <aside className="panel stack">
          <h2>Sécurité</h2>
          <PasswordForm />
          <h2 className="v3-subtitle">Vos données</h2>
          <p className="meta">Vos ordonnances, messages et documents de consultation sont supprimés 30 jours après chaque consultation. Pour fermer votre compte, écrivez à <a className="auth-link" href={mailto('support', 'Fermeture de mon compte')}>{EMAILS.support}</a>.</p>
          <form action="/auth/deconnexion" method="post"><button className="btn btn-ghost" type="submit"><Icon name="log-out" /> Se déconnecter</button></form>
        </aside>
      </div>
    </>
  )
}

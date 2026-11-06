import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Icon } from '@/components/ui/icon'
import { DoctorApplicationForm } from '@/components/auth/doctor-application-form'
import { dateLong } from '@/lib/format'
import type { DocumentKind } from '@/lib/types'

export const metadata: Metadata = { title: 'Mon dossier médecin' }

export default async function DossierPage() {
  const session = await getSession()
  if (!session) redirect('/connexion?suite=/dossier')
  if (session.profile.role !== 'medecin') redirect('/espace')
  const doctor = session.doctor
  if (doctor?.status === 'valide') redirect('/medecin')

  const supabase = await createClient()
  const { data: docs } = await supabase.from('doctor_documents').select('kind').eq('doctor_id', session.userId)
  const kinds = [...new Set((docs ?? []).map((d) => d.kind as DocumentKind))]
  const defaults = doctor ? {
    specialty: doctor.specialty, bio: doctor.bio, fee: String(doctor.fee_cents / 100), languages: doctor.languages,
    years: doctor.years_experience != null ? String(doctor.years_experience) : '', commune: doctor.commune ?? '',
    payout_method: doctor.payout_method, payout_account: doctor.payout_account, payout_holder: doctor.payout_holder ?? '',
  } : undefined

  const logout = (
    <form action="/auth/deconnexion" method="post"><button className="btn btn-secondary btn-block" type="submit"><Icon name="log-out" /> Se déconnecter</button></form>
  )

  if (!doctor || doctor.status === 'refuse' || doctor.status === 'complement_demande') {
    const refused = doctor?.status === 'refuse'
    return (
      <div className="wide-auth form-stack">
        <div className="v3-center">
          <div className={`v3-icon-circle ${refused ? 'danger' : 'warn'}`}><Icon name={refused ? 'circle-x' : 'file-up'} /></div>
          <h1 className="auth-title">{!doctor ? 'Complétez votre dossier' : refused ? 'Votre dossier n’a pas été validé' : 'Un complément est demandé'}</h1>
          {doctor?.admin_message ? (
            <div className={refused ? 'v3-reason' : 'notice warning'} style={{ textAlign: 'left' }}>
              {refused ? <span><Icon name="circle-alert" /> Motif du refus</span> : null}
              <p>{doctor.admin_message}</p>
              {doctor.decided_at ? <small>Décision du {dateLong(doctor.decided_at)}</small> : null}
            </div>
          ) : null}
          <p className="auth-subtitle">Vos informations sont déjà remplies : corrigez ce qui pose problème, ajoutez les pièces demandées, puis soumettez à nouveau.</p>
        </div>
        <DoctorApplicationForm mode="correction" userId={session.userId} defaults={defaults} existingKinds={kinds} />
        {logout}
      </div>
    )
  }

  if (doctor.status === 'suspendu') {
    return (
      <div className="v3-center">
        <div className="v3-icon-circle danger"><Icon name="ban" /></div>
        <h1 className="auth-title">Compte médecin suspendu</h1>
        <p className="auth-subtitle">Votre accès est suspendu. Contactez l’équipe MONGANGA : contact@monganga.cd.</p>
        {logout}
      </div>
    )
  }

  const missing = (['photo', 'identite', 'diplome', 'ordre', 'cv'] as DocumentKind[]).filter((k) => !kinds.includes(k))
  return (
    <div className="v3-center">
      <div className="v3-icon-circle warn"><Icon name="hourglass" /></div>
      <h1 className="auth-title">Votre dossier est en cours de validation</h1>
      <p className="auth-subtitle">Merci, {session.profile.first_name}. Votre espace médecin s’ouvrira dès que l’équipe MONGANGA aura vérifié vos justificatifs.</p>
      <ol className="v3-steps">
        <li className="v3-step done"><span className="v3-step-dot"><Icon name="check" /></span><div><strong>Dossier envoyé</strong><p>Le {dateLong(doctor.submitted_at)} · {kinds.length} pièce{kinds.length > 1 ? 's' : ''} reçue{kinds.length > 1 ? 's' : ''}</p></div></li>
        <li className="v3-step current"><span className="v3-step-dot"><Icon name="loader" /></span><div><strong>Vérification par l’équipe</strong><p>Identité, diplômes et inscription à l’Ordre</p></div></li>
        <li className="v3-step"><span className="v3-step-dot" /><div><strong>Accès à votre espace médecin</strong><p>Vous recevrez un e-mail dès la décision</p></div></li>
      </ol>
      {missing.length ? (
        <>
          <p className="notice warning">Il manque des pièces à votre dossier. Ajoutez-les pour que l’équipe puisse le valider.</p>
          <div style={{ textAlign: 'left' }}><DoctorApplicationForm mode="correction" userId={session.userId} defaults={defaults} existingKinds={kinds} /></div>
        </>
      ) : (
        <p className="notice"><Icon name="info" size={14} /> Délai habituel : 48 heures ouvrables. Si un document manque, nous vous dirons lequel.</p>
      )}
      {logout}
    </div>
  )
}

import Link from 'next/link'
import type { Metadata } from 'next'
import { Icon } from '@/components/ui/icon'
import { DoctorApplicationForm } from '@/components/auth/doctor-application-form'

export const metadata: Metadata = { title: 'Devenir médecin' }

export default function InscriptionMedecinPage() {
  return (
    <div className="wide-auth">
      <h1 className="auth-title">Créer un compte médecin</h1>
      <p className="auth-subtitle">Remplissez votre candidature : notre équipe vérifie votre dossier avant d’ouvrir votre espace.</p>
      <nav className="auth-tabs" aria-label="Type de compte">
        <Link href="/inscription"><Icon name="user" /> Patient</Link>
        <Link href="/inscription/medecin" aria-current="page"><Icon name="stethoscope" /> Médecin</Link>
      </nav>
      <div className="notice" style={{ marginBottom: 20 }}>
        <strong>Processus vérifié.</strong> Pièce d’identité, diplôme de médecine, attestation de l’Ordre des médecins et CV vous seront demandés. Durée estimée : 5 minutes.
      </div>
      <DoctorApplicationForm mode="inscription" />
      <p className="auth-footer">Déjà inscrit ? <Link className="auth-link" href="/connexion">Se connecter</Link></p>
    </div>
  )
}

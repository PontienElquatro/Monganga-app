import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { RegisterPatientForm } from './register-form'
import { Icon } from '@/components/ui/icon'

export const metadata: Metadata = { title: 'Créer un compte' }

export default async function InscriptionPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  if ((await searchParams).type === 'medecin') redirect('/inscription/medecin')
  return (
    <>
      <h1 className="auth-title">Créer un compte</h1>
      <p className="auth-subtitle">Choisissez votre type de compte pour commencer</p>
      <nav className="auth-tabs" aria-label="Type de compte">
        <Link href="/inscription" aria-current="page"><Icon name="user" /> Patient</Link>
        <Link href="/inscription/medecin"><Icon name="stethoscope" /> Médecin</Link>
      </nav>
      <RegisterPatientForm />
      <p className="auth-footer">Déjà inscrit ? <Link className="auth-link" href="/connexion">Se connecter</Link></p>
    </>
  )
}

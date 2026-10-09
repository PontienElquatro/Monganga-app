import { Suspense } from 'react'
import { signIn, signUp } from '../auth/actions'

async function Erreur({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  return error ? <p style={{ color: 'red' }}>{error}</p> : null
}

export default function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  return (
    <main style={{ padding: 20, display: 'grid', gap: 24, maxWidth: 360 }}>
      <Suspense>
        <Erreur searchParams={searchParams} />
      </Suspense>

      <form action={signUp} style={{ display: 'grid', gap: 8 }}>
        <h2>Inscription</h2>
        <input name="full_name" placeholder="Nom complet" />
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Mot de passe (6+ caractères)" required />
        <button>Créer le compte</button>
      </form>

      <form action={signIn} style={{ display: 'grid', gap: 8 }}>
        <h2>Connexion</h2>
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Mot de passe" required />
        <button>Se connecter</button>
      </form>
    </main>
  )
}
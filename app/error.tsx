'use client'
import { useEffect } from 'react'
import { Icon } from '@/components/ui/icon'

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div className="auth-wrapper">
      <div className="auth-card v3-center" role="main">
        <div className="v3-icon-circle danger"><Icon name="circle-alert" /></div>
        <h1 className="auth-title">Un problème est survenu</h1>
        <p className="auth-subtitle">Vérifiez votre connexion internet puis réessayez. Si le problème continue, écrivez à contact@monganga.cd{error.digest ? ` (code ${error.digest})` : ''}.</p>
        <button className="btn btn-primary btn-block" type="button" onClick={reset}><Icon name="refresh-cw" /> Réessayer</button>
      </div>
    </div>
  )
}

import { Icon } from '@/components/ui/icon'

export default function CompteSuspenduPage() {
  return (
    <div className="v3-center">
      <div className="v3-icon-circle danger"><Icon name="ban" /></div>
      <h1 className="auth-title">Compte suspendu</h1>
      <p className="auth-subtitle">L’accès à votre compte est suspendu. Pour en savoir plus, écrivez à contact@monganga.cd.</p>
      <form action="/auth/deconnexion" method="post"><button className="btn btn-secondary btn-block" type="submit"><Icon name="log-out" /> Se déconnecter</button></form>
    </div>
  )
}

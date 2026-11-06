import Link from 'next/link'
import { Logo } from '@/components/ui/logo'

export function PublicFooter() {
  return (
    <footer className="pub-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Logo />
            <p>Monganga na yo, na tshombo na yo. La santé à portée de main, à Kinshasa.</p>
          </div>
          <div className="footer-col">
            <h5>Produit</h5>
            <Link href="/comment-ca-marche">Comment ça marche</Link>
            <Link href="/medecins">Trouver un médecin</Link>
            <Link href="/tarifs">Tarifs</Link>
          </div>
          <div className="footer-col">
            <h5>Aide</h5>
            <Link href="/faq">FAQ</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/inscription?type=medecin">Devenir médecin</Link>
          </div>
          <div className="footer-col">
            <h5>Légal</h5>
            <Link href="/conditions">Conditions d’utilisation</Link>
            <Link href="/confidentialite">Politique de confidentialité</Link>
            <Link href="/mentions-legales">Mentions légales</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} MONGANGA. Tous droits réservés.</span>
          <span><span style={{ color: 'var(--rdc-yellow)' }}>★</span> Fait à Kinshasa, RDC</span>
        </div>
      </div>
    </footer>
  )
}

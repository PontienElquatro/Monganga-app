import type { Metadata } from 'next'
import { LegalPage } from '@/components/public/legal-page'

export const metadata: Metadata = { title: 'Mentions légales' }

export default function MentionsPage() {
  return (
    <LegalPage title="Mentions légales" updated="novembre 2026" intro="Informations sur l’éditeur et l’hébergement de la plateforme MONGANGA.">
      <h2>1. Éditeur</h2>
      <p>MONGANGA na Tshombo — [À compléter avant la mise en ligne : raison sociale de l’entreprise qui exploite MONGANGA, numéro RCCM, identification nationale, adresse du siège à Kinshasa, responsable de la publication].</p>
      <h2>2. Conception et développement</h2>
      <p>BisoTech, Kinshasa.</p>
      <h2>3. Hébergement</h2>
      <p>Site web : Vercel Inc. Base de données et fichiers : Supabase. Visio : Daily.co.</p>
      <h2>4. Propriété intellectuelle</h2>
      <p>Le nom MONGANGA, le logo, les textes et les visuels de la plateforme sont protégés. Toute reproduction sans autorisation est interdite.</p>
      <h2>5. Contact</h2>
      <p>contact@monganga.cd</p>
    </LegalPage>
  )
}

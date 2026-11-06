import type { Metadata } from 'next'
import { LegalPage } from '@/components/public/legal-page'

export const metadata: Metadata = { title: 'Politique de confidentialité' }

export default function ConfidentialitePage() {
  return (
    <LegalPage title="Politique de confidentialité" updated="novembre 2026"
      intro="Nous protégeons les données que vous nous confiez, en particulier vos données de santé. Voici lesquelles nous utilisons, pourquoi, et combien de temps.">
      <h2>1. Les données collectées</h2>
      <ul>
        <li>Votre compte : nom, adresse e-mail, mot de passe (chiffré), et si vous les donnez : téléphone, photo, date de naissance, sexe, commune.</li>
        <li>Vos rendez-vous et paiements : dates, montants, moyen de paiement, références des opérations.</li>
        <li>Vos consultations : messages, documents envoyés, ordonnances, notes du médecin.</li>
        <li>Pour les médecins : pièces justificatives (identité, diplômes, Ordre, CV) et moyen de versement.</li>
      </ul>
      <h2>2. Qui voit quoi</h2>
      <ul>
        <li>Votre médecin voit votre nom, votre âge, votre commune et le contenu de votre consultation avec lui.</li>
        <li>Les patients ne voient jamais les coordonnées personnelles des médecins.</li>
        <li>L’administration de MONGANGA gère les comptes et les paiements, mais n’a pas accès aux ordonnances ni au contenu des consultations.</li>
        <li>Les pièces des candidats médecins ne sont visibles que par l’administration.</li>
      </ul>
      <h2>3. Durée de conservation</h2>
      <p>Les ordonnances, documents, messages et notes de consultation sont supprimés 30 jours après la consultation. L’historique de vos rendez-vous (date, médecin) et les données de paiement sont conservés pour la gestion du service et les obligations comptables.</p>
      <h2>4. Nos prestataires</h2>
      <p>Nous faisons appel à des prestataires techniques : hébergement et base de données, visio, envoi d’e-mails, stockage des photos de profil et paiement. Ils ne reçoivent que les données nécessaires à leur mission.</p>
      <h2>5. Sécurité</h2>
      <p>Les échanges sont chiffrés. L’accès aux données est contrôlé par la base de données elle-même à chaque demande. Les documents sont stockés dans des espaces privés, ouverts par des liens temporaires.</p>
      <h2>6. Vos droits</h2>
      <p>Vous pouvez consulter et corriger vos informations depuis votre profil, et demander la suppression de votre compte en écrivant à contact@monganga.cd.</p>
    </LegalPage>
  )
}

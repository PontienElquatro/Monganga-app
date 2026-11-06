import type { Metadata } from 'next'
import { LegalPage } from '@/components/public/legal-page'

export const metadata: Metadata = { title: 'Conditions d’utilisation' }

export default function ConditionsPage() {
  return (
    <LegalPage title="Conditions d’utilisation" updated="novembre 2026"
      intro="En créant un compte ou en utilisant MONGANGA, vous acceptez les règles ci-dessous. Elles définissent les droits et obligations des patients, des médecins et de MONGANGA.">
      <h2>1. Le service</h2>
      <p>MONGANGA met en relation des patients et des médecins dont le diplôme, l’identité et l’inscription à l’Ordre des médecins ont été vérifiés, pour des consultations en visio de 30 minutes. MONGANGA ne pratique pas la médecine : chaque médecin reste seul responsable de ses actes et de ses prescriptions.</p>
      <h2>2. Pas d’urgence</h2>
      <p>MONGANGA n’est pas un service d’urgence. En cas de douleur intense, de difficulté à respirer, de perte de connaissance ou de tout autre signe grave, rendez-vous immédiatement à l’hôpital le plus proche.</p>
      <h2>3. Votre compte</h2>
      <p>Vous vous engagez à donner des informations exactes et à garder votre mot de passe confidentiel. Toute action faite depuis votre compte est réputée faite par vous. MONGANGA peut suspendre un compte en cas d’abus.</p>
      <h2>4. Tarifs et paiements</h2>
      <ul>
        <li>Chaque médecin fixe le tarif de sa consultation, affiché avant la réservation.</li>
        <li>La réservation est confirmée après le paiement d’un acompte de 1 $, déduit du tarif.</li>
        <li>Le solde est payé le jour de la consultation, à partir d’une heure avant.</li>
        <li>Les paiements sont traités par un prestataire agréé ; MONGANGA ne conserve aucun numéro de carte.</li>
      </ul>
      <h2>5. Annulations, absences et remboursements</h2>
      <ul>
        <li>Annulation par le patient plus de 24 h avant : l’acompte est remboursé.</li>
        <li>Annulation par le patient moins de 24 h avant : l’acompte reste acquis.</li>
        <li>Solde non payé 10 minutes après l’heure prévue : le rendez-vous est considéré comme manqué et l’acompte reste acquis.</li>
        <li>Annulation ou absence du médecin : le patient est remboursé intégralement.</li>
      </ul>
      <h2>6. Consultation et ordonnances</h2>
      <p>La consultation dure 30 minutes. Les ordonnances, documents et messages échangés restent disponibles 30 jours après la consultation, puis sont supprimés. Il appartient au patient de télécharger les documents qu’il souhaite conserver.</p>
      <h2>7. Médecins</h2>
      <p>Les médecins s’engagent à exercer conformément à la déontologie médicale, à respecter leurs créneaux et à ne pas demander de paiement en dehors de MONGANGA pour les consultations réservées sur la plateforme. Leur part leur est versée chaque samedi soir, frais de transfert éventuels déduits.</p>
      <h2>8. Responsabilité</h2>
      <p>MONGANGA met tout en œuvre pour assurer la disponibilité du service, sans pouvoir garantir une absence totale d’interruption, notamment liée aux réseaux de téléphonie et à Internet.</p>
      <h2>9. Contact</h2>
      <p>Pour toute question : contact@monganga.cd.</p>
    </LegalPage>
  )
}

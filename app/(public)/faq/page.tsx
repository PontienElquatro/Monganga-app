import Link from 'next/link'
import type { Metadata } from 'next'
import { Icon } from '@/components/ui/icon'
import { FaqList, type FaqEntry } from '@/components/public/faq-list'

export const metadata: Metadata = { title: 'Questions fréquentes' }

const FAQ: FaqEntry[] = [
  { category: 'rdv', icon: 'calendar-check', question: 'Comment prendre un rendez-vous ?', answer: 'Créez votre compte, choisissez un médecin et un créneau, puis payez l’acompte de 1 $. Votre rendez-vous est confirmé dès que l’acompte est reçu.' },
  { category: 'rdv', icon: 'clock', question: 'Combien de temps dure une consultation ?', answer: 'Toutes les consultations durent 30 minutes. Un avertissement apparaît 5 minutes avant la fin.' },
  { category: 'rdv', icon: 'circle-x', question: 'Puis-je annuler mon rendez-vous ?', answer: 'Oui, depuis « Mes rendez-vous ». Plus de 24 h avant la consultation, l’acompte vous est remboursé. Moins de 24 h avant, il reste acquis, car le créneau est perdu pour le médecin.' },
  { category: 'paiement', icon: 'wallet', question: 'Combien coûte une consultation ?', answer: 'Chaque médecin fixe son tarif, affiché sur son profil. Vous payez 1 $ pour réserver, puis le reste le jour de la consultation. Aucun frais ne s’ajoute.' },
  { category: 'paiement', icon: 'smartphone', question: 'Quels moyens de paiement sont acceptés ?', answer: 'M-Pesa, Orange Money, Airtel Money et les cartes Visa ou Mastercard.' },
  { category: 'paiement', icon: 'credit-card', question: 'Quand dois-je payer le solde ?', answer: 'À partir d’une heure avant la consultation. Vous recevez un rappel par e-mail. Si vous cliquez sur « Démarrer » sans avoir payé, l’écran de paiement s’ouvre d’abord.' },
  { category: 'paiement', icon: 'refresh-cw', question: 'Que se passe-t-il si le médecin ne vient pas ?', answer: 'Vous êtes remboursé de tout, acompte et solde. L’équipe MONGANGA est prévenue automatiquement.' },
  { category: 'consultation', icon: 'wifi-off', question: 'Et si ma connexion est mauvaise ?', answer: 'Coupez la caméra pendant l’appel : la consultation continue en audio et consomme beaucoup moins de données.' },
  { category: 'consultation', icon: 'file-text', question: 'Comment recevoir mon ordonnance ?', answer: 'Le médecin vous l’envoie pendant ou juste après la consultation. Elle apparaît dans « Ordonnances », téléchargeable en PDF avec un QR code que le pharmacien peut vérifier.' },
  { category: 'consultation', icon: 'lock', question: 'Mes données sont-elles protégées ?', answer: 'Seul votre médecin voit votre consultation. L’administration n’a pas accès aux ordonnances. Ordonnances, documents et messages sont supprimés 30 jours après la consultation.' },
  { category: 'consultation', icon: 'circle-alert', question: 'Puis-je utiliser MONGANGA en cas d’urgence ?', answer: 'Non. En cas d’urgence (douleur intense, difficulté à respirer, perte de connaissance), rendez-vous immédiatement à l’hôpital le plus proche.' },
  { category: 'medecin', icon: 'stethoscope', question: 'Comment devenir médecin sur MONGANGA ?', answer: 'Sur la page d’inscription, choisissez « Médecin » et remplissez le formulaire de candidature avec vos pièces justificatives. Notre équipe vérifie votre dossier avant d’ouvrir votre espace.' },
  { category: 'medecin', icon: 'hand-coins', question: 'Comment suis-je payé ?', answer: 'Vous fixez votre tarif. Chaque samedi soir, MONGANGA vous verse votre part des consultations de la semaine, par Mobile Money ou virement bancaire.' },
]

export default function FaqPage() {
  return (
    <>
      <section className="container section text-center">
        <div className="breadcrumb" style={{ justifyContent: 'center', marginBottom: 16 }}><Link href="/">Accueil</Link><Icon name="chevron-right" /><span>FAQ</span></div>
        <h1 className="h1 mb-4">Questions fréquentes</h1>
        <p className="text-2 mx-auto" style={{ fontSize: 15, maxWidth: 640 }}>Les réponses aux questions les plus posées par nos utilisateurs.</p>
      </section>
      <FaqList entries={FAQ} />
    </>
  )
}

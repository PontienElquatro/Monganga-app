/**
 * Adresses officielles de MONGANGA (domaine monganga.org), chacune avec un rôle précis.
 * Les messages reçus sont transférés par Cloudflare Email Routing vers la boîte de l'équipe.
 */
export const EMAILS = {
  /** Questions générales, partenariats, candidatures médecins, données personnelles. */
  contact: 'contact@monganga.org',
  /** Compte, connexion, mot de passe, problème technique, visio. Expéditeur des e-mails de connexion (Supabase). */
  support: 'support@monganga.org',
  /** Paiements, remboursements, annulations, réclamations, versements aux médecins. */
  sav: 'sav@monganga.org',
} as const

export type EmailBox = keyof typeof EMAILS

export const SENDER_NAMES: Record<EmailBox, string> = {
  contact: 'MONGANGA',
  support: 'MONGANGA Support',
  sav: 'MONGANGA SAV',
}

export function mailto(box: EmailBox, subject?: string): string {
  return `mailto:${EMAILS[box]}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`
}

/** Boîte qui envoie une notification, selon son type : tout ce qui touche à l'argent part du SAV. */
export function boxForNotification(kind: string): EmailBox {
  return /^(remboursement|rdv_annule|absence_patient|solde_paye|versement|alerte_annulation|alerte_absence_medecin)/.test(kind) ? 'sav' : 'contact'
}

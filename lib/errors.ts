// Traduction des codes d'erreur de la base en messages clairs pour l'utilisateur.

const MESSAGES: Record<string, string> = {
  ACCES_REFUSE: 'Vous n’avez pas accès à cette action.',
  ACTION_IMPOSSIBLE: 'Cette action n’est pas possible.',
  COMPTE_NON_MEDECIN: 'Ce compte n’est pas un compte médecin.',
  COMPTE_NON_PATIENT: 'Cette action est réservée aux patients.',
  DOSSIER_DEJA_TRAITE: 'Votre dossier a déjà été traité.',
  DOSSIER_INTROUVABLE: 'Dossier introuvable ou déjà traité.',
  PIECES_MANQUANTES: 'Des pièces obligatoires manquent au dossier (photo, identité, diplôme, Ordre, CV).',
  SPECIALITE_OBLIGATOIRE: 'Choisissez votre spécialité.',
  COMPTE_VERSEMENT_INVALIDE: 'Indiquez le numéro ou le compte sur lequel recevoir vos versements.',
  MESSAGE_OBLIGATOIRE: 'Écrivez le message à envoyer au médecin.',
  MOTIF_OBLIGATOIRE: 'Indiquez un motif.',
  COMMISSION_INVALIDE: 'La commission doit être comprise entre 0 et 100 %.',
  UTILISATEUR_INTROUVABLE: 'Utilisateur introuvable.',
  VALEUR_INVALIDE: 'Valeur invalide.',
  PARAMETRE_INCONNU: 'Paramètre inconnu.',
  TARIF_HORS_LIMITES: 'Le tarif doit être compris entre 5 $ et 500 $.',
  TARIF_INFERIEUR_ACOMPTE: 'Le tarif doit être supérieur à l’acompte de réservation.',
  TARIF_INVALIDE: 'Le tarif de ce médecin ne permet pas de réserver pour le moment.',
  MEDECIN_NON_VALIDE: 'Votre compte médecin n’est pas encore validé.',
  PLAGE_INVALIDE: 'L’heure de fin doit être après l’heure de début.',
  DATE_TROP_LOINTAINE: 'Vous pouvez ouvrir des créneaux jusqu’à 60 jours à l’avance.',
  CRENEAU_NON_SUPPRIMABLE: 'Ce créneau est réservé : il ne peut pas être supprimé.',
  CRENEAU_INDISPONIBLE: 'Ce créneau vient d’être pris. Choisissez-en un autre.',
  CRENEAU_TROP_PROCHE: 'Ce créneau est trop proche pour être réservé. Choisissez un horaire plus tard.',
  TROP_DE_RESERVATIONS_EN_ATTENTE: 'Vous avez déjà 3 réservations en attente de paiement. Payez ou laissez-les expirer avant d’en faire une autre.',
  CONFLIT_HORAIRE: 'Vous avez déjà un rendez-vous à cette heure-là.',
  RENDEZ_VOUS_INTROUVABLE: 'Rendez-vous introuvable.',
  ACOMPTE_IMPOSSIBLE: 'Le délai pour payer l’acompte est dépassé. Réservez à nouveau un créneau.',
  SOLDE_IMPOSSIBLE: 'Le solde ne peut pas être payé pour ce rendez-vous.',
  SOLDE_PAS_ENCORE_OUVERT: 'Le paiement du solde ouvre une heure avant la consultation.',
  SOLDE_TROP_TARD: 'Le délai pour payer le solde est dépassé.',
  NUMERO_INVALIDE: 'Indiquez un numéro Mobile Money valide.',
  PAIEMENT_INTROUVABLE: 'Paiement introuvable.',
  ANNULATION_IMPOSSIBLE: 'Ce rendez-vous ne peut plus être annulé.',
  CONSULTATION_INDISPONIBLE: 'Cette consultation n’est pas disponible.',
  CONSULTATION_PAS_ENCORE_OUVERTE: 'La salle ouvre 5 minutes avant l’heure du rendez-vous.',
  CONSULTATION_FERMEE: 'La salle de consultation est fermée.',
  SOLDE_NON_PAYE: 'Réglez le solde pour accéder à la consultation.',
  CONSULTATION_NON_DEMARREE: 'La consultation n’a pas démarré : le patient ne s’est pas encore connecté.',
  ORDONNANCE_IMPOSSIBLE: 'L’ordonnance s’émet pendant ou après la consultation.',
  ORDONNANCE_TROP_TARD: 'L’ordonnance doit être émise dans les 24 heures après la consultation.',
  ORDONNANCE_VIDE: 'Ajoutez au moins un médicament.',
  ORDONNANCE_LIGNE_INVALIDE: 'Chaque ligne doit avoir un nom de médicament (120 caractères maximum).',
  NOTATION_IMPOSSIBLE: 'Vous pourrez noter la consultation une fois terminée.',
  NOTE_INVALIDE: 'Choisissez une note de 1 à 5 étoiles.',
  DEJA_NOTE: 'Vous avez déjà noté cette consultation.',
  REMBOURSEMENT_INTROUVABLE: 'Remboursement introuvable ou déjà traité.',
  VERSEMENT_INTROUVABLE: 'Versement introuvable ou déjà effectué.',
  REFERENCE_OBLIGATOIRE: 'Indiquez la référence de l’opération.',
  FRAIS_INVALIDES: 'Les frais ne peuvent pas dépasser le montant dû.',
  DECISION_INVALIDE: 'Décision invalide.',
}

export function friendlyError(error: unknown, fallback = 'Une erreur est survenue. Réessayez dans un instant.'): string {
  const message = typeof error === 'string' ? error : (error as { message?: string } | null)?.message ?? ''
  for (const code of Object.keys(MESSAGES)) {
    if (message.includes(code)) return MESSAGES[code]
  }
  if (/Invalid login credentials/i.test(message)) return 'E-mail ou mot de passe incorrect.'
  if (/Email not confirmed/i.test(message)) return 'Confirmez d’abord votre adresse e-mail grâce au lien reçu.'
  if (/User already registered|already been registered/i.test(message)) return 'Un compte existe déjà avec cette adresse e-mail.'
  if (/Password should be|weak password/i.test(message)) return 'Mot de passe trop faible : au moins 8 caractères, avec une majuscule et un chiffre.'
  if (/rate limit|too many/i.test(message)) return 'Trop de tentatives. Patientez quelques minutes.'
  if (message) console.error('[monganga]', message)
  return fallback
}

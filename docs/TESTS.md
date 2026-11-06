# Parcours de test (avant mise en ligne)

À faire avec **trois comptes** dans trois navigateurs (ou fenêtres privées) : un patient, un médecin, un administrateur. Tous les services sont en mode test : aucun argent ne circule.

Astuce : pour tester l’ouverture du solde et de la salle sans attendre, ouvrir un créneau qui commence dans ~2 h 05, le réserver, puis dans l’éditeur SQL avancer l’heure du rendez-vous (`update appointments set starts_at = now() + interval '30 minutes', ends_at = now() + interval '60 minutes' where reference = 'MGA-…'`).

## 1. Comptes
- [ ] Inscription patient (e-mail + mot de passe), e-mail de confirmation, connexion → tableau de bord patient.
- [ ] Mot de passe oublié → lien reçu → nouveau mot de passe → connexion.
- [ ] Inscription médecin avec les pièces (photo, identité, diplôme, Ordre, CV) → page « dossier en validation ».
- [ ] Le médecin non validé ne peut ouvrir aucune page de l’espace médecin.

## 2. Validation (administrateur)
- [ ] *Validations* : le dossier apparaît, les pièces s’ouvrent (liens privés).
- [ ] « Demander un complément » avec un message → le médecin voit le message et peut renvoyer son dossier.
- [ ] « Refuser » avec un motif → le médecin voit le motif et peut soumettre à nouveau.
- [ ] « Valider » → le médecin accède à son espace ; il apparaît dans la recherche dès qu’il ouvre des créneaux.

## 3. Créneaux et réservation
- [ ] Médecin : *Disponibilités* → ouvrir une plage (ex. 9 h – 12 h) → 6 créneaux de 30 min ; supprimer un créneau libre.
- [ ] Médecin : modifier son tarif et son compte de versement dans *Mon profil*.
- [ ] Patient : *Rechercher* → fiche du médecin (aucun téléphone ni e-mail du médecin visible) → choisir un créneau.
- [ ] Paiement de l’acompte (1 $) → simulateur → « réussi » → « Rendez-vous confirmé » ; e-mail + notification.
- [ ] Refaire avec « échec » → message d’échec, possibilité de réessayer.
- [ ] Ne pas payer : après 15 min, la réservation expire et le créneau redevient libre.

## 4. Jour J
- [ ] 1 h avant : rappel (notification + e-mail), bouton « Payer le solde » ouvert.
- [ ] « Démarrer » sans solde → l’écran de paiement du solde s’ouvre d’abord.
- [ ] Solde payé → salle d’attente ; la salle ouvre 5 min avant l’heure.
- [ ] Les deux entrent → statut « En cours » ; minuteur ; alerte 5 min avant la fin.
- [ ] Chat en temps réel dans les deux sens ; envoi d’un PDF et d’une photo ; ouverture par l’autre participant.
- [ ] Médecin : notes privées (enregistrement automatique), ordonnance avec 2 médicaments → le patient la reçoit.
- [ ] Médecin : « Terminer la consultation » → patient prévenu ; part du médecin visible dans *Revenus*.
- [ ] Patient : *Ordonnances* → PDF téléchargé, QR code → page de vérification (aucune donnée médicale).
- [ ] Patient : note 1–5 étoiles → visible uniquement dans *Administration → Médecins*.

## 5. Absences et annulations
- [ ] Patient annule **plus de 24 h avant** → « acompte remboursé » ; remboursement « à effectuer » côté administration.
- [ ] Patient annule **moins de 24 h avant** → acompte conservé (70 % médecin / 30 % plateforme).
- [ ] Solde non payé **10 min après l’heure** → « absent » ; acompte partagé 70/30.
- [ ] Médecin annule (motif obligatoire) → patient remboursé de tout, alerte administration.
- [ ] Patient connecté, médecin jamais connecté → « Médecin absent », remboursement total, alerte administration.
- [ ] Personne ne se connecte alors que tout est payé → « À trancher » dans *Transactions*.

## 6. Argent (administrateur)
- [ ] *Transactions* : paiements, remboursements à effectuer (saisir une référence → patient prévenu).
- [ ] *Versements* : « Préparer » → un versement par médecin ; saisir frais + référence → « Versé », médecin prévenu ; *Revenus* du médecin à jour (net de frais).
- [ ] *Médecins* : changer la commission d’un médecin → s’applique aux réservations suivantes seulement.
- [ ] *Utilisateurs* : suspendre un compte → plus d’accès ; ses rendez-vous à venir sont annulés et remboursés.
- [ ] *Rapports* et exports CSV.

## 7. Confidentialité (à vérifier absolument)
- [ ] L’administration ne voit ni ordonnances, ni notes, ni messages.
- [ ] Le médecin ne voit pas la commission, ni la part de la plateforme.
- [ ] Le patient ne voit pas les notes du médecin.
- [ ] Après 30 jours : ordonnances, messages, notes et documents supprimés.

## 8. Affichage
- [ ] Téléphone (Android, petit écran), tablette, ordinateur ; mode sombre.
- [ ] Connexion lente (3G) : pages lisibles, messages d’erreur clairs.

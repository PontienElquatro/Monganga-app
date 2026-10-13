# Branchement front ↔ backend (branche `frontend`)

**Principe.** Le front garde son contrat HTTP (`docs/frontend/openapi.json`). Le backend l'expose via des
Route Handlers `app/api/v1/**` qui parlent à Supabase (RLS, `doctors_public`, Server Actions de Junior intactes).
Le front passe en mode réel avec `NEXT_PUBLIC_MONGANGA_MODE=api` (figé au build). En mode `demo`, rien ne change.
Toute route du contrat pas encore branchée répond `501 NOT_IMPLEMENTED` (jamais de données fictives en mode api).

Règles : service_role côté serveur uniquement, rôle toujours lu en base, CSRF + origine sur chaque mutation,
`doctors_public` pour tout ce qui est vu par un patient, paiements en mock.

## Correspondances

| Front | Supabase |
|---|---|
| rôle `doctor` | `profiles.role = 'medecin'` |
| `doctorId` | `doctor_profiles.id` (= `profiles.id`) |
| `priceCents` | `consultation_fee` × 100 |
| statuts réservation (`confirmed`, `cancelled`…) | `appointment_status` (`confirme`, `annule`…) |

## Modules (ordre de travail)

| # | Module | Routes | État |
|---|---|---|---|
| 0 | Intégration du front, config, proxy.ts | — | ✅ |
| 1 | Authentification | `GET /auth/csrf`, `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`, `POST /auth/register/patient` | ✅ code + tests (à valider avec le vrai Supabase) |
| 2 | Annuaire médecins | `GET /doctors`, `GET /doctors/{id}/slots` | ✅ code + tests (à valider avec le vrai Supabase) |
| 3a | Lecture des données du compte | `GET /bookings`, `/prescriptions`, `/transactions`, `/notifications`, `POST /notifications/read` | ✅ code + tests (tableau de bord patient) |
| 3b | Réservation + paiement mock (patient) | `POST /bookings`, `GET /bookings/{id}`, `/bookings/{id}/payment` (GET, POST, `/cancel`), `POST /bookings/{id}/cancel` | ✅ code + tests. Uniquement via les RPC de Junior (`book_appointment`, `pay_reservation_mock`, `cancel_appointment`), jamais d'écriture directe. Reste en 501 : déplacement (`PUT /bookings/{id}/slot`) et décision médecin (`PUT /bookings/{id}/request-status`, module 4) |
| 4 | Agenda / disponibilités médecin | `/doctors/me/availability*` | ⏳ |
| 5 | Profil, préférences | `/me/*` | ⏳ |
| 6 | Candidature médecin + admin | `/doctor-applications`, `/admin/*` | ⏳ upload pièces non prêt côté Junior |
| 7 | Consultation, ordonnances, notifications, gains | `/consultations*`, `/prescriptions*`… | ⏳ modules futurs de Junior |

## Sources de vérité

Pour le backend : README des branches `main` et `back-end` (pas celui du zip du front). Le README du zip ne sert que
pour le contrat HTTP du front.

## Écarts connus à trancher avec Junior / le client

- **Inscription** (décision du 13/10) : email + mot de passe obligatoires, téléphone facultatif, **sans OTP** (README backend §9.4).
  Mode `api` uniquement : le mode démo garde son parcours OTP. Si la confirmation d'email est active dans Supabase, le compte est
  créé mais inactif jusqu'au clic sur le lien ; sinon la session s'ouvre tout de suite. Le lien de confirmation renvoie vers le
  « Site URL » configuré dans Supabase (Authentication > URL Configuration) : à régler avec Junior.
  `/auth/verify-otp`, `/resend-otp`, `/forgot-password`, `/reset-password` restent en 501.
- **Connexion par téléphone** : résolue côté serveur via `profiles.phone` → email (client admin). Format du numéro à confirmer.
- **« Se souvenir de moi »** : ignoré pour l'instant (durée des cookies Supabase par défaut).
- **Annuaire** : `doctors_public` n'a ni `commune`, ni `languages`, ni note. `GET /doctors` renvoie `commune: ""`,
  `languages: []`, `rating: null` (rien d'inventé). À demander à Junior : colonnes ou vue enrichie. Durée = durée du créneau (30 min par défaut).
- **Délai de 24 h avant rendez-vous** : exigé par le contrat du front, absent du README backend (seule l'annulation a 24 h). À confirmer.
- **Statuts de réservation** : `en_attente` → `payment_pending` (réservation de 1 $ non payée), `confirme` → `confirmed`,
  `termine` → `completed`, `refuse`/`annule`/`non_honore` → `cancelled`. L'état de paiement vient du dernier paiement `reservation` de la table `payments`.
  Le front suppose un paiement unique (honoraire + frais) ; la base sépare réservation (1 $) et consultation : à trancher avec Junior.
- **Ordonnances** : la base n'a qu'un champ `content` ; le contrat attend `medication` + `instructions`. Convention : 1re ligne = médicament, reste = consignes.
- **Dépenses du patient** : le README backend (règle 7) dit que le patient n'a pas la rubrique « dépenses ce mois » ; le tableau de bord patient du front l'affiche (4e carte). À retirer ou à confirmer avec le client.
- **Gains du médecin** : `GET /transactions` renvoie une liste vide pour un médecin tant que l'écran « mes gains » n'est pas branché sur `ledger_entries` (il ne doit voir que sa part de 70 %).
- **Réservation (module 3b)** : `book_appointment` retient le créneau 30 min (libéré par `release_unpaid_reservations`) et crée un paiement mock
  en attente ; `pay_reservation_mock` confirme directement (pas d'état « demande à accepter par le médecin » côté base). Le moyen de paiement choisi
  (M-Pesa…) est validé mais **non enregistré** : `payments.provider` vaut `mock`. « Annuler le paiement » annule le rendez-vous (pas d'état brouillon en base).
  Le rendez-vous est visible comme `payment_pending` dès la création (le front attendait `draft`).
- **`supabase/03_rendezvous.sql`** : cité dans le README `back-end` mais absent du dépôt ; les 4 fonctions existent bien dans la base (lues le 13/10). À faire versionner par Junior.
- **Tarifs** : le front affiche des prix fixes ; le client veut `consultation_fee` par médecin (README §10).
- **Comptes suspendus** : pas de statut sur `profiles` ; seul `doctor_status = 'suspendu'` existe.
- **Visio, MaishaPay, PDF signé** : le front est prévu pour MaishaPay ; le README backend impose un paiement mock.
- **Thème** : les écrans de test de Junior (`/login`, `/admin`, `/medecins`) n'ont plus Tailwind chargé
  (le layout global est celui du front). À remplacer par les écrans définitifs, comme prévu au README §4.
- **`package-lock.json`** : les entrées existantes pointent vers `registry.npmmirror.com` ; certaines
  machines/CI ne l'atteignent pas (`npm install --replace-registry-host=always`).

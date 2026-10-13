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
| 1 | Authentification | `GET /auth/csrf`, `POST /auth/login`, `GET /auth/me`, `POST /auth/logout` | ✅ code + tests (à valider avec le vrai Supabase) |
| 2 | Annuaire médecins | `GET /doctors`, `GET /doctors/{id}/slots` | ✅ code + tests (à valider avec le vrai Supabase) |
| 3 | Réservation + paiement mock | `/bookings*` | ⏳ branche `back-end` à fusionner. `appointments` ne s'écrit **jamais** en direct : uniquement via les RPC `book_appointment`, `pay_reservation_mock`, `refuse_appointment`, `cancel_appointment` (README back-end §7) |
| 4 | Agenda / disponibilités médecin | `/doctors/me/availability*` | ⏳ |
| 5 | Profil, préférences | `/me/*` | ⏳ |
| 6 | Candidature médecin + admin | `/doctor-applications`, `/admin/*` | ⏳ upload pièces non prêt côté Junior |
| 7 | Consultation, ordonnances, notifications, gains | `/consultations*`, `/prescriptions*`… | ⏳ modules futurs de Junior |

## Sources de vérité

Pour le backend : README des branches `main` et `back-end` (pas celui du zip du front). Le README du zip ne sert que
pour le contrat HTTP du front.

## Écarts connus à trancher avec Junior / le client

- **Inscription et OTP** : le front inscrit par téléphone + OTP ; le backend est email + mot de passe. Les routes
  `/auth/register/patient`, `/verify-otp`, `/forgot-password`… restent en 501 tant que ce n'est pas décidé.
- **Connexion par téléphone** : résolue côté serveur via `profiles.phone` → email (client admin). Format du numéro à confirmer.
- **« Se souvenir de moi »** : ignoré pour l'instant (durée des cookies Supabase par défaut).
- **Annuaire** : `doctors_public` n'a ni `commune`, ni `languages`, ni note. `GET /doctors` renvoie `commune: ""`,
  `languages: []`, `rating: null` (rien d'inventé). À demander à Junior : colonnes ou vue enrichie. Durée = durée du créneau (30 min par défaut).
- **Délai de 24 h avant rendez-vous** : exigé par le contrat du front, absent du README backend (seule l'annulation a 24 h). À confirmer.
- **Tarifs** : le front affiche des prix fixes ; le client veut `consultation_fee` par médecin (README §10).
- **Comptes suspendus** : pas de statut sur `profiles` ; seul `doctor_status = 'suspendu'` existe.
- **Visio, MaishaPay, PDF signé** : le front est prévu pour MaishaPay ; le README backend impose un paiement mock.
- **Thème** : les écrans de test de Junior (`/login`, `/admin`, `/medecins`) n'ont plus Tailwind chargé
  (le layout global est celui du front). À remplacer par les écrans définitifs, comme prévu au README §4.
- **`package-lock.json`** : les entrées existantes pointent vers `registry.npmmirror.com` ; certaines
  machines/CI ne l'atteignent pas (`npm install --replace-registry-host=always`).

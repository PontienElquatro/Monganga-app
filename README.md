# MONGANGA — Plateforme de téléconsultation médicale

> Projet BisoTech pour Russel Nete Bezo (Kinshasa, RDC).
> **Backend** (Supabase + Next.js) : fait par Junior. **Frontend / écrans** : Pontien.
> Ce document est confidentiel (NDA). Dépôt **privé** uniquement.

---

## 1. Ce qui est déjà prêt / ce que tu dois faire

| Zone | État | Qui |
|---|---|---|
| Base de données, sécurité (RLS), rôles | ✅ Prêt | Junior |
| Inscription / connexion / déconnexion | ✅ Prêt (email + mot de passe) | Junior |
| Rôles patient / médecin / admin + protection des pages | ✅ Prêt | Junior |
| Candidature médecin + validation/rejet par l'admin | ✅ Prêt (écrans de test basiques) | Junior |
| Liste publique des médecins validés | ✅ Prêt | Junior |
| **Tous les écrans définitifs (design de la maquette)** | 🔜 **À faire** | **Pontien** |
| Disponibilités médecin + réservation + paiement réservation (mock) + refus/annulation | ✅ Prêt (écrans de test) | Junior |
| Visio, consultation, no-show, ordonnances, notifications temps réel | 🔜 Modules suivants | Junior |
| Paiements (1 $, honoraires, reversements) | ⛔ Hors devis, en **mock** pour l'instant | — |

**Ta mission** : reprendre les écrans de la maquette et les brancher sur le backend, écran par écran, sans casser la sécurité (section 6).

---

## 2. Stack

- **Next.js 16** (App Router, Turbopack), **TypeScript**, **Tailwind CSS**
- **Supabase** : Postgres, Auth, RLS, pg_cron (Edge Functions plus tard)
- `@supabase/ssr` + `@supabase/supabase-js`
- ⚠️ Next 16 : le « middleware » s'appelle **`proxy.ts`** et exporte `proxy()` (pas `middleware()`).

---

## 3. Démarrage rapide

```bash
git clone https://github.com/PontienElquatro/Monganga-app.git
cd Monganga-app
npm install
```

1. Junior t'envoie **en privé** (WhatsApp/Signal, pas sur GitHub) le fichier `.env.local`.
2. Place-le **à la racine** du projet (même niveau que `package.json`). Modèle : `.env.example`.
3. Lance :

```bash
npm run dev
```

Ouvre http://localhost:3000.

**Vérifie que `.env.local` est ignoré par git** : `git check-ignore .env.local` doit afficher `.env.local`.

### Comptes de test
Crée-toi un compte via `/login` (inscription). Par défaut tout nouveau compte est **patient**. Pour tester les rôles médecin/admin, demande à Junior de te promouvoir (c'est volontairement impossible depuis l'app).

### Base de données
Déjà installée sur le projet Supabase partagé. Les scripts sont dans `supabase/` pour référence :
- `01_schema.sql` : tables, enums, RLS, triggers, tâche planifiée.
- `02_patches.sql` : permissions (GRANT), vue `doctors_public`, correctifs de sécurité.
- `03_rendezvous.sql` : fonctions de réservation (`book_appointment`, `pay_reservation_mock`, `refuse_appointment`, `cancel_appointment`) et nettoyage des réservations non payées.

Ne les relance **pas** sur le projet partagé. Toute modification de la base passe par Junior.

---

## 4. Structure du dépôt

```
proxy.ts                      # Rafraîchit la session à chaque requête (ne pas supprimer)
lib/supabase/
  client.ts                   # Client navigateur (composants "use client")
  server.ts                   # Client serveur (Server Components / Actions)
  middleware.ts               # Logique de session utilisée par proxy.ts
  admin.ts                    # Client service_role (SERVEUR UNIQUEMENT)
  get-user.ts                 # getCurrentUser() : utilisateur + rôle
  require-role.ts             # requireRole(['admin']) : protège une page
app/
  auth/actions.ts             # signUp / signIn / signOut (Server Actions)
  login/page.tsx              # Écran connexion/inscription (test)
  admin/page.tsx              # Tableau de bord admin (test)
  admin/medecins/             # Valider / rejeter les candidatures
  medecin/candidature/        # Formulaire de candidature médecin
  medecins/page.tsx           # Liste publique des médecins
supabase/                     # Scripts SQL (référence)
```

Les écrans « test » existants sont **fonctionnels mais sans design** : tu les remplaces visuellement en gardant les Server Actions.

---

## 5. Utiliser le backend dans tes écrans

### Savoir qui est connecté
```ts
import { getCurrentUser } from '@/lib/supabase/get-user'
const user = await getCurrentUser()   // null si non connecté, sinon { id, email, role, ... }
```

### Protéger une page par rôle
```ts
import { requireRole } from '@/lib/supabase/require-role'
await requireRole(['medecin'])        // redirige si le rôle ne correspond pas
```

### Connexion / inscription / déconnexion
Utilise les Server Actions de `app/auth/actions.ts` comme `action` d'un `<form>` :
```tsx
<form action={signIn}>
  <input name="email" type="email" required />
  <input name="password" type="password" required />
  <button>Se connecter</button>
</form>
```
Les erreurs reviennent en `/login?error=...` : affiche-les.

### Lire des données
- **Côté serveur** (recommandé) : `const supabase = await createClient()` depuis `lib/supabase/server.ts`.
- **Côté navigateur** : `createClient()` depuis `lib/supabase/client.ts`.
- La sécurité est assurée par la base (RLS) : si une requête renvoie vide, c'est souvent que la RLS refuse, pas un bug.

### Recherche de médecins
```ts
const { data } = await supabase.from('doctors_public').select('*')
```
**Toujours `doctors_public`**, jamais `profiles` (voir règles).

---

## 6. Règles à respecter (important)

1. **`SUPABASE_SERVICE_ROLE_KEY` : serveur seulement.** Jamais dans un composant `"use client"`, jamais avec `NEXT_PUBLIC_`, jamais commitée.
2. **Ne jamais commiter `.env.local`.**
3. **Rôle et statut médecin** ne se changent **que** côté serveur avec le client admin (ce qui est déjà fait dans `app/admin/medecins/actions.ts`). Ne tente pas de les modifier depuis le navigateur.
4. **Recherche de médecins = `doctors_public`.** Aucune coordonnée personnelle du médecin (téléphone, email) ne doit apparaître côté patient (exigence du client).
5. **Utiliser `getUser()` et non `getSession()`** pour vérifier l'identité côté serveur.
6. **Ordonnances/documents médicaux** disparaissent **30 jours** après consultation (tâche `pg_cron` quotidienne). Prévois un message clair dans l'UI.
7. **Le médecin ne voit que sa part** (70 %), jamais la commission de la plateforme ni les chiffres globaux. Le patient **n'a pas** la rubrique « dépenses ce mois ».
8. **Paiements : mock uniquement.** Ne branche aucun vrai opérateur (pawaPay/SerdiPay…) sans avenant signé.
9. **Un seul code pour mobile/web** : pense responsive, l'app mobile arrivera ensuite avec le même backend.
10. **Branches** : ne pousse pas sur `main`. `git checkout -b feature/nom-ecran`, puis Pull Request. Jamais de `git push --force`.

---

## 7. Les tables expliquées

| Table / objet | Rôle | Utile pour tes écrans |
|---|---|---|
| `profiles` | Un profil par utilisateur (nom, téléphone, avatar, **rôle**). Créé automatiquement à l'inscription (rôle `patient`). | Écran profil, affichage du nom/avatar, menus selon rôle |
| `doctor_profiles` | Infos pro du médecin : spécialité, bio, **honoraire**, **statut** (`en_attente`/`valide`/`rejete`), motif de rejet, commission (30 %). | Candidature médecin, statut de dossier, fiche médecin |
| `doctors_public` (vue) | Médecins **validés** sans données privées. | **Recherche, liste, fiche médecin côté patient** |
| `availabilities` | Créneaux de disponibilité du médecin (pas de chevauchement possible). | Agenda médecin, choix de créneau patient |
| `appointments` | Rendez-vous patient ↔ médecin, statut, frais de réservation (1 $). | « Mes rendez-vous », réserver, annuler |
| `consultations` | Déroulé de la téléconsultation (début, fin, lien visio, notes). | Salle de visio, historique médecin |
| `prescriptions` | Ordonnances, **expirent à +30 jours**. | « Mes ordonnances » |
| `notifications` | Messages in-app par utilisateur. | Cloche de notifications |
| `payments` | Paiements (réservation, honoraire). Écriture réservée au serveur. | Lecture du statut de paiement seulement |
| `ledger_entries` | Écritures comptables 70/30. Serveur uniquement. | Écran « mes gains » du médecin (sa part) |
| `payouts` | Reversements au médecin (samedi). Serveur uniquement. | Historique des reversements |
| `webhook_events` | Journal des notifications opérateurs (idempotence). Interne. | Aucun (ne pas toucher) |
| `current_user_role()` | Fonction : rôle de l'utilisateur courant, utilisée par la RLS. | — |
| `handle_new_user()` | Trigger : crée le profil à l'inscription. | — |
| `book_appointment(id)` | Fonction : réserve un créneau de façon atomique (pas de double réservation). Appelle-la avec `supabase.rpc('book_appointment', { p_availability_id })`. | Bouton « Réserver » |
| `pay_reservation_mock(id)` | Fonction : simule le paiement des 1 $ de réservation, confirme le rendez-vous. | Bouton « Payer » (test) |
| `refuse_appointment(id, motif)` | Fonction : le médecin refuse un rendez-vous, le patient est remboursé (mock), le créneau est libéré. | Bouton « Refuser » côté médecin |
| `cancel_appointment(id, motif)` | Fonction : annule un rendez-vous (règle : 24h avant pour le patient). | Bouton « Annuler » |

⚠️ **Important** : depuis ce module, `appointments` ne s'écrit plus jamais directement (`insert`/`update`) depuis le code — uniquement via ces 4 fonctions (`supabase.rpc(...)`), pour garder le contrôle du statut et du paiement.

Tout est protégé par **RLS** : un patient ne voit que ses données, un médecin ses patients/rendez-vous, l'admin ce qui lui est ouvert.

---

## 8. Carte des écrans (maquette → code)

Maquette de référence : https://quatro-monganga-app.netlify.app (site **statique**, pas Next.js : les écrans sont à **porter** en composants React/Tailwind).

### Pages publiques
| Écran maquette | Route Next | Backend |
|---|---|---|
| Accueil | `/` | ✅ (remplace la page par défaut) |
| `/public/how` Comment ça marche | `/comment-ca-marche` | — (statique) |
| `/public/doctors` Médecins | `/medecins` | ✅ `doctors_public` |
| `/public/pricing` Tarifs | `/tarifs` | ⚠️ voir §10 |
| `/public/faq` | `/faq` | — |
| `/public/contact` | `/contact` | 🔜 |
| `/public/candidature` | `/medecin/candidature` | ✅ (texte seulement, upload documents 🔜) |
| `/public/conditions-utilisation`, `politique-confidentialite`, `mentions-legales` | mêmes noms en français | — (statique) |

### Authentification
| Maquette | Route Next | Backend |
|---|---|---|
| `/auth/login`, `/auth/register` | `/login` (ou adapte, voir §9) | ✅ email + mot de passe |

### Espaces connectés (selon rôle)
| Espace | Écrans | Backend |
|---|---|---|
| Patient | Tableau de bord, rechercher un médecin, réserver, mes rendez-vous, visio, mes ordonnances, profil | 🔜 appointments / consultations / prescriptions |
| Médecin | Tableau de bord, agenda & disponibilités, rendez-vous, visio, mes gains (sa part), profil | 🔜 |
| Admin | Candidatures médecins, utilisateurs, suivi | ✅ candidatures (`/admin/medecins`), reste 🔜 |

Légende : ✅ prêt · 🔜 module à venir (Junior te prévient) · ⛔ hors devis.
Commence par ce qui est ✅ : accueil, pages statiques, login/inscription, liste médecins, candidature, admin candidatures.

---

## 9. Intégrer le site existant

1. Mets le site de la maquette dans un dossier **`maquette/`** (référence, hors build) : il ne doit pas être importé par Next.
2. Porte les écrans **un par un** vers `app/...` en composants Next/Tailwind, sur une branche par écran.
3. **Routes** : la maquette utilise `/auth/login` ; le backend `/login`. Soit tu crées `app/auth/login/page.tsx` et tu mets à jour les `redirect()` de `app/auth/actions.ts`, soit tu gardes `/login`. Garde la cohérence partout.
4. **Inscription** : la maquette montre téléphone + OTP ; le backend est email + mot de passe pour l'instant. Garde email + mot de passe en attendant la décision du client.
5. Après connexion, redirige selon le rôle : patient → espace patient, médecin → espace médecin, admin → `/admin`.

---

## 10. Points ouverts avec le client (ne pas figer l'UI dessus)

- **Tarifs** : la maquette affiche 20 $/30 $ fixes, mais le client dit que chaque médecin fixe ses honoraires → afficher `consultation_fee` du médecin.
- Délai d'annulation, motif de refus, historique visible au médecin, accès admin aux ordonnances, nouvelle candidature après rejet, tolérance en cas d'absence.
- Conservation 1 mois vs « historique/ordonnances » du devis.
- Devise (FC/USD), frais de transfert, montant « somme rentrante 10 $ ».
- Upload des pièces de candidature (CNI, diplôme, Ordre, CV) → Supabase Storage, pas encore fait.

---

## 11. Checklist avant chaque Pull Request

- [ ] `npm run build` passe sans erreur
- [ ] Aucun secret dans le code ni dans le diff (`git diff` relu)
- [ ] `.env.local` non suivi par git
- [ ] Testé avec 3 comptes : patient, médecin, admin
- [ ] Aucune donnée privée de médecin visible côté patient
- [ ] Responsive (mobile d'abord)

## 12. Contact

Junior (BisoTech) pour la base de données, les accès, les promotions de rôle et toute décision produit. En cas de doute sur la sécurité : **demande avant de coder**.
# MONGANGA — Plateforme de téléconsultation médicale

> Projet BisoTech pour Russel Nete Bezo (Kinshasa, RDC).
> **Backend** (Supabase + Next.js) : fait par Junior. **Frontend / écrans** : Pontien.
> Ce document est confidentiel (NDA). Dépôt **privé** uniquement.

---

## 1. Ce qui est déjà prêt / ce que tu dois faire

| Zone | État | Qui |
|---|---|---|
| Base de données, sécurité (RLS), rôles | ✅ Prêt | Junior |
| Inscription / connexion / déconnexion | ✅ Prêt (email + mot de passe) | Junior |
| Rôles patient / médecin / admin + protection des pages | ✅ Prêt | Junior |
| Candidature médecin + validation/rejet par l'admin | ✅ Prêt (écrans de test basiques) | Junior |
| Liste publique des médecins validés | ✅ Prêt | Junior |
| **Tous les écrans définitifs (design de la maquette)** | 🔜 **À faire** | **Pontien** |
| Disponibilités médecin + réservation + paiement réservation (mock) + refus/annulation | ✅ Prêt (écrans de test) | Junior |
| Visio, consultation, no-show, ordonnances, notifications temps réel | 🔜 Modules suivants | Junior |
| Paiements (1 $, honoraires, reversements) | ⛔ Hors devis, en **mock** pour l'instant | — |

**Ta mission** : reprendre les écrans de la maquette et les brancher sur le backend, écran par écran, sans casser la sécurité (section 6).

---

## 2. Stack

- **Next.js 16** (App Router, Turbopack), **TypeScript**, **Tailwind CSS**
- **Supabase** : Postgres, Auth, RLS, pg_cron (Edge Functions plus tard)
- `@supabase/ssr` + `@supabase/supabase-js`
- ⚠️ Next 16 : le « middleware » s'appelle **`proxy.ts`** et exporte `proxy()` (pas `middleware()`).

---

## 3. Démarrage rapide

```bash
git clone https://github.com/PontienElquatro/Monganga-app.git
cd Monganga-app
npm install
```

1. Junior t'envoie **en privé** (WhatsApp/Signal, pas sur GitHub) le fichier `.env.local`.
2. Place-le **à la racine** du projet (même niveau que `package.json`). Modèle : `.env.example`.
3. Lance :

```bash
npm run dev
```

Ouvre http://localhost:3000.

**Vérifie que `.env.local` est ignoré par git** : `git check-ignore .env.local` doit afficher `.env.local`.

### Comptes de test
Crée-toi un compte via `/login` (inscription). Par défaut tout nouveau compte est **patient**. Pour tester les rôles médecin/admin, demande à Junior de te promouvoir (c'est volontairement impossible depuis l'app).

### Base de données
Déjà installée sur le projet Supabase partagé. Les scripts sont dans `supabase/` pour référence :
- `01_schema.sql` : tables, enums, RLS, triggers, tâche planifiée.
- `02_patches.sql` : permissions (GRANT), vue `doctors_public`, correctifs de sécurité.
- `03_rendezvous.sql` : fonctions de réservation (`book_appointment`, `pay_reservation_mock`, `refuse_appointment`, `cancel_appointment`) et nettoyage des réservations non payées.

Ne les relance **pas** sur le projet partagé. Toute modification de la base passe par Junior.

---

## 4. Structure du dépôt

```
proxy.ts                      # Rafraîchit la session à chaque requête (ne pas supprimer)
lib/supabase/
  client.ts                   # Client navigateur (composants "use client")
  server.ts                   # Client serveur (Server Components / Actions)
  middleware.ts               # Logique de session utilisée par proxy.ts
  admin.ts                    # Client service_role (SERVEUR UNIQUEMENT)
  get-user.ts                 # getCurrentUser() : utilisateur + rôle
  require-role.ts             # requireRole(['admin']) : protège une page
app/
  auth/actions.ts             # signUp / signIn / signOut (Server Actions)
  login/page.tsx              # Écran connexion/inscription (test)
  admin/page.tsx              # Tableau de bord admin (test)
  admin/medecins/             # Valider / rejeter les candidatures
  medecin/candidature/        # Formulaire de candidature médecin
  medecins/page.tsx           # Liste publique des médecins
supabase/                     # Scripts SQL (référence)
```

Les écrans « test » existants sont **fonctionnels mais sans design** : tu les remplaces visuellement en gardant les Server Actions.

---

## 5. Utiliser le backend dans tes écrans

### Savoir qui est connecté
```ts
import { getCurrentUser } from '@/lib/supabase/get-user'
const user = await getCurrentUser()   // null si non connecté, sinon { id, email, role, ... }
```

### Protéger une page par rôle
```ts
import { requireRole } from '@/lib/supabase/require-role'
await requireRole(['medecin'])        // redirige si le rôle ne correspond pas
```

### Connexion / inscription / déconnexion
Utilise les Server Actions de `app/auth/actions.ts` comme `action` d'un `<form>` :
```tsx
<form action={signIn}>
  <input name="email" type="email" required />
  <input name="password" type="password" required />
  <button>Se connecter</button>
</form>
```
Les erreurs reviennent en `/login?error=...` : affiche-les.

### Lire des données
- **Côté serveur** (recommandé) : `const supabase = await createClient()` depuis `lib/supabase/server.ts`.
- **Côté navigateur** : `createClient()` depuis `lib/supabase/client.ts`.
- La sécurité est assurée par la base (RLS) : si une requête renvoie vide, c'est souvent que la RLS refuse, pas un bug.

### Recherche de médecins
```ts
const { data } = await supabase.from('doctors_public').select('*')
```
**Toujours `doctors_public`**, jamais `profiles` (voir règles).

---

## 6. Règles à respecter (important)

1. **`SUPABASE_SERVICE_ROLE_KEY` : serveur seulement.** Jamais dans un composant `"use client"`, jamais avec `NEXT_PUBLIC_`, jamais commitée.
2. **Ne jamais commiter `.env.local`.**
3. **Rôle et statut médecin** ne se changent **que** côté serveur avec le client admin (ce qui est déjà fait dans `app/admin/medecins/actions.ts`). Ne tente pas de les modifier depuis le navigateur.
4. **Recherche de médecins = `doctors_public`.** Aucune coordonnée personnelle du médecin (téléphone, email) ne doit apparaître côté patient (exigence du client).
5. **Utiliser `getUser()` et non `getSession()`** pour vérifier l'identité côté serveur.
6. **Ordonnances/documents médicaux** disparaissent **30 jours** après consultation (tâche `pg_cron` quotidienne). Prévois un message clair dans l'UI.
7. **Le médecin ne voit que sa part** (70 %), jamais la commission de la plateforme ni les chiffres globaux. Le patient **n'a pas** la rubrique « dépenses ce mois ».
8. **Paiements : mock uniquement.** Ne branche aucun vrai opérateur (pawaPay/SerdiPay…) sans avenant signé.
9. **Un seul code pour mobile/web** : pense responsive, l'app mobile arrivera ensuite avec le même backend.
10. **Branches** : ne pousse pas sur `main`. `git checkout -b feature/nom-ecran`, puis Pull Request. Jamais de `git push --force`.

---

## 7. Les tables expliquées

| Table / objet | Rôle | Utile pour tes écrans |
|---|---|---|
| `profiles` | Un profil par utilisateur (nom, téléphone, avatar, **rôle**). Créé automatiquement à l'inscription (rôle `patient`). | Écran profil, affichage du nom/avatar, menus selon rôle |
| `doctor_profiles` | Infos pro du médecin : spécialité, bio, **honoraire**, **statut** (`en_attente`/`valide`/`rejete`), motif de rejet, commission (30 %). | Candidature médecin, statut de dossier, fiche médecin |
| `doctors_public` (vue) | Médecins **validés** sans données privées. | **Recherche, liste, fiche médecin côté patient** |
| `availabilities` | Créneaux de disponibilité du médecin (pas de chevauchement possible). | Agenda médecin, choix de créneau patient |
| `appointments` | Rendez-vous patient ↔ médecin, statut, frais de réservation (1 $). | « Mes rendez-vous », réserver, annuler |
| `consultations` | Déroulé de la téléconsultation (début, fin, lien visio, notes). | Salle de visio, historique médecin |
| `prescriptions` | Ordonnances, **expirent à +30 jours**. | « Mes ordonnances » |
| `notifications` | Messages in-app par utilisateur. | Cloche de notifications |
| `payments` | Paiements (réservation, honoraire). Écriture réservée au serveur. | Lecture du statut de paiement seulement |
| `ledger_entries` | Écritures comptables 70/30. Serveur uniquement. | Écran « mes gains » du médecin (sa part) |
| `payouts` | Reversements au médecin (samedi). Serveur uniquement. | Historique des reversements |
| `webhook_events` | Journal des notifications opérateurs (idempotence). Interne. | Aucun (ne pas toucher) |
| `current_user_role()` | Fonction : rôle de l'utilisateur courant, utilisée par la RLS. | — |
| `handle_new_user()` | Trigger : crée le profil à l'inscription. | — |
| `book_appointment(id)` | Fonction : réserve un créneau de façon atomique (pas de double réservation). Appelle-la avec `supabase.rpc('book_appointment', { p_availability_id })`. | Bouton « Réserver » |
| `pay_reservation_mock(id)` | Fonction : simule le paiement des 1 $ de réservation, confirme le rendez-vous. | Bouton « Payer » (test) |
| `refuse_appointment(id, motif)` | Fonction : le médecin refuse un rendez-vous, le patient est remboursé (mock), le créneau est libéré. | Bouton « Refuser » côté médecin |
| `cancel_appointment(id, motif)` | Fonction : annule un rendez-vous (règle : 24h avant pour le patient). | Bouton « Annuler » |

⚠️ **Important** : depuis ce module, `appointments` ne s'écrit plus jamais directement (`insert`/`update`) depuis le code — uniquement via ces 4 fonctions (`supabase.rpc(...)`), pour garder le contrôle du statut et du paiement.

Tout est protégé par **RLS** : un patient ne voit que ses données, un médecin ses patients/rendez-vous, l'admin ce qui lui est ouvert.

---

## 8. Carte des écrans (maquette → code)

Maquette de référence : https://quatro-monganga-app.netlify.app (site **statique**, pas Next.js : les écrans sont à **porter** en composants React/Tailwind).

### Pages publiques
| Écran maquette | Route Next | Backend |
|---|---|---|
| Accueil | `/` | ✅ (remplace la page par défaut) |
| `/public/how` Comment ça marche | `/comment-ca-marche` | — (statique) |
| `/public/doctors` Médecins | `/medecins` | ✅ `doctors_public` |
| `/public/pricing` Tarifs | `/tarifs` | ⚠️ voir §10 |
| `/public/faq` | `/faq` | — |
| `/public/contact` | `/contact` | 🔜 |
| `/public/candidature` | `/medecin/candidature` | ✅ (texte seulement, upload documents 🔜) |
| `/public/conditions-utilisation`, `politique-confidentialite`, `mentions-legales` | mêmes noms en français | — (statique) |

### Authentification
| Maquette | Route Next | Backend |
|---|---|---|
| `/auth/login`, `/auth/register` | `/login` (ou adapte, voir §9) | ✅ email + mot de passe |

### Espaces connectés (selon rôle)
| Espace | Écrans | Backend |
|---|---|---|
| Patient | Tableau de bord, rechercher un médecin, réserver, mes rendez-vous, visio, mes ordonnances, profil | 🔜 appointments / consultations / prescriptions |
| Médecin | Tableau de bord, agenda & disponibilités, rendez-vous, visio, mes gains (sa part), profil | 🔜 |
| Admin | Candidatures médecins, utilisateurs, suivi | ✅ candidatures (`/admin/medecins`), reste 🔜 |

Légende : ✅ prêt · 🔜 module à venir (Junior te prévient) · ⛔ hors devis.
Commence par ce qui est ✅ : accueil, pages statiques, login/inscription, liste médecins, candidature, admin candidatures.

---

## 9. Intégrer le site existant

1. Mets le site de la maquette dans un dossier **`maquette/`** (référence, hors build) : il ne doit pas être importé par Next.
2. Porte les écrans **un par un** vers `app/...` en composants Next/Tailwind, sur une branche par écran.
3. **Routes** : la maquette utilise `/auth/login` ; le backend `/login`. Soit tu crées `app/auth/login/page.tsx` et tu mets à jour les `redirect()` de `app/auth/actions.ts`, soit tu gardes `/login`. Garde la cohérence partout.
4. **Inscription** : la maquette montre téléphone + OTP ; le backend est email + mot de passe pour l'instant. Garde email + mot de passe en attendant la décision du client.
5. Après connexion, redirige selon le rôle : patient → espace patient, médecin → espace médecin, admin → `/admin`.

---

## 10. Points ouverts avec le client (ne pas figer l'UI dessus)

- **Tarifs** : la maquette affiche 20 $/30 $ fixes, mais le client dit que chaque médecin fixe ses honoraires → afficher `consultation_fee` du médecin.
- Délai d'annulation, motif de refus, historique visible au médecin, accès admin aux ordonnances, nouvelle candidature après rejet, tolérance en cas d'absence.
- Conservation 1 mois vs « historique/ordonnances » du devis.
- Devise (FC/USD), frais de transfert, montant « somme rentrante 10 $ ».
- Upload des pièces de candidature (CNI, diplôme, Ordre, CV) → Supabase Storage, pas encore fait.

---

## 11. Checklist avant chaque Pull Request

- [ ] `npm run build` passe sans erreur
- [ ] Aucun secret dans le code ni dans le diff (`git diff` relu)
- [ ] `.env.local` non suivi par git
- [ ] Testé avec 3 comptes : patient, médecin, admin
- [ ] Aucune donnée privée de médecin visible côté patient
- [ ] Responsive (mobile d'abord)

## 12. Contact

Junior (BisoTech) pour la base de données, les accès, les promotions de rôle et toute décision produit. En cas de doute sur la sécurité : **demande avant de coder**.
# MONGANGA — Plateforme de téléconsultation médicale

> Projet BisoTech pour Russel Nete Bezo (Kinshasa, RDC).
> **Backend** (Supabase + Next.js) : fait par Junior. **Frontend / écrans** : Pontien.
> Ce document est confidentiel (NDA). Dépôt **privé** uniquement.

---

## 1. Ce qui est déjà prêt / ce que tu dois faire

| Zone | État | Qui |
|---|---|---|
| Base de données, sécurité (RLS), rôles | ✅ Prêt | Junior |
| Inscription / connexion / déconnexion | ✅ Prêt (email + mot de passe) | Junior |
| Rôles patient / médecin / admin + protection des pages | ✅ Prêt | Junior |
| Candidature médecin + validation/rejet par l'admin | ✅ Prêt (écrans de test basiques) | Junior |
| Liste publique des médecins validés | ✅ Prêt | Junior |
| **Tous les écrans définitifs (design de la maquette)** | 🔜 **À faire** | **Pontien** |
| Disponibilités médecin + réservation + paiement réservation (mock) + refus/annulation | ✅ Prêt (écrans de test) | Junior |
| Visio, consultation, no-show, ordonnances, notifications temps réel | 🔜 Modules suivants | Junior |
| Paiements (1 $, honoraires, reversements) | ⛔ Hors devis, en **mock** pour l'instant | — |

**Ta mission** : reprendre les écrans de la maquette et les brancher sur le backend, écran par écran, sans casser la sécurité (section 6).

---

## 2. Stack

- **Next.js 16** (App Router, Turbopack), **TypeScript**, **Tailwind CSS**
- **Supabase** : Postgres, Auth, RLS, pg_cron (Edge Functions plus tard)
- `@supabase/ssr` + `@supabase/supabase-js`
- ⚠️ Next 16 : le « middleware » s'appelle **`proxy.ts`** et exporte `proxy()` (pas `middleware()`).

---

## 3. Démarrage rapide

```bash
git clone https://github.com/PontienElquatro/Monganga-app.git
cd Monganga-app
npm install
```

1. Junior t'envoie **en privé** (WhatsApp/Signal, pas sur GitHub) le fichier `.env.local`.
2. Place-le **à la racine** du projet (même niveau que `package.json`). Modèle : `.env.example`.
3. Lance :

```bash
npm run dev
```

Ouvre http://localhost:3000.

**Vérifie que `.env.local` est ignoré par git** : `git check-ignore .env.local` doit afficher `.env.local`.

### Comptes de test
Crée-toi un compte via `/login` (inscription). Par défaut tout nouveau compte est **patient**. Pour tester les rôles médecin/admin, demande à Junior de te promouvoir (c'est volontairement impossible depuis l'app).

### Base de données
Déjà installée sur le projet Supabase partagé. Les scripts sont dans `supabase/` pour référence :
- `01_schema.sql` : tables, enums, RLS, triggers, tâche planifiée.
- `02_patches.sql` : permissions (GRANT), vue `doctors_public`, correctifs de sécurité.
- `03_rendezvous.sql` : fonctions de réservation (`book_appointment`, `pay_reservation_mock`, `refuse_appointment`, `cancel_appointment`) et nettoyage des réservations non payées.

Ne les relance **pas** sur le projet partagé. Toute modification de la base passe par Junior.

---

## 4. Structure du dépôt

```
proxy.ts                      # Rafraîchit la session à chaque requête (ne pas supprimer)
lib/supabase/
  client.ts                   # Client navigateur (composants "use client")
  server.ts                   # Client serveur (Server Components / Actions)
  middleware.ts               # Logique de session utilisée par proxy.ts
  admin.ts                    # Client service_role (SERVEUR UNIQUEMENT)
  get-user.ts                 # getCurrentUser() : utilisateur + rôle
  require-role.ts             # requireRole(['admin']) : protège une page
app/
  auth/actions.ts             # signUp / signIn / signOut (Server Actions)
  login/page.tsx              # Écran connexion/inscription (test)
  admin/page.tsx              # Tableau de bord admin (test)
  admin/medecins/             # Valider / rejeter les candidatures
  medecin/candidature/        # Formulaire de candidature médecin
  medecins/page.tsx           # Liste publique des médecins
supabase/                     # Scripts SQL (référence)
```

Les écrans « test » existants sont **fonctionnels mais sans design** : tu les remplaces visuellement en gardant les Server Actions.

---

## 5. Utiliser le backend dans tes écrans

### Savoir qui est connecté
```ts
import { getCurrentUser } from '@/lib/supabase/get-user'
const user = await getCurrentUser()   // null si non connecté, sinon { id, email, role, ... }
```

### Protéger une page par rôle
```ts
import { requireRole } from '@/lib/supabase/require-role'
await requireRole(['medecin'])        // redirige si le rôle ne correspond pas
```

### Connexion / inscription / déconnexion
Utilise les Server Actions de `app/auth/actions.ts` comme `action` d'un `<form>` :
```tsx
<form action={signIn}>
  <input name="email" type="email" required />
  <input name="password" type="password" required />
  <button>Se connecter</button>
</form>
```
Les erreurs reviennent en `/login?error=...` : affiche-les.

### Lire des données
- **Côté serveur** (recommandé) : `const supabase = await createClient()` depuis `lib/supabase/server.ts`.
- **Côté navigateur** : `createClient()` depuis `lib/supabase/client.ts`.
- La sécurité est assurée par la base (RLS) : si une requête renvoie vide, c'est souvent que la RLS refuse, pas un bug.

### Recherche de médecins
```ts
const { data } = await supabase.from('doctors_public').select('*')
```
**Toujours `doctors_public`**, jamais `profiles` (voir règles).

---

## 6. Règles à respecter (important)

1. **`SUPABASE_SERVICE_ROLE_KEY` : serveur seulement.** Jamais dans un composant `"use client"`, jamais avec `NEXT_PUBLIC_`, jamais commitée.
2. **Ne jamais commiter `.env.local`.**
3. **Rôle et statut médecin** ne se changent **que** côté serveur avec le client admin (ce qui est déjà fait dans `app/admin/medecins/actions.ts`). Ne tente pas de les modifier depuis le navigateur.
4. **Recherche de médecins = `doctors_public`.** Aucune coordonnée personnelle du médecin (téléphone, email) ne doit apparaître côté patient (exigence du client).
5. **Utiliser `getUser()` et non `getSession()`** pour vérifier l'identité côté serveur.
6. **Ordonnances/documents médicaux** disparaissent **30 jours** après consultation (tâche `pg_cron` quotidienne). Prévois un message clair dans l'UI.
7. **Le médecin ne voit que sa part** (70 %), jamais la commission de la plateforme ni les chiffres globaux. Le patient **n'a pas** la rubrique « dépenses ce mois ».
8. **Paiements : mock uniquement.** Ne branche aucun vrai opérateur (pawaPay/SerdiPay…) sans avenant signé.
9. **Un seul code pour mobile/web** : pense responsive, l'app mobile arrivera ensuite avec le même backend.
10. **Branches** : ne pousse pas sur `main`. `git checkout -b feature/nom-ecran`, puis Pull Request. Jamais de `git push --force`.

---

## 7. Les tables expliquées

| Table / objet | Rôle | Utile pour tes écrans |
|---|---|---|
| `profiles` | Un profil par utilisateur (nom, téléphone, avatar, **rôle**). Créé automatiquement à l'inscription (rôle `patient`). | Écran profil, affichage du nom/avatar, menus selon rôle |
| `doctor_profiles` | Infos pro du médecin : spécialité, bio, **honoraire**, **statut** (`en_attente`/`valide`/`rejete`), motif de rejet, commission (30 %). | Candidature médecin, statut de dossier, fiche médecin |
| `doctors_public` (vue) | Médecins **validés** sans données privées. | **Recherche, liste, fiche médecin côté patient** |
| `availabilities` | Créneaux de disponibilité du médecin (pas de chevauchement possible). | Agenda médecin, choix de créneau patient |
| `appointments` | Rendez-vous patient ↔ médecin, statut, frais de réservation (1 $). | « Mes rendez-vous », réserver, annuler |
| `consultations` | Déroulé de la téléconsultation (début, fin, lien visio, notes). | Salle de visio, historique médecin |
| `prescriptions` | Ordonnances, **expirent à +30 jours**. | « Mes ordonnances » |
| `notifications` | Messages in-app par utilisateur. | Cloche de notifications |
| `payments` | Paiements (réservation, honoraire). Écriture réservée au serveur. | Lecture du statut de paiement seulement |
| `ledger_entries` | Écritures comptables 70/30. Serveur uniquement. | Écran « mes gains » du médecin (sa part) |
| `payouts` | Reversements au médecin (samedi). Serveur uniquement. | Historique des reversements |
| `webhook_events` | Journal des notifications opérateurs (idempotence). Interne. | Aucun (ne pas toucher) |
| `current_user_role()` | Fonction : rôle de l'utilisateur courant, utilisée par la RLS. | — |
| `handle_new_user()` | Trigger : crée le profil à l'inscription. | — |
| `book_appointment(id)` | Fonction : réserve un créneau de façon atomique (pas de double réservation). Appelle-la avec `supabase.rpc('book_appointment', { p_availability_id })`. | Bouton « Réserver » |
| `pay_reservation_mock(id)` | Fonction : simule le paiement des 1 $ de réservation, confirme le rendez-vous. | Bouton « Payer » (test) |
| `refuse_appointment(id, motif)` | Fonction : le médecin refuse un rendez-vous, le patient est remboursé (mock), le créneau est libéré. | Bouton « Refuser » côté médecin |
| `cancel_appointment(id, motif)` | Fonction : annule un rendez-vous (règle : 24h avant pour le patient). | Bouton « Annuler » |

⚠️ **Important** : depuis ce module, `appointments` ne s'écrit plus jamais directement (`insert`/`update`) depuis le code — uniquement via ces 4 fonctions (`supabase.rpc(...)`), pour garder le contrôle du statut et du paiement.

Tout est protégé par **RLS** : un patient ne voit que ses données, un médecin ses patients/rendez-vous, l'admin ce qui lui est ouvert.

---

## 8. Carte des écrans (maquette → code)

Maquette de référence : https://quatro-monganga-app.netlify.app (site **statique**, pas Next.js : les écrans sont à **porter** en composants React/Tailwind).

### Pages publiques
| Écran maquette | Route Next | Backend |
|---|---|---|
| Accueil | `/` | ✅ (remplace la page par défaut) |
| `/public/how` Comment ça marche | `/comment-ca-marche` | — (statique) |
| `/public/doctors` Médecins | `/medecins` | ✅ `doctors_public` |
| `/public/pricing` Tarifs | `/tarifs` | ⚠️ voir §10 |
| `/public/faq` | `/faq` | — |
| `/public/contact` | `/contact` | 🔜 |
| `/public/candidature` | `/medecin/candidature` | ✅ (texte seulement, upload documents 🔜) |
| `/public/conditions-utilisation`, `politique-confidentialite`, `mentions-legales` | mêmes noms en français | — (statique) |

### Authentification
| Maquette | Route Next | Backend |
|---|---|---|
| `/auth/login`, `/auth/register` | `/login` (ou adapte, voir §9) | ✅ email + mot de passe |

### Espaces connectés (selon rôle)
| Espace | Écrans | Backend |
|---|---|---|
| Patient | Tableau de bord, rechercher un médecin, réserver, mes rendez-vous, visio, mes ordonnances, profil | 🔜 appointments / consultations / prescriptions |
| Médecin | Tableau de bord, agenda & disponibilités, rendez-vous, visio, mes gains (sa part), profil | 🔜 |
| Admin | Candidatures médecins, utilisateurs, suivi | ✅ candidatures (`/admin/medecins`), reste 🔜 |

Légende : ✅ prêt · 🔜 module à venir (Junior te prévient) · ⛔ hors devis.
Commence par ce qui est ✅ : accueil, pages statiques, login/inscription, liste médecins, candidature, admin candidatures.

---

## 9. Intégrer le site existant

1. Mets le site de la maquette dans un dossier **`maquette/`** (référence, hors build) : il ne doit pas être importé par Next.
2. Porte les écrans **un par un** vers `app/...` en composants Next/Tailwind, sur une branche par écran.
3. **Routes** : la maquette utilise `/auth/login` ; le backend `/login`. Soit tu crées `app/auth/login/page.tsx` et tu mets à jour les `redirect()` de `app/auth/actions.ts`, soit tu gardes `/login`. Garde la cohérence partout.
4. **Inscription** : la maquette montre téléphone + OTP ; le backend est email + mot de passe pour l'instant. Garde email + mot de passe en attendant la décision du client.
5. Après connexion, redirige selon le rôle : patient → espace patient, médecin → espace médecin, admin → `/admin`.

---

## 10. Points ouverts avec le client (ne pas figer l'UI dessus)

- **Tarifs** : la maquette affiche 20 $/30 $ fixes, mais le client dit que chaque médecin fixe ses honoraires → afficher `consultation_fee` du médecin.
- Délai d'annulation, motif de refus, historique visible au médecin, accès admin aux ordonnances, nouvelle candidature après rejet, tolérance en cas d'absence.
- Conservation 1 mois vs « historique/ordonnances » du devis.
- Devise (FC/USD), frais de transfert, montant « somme rentrante 10 $ ».
- Upload des pièces de candidature (CNI, diplôme, Ordre, CV) → Supabase Storage, pas encore fait.

---

## 11. Checklist avant chaque Pull Request

- [ ] `npm run build` passe sans erreur
- [ ] Aucun secret dans le code ni dans le diff (`git diff` relu)
- [ ] `.env.local` non suivi par git
- [ ] Testé avec 3 comptes : patient, médecin, admin
- [ ] Aucune donnée privée de médecin visible côté patient
- [ ] Responsive (mobile d'abord)

## 12. Contact

Junior (BisoTech) pour la base de données, les accès, les promotions de rôle et toute décision produit. En cas de doute sur la sécurité : **demande avant de coder**.

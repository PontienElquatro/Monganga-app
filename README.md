# MONGANGA na Tshombo — plateforme web (v2)

Consultation médicale en visio pour Kinshasa. Réalisé par **BisoTech** pour NETE BEZO.

- **Patients** : recherche d’un médecin vérifié, réservation avec un acompte de 1 $, solde payé le jour J, visio de 30 minutes, ordonnance PDF avec QR code.
- **Médecins** : candidature avec pièces justificatives, créneaux, agenda, salle de consultation (notes privées, ordonnance), revenus et versements du samedi.
- **Administration** (web uniquement) : validation des dossiers, commissions, remboursements, versements, rapports, paramètres.

Pile technique : Next.js 16 (App Router) · React 19 · TypeScript · Supabase (Postgres, Auth, Storage, Realtime) · Daily.co · Resend · Cloudinary · prestataire de paiement (MaishaPay prévu). Hébergement : Vercel.

> **Services en mode test.** Tant que les clés ne sont pas renseignées, les paiements sont simulés, la visio est remplacée par un écran de test et les e-mails sont seulement écrits dans les journaux. Un bandeau jaune le rappelle dans chaque espace. Voir [docs/BRANCHEMENT-API.md](docs/BRANCHEMENT-API.md).

---

## 1. Démarrer en local

Prérequis : Node.js 22.12 ou plus récent, un projet Supabase.

```bash
npm install
cp .env.example .env.local      # puis remplir les valeurs Supabase
npm run dev                      # http://localhost:3000
```

Vérifications : `npm run typecheck`, `npm run lint`, `npm run build`.

## 2. Base de données (Supabase)

Tout est dans `supabase/migrations/` (à exécuter **dans l’ordre**, sur un projet **neuf**) :

| Fichier | Contenu |
|---|---|
| `…0001_schema.sql` | Tables, types, paramètres par défaut |
| `…0002_securite.sql` | Création du profil à l’inscription, règles d’accès (RLS) sur toutes les tables, droits par colonne |
| `…0003_fonctions.sql` | Toute la logique métier : réservation, paiements, annulations, absences, consultation, ordonnance, répartition 70/30, versements, tâche périodique `tick()` |
| `…0004_stockage_temps_reel_cron.sql` | Espaces de stockage privés, temps réel, tâche pg_cron (chaque minute) |

Deux façons de les appliquer :
- **Supabase CLI** : `supabase link --project-ref <ref>` puis `supabase db push` ;
- **ou** l’éditeur SQL du tableau de bord : coller chaque fichier, dans l’ordre, et exécuter.

Tests automatiques (82 vérifications, sur un PostgreSQL 16 local, sans toucher à Supabase) :
```bash
PGHOST=127.0.0.1 PGPORT=5432 PGUSER=postgres npm run test:db
```

### Réglages Supabase à faire une fois

1. **Authentication → URL Configuration** : *Site URL* = l’adresse du site (ex. `https://monganga.vercel.app`) ; ajouter `https://<site>/auth/confirm` dans *Redirect URLs* (et `http://localhost:3000/auth/confirm` pour le développement).
2. **Authentication → Email Templates** : remplacer le lien des modèles par la version « token_hash » (fonctionne sur tous les appareils) :
   - *Confirm signup* : `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`
   - *Reset password* : `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery`
3. **Authentication → SMTP** : brancher Resend (ou un autre SMTP) pour que les e-mails de confirmation partent depuis l’adresse MONGANGA (le SMTP par défaut de Supabase est très limité).
4. **Database → Extensions** : vérifier que `pg_cron` est activé (la migration 4 planifie `tick()` chaque minute). Activer aussi `pg_net` pour l’étape 5.
5. **Envoi régulier des e-mails** (recommandé) : dans l’éditeur SQL, avec la vraie adresse et le vrai secret :
   ```sql
   select cron.schedule('monganga-emails', '*/5 * * * *', $$
     select net.http_get(
       url := 'https://<site>/api/cron',
       headers := jsonb_build_object('Authorization', 'Bearer <CRON_SECRET>')
     )
   $$);
   ```
   (Vercel appelle aussi `/api/cron` une fois par jour, voir `vercel.json`. Avec un plan Vercel Pro, on peut passer à `*/5 * * * *`.)

### Premier administrateur

Personne ne peut devenir administrateur depuis le site. Créer un compte patient normal, confirmer l’e-mail, puis dans l’éditeur SQL :
```sql
update public.profiles set role = 'admin' where email = 'adresse@exemple.com';
```

## 3. Variables d’environnement

Voir `.env.example` (aucune vraie valeur dans le dépôt). Sur Vercel : *Project → Settings → Environment Variables*.

| Variable | Obligatoire | Rôle |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | oui | Adresse publique (liens des e-mails, QR code des ordonnances) |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | oui | Connexion Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | oui | **Serveur uniquement** : webhooks, tâche planifiée, e-mails |
| `CRON_SECRET` | oui | Protège `/api/cron` |
| `PAYMENT_PROVIDER` | oui | `test` (simulation) ou `maishapay` |
| `DAILY_API_KEY`, `DAILY_DOMAIN` | non | Visio réelle |
| `RESEND_API_KEY`, `EMAIL_FROM` | non | E-mails de notification |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | non | Photos de profil |

## 4. Organisation du code

```
app/
  (public)/        accueil, médecins, tarifs (sans prix), FAQ, pages légales, vérification d’ordonnance
  (auth)/          connexion, inscription patient / médecin, dossier de candidature, simulateur de paiement
  patient/         tableau de bord, recherche, réservation, paiement, RDV, salle, ordonnances, profil
  medecin/         tableau de bord, agenda, disponibilités, patients, salle, ordonnances, revenus, profil
  admin/           vue d’ensemble, validations, médecins, utilisateurs, transactions, versements, rapports, paramètres
  notifications/   commun à tous les rôles
  api/             webhook de paiement, tâche planifiée, PDF d’ordonnance, exports CSV
components/        interface (coques, formulaires, salle de consultation…)
lib/               accès aux données, règles d’affichage, services externes (lib/services)
supabase/          migrations SQL et tests
```

Principes :
- **La base décide.** Chaque règle (montants, délais, droits) est vérifiée dans Postgres ; l’écran n’est qu’une vitrine. Les montants sont en **centimes de dollar**, les heures affichées en **heure de Kinshasa**.
- **Confidentialité.** Les patients ne voient jamais les coordonnées des médecins ; les médecins ne voient pas la commission ; l’administration n’a pas accès aux ordonnances, notes ni messages ; les notes de qualité ne sont visibles que par l’administration. Ordonnances, messages, notes et documents sont supprimés 30 jours après la consultation.
- **La clé `service_role`** n’est utilisée que côté serveur (`lib/supabase/admin.ts`), jamais dans le navigateur.

## 5. Mise en ligne (Vercel)

1. Importer le dépôt sur Vercel (framework Next.js détecté).
2. Renseigner les variables d’environnement.
3. Déployer, puis reporter l’adresse obtenue dans Supabase (Site URL, Redirect URLs) et dans `NEXT_PUBLIC_SITE_URL`.

Documents utiles : [docs/BRANCHEMENT-API.md](docs/BRANCHEMENT-API.md) (brancher les services réels) · [docs/TESTS.md](docs/TESTS.md) (parcours de test).

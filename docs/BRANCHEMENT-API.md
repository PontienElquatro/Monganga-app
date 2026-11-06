# Brancher les services réels

La plateforme fonctionne entièrement en **mode test**. Brancher un service revient à renseigner ses clés (et, pour le paiement, à écrire l’adaptateur). Aucun autre fichier n’est à modifier.

| Service | Mode test (clé absente) | Pour passer en réel |
|---|---|---|
| Paiement | Écran `/paiement-test/<id>` : « Simuler un paiement réussi / un échec » | Adaptateur `lib/services/paiement/maishapay.ts` + `PAYMENT_PROVIDER=maishapay` |
| Visio Daily.co | Écran de test dans la salle (minuteur, chat et documents fonctionnent) | `DAILY_API_KEY`, `DAILY_DOMAIN` |
| E-mails Resend | Les e-mails sont écrits dans les journaux du serveur | `RESEND_API_KEY`, `EMAIL_FROM` (domaine vérifié chez Resend) |
| Photos Cloudinary | Bouton « Ajouter une photo » désactivé | `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |

Après chaque changement de variable sur Vercel : **redéployer**.

---

## 1. Paiement (compte marchand)

Le parcours complet est déjà en place : création du paiement en base, envoi chez le prestataire, retour du patient, confirmation par webhook, répartition, remboursements. Il reste à écrire **deux fonctions** dans `lib/services/paiement/maishapay.ts`, avec la documentation remise à l’ouverture du compte marchand :

- `initiate(input)` : appeler l’API du prestataire avec `input.amountCents` (USD), `input.method` (`mpesa`, `orange_money`, `airtel_money`, `carte`), `input.phone`, la référence interne `input.paymentId` et l’adresse de rappel `input.callbackUrl`.
  - Mobile Money (le patient valide sur son téléphone) → renvoyer `{ kind: 'pending', message, providerRef }` : le patient voit une page d’attente qui se met à jour seule.
  - Carte (page sécurisée du prestataire) → renvoyer `{ kind: 'redirect', url, providerRef }` ; après paiement, le prestataire renvoie le patient vers `input.returnUrl`.
- `parseWebhook(request)` : **vérifier l’authenticité** de l’appel (signature ou secret `MAISHAPAY_CALLBACK_SECRET`), puis renvoyer `{ paymentId, providerRef, status: 'reussi' | 'echoue', reason?, raw }`.

Adresse de rappel à déclarer chez le prestataire : `https://<site>/api/paiements/webhook/maishapay`.

Le webhook est le **seul** chemin qui confirme un paiement réel ; il est idempotent (un rappel reçu deux fois ne compte qu’une fois). Si un paiement arrive après l’expiration d’une réservation, un remboursement est créé automatiquement.

**Remboursements et versements** : tant que l’API ne les automatise pas, l’administration les effectue depuis le compte marchand puis saisit la référence dans *Administration → Transactions* (remboursements) et *Administration → Versements* (versements du samedi, frais de transfert déduits).

Un autre prestataire (FlexPay, CinetPay…) se branche de la même façon : un fichier qui respecte `PaymentProvider` (`lib/services/paiement/types.ts`), déclaré dans `lib/services/paiement/index.ts`.

## 2. Visio — Daily.co

1. Tableau de bord Daily.co → *Developers* : copier la clé d’API → `DAILY_API_KEY`.
2. `DAILY_DOMAIN` = la partie avant `.daily.co` de l’adresse du compte (ex. `monganga` pour `monganga.daily.co`).

Fonctionnement (`lib/services/visio.ts`) : une salle **privée** par rendez-vous, 2 participants maximum, qui expire à la fermeture (10 min après la fin) ; chaque participant reçoit un accès nominatif qui expire au même moment ; le médecin est propriétaire de la salle. Le chat Daily est désactivé : messages et documents passent par MONGANGA (conservés 30 jours puis supprimés).

## 3. E-mails — Resend

1. Resend → *Domains* : ajouter et vérifier le domaine d’envoi (enregistrements DNS).
2. Resend → *API Keys* → `RESEND_API_KEY`. `EMAIL_FROM` = ex. `MONGANGA <notifications@monganga.cd>`.
3. Recommandé : utiliser aussi Resend comme SMTP de Supabase (*Authentication → SMTP*) pour les e-mails de confirmation d’inscription et de mot de passe.

Les notifications sont d’abord écrites en base (visibles dans l’application), puis envoyées par e-mail juste après l’action et par la tâche `/api/cron` (voir README, étape 5).

## 4. Photos de profil — Cloudinary

Cloudinary → *Settings → API Keys* : nom du cloud, clé et secret. L’envoi se fait directement du navigateur vers Cloudinary avec une signature calculée par le serveur (le secret ne quitte jamais le serveur) ; l’image est recadrée en 400×400 sur le visage. Seules les adresses de notre propre compte Cloudinary sont acceptées en base.

Les pièces des candidatures médecins (diplômes, identité…) ne vont **pas** sur Cloudinary : elles restent dans l’espace privé Supabase `candidatures`, lisible seulement par le candidat et l’administration.

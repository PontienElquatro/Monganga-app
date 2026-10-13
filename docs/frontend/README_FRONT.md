# MONGANGA — Next.js

Migration du projet fourni vers **Next.js 16.3.8 / React 19 / App Router**. Les 38 écrans, couleurs, typographies, mises en page, graphiques et parcours de démonstration sont conservés.

## Lancer le projet

Installer Node.js 22.12 ou supérieur (Node.js 24 recommandé), ouvrir un terminal dans ce dossier puis :

```bash
npm ci
npm run dev
```

Ouvrir **http://localhost:3000**. Aucun fichier `.env` n’est nécessaire pour la démonstration.

Pour la production :

```bash
npm run build
npm start
```

## Tester les espaces

Ouvrir `/auth/login`, choisir **Patient**, **Médecin** ou **Admin**, puis cliquer sur **Se connecter**. Les identifiants sont remplis automatiquement. Mot de passe de démo : `Demo1234`. Inscription patient : code OTP simulé `123456`.

Utiliser le même onglet pour passer d’un rôle à l’autre et suivre les mêmes rendez-vous. Les données fictives sont conservées dans le stockage de session. Le mode démo ne débite aucun paiement et n’établit aucun appel médical distant.

## Organisation

- `app/` : pages JSX rendues par Next.js, métadonnées, page 404 et routes API.
- `components/Runtime.jsx` : initialisation des fonctionnalités existantes après hydratation React, chargement ordonné et branchement des actions.
- `public/assets/` : styles, polices, images, icônes et contrôleurs métier conservés.
- `app/api/v1/[...path]/route.js` : proxy serveur configurable vers le backend.
- `docs/routes.json` : liste des 38 routes.
- `docs/openapi.json` et `BACKEND_INTEGRATION.md` : contrat et consignes backend.
- `tests/` : tests métier, proxy et parcours navigateur.

Les URL n’ont plus d’extension : `/public/faq`, `/patient/dashboard`, `/doctor/agenda`, etc. Les anciennes adresses `.html` redirigent vers les nouvelles en conservant les paramètres.

## Périmètre de la migration

Les pages statiques sont converties en JSX ; Next.js assure le routage, le rendu et le build. Les contrôleurs existants continuent à gérer les tableaux, formulaires et dialogues avec le DOM. Il s’agit d’une migration progressive, pas d’une réécriture complète de tous les widgets avec l’état React.

La navigation entre pages recharge volontairement le document pour isoler les écouteurs, temporisateurs et ressources média des anciens contrôleurs. Ne remplacer ces liens par `next/link` qu’après avoir porté les widgets concernés en composants React avec nettoyage des effets. Ne pas faire de mise à jour React du DOM que ces contrôleurs gèrent déjà.

Les images et les feuilles de styles par page sont conservées avec leurs dimensions originales pour préserver le rendu. Les polices et icônes sont locales ; aucun CDN n’est requis en démo.

## Connecter le backend réel

Copier `.env.example` vers `.env.local`, puis définir :

```dotenv
NEXT_PUBLIC_MONGANGA_MODE=api
MONGANGA_BACKEND_URL=http://localhost:4000
```

Le backend doit exposer `/api/v1` sur cette origine. Le navigateur utilise le proxy Next.js de même origine ; l’adresse du backend reste côté serveur. Configurer aussi les origines de paiement et de documents si nécessaire. Redémarrer le développement ou reconstruire la production après changement des variables publiques.

Sans backend, le mode API affiche une erreur explicite. L’authentification réelle, les autorisations serveur, la base de données, MaishaPay, les SMS, la vidéo et les documents signés restent à implémenter côté backend. Les contrôles d’accès de la démo ne constituent pas une protection serveur des données réelles.

## Vérifications reproductibles

```bash
npm test
npm run build
npx playwright install chromium
npm run test:restoration
npm run test:browser
npm run test:api-browser
```

Les suites navigateur démarrent et arrêtent le serveur de production elles-mêmes ; exécuter le build avant. On peut aussi définir `BASE_URL` pour un serveur déjà lancé. `CHROMIUM_EXECUTABLE` permet d’utiliser un Chromium installé localement. Exécuter les suites navigateur l’une après l’autre.

Les rapports et captures originaux dans `docs/` décrivent la livraison HTML précédente. La recette de cette migration figure dans `docs/RECETTE_NEXTJS.md`.

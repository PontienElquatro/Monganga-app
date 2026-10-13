# Recette de la migration Next.js

Validation réalisée le 2 octobre 2026, avec Node.js 24.19 et Chromium 153.

- Build de production : réussi ; 38 pages Next.js et un proxy HTTP dynamique.
- Tests métier, DOM, styles et proxy : 46 réussites, aucun échec.
- Parcours navigateur : 290 vérifications réussies, aucune erreur JavaScript non gérée.
- Restauration visuelle et authentification : mise en page des trois tableaux de bord, graphiques, menus mobiles, onglets patient/médecin, formulaire, mot de passe visible, inscription par téléphone, OTP et FAQ validés.
- Mode API simulé : identifiants incorrects, CSRF, connexion, restauration de session, erreur serveur sans médecins fictifs, compatibilité des anciennes URL et page 404 validés.
- Affichage : 360, 768, 1024 et 1440 pixels sur les pages couvertes par la suite navigateur ; absence de débordement vérifiée.
- Parcours transversal : recherche → réservation → échec de paiement → nouvelle tentative → paiement simulé réussi → déplacement → consultation médecin → message → fin de consultation → ordonnance → consultation patient → séparation des comptes → remboursement admin.

Le rapport détaillé est dans `browser-results-nextjs.json`. Des captures de cette version sont disponibles dans `captures-nextjs/`.

## Limites

Les tests utilisent des données et réponses HTTP fictives. Aucun vrai paiement MaishaPay, SMS, appel vidéo distant ou backend médical n’a été testé. La démonstration et le proxy de raccordement sont fonctionnels ; les services réels restent à fournir selon `BACKEND_INTEGRATION.md`.

Les contrôleurs historiques manipulent encore le DOM. La migration n’est pas une réécriture de tous les widgets en composants React : la navigation complète entre documents est conservée pour leur isolation.

## Reproduire

```bash
npm ci
npm run build
npm test
npx playwright install chromium
npm run test:restoration
npm run test:browser
npm run test:api-browser
```

Arrêter un serveur qui utilise déjà le port 3000 ou définir `BASE_URL`. Les trois suites navigateur doivent être exécutées successivement.

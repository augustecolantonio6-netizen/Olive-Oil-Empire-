# Olive Oil Empire 🫒

Jeu idle de production d'huile d'olive en français, jouable dans un navigateur sur PC et mobile.

## Jouer en local

1. Télécharge `index.html`.
2. Double-clique dessus pour l'ouvrir dans ton navigateur.

Pour une sauvegarde plus fiable, ouvre un terminal dans le dossier du fichier et lance :

```bash
python -m http.server 8000
```

Puis ouvre http://localhost:8000.

## Publier avec GitHub Pages

1. Ouvre **Settings → Pages** dans le dépôt.
2. Choisis **Deploy from a branch**.
3. Sélectionne la branche `main` et le dossier `/(root)`, puis clique **Save**.
4. Après le déploiement, GitHub affichera le lien du jeu dans cette page.

## Fonctionnalités

- 12 parcelles achetables, avec variétés et rendements différents.
- Récolte au clic ou au swipe.
- Amélioration des niveaux de parcelle payée en olives.
- Stockage automatisé achetable séparément : les récoltes peuvent s'empiler, mais il faut toujours récolter manuellement.
- Moulin : 10 kg d'olives produisent 1 unité d'huile et relancent le cycle des parcelles.
- Bonus permanent de rendement à chaque fabrication d'huile.
- Boutique d'améliorations permanentes payées en huile.
- Sauvegarde automatique via `localStorage`, export JSON et remise à zéro.
- Aucune progression hors ligne.

## Sauvegarde

La partie est stockée dans le navigateur utilisé. Elle n'est pas synchronisée entre plusieurs appareils ou navigateurs.

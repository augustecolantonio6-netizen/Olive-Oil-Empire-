# Olive Oil Empire 🫒

Un jeu idle d'oliveraie en 2D cartoon/isométrique, dans l'esprit des jeux de ferme mobiles : décor vivant, ruban de progression, petits arbres animés, bâtiments cliquables et panneaux de ressources.

## Jouer en local

1. Ouvre le fichier **index.html** du dépôt (bouton **Download raw** si besoin).
2. Double-clique sur le fichier téléchargé.

Pour une sauvegarde plus fiable, ouvre un terminal dans le dossier du fichier et lance :

```bash
python -m http.server 8000
```

Puis ouvre http://localhost:8000.

## Publier sur GitHub Pages

Le dépôt contient déjà le workflow `.github/workflows/pages.yml`.

1. Va dans [Settings → Pages](https://github.com/augustecolantonio6-netizen/Olive-Oil-Empire-/settings/pages).
2. Dans **Build and deployment → Source**, sélectionne **GitHub Actions**.
3. Va dans [Actions](https://github.com/augustecolantonio6-netizen/Olive-Oil-Empire-/actions) et vérifie que le workflow **Deploy Olive Oil Empire to GitHub Pages** termine avec une coche verte.
4. Le lien public apparaît ensuite dans **Settings → Pages**. Il devrait être : https://augustecolantonio6-netizen.github.io/Olive-Oil-Empire-/

Si tu vois une 404, vérifie d'abord que la source est bien réglée sur **GitHub Actions**, puis ouvre le dernier workflow dans Actions pour consulter l'erreur éventuelle.

## Jouer

- **Récolter :** clique sur un arbre mûr ou glisse la souris en passant sur plusieurs arbres.
- **Choisir une parcelle :** clique sur la terre autour des arbres pour ouvrir son panneau.
- **Débloquer une parcelle :** clique sur son cadenas et paie avec des olives.
- **Améliorer un terroir :** dans le panneau de parcelle, paie en olives pour augmenter son niveau et son rendement.
- **Empiler les récoltes :** paie l'automatisation de stockage. Les arbres continuent à pousser et les récoltes s'empilent, mais tu dois encore venir les cueillir.
- **Produire de l'huile :** clique sur le moulin quand tu as au moins 10 kg d'olives. Tu obtiens 1 kg d'huile et le terrain revient à une parcelle.
- **Prestige :** chaque huile produite ajoute un bonus de rendement permanent.
- **Boutique :** dépense l'huile pour des améliorations permanentes de rendement, de pousse et de capacité des paniers.

## Sauvegarde

La partie est sauvegardée automatiquement dans le navigateur et n'avance pas hors ligne. Elle n'est pas synchronisée entre appareils. Le menu ⚙ permet d'exporter ou d'importer un fichier JSON et de recommencer une partie.

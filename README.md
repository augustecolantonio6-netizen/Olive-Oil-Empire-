# Olive Oil Empire 🫒

Jeu idle d'oliveraie pour navigateur, en français, avec un décor cartoon isométrique inspiré des jeux de ferme mobiles.

## Lancer le jeu en local

**Télécharge le dépôt complet** avec **Code → Download ZIP**, puis décompresse-le. Conserve le dossier `assets/` à côté de `index.html` : il contient les sprites dessinés du jeu.

Pour ouvrir simplement le jeu, double-clique sur `index.html`.

Pour une sauvegarde plus fiable, ouvre un terminal dans le dossier et lance :

```bash
python -m http.server 8000
```

Puis ouvre http://localhost:8000.

## GitHub Pages

Le workflow `.github/workflows/pages.yml` publie les fichiers statiques après chaque commit sur `main`.

1. Ouvre [Settings → Pages](https://github.com/augustecolantonio6-netizen/Olive-Oil-Empire-/settings/pages).
2. Dans **Build and deployment → Source**, sélectionne **GitHub Actions**.
3. Vérifie le résultat dans [Actions](https://github.com/augustecolantonio6-netizen/Olive-Oil-Empire-/actions). Une coche verte confirme que la publication est terminée.
4. Le site devrait ensuite être disponible ici : https://augustecolantonio6-netizen.github.io/Olive-Oil-Empire-/

## Contenu du projet

Le dossier `assets/` contient des sprites SVG indépendants : quatre états d'olivier, parcelles ouvertes et verrouillées, maison provençale, grange rouge, moulin traditionnel et caisse de récolte. Ils sont intégrés au canvas et restent séparés de l'interface HTML, de la progression et de la sauvegarde.

## Commandes de jeu

- **Récolter :** clique sur un olivier mûr ou glisse sur plusieurs arbres.
- **Parcelle :** clique sur une parcelle pour l'acheter si elle est verrouillée, ou pour afficher ses améliorations.
- **Niveau :** dépense des olives pour augmenter le rendement du terroir.
- **Automatisation :** les olives peuvent pousser et s'empiler en plusieurs récoltes ; la cueillette reste toujours manuelle.
- **Moulin :** clique dessus avec au moins 10 kg d'olives pour produire 1 kg d'huile. La progression des parcelles repart à une seule parcelle, avec un bonus permanent de productivité.
- **Boutique :** dépense l'huile pour des bonus permanents de rendement, vitesse de pousse et capacité de stockage.

La sauvegarde est locale au navigateur, sans production hors ligne. Le menu ⚙ permet d'exporter ou d'importer un fichier JSON et de recommencer.

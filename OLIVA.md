# Oliva — nouvelle version

La branche `oliva` contient le nouveau jeu : oliveraie isométrique, interface idle, sauvegarde locale.

Le site GitHub Pages (branche `main`) continue de servir l'ancien `index.html`. Cette branche ne le remplace pas.

Les dessins (parcelle, olivier, maison, caisse) sont déposés en texte dans `public/art/b64/`. Pour obtenir les PNG :

```bash
npm install
node scripts/materialize-art.mjs
npm run dev
```

Une action GitHub sur `oliva` tente aussi de committer ces PNG après décodage.

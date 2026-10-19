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

Le workflow `.github/workflows/pages.yml` publie les fichiers statiques après chaque commit sur `main`. Avant publication, il vérifie la syntaxe JavaScript, les identifiants HTML utilisés par le jeu et la présence des sprites SVG. Une erreur bloque le déploiement au lieu de publier une version manifestement incomplète.

1. Ouvre [Settings → Pages](https://github.com/augustecolantonio6-netizen/Olive-Oil-Empire-/settings/pages).
2. Dans **Build and deployment → Source**, sélectionne **GitHub Actions**.
3. Vérifie le résultat dans [Actions](https://github.com/augustecolantonio6-netizen/Olive-Oil-Empire-/actions). Une coche verte confirme que les contrôles et la publication sont terminés.
4. Le site devrait ensuite être disponible ici : https://augustecolantonio6-netizen.github.io/Olive-Oil-Empire-/


## Contenu du projet

Le dossier `assets/` contient des sprites SVG indépendants : quatre états d'olivier, parcelles ouvertes et verrouillées, maison provençale, grange rouge, moulin traditionnel et caisse de récolte. Ils sont intégrés au canvas et restent séparés de l'interface HTML, de la progression et de la sauvegarde.

## Progression économique des 12 parcelles

Le rendement d'une récolte est calculé ainsi : **kg de base par arbre × nombre d'arbres × niveau de la parcelle × multiplicateur permanent**. Les coûts montent progressivement pour laisser un vrai choix entre acheter du terrain, améliorer un terroir et économiser pour le moulin.

| Parcelle | Style de terroir | Arbres | kg/arbre au niveau 1 | kg/récolte au niveau 1 | Coût de déblocage |
|---:|---|---:|---:|---:|---:|
| 1 | Départ — jeune | 1 | 1 | 1 | Déjà ouverte |
| 2 | Départ — jeune | 1 | 1,35 | 1,35 | 6 kg |
| 3 | Départ — jeune | 2 | 1,8 | 3,6 | 24 kg |
| 4 | Départ — jeune | 2 | 2,4 | 4,8 | 72 kg |
| 5 | Productif | 2 | 3,2 | 6,4 | 155 kg |
| 6 | Productif | 3 | 4,3 | 12,9 | 280 kg |
| 7 | Productif | 3 | 5,8 | 17,4 | 550 kg |
| 8 | Productif | 3 | 7,8 | 23,4 | 960 kg |
| 9 | Premium — ancien | 4 | 10,5 | 42 | 1 600 kg |
| 10 | Premium — ancien | 4 | 14 | 56 | 2 800 kg |
| 11 | Premium — ancien | 4 | 18,5 | 74 | 4 500 kg |
| 12 | Premium — ancien | 5 | 24 | 120 | 7 000 kg |

Les prix d'amélioration du niveau et du stockage sont calculés selon la productivité de la parcelle et le bonus permanent déjà obtenu ; le coût exact est affiché dans le panneau avant l'achat.

## Prestige et récompenses permanentes

Le stock **Huile disponible** est la monnaie que tu peux dépenser dans la boutique. **Huile cumulée à vie** est le total de toutes les huiles fabriquées : il ne diminue jamais lorsque tu achètes une amélioration et sert à calculer le bonus de prestige.

Chaque pression au moulin coûte 10 kg d'olives et produit 1 kg d'huile. Elle relance les parcelles à une seule parcelle, mais conserve l'huile disponible non dépensée, les améliorations de boutique et tous les paliers déjà acquis.

| Huile cumulée | Récompense permanente |
|---:|---|
| 1 | +10 % de rendement |
| 5 | +15 % de rendement et éclats dorés sur les arbres |
| 10 | +20 % de rendement, +2 places de stockage et déblocage de la Presse de maître |
| 25 | +25 % de rendement, temps de pousse réduit de 15 % et enseigne du moulin améliorée |
| 50 | +35 % de rendement, +2 places de stockage supplémentaires et temps de pousse réduit de 10 % |
| 100 | +50 % de rendement, temps de pousse réduit de 10 % et halo de prestige légendaire |

Les bonus de rendement des paliers se cumulent. Les réductions de pousse des paliers 25, 50 et 100 se cumulent également, avec un plancher de temps de pousse pour préserver la lisibilité du jeu. À partir de 10 huiles cumulées, la boutique révèle la **Presse de maître** : elle coûte 8 huiles disponibles et ajoute +25 % de rendement permanent ; l'achat est unique.

## Commandes de jeu

- **Récolter :** clique sur un olivier mûr ou glisse sur plusieurs parcelles. Chaque parcelle est récoltée au maximum une fois par geste.
- **Retour visuel de récolte :** arbre secoué, olives qui tombent, gain qui flotte au-dessus de la ferme et trace lumineuse du swipe ; une pulsation signale la maturation.
- **Parcelle :** clique sur une parcelle pour l'acheter si elle est verrouillée, ou pour afficher ses améliorations. Les coûts augmentent de 6 kg pour la 2e parcelle à 7 000 kg pour la 12e.
- **Rendement :** calculé par arbre, puis multiplié par le nombre d'arbres de la parcelle, son niveau et le bonus permanent ; les jeunes terroirs ont moins d'arbres, les parcelles productives sont plus denses et les 9 à 12 utilisent des oliviers anciens.
- **Niveau :** dépense des olives pour augmenter le rendement du terroir ; le prix tient compte du niveau, du rendement de base et du bonus déjà obtenu.
- **Automatisation :** les olives peuvent pousser et s'empiler en plusieurs récoltes ; la cueillette reste toujours manuelle.
- **Moulin :** clique dessus avec au moins 10 kg d'olives pour produire 1 kg d'huile. La progression des parcelles repart à une seule parcelle, avec un bonus permanent de productivité.
- **Boutique :** dépense l'huile pour des bonus permanents de rendement, vitesse de pousse et capacité de stockage.

La sauvegarde est locale au navigateur, sans production hors ligne. Le jeu migre les sauvegardes précédentes vers le format v4, valide et normalise les données avant de les charger, et garde une copie de secours de la dernière sauvegarde. Le menu ⚙ permet d'exporter ou d'importer un fichier JSON, de restaurer la copie de secours et de recommencer. Les imports invalides sont refusés sans remplacer la partie en cours.

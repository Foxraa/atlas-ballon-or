# Pastilles par juré : note de conception

2 novembre 2026. Petit chantier : une position de plus dans la bascule de la carte.

## Pourquoi

La carte coloriée donne aux grands pays un poids qu'ils n'ont pas dans le vote. Chaque pays a un seul juré, mais Kane couvre 67 % des terres coloriées avec 40 jurés, et Mbappé 6 % avec 23. L'Écosse, le pays de Galles et l'Irlande du Nord n'ont pas de contour à eux : le Royaume-Uni est peint selon l'Angleterre (Kane), et le vote du pays de Galles pour Lamine Yamal ne se voit pas.

On veut une lecture où chaque juré pèse autant : le lecteur compte des pastilles au lieu de comparer des surfaces.

## Objectifs

- Une troisième position dans la bascule d'échelle de la carte : **Par pays · Par continent · Par juré**.
- En position « Par juré », les pays passent en gris et chaque juré devient une pastille de même taille, posée sur son pays.
- Les pastilles prennent toutes les couleurs que la carte sait déjà donner : 1er choix, points d'un joueur, accord avec le résultat, ressemblance avec ton vote.
- Les chocs et les duels mettent en avant leurs pastilles comme aujourd'hui (les autres s'estompent). Si l'on rejoue le dépouillement dans cette position, les pastilles s'allument une à une.
- Le duel Kane–Mbappé, prochain chantier, devra marcher aussi sur les pastilles.

## Hors sujet

- La vue d'ouverture ne change pas : carte coloriée « Par pays ». L'image d'aperçu LinkedIn reste valable.
- Les onglets Histoire et Continents gardent leur rendu ; la bascule y est déjà masquée.
- Pas de grille de cases ni de bulles tassées.

## À éviter

- Des pastilles qui se chevauchent à la vue d'ensemble : on ne pourrait plus compter.
- Des pastilles trop petites pour être touchées au doigt sur téléphone.

## Contraintes

- JavaScript sans framework, Leaflet 1.9.4, aucune bibliothèque de plus.
- D'autres sessions modifient `app/` en parallèle : vérifier avant chaque modification, ne rien commiter sans demander.
- Textes de l'interface en français.

## Approches envisagées

Les trois ont été montrées en maquette, avec les vrais 1ers choix.

- **A. Grille de cases.** C'est la plus lisible pour compter. Mais c'est une vue de plus à construire, la disposition se règle à la main, et elle n'a ni zoom ni tracés.
- **B. Pastilles sur la carte (retenue).** La carte, le zoom et les tracés restent. Les pastilles existent déjà dans `app.js` : elles sont créées et coloriées par `styler()`, mais jamais ajoutées à la carte.
- **C. Bulles tassées sans fond de carte.** Plus organique, mais en rangs irréguliers, et la disposition est calculée par la machine.

## Ce qui est décidé

Points proposés par Claude, à valider en relisant :

- **Bascule.** Libellé « Par juré » ; le curseur glisse sur trois positions au lieu de deux.
- **Carte en position « Par juré ».**
  - Tous les pays prennent le gris des pays sans juré, et les pastilles colorées se posent par-dessus.
  - Les pastilles ont les mêmes infobulles et le même clic que les pays aujourd'hui (fiche du juré).
  - Les pays restent cliquables. L'infobulle du Royaume-Uni (« 4 jurés… voir les points ») retrouve son sens.
- **Écartement.**
  - À chaque zoom, les pastilles qui se chevauchent sont écartées juste assez, sans quitter le voisinage de leur pays.
  - Sans écartement, 34 jurés sur 100 se touchent au zoom d'ouverture, 53 au zoom minimal, 2 au zoom 4.
  - Plus on zoome, plus les pastilles reviennent à leur place exacte.
- **Légende.** Elle précise « 1 pastille = 1 juré ».

## Laissé au constructeur

- Le rayon exact des pastilles (5 px aujourd'hui) et la zone de toucher sur téléphone.
- Pour les tracés (lignes des duels, flux vers les clubs) : partir de la pastille écartée ou du point exact.
- La largeur de la bascule à trois positions sur téléphone.

# Duel Kane–Mbappé : note de conception

2 novembre 2026. Petit chantier : une carte de plus dans l'onglet Révélations, avec sa propre coloration.

## Pourquoi

Kane gagne de 28 points, la plus petite marge du top 5. La carte des 1ers choix montre qui a mis qui en tête, mais pas de combien chaque juré a fait pencher le duel. Le lecteur doit voir où Kane a gagné et où Mbappé a repris du terrain.

## Objectifs

- Une nouvelle coloration : pour chaque juré, l'écart `points de Kane − points de Mbappé` (de −15 à +15).
  - Rouge Kane `#d64545` si l'écart est positif, bleu Mbappé `#3d6fd9` s'il est négatif, neutre à 0.
  - La couleur fonce avec la taille de l'écart.
- Elle marche partout où la carte colorie les jurés : par pays, par continent (écart moyen du continent), par juré (pastilles).
- Infobulle : « Kane 15 pts · Mbappé 0 pt · +15 pour Kane ».
- Légende : un dégradé de « Mbappé +15 » à « Kane +15 », avec le nombre de jurés de chaque côté.
- Une carte « Duel » en tête de l'onglet Révélations, du même modèle que les autres :
  - Chiffre choc : « 2 pts ». Phrase : « S'il avait inversé Kane et Mbappé, le juré écossais faisait gagner Mbappé de 2 points. »
  - Texte : 55 jurés placent Kane devant, 45 Mbappé. L'Europe donne +60 à Kane, l'Afrique +52 à Mbappé. Avec un barème linéaire de 10 à 1, égalité à 780.
- Le titre de l'onglet « Le vote » (« Kane sacré, 28 points devant Mbappé ») devient un lien qui ouvre cette carte.

## Hors sujet

- Pas de duel au choix entre deux joueurs quelconques.
- Pas de changement aux autres cartes ni à la vue d'ouverture.

## Contraintes

- Les chiffres du texte sont calculés depuis `data.js`, pas écrits en dur.
- Mêmes contraintes que les pastilles : JavaScript sans bibliothèque de plus, textes en français, rien de commité sans accord.

## Approches envisagées

- **Carte dans Révélations, avec un lien depuis le titre du vote (retenue).**
- Carte dans Révélations seulement : moins visible.
- Bouton dans la fiche de Kane ou de Mbappé : trop caché.

## Laissé au constructeur

- Le nombre de paliers de couleur, ou un dégradé continu.
- La façon d'ouvrir la carte depuis le lien : changement d'onglet puis activation de la carte.

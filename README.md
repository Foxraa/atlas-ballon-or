# Atlas du Ballon d'or

Application cartographique sur le vote du Ballon d'or 2026 (100 jurés, un par pays) et l'histoire du trophée.

Version publique : https://foxraa.github.io/atlas-ballon-or/ (publiée par GitHub Pages à chaque envoi sur `main`,
voir `.github/workflows/pages.yml`).

## Lancer

Double-cliquer sur `lancer.bat` : il régénère `app/data.js` à partir des CSV puis ouvre `app/index.html`.
Une connexion internet est nécessaire (Leaflet, polices). Les contours des pays sont fournis avec l'appli
(`app/countries-50m.json`) ; ouverte directement en `file://`, la page les recharge depuis un CDN.

## Onglets

L'en-tête réunit le titre, les quatre rubriques et le bouton « Revoir le dépouillement ».
Sur téléphone (≤ 900 px, `app/mobile.css`), la carte occupe tout l'écran, les rubriques passent dans une barre en bas
(« Ton vote » en ballon d'or) et le panneau devient un tiroir à trois crans qu'on tire par sa poignée ; toucher un élément
qui modifie la carte baisse le tiroir, et les cartes-chocs défilent de côté pendant que la carte suit.
À l'ouverture, un dépouillement animé allume les 100 bulletins puis affiche le podium. Pendant le dépouillement,
le titre et le classement du panneau restent flous, pour ne pas gâcher le suspense ; aucun chiffre du vote n'est affiché dans l'en-tête.

- **Le vote** : le titre donne la nouvelle (le vainqueur et son avance) ; carte du 1er choix de chaque juré ; clic sur un joueur = carte des points qu'il a reçus.
  La bascule « Joueurs / Pays », en tête du panneau, passe au classement des 100 jurés, du bulletin le plus conforme au plus original.
  Un encart « Et toi, qui aurait gagné ? », juste sous le titre, mène à l'onglet Ton vote.
- **★ Ton vote** : le visiteur classe 10 joueurs, découvre « quel pays a voté comme lui » (le juré qui lui ressemble le plus)
  et crée une image à partager. Le prénom (facultatif) et le bouton de l'image viennent juste sous ce verdict,
  avant les détails : rien n'est demandé avant d'avoir voté. « Voir sur la carte » montre le monde entier, coloré selon la ressemblance avec ton bulletin.
- **Révélations**, en trois sous-onglets :
  - **Chocs** : votes patriotiques, favoris oubliés, bulletins originaux… en cartes-chocs partageables ;
  - **Duels** : comparaison de deux pays au choix, et des pays en guerre ou en rivalité (Russie-Ukraine, Maroc-Algérie…) ;
  - **Continents** : favoris et préférence « locale » par continent.
- **Histoire** : lauréats 1956-2025 par pays, continents de nationalité, de naissance et de club, récits géolocalisés.

Le champ « Chercher ton pays » de la carte, ou un clic sur un pays, ouvre sa fiche : juré, média, top 10,
accord avec le résultat final, et un bouton pour le comparer avec un autre pays.
Le même champ trouve aussi un joueur : sa fiche liste les pays qui l'ont classé, rang par rang (1er choix, 2e…),
et ceux qui ne l'ont pas cité. Un clic sur un joueur du Classement ou d'une fiche pays ouvre la même fiche.

## Données (`donnees/`)

Source des votes : Ballon d'or, France Football 2026.

| Fichier | Contenu |
|---|---|
| `ballon_or_2026_votes_long.csv` | Vos votes : pays, journaliste, média, rang, joueur, points |
| `ballon_or_2026_votes_matrice.csv` | Les mêmes votes en matrice ; le script vérifie que les deux concordent |
| `pays.csv` | Code ISO numérique, code du drapeau (ISO alpha-2, ou `GB-ENG`/`GB-SCT`/`GB-WLS`/`GB-NIR`), continent, confédération et coordonnées de chaque pays votant |
| `joueurs.csv` | Nationalité, poste et club (indicatif) des joueurs cités |
| `rivalites.csv` | Paires de pays en conflit et leur contexte |
| `palmares_historique.csv`, `histoires.csv` | Palmarès 1956-2025 et récits géolocalisés |
| `images.csv` | Crédits des photos (joueurs, trophée) rangées dans `app/images/` |

Après toute modification d'un CSV, relancer `python scripts/preparer_donnees.py` (ou `lancer.bat`).

## LinkedIn

- `app/apercu.png` : image d'aperçu des liens partagés (1200×627), régénérée par `python scripts/creer_apercu.py` (Pillow requis).
  Les balises `og:url` et `og:image` d'`index.html`, et `LIEN_PUBLIC` dans `app.js`, pointent vers la version publique.
- Révélations > Chocs > « Télécharger toutes ces cartes », sous la liste : PDF de 10 pages (couverture, cartes-chocs, appel à voter), à publier comme document LinkedIn.

## Crédits

Conçu et réalisé par Rémi AYMARD, novembre 2026. Le bouton « Crédits » de l'en-tête ouvre l'auteur, son contact et les sources ;
le même bloc ferme l'onglet Le vote, et la signature figure au coin de la carte (`AUTEUR` dans `app.js`).

## Photos

Les portraits des joueurs et la photo du trophée viennent de Wikimedia Commons (licences libres, recadrées ; crédits avec lien vers chaque licence dans la fenêtre « Crédits » et en bas de l'onglet Le vote).
Si un joueur est ajouté à `joueurs.csv`, lancer `python scripts/telecharger_images.py` puis `python scripts/preparer_donnees.py`. Un joueur sans photo s'affiche avec ses initiales.

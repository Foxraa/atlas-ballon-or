# Pastilles par juré : plan d'implémentation

> Exécution : en natif dans la session (petit chantier, trois tâches liées).

**But :** une position « Par juré » dans la bascule de la carte, où chaque juré est une pastille de même taille sur des pays gris.

**Architecture :** on réutilise les `circleMarker` déjà créés et coloriés par `styler()` ; un calque `calquePastilles` les ajoute à la carte quand `etat.echelle === "jure"`. Une fonction `ecarterPastilles()` les écarte à chaque zoom.

**Technique :** JavaScript sans framework, Leaflet 1.9.4.

**Note :** `docs/superpowers/specs/2026-11-02-pastilles-par-jure-design.md`

## Contraintes globales

- Aucune bibliothèque de plus ; textes en français.
- D'autres sessions modifient `app/` : relire juste avant chaque modification ; ne rien commiter sans accord.
- Pas de framework de test : chaque tâche se vérifie par du JavaScript exécuté dans l'appli sur http://localhost:8765/.

## Points de vigilance

- Passer de « Par juré » à l'onglet Histoire ou Continents : pas de pastilles, pays coloriés normalement.
- Rejouer le dépouillement en « Par juré » : les pastilles s'allument une à une et retrouvent leur taille.
- Zoom minimal (1,5) : toujours aucun chevauchement.
- Téléphone (375 px) : la bascule à trois positions tient à l'écran.
- Thème clair et sombre : le gris des pays reste celui des pays sans juré.

---

### Tâche 1 : bascule à trois positions

**Fichiers :** `app/index.html:66-70`, `app/style.css:443-462`, `app/app.js:350-353`

- [ ] Ajouter `<button type="button" data-echelle="jure" aria-pressed="false">Par juré</button>`.
- [ ] CSS : trois colonnes, curseur large d'un tiers, `.bascule-echelle.jure .curseur { transform: translateX(200%) }`.
- [ ] `dessinerLegende()` : `bascule.classList.toggle("jure", etat.echelle === "jure")`.
- [ ] Vérifier : clic sur « Par juré » → `aria-pressed="true"` sur ce bouton seulement, curseur sous le bouton.

### Tâche 2 : pastilles sur pays gris

**Fichiers :** `app/app.js` (marqueurs l. 175-181, `styler()`, `dessinerLegende()`, intro l. 1711-1712)

**Produit :** `RAYON_PASTILLE = 6`, `calquePastilles`, `parJure()` = échelle « jure » hors modes `historique` et `continent`.

- [ ] Marqueurs créés avec `className: "pastille"` et `RAYON_PASTILLE` ; rayon 9 en surbrillance ; l'intro revient à `RAYON_PASTILLE`.
- [ ] `styler()` : si `parJure()`, polygones au style des pays sans juré, calque ajouté ; sinon calque retiré.
- [ ] Légende : ligne « 1 pastille = 1 juré » quand `parJure()`.
- [ ] Vérifier : en « Par juré », `document.querySelectorAll("path.pastille").length === 100` ; en « Par pays » et dans l'onglet Histoire, 0.

### Tâche 3 : écartement à chaque zoom

**Fichiers :** `app/app.js`

**Produit :** `ecarterPastilles()`, appelée par `styler()` et sur `zoomend`.

- [ ] Projeter les positions exactes au zoom courant, repousser par paires celles plus proches que `2 * RAYON_PASTILLE + 2` px, rappel léger vers la position exacte, 120 itérations, puis `setLatLng`.
- [ ] Les tracés (duels, flux) gardent les positions exactes.
- [ ] Vérifier aux zooms 1,5, 2 et 4 : aucune paire de centres de `path.pastille` à moins de `2 * RAYON_PASTILLE` px.

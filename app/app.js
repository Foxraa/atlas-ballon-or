/* Atlas du Ballon d'or — toutes les analyses sont calculées ici à partir de data.js */
(function () {
  "use strict";

  const D = window.DONNEES;
  const PAYS = Object.keys(D.jury).sort((a, b) => a.localeCompare(b, "fr"));
  const JOUEURS = Object.keys(D.joueurs);
  const BAREME = [15, 12, 10, 8, 7, 5, 4, 3, 2, 1];

  // ---------- Calculs ----------
  const pts = {};
  const totaux = {}, premiers = {}, soutiens = {};
  JOUEURS.forEach(j => { totaux[j] = 0; premiers[j] = 0; soutiens[j] = 0; });
  PAYS.forEach(p => {
    pts[p] = {};
    JOUEURS.forEach(j => { pts[p][j] = 0; });
    D.jury[p].votes.forEach(v => {
      pts[p][v.joueur] = v.points;
      totaux[v.joueur] += v.points;
      soutiens[v.joueur] += 1;
      if (v.rang === 1) premiers[v.joueur] += 1;
    });
  });
  const classement = JOUEURS.slice().sort((a, b) => totaux[b] - totaux[a] || premiers[b] - premiers[a]);
  const rangGlobal = {};
  classement.forEach((j, i) => { rangGlobal[j] = i + 1; });
  const moyenne = j => totaux[j] / PAYS.length;
  const premierChoix = p => D.jury[p].votes[0].joueur;

  function correlation(x, y) {
    const n = x.length, mx = x.reduce((a, b) => a + b) / n, my = y.reduce((a, b) => a + b) / n;
    let num = 0, dx = 0, dy = 0;
    for (let i = 0; i < n; i++) { num += (x[i] - mx) * (y[i] - my); dx += (x[i] - mx) ** 2; dy += (y[i] - my) ** 2; }
    return dx && dy ? num / Math.sqrt(dx * dy) : 0;
  }
  const vecteur = p => JOUEURS.map(j => pts[p][j]);
  const vecteurMonde = JOUEURS.map(j => totaux[j]);
  const accord = {};
  PAYS.forEach(p => { accord[p] = correlation(vecteur(p), vecteurMonde); });
  const parAccord = PAYS.slice().sort((a, b) => accord[a] - accord[b]);

  const continentDe = p => (D.pays[p] ? D.pays[p].continent : null);
  const CONTINENTS = ["Europe", "Afrique", "Asie", "Amérique du Nord et centrale", "Amérique du Sud", "Océanie"];

  const victoiresParIso = {};
  D.palmares.forEach(w => { victoiresParIso[w.iso_num] = (victoiresParIso[w.iso_num] || 0) + 1; });

  // ---------- Couleurs ----------
  const PALETTE = ["#d64545", "#3d6fd9", "#e9a23b", "#4fb3d4", "#8f5fd0", "#2e9e74", "#c4589b", "#9a7b2f", "#e0703a"];
  const COULEUR_JOUEUR = {};
  classement.filter(j => premiers[j] > 0).forEach((j, i) => { COULEUR_JOUEUR[j] = PALETTE[i % PALETTE.length]; });
  const COULEUR_CONTINENT = {
    "Europe": "#3d6fd9", "Afrique": "#e9a23b", "Asie": "#d64545",
    "Amérique du Nord et centrale": "#2e9e74", "Amérique du Sud": "#8f5fd0", "Océanie": "#4fb3d4"
  };
  const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

  function melange(c1, c2, t) {
    const a = parseInt(c1.slice(1), 16), b = parseInt(c2.slice(1), 16);
    const r = Math.round(((a >> 16) & 255) * (1 - t) + ((b >> 16) & 255) * t);
    const g = Math.round(((a >> 8) & 255) * (1 - t) + ((b >> 8) & 255) * t);
    const bl = Math.round((a & 255) * (1 - t) + (b & 255) * t);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1);
  }
  const echelleOr = t => melange(css("--terre-vide"), "#b8860b", Math.max(0, Math.min(1, t)));
  // Points reçus par un joueur : classes par rang du bulletin, du jaune (bas du top 10) au rouge foncé (1er choix)
  const CLASSES_POINTS = [
    { min: 15, libelle: "1er choix · 15 pts", couleur: "#8b0a0a" },
    { min: 10, libelle: "2e-3e · 12-10 pts", couleur: "#e0472b" },
    { min: 7, libelle: "4e-5e · 8-7 pts", couleur: "#f39237" },
    { min: 4, libelle: "6e-7e · 5-4 pts", couleur: "#f6b941" },
    { min: 1, libelle: "8e-10e · 3-1 pts", couleur: "#f9e48b" }
  ];
  const echellePoints = v => v > 0 ? CLASSES_POINTS.find(c => v >= c.min).couleur : css("--terre-vide");
  const echelleAccord = t => t >= 0.5 ? melange("#e7dfcf", "#2e9e74", (t - 0.5) * 2) : melange("#8f5fd0", "#e7dfcf", t * 2);
  // Accord avec le résultat final : échelle séquentielle par quintile de rang, sans valeur centrale (presque tous les bulletins sont proches du classement)
  const CLASSES_ACCORD = ["#c7e9b4", "#7fcdbb", "#41b6c4", "#2c7fb8", "#253494"];
  const classeAccord = p => Math.min(CLASSES_ACCORD.length - 1, Math.floor(parAccord.indexOf(p) * CLASSES_ACCORD.length / PAYS.length));
  const couleurAccord = p => CLASSES_ACCORD[classeAccord(p)];

  // ---------- Utilitaires ----------
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = (n, d = 0) => n.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });
  const nomJoueur = j => D.joueurs[j].nom_complet;
  const sansAccents = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  // Portrait du joueur, ou ses initiales si la photo manque
  const photo = (j, classe = "") => {
    const src = D.joueurs[j] && D.joueurs[j].photo;
    if (src) return `<img class="portrait ${classe}" src="${esc(src)}" alt="" loading="lazy" decoding="async">`;
    const initiales = (D.joueurs[j] ? nomJoueur(j) : j).split(/\s+/).map(m => m[0]).join("").slice(0, 2);
    return `<span class="portrait ${classe}" aria-hidden="true">${esc(initiales)}</span>`;
  };
  // Les licences CC demandent un lien vers leur texte et la mention des modifications (les photos sont recadrées)
  const LICENCES = {
    "CC BY-SA 4.0": "https://creativecommons.org/licenses/by-sa/4.0/deed.fr",
    "CC BY 3.0": "https://creativecommons.org/licenses/by/3.0/deed.fr",
    "CC0": "https://creativecommons.org/publicdomain/zero/1.0/deed.fr"
  };
  const licence = l => LICENCES[l] ? `<a href="${LICENCES[l]}" target="_blank" rel="noopener license">${esc(l)}</a>` : esc(l);
  const credits = () => D.credits_images && D.credits_images.length ? `
    <details class="credits"><summary>Crédits photos (Wikimedia Commons)</summary>
      <p>Photos recadrées et réduites pour l'atlas.</p>
      <ul>${D.credits_images.map(c => `<li><a href="${esc(c.source)}" target="_blank" rel="noopener">${esc(c.cle === "trophee" ? "Trophée" : c.page)}</a>
        — ${esc(c.auteur || "auteur inconnu")}, ${licence(c.licence)}</li>`).join("")}</ul></details>` : "";
  // L'auteur et les sources : en bas de « Le vote » et dans la fenêtre du bouton Crédits de l'en-tête
  const AUTEUR = { nom: "Rémi AYMARD", date: "novembre 2026", courriel: "remi.aymard@proton.me" };
  const blocCredits = (titre = "h3") => `
    <section class="bloc-credits">
      <p class="surtitre">Crédits</p>
      <${titre}${titre === "h2" ? ' id="credits-titre"' : ""} class="auteur-credits">Conçu et réalisé par <span class="insecable">${esc(AUTEUR.nom)}</span></${titre}>
      <p class="meta">Atlas du Ballon d'or · ${esc(AUTEUR.date)}</p>
      <a class="courriel" href="mailto:${esc(AUTEUR.courriel)}">✉ ${esc(AUTEUR.courriel)}</a>
      <ul class="sources">
        <li><b>Votes</b><span>Ballon d'or 2026, <a href="https://www.francefootball.fr/" target="_blank" rel="noopener">France Football</a></span></li>
        <li><b>Frontières</b><span><a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener">Natural Earth</a></span></li>
        <li><b>Carte</b><span><a href="https://leafletjs.com/" target="_blank" rel="noopener">Leaflet</a></span></li>
        <li><b>Photos</b><span>Wikimedia Commons, licences libres</span></li>
      </ul>
      ${credits()}
      <p class="mentions">Site personnel et non officiel, sans lien avec <i>France Football</i> ni l'organisation du Ballon d'or ;
        « Ballon d'or » est une marque de ses propriétaires.</p>
      <p class="mentions">Vie privée : ton bulletin et ton prénom restent dans ton navigateur.
        Les polices sont servies par Google Fonts.</p>
    </section>`;
  // Ressemblance affichée : une corrélation négative (bulletins à rebours) compte comme 0 %, les tris gardent la valeur brute
  const pourcent = r => `${Math.round(Math.max(0, r) * 100)} %`;
  // « du Maroc », « des Pays-Bas », « d'Haïti », « de France »
  const PAYS_DU = new Set(["Bénin", "Brésil", "Burkina Faso", "Cameroun", "Canada", "Cap-Vert", "Chili", "Costa Rica", "Danemark",
    "Gabon", "Ghana", "Guatemala", "Honduras", "Japon", "Kosovo", "Luxembourg", "Mali", "Maroc", "Mexique", "Monténégro",
    "Nigeria", "Panama", "Paraguay", "Portugal", "Pérou", "Qatar", "Salvador", "Sénégal", "Venezuela", "Vietnam"]);
  const PAYS_DES = new Set(["Pays-Bas", "États-Unis", "Émirats arabes unis"]);
  const deP = p => PAYS_DU.has(p) ? `du ${p}` : PAYS_DES.has(p) ? `des ${p}` : /^([AEIOUÉÈÊÎÔY]|Haï)/i.test(p) ? `d'${p}` : `de ${p}`;

  // Drapeau en émoji : deux indicateurs régionaux, ou séquence de sous-division pour l'Angleterre, l'Écosse et le pays de Galles
  function drapeau(p) {
    const c = ((D.pays[p] && D.pays[p].code) || "").toUpperCase();
    const sous = { "GB-ENG": "gbeng", "GB-SCT": "gbsct", "GB-WLS": "gbwls" }[c];
    if (sous) return "\u{1F3F4}" + [...sous].map(ch => String.fromCodePoint(0xE0000 + ch.charCodeAt(0))).join("") + "\u{E007F}";
    if (c === "GB-NIR") return "\u{1F1EC}\u{1F1E7}"; // pas d'émoji pour l'Irlande du Nord : Union Jack
    if (!/^[A-Z]{2}$/.test(c)) return "";
    return String.fromCodePoint(...[...c].map(ch => 0x1F1E6 + ch.charCodeAt(0) - 65));
  }
  const nomPays = p => `<span class="drapeau" aria-hidden="true">${drapeau(p)}</span>${esc(p)}`;

  // ---------- Carte ----------
  // Pas de fond tuilé : les contours de pays suffisent et la carte reste lisible dans les deux thèmes
  const carte = L.map("carte", { worldCopyJump: true, minZoom: 1.5, maxZoom: 7, zoomSnap: 0.25 }).setView([25, 12], 2);
  carte.attributionControl.addAttribution('Source : Ballon d\'or, <a href="https://www.francefootball.fr/">France Football</a> 2026');
  carte.attributionControl.addAttribution('Frontières : <a href="https://www.naturalearthdata.com/">Natural Earth</a>');
  carte.attributionControl.addAttribution(`<a href="#" class="lien-credits">Réalisation : ${esc(AUTEUR.nom)}, ${esc(AUTEUR.date)}</a>`);
  const estSombre = () => {
    const t = document.documentElement.dataset.theme;
    return t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  };

  const paysParIso = {};
  PAYS.forEach(p => {
    const iso = D.pays[p].iso;
    (paysParIso[iso] = paysParIso[iso] || []).push(p);
  });
  const paysPolygone = f => {
    const iso = f.id === undefined ? (f.properties.name === "Kosovo" ? "-99" : null) : String(f.id).padStart(3, "0");
    const liste = iso ? paysParIso[iso] : null;
    if (!liste) return null;
    return liste.includes("Angleterre") ? "Angleterre" : liste[0];
  };
  const isoPolygone = f => (f.id === undefined ? (f.properties.name === "Kosovo" ? "-99" : null) : String(f.id).padStart(3, "0"));

  let calquePolygones = null;
  const boundsParIso = {};
  const calqueSurcouche = L.layerGroup().addTo(carte);
  const marqueurs = {};

  // Marqueurs gardés hors carte : le style et les animations les manipulent, mais seuls les polygones s'affichent
  PAYS.forEach(p => {
    const m = L.circleMarker([D.pays[p].lat, D.pays[p].lon], { radius: 5, weight: 1.5, fillOpacity: 1 })
      .bindTooltip(() => infobulle(p), { className: "infobulle", direction: "top", offset: [0, -4] })
      .on("click", e => ouvrirFicheOuContinent(p, e.latlng));
    marqueurs[p] = m;
  });

  // Contours servis avec l'appli ; repli sur le CDN quand la page est ouverte en file://
  const chargerJson = url => fetch(url).then(r => { if (!r.ok) throw new Error(url); return r.json(); });
  const contoursPrets = chargerJson("countries-50m.json")
    .catch(() => chargerJson("https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json"))
    .then(topo => {
      const geo = topojson.feature(topo, topo.objects.countries);
      geo.features = geo.features.filter(f => f.id !== "010"); // Antarctique
      // Les anneaux qui traversent l'antiméridien (Russie, Fidji) sont recollés côté est pour éviter une bande parasite
      geo.features.forEach(f => {
        const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
        polys.forEach(poly => poly.forEach(anneau => {
          if (anneau.some(c => c[0] < -170) && anneau.some(c => c[0] > 170)) anneau.forEach(c => { if (c[0] < 0) c[0] += 360; });
        }));
      });
      calquePolygones = L.geoJSON(geo, {
        style: { weight: 0.6 },
        onEachFeature: (f, couche) => {
          const iso = isoPolygone(f);
          if (iso) boundsParIso[iso] = couche.getBounds();
          couche.bindTooltip(() => infobullePolygone(f), { className: "infobulle", sticky: true });
          couche.on("click", e => {
            const p = paysPolygone(f);
            if (p && etat.mode !== "historique") ouvrirFicheOuContinent(p, e.latlng);
          });
        }
      }).addTo(carte);
      calquePolygones.bringToBack();
      styler();
    })
    .catch(() => { /* sans fond de pays, les marqueurs suffisent */ });

  // ---------- État et modes ----------
  // intro : ensemble des pays déjà dépouillés pendant l'animation d'ouverture, null sinon
  // echelle : « pays » ou « continent », gardée d'un mode à l'autre
  const etat = { mode: "premier", joueur: null, continent: null, surbrillance: null, intro: null, echelle: "pays" };
  const pasEncoreCompte = p => etat.intro && !etat.intro.has(p);

  // ---------- Agrégats par continent ----------
  const juresDu = {};
  CONTINENTS.forEach(c => { juresDu[c] = PAYS.filter(p => continentDe(p) === c); });
  const moyenneSur = (liste, f) => liste.reduce((s, p) => s + f(p), 0) / liste.length;
  const parContinent = () => etat.echelle === "continent" && !etat.intro && etat.mode !== "historique" && etat.mode !== "continent";

  // 1er choix le plus fréquent du continent ; à égalité, le joueur qui y a reçu le plus de points
  function premierDuContinent(c) {
    const jures = juresDu[c], n = {};
    jures.forEach(p => { const j = premierChoix(p); n[j] = (n[j] || 0) + 1; });
    const somme = j => jures.reduce((s, p) => s + pts[p][j], 0);
    const j = Object.keys(n).sort((a, b) => n[b] - n[a] || somme(b) - somme(a))[0];
    return { joueur: j, voix: n[j], jures: jures.length };
  }
  const accordMoyen = c => moyenneSur(juresDu[c], p => accord[p]);

  function couleurContinent(c) {
    const jures = juresDu[c];
    switch (etat.mode) {
      case "joueur": return echellePoints(Math.round(moyenneSur(jures, p => pts[p][etat.joueur])));
      case "accord": {
        const m = accordMoyen(c);
        return CLASSES_ACCORD[Math.min(CLASSES_ACCORD.length - 1, Math.floor(parAccord.filter(p => accord[p] < m).length * CLASSES_ACCORD.length / PAYS.length))];
      }
      case "moi": return echelleAccord((moyenneSur(jures, p => affinite[p]) + 0.2) / 1.2);
      default: return COULEUR_JOUEUR[premierDuContinent(c).joueur] || "#9a9a9a";
    }
  }
  function valeurContinent(c) {
    const jures = juresDu[c];
    switch (etat.mode) {
      case "joueur": return `${fmt(moyenneSur(jures, p => pts[p][etat.joueur]), 1)} pts en moyenne`;
      case "accord": return `accord moyen ${fmt(accordMoyen(c), 2)}`;
      case "moi": return `${pourcent(moyenneSur(jures, p => affinite[p]))} de ressemblance`;
      default: { const r = premierDuContinent(c); return `${esc(r.joueur)} (${r.voix}/${r.jures})`; }
    }
  }

  function couleurPays(p) {
    if (parContinent() && juresDu[continentDe(p)]) return couleurContinent(continentDe(p));
    switch (etat.mode) {
      case "joueur": return echellePoints(pts[p][etat.joueur]);
      case "continent": return COULEUR_CONTINENT[continentDe(p)];
      case "accord": return couleurAccord(p);
      case "moi": return echelleAccord((affinite[p] + 0.2) / 1.2);
      default: return COULEUR_JOUEUR[premierChoix(p)] || "#9a9a9a";
    }
  }
  const estEstompe = p =>
    (etat.surbrillance && !etat.surbrillance.has(p)) ||
    (etat.mode === "continent" && etat.continent && continentDe(p) !== etat.continent) ||
    (parContinent() && etat.continentChoisi && continentDe(p) !== etat.continentChoisi);

  function styler() {
    const historique = etat.mode === "historique";
    const bord = css("--surface"), vide = css("--terre-vide");
    if (calquePolygones) {
      const maxV = Math.max(...Object.values(victoiresParIso));
      calquePolygones.setStyle(f => {
        if (historique) {
          const v = victoiresParIso[isoPolygone(f)] || 0;
          return { fillColor: v ? echelleOr(0.25 + 0.75 * v / maxV) : vide, fillOpacity: v ? 0.9 : 0.6, color: bord, weight: 0.6 };
        }
        const p = paysPolygone(f);
        if (!p || pasEncoreCompte(p)) return { fillColor: vide, fillOpacity: 0.55, color: bord, weight: 0.5 };
        return { fillColor: couleurPays(p), fillOpacity: estEstompe(p) ? 0.18 : 0.78, color: bord, weight: 0.6 };
      });
    }
    PAYS.forEach(p => {
      const m = marqueurs[p];
      if (historique || pasEncoreCompte(p)) { m.setStyle({ opacity: 0, fillOpacity: 0 }); return; }
      const fort = etat.surbrillance && etat.surbrillance.has(p);
      m.setStyle({
        fillColor: couleurPays(p), color: bord,
        opacity: estEstompe(p) ? 0.3 : 1, fillOpacity: estEstompe(p) ? 0.25 : 1
      });
      m.setRadius(fort ? 8 : 5);
    });
    dessinerLegende();
  }

  function changerMode(nouveau) {
    if (etat.intro) terminerIntro(false);
    Object.assign(etat, { mode: "premier", joueur: null, continent: null, surbrillance: null, continentChoisi: null }, nouveau);
    calqueSurcouche.clearLayers();
    styler();
  }

  document.querySelectorAll("[data-echelle]").forEach(b => b.addEventListener("click", () => {
    etat.echelle = b.dataset.echelle;
    if (etat.continentChoisi) { etat.continentChoisi = null; $("#fiche").hidden = true; }
    styler();
  }));

  function cadrer(listePays, options) {
    if (!listePays.length) return;
    const b = L.latLngBounds(listePays.map(p => [D.pays[p].lat, D.pays[p].lon]));
    carte.flyToBounds(b.pad(0.35), Object.assign({ maxZoom: 5, duration: 0.8 }, margesCarte(), options));
  }

  function infobulle(p) {
    const v = D.jury[p].votes;
    if (parContinent() && juresDu[continentDe(p)]) {
      const c = continentDe(p);
      return `<b>${esc(c)}</b> <span style="opacity:.7">· ${juresDu[c].length} jurés</span><br>${valeurContinent(c)}
        <br><span style="opacity:.7">${nomPays(p)}</span>`;
    }
    let detail;
    if (etat.mode === "joueur") detail = `${esc(etat.joueur)} : <b>${pts[p][etat.joueur]} pts</b>`;
    else if (etat.mode === "accord") detail = `Accord avec le résultat final : <b>${fmt(accord[p], 2)}</b>`;
    else if (etat.mode === "moi") detail = `Ressemblance avec ton bulletin : <b>${pourcent(affinite[p])}</b>`;
    else if (etat.mode === "continent") detail = esc(continentDe(p));
    else detail = `1er choix : <b>${esc(v[0].joueur)}</b>`;
    return `<b>${nomPays(p)}</b><br>${detail}`;
  }
  function infobullePolygone(f) {
    if (etat.mode === "historique") {
      const v = victoiresParIso[isoPolygone(f)] || 0;
      const noms = [...new Set(D.palmares.filter(w => w.iso_num === isoPolygone(f)).map(w => w.joueur))];
      return `<b>${esc(f.properties.name)}</b><br>${v ? `${v} Ballon${v > 1 ? "s" : ""} d'or<br><span style="opacity:.7">${esc(noms.join(", "))}</span>` : "Aucun lauréat"}`;
    }
    const p = paysPolygone(f);
    if (!p) return `${esc(f.properties.name)}<br><span style="opacity:.7">Pas de juré en 2026</span>`;
    if (D.pays[p].iso === "826") return `<b>Royaume-Uni</b><br><span style="opacity:.7">4 jurés : Angleterre, Écosse, Galles, Irlande du Nord (voir les points)</span>`;
    return infobulle(p);
  }

  function dessinerLegende() {
    const L_ = $("#legende");
    const ligne = (c, t) => `<div class="ligne"><span class="carre" style="background:${c}"></span>${t}</div>`;
    const bascule = $("#bascule-echelle");
    bascule.hidden = etat.mode === "historique" || etat.mode === "continent";
    bascule.classList.toggle("continent", etat.echelle === "continent");
    bascule.querySelectorAll("[data-echelle]").forEach(b => b.setAttribute("aria-pressed", b.dataset.echelle === etat.echelle));
    if (parContinent()) {
      const titre = etat.mode === "joueur" ? `Points donnés à ${esc(nomJoueur(etat.joueur))}`
        : { accord: "Accord avec le résultat final", moi: "Les continents qui votent comme toi" }[etat.mode] || "1er choix le plus fréquent";
      L_.innerHTML = `<h3>${titre} · par continent</h3>` +
        CONTINENTS.filter(c => juresDu[c].length).map(c => ligne(couleurContinent(c), `${esc(c)} <span style="opacity:.6">${valeurContinent(c)}</span>`)).join("");
    } else if (etat.mode === "joueur") {
      const compte = c => PAYS.filter(p => pts[p][etat.joueur] > 0 && CLASSES_POINTS.find(k => pts[p][etat.joueur] >= k.min) === c).length;
      L_.innerHTML = `<h3>Points donnés à ${esc(nomJoueur(etat.joueur))}</h3>` +
        CLASSES_POINTS.map(c => ligne(c.couleur, `${c.libelle} <span style="opacity:.6">(${compte(c)})</span>`)).join("") +
        ligne(css("--terre-vide"), `Non classé <span style="opacity:.6">(${PAYS.filter(p => pts[p][etat.joueur] === 0).length})</span>`);
    } else if (etat.mode === "continent") {
      L_.innerHTML = `<h3>Continent du juré</h3>` + CONTINENTS.map(c => ligne(COULEUR_CONTINENT[c], c)).join("");
    } else if (etat.mode === "accord") {
      const bornes = CLASSES_ACCORD.map((_, i) => PAYS.filter(p => classeAccord(p) === i).map(p => accord[p]));
      const libelles = ["20 % les plus originaux", "", "", "", "20 % les plus conformes"];
      L_.innerHTML = `<h3>Accord avec le résultat final</h3>` +
        CLASSES_ACCORD.map((c, i) => ligne(c, `${fmt(Math.min(...bornes[i]), 2)} – ${fmt(Math.max(...bornes[i]), 2)}${libelles[i] ? ` <span style="opacity:.6">${libelles[i]}</span>` : ""}`)).reverse().join("");
    } else if (etat.mode === "moi") {
      L_.innerHTML = `<h3>Les pays qui votent comme toi</h3>
        <div class="degrade" style="background:linear-gradient(90deg,${echelleAccord(0)},${echelleAccord(0.5)},${echelleAccord(1)})"></div>
        <div class="bornes"><span>à l'opposé</span><span>comme toi</span></div>`;
    } else if (etat.mode === "historique") {
      L_.innerHTML = `<h3>Ballons d'or 1956-2025, par pays actuel</h3>
        <div class="degrade" style="background:linear-gradient(90deg,${echelleOr(0.25)},${echelleOr(1)})"></div>
        <div class="bornes"><span>1</span><span>${Math.max(...Object.values(victoiresParIso))}</span></div>
        <div class="ligne" style="margin-top:6px"><span class="carre" style="background:#b8860b;border-radius:50%"></span>Lieu d'une histoire</div>`;
    } else {
      const lignes = Object.keys(COULEUR_JOUEUR).map(j => ligne(COULEUR_JOUEUR[j], `${esc(j)} <span style="opacity:.6">(${premiers[j]})</span>`));
      L_.innerHTML = `<h3>1er choix de chaque juré</h3>` + lignes.join("");
    }
  }

  // ---------- Fiche pays ----------
  // Sur grand écran, la fiche pays se pose à côté du pays et le suit quand la carte bouge
  let ancreFiche = null;
  function placerFiche() {
    const f = $("#fiche");
    if (!ancreFiche || f.hidden || matchMedia("(max-width: 900px)").matches) { f.style.left = f.style.top = f.style.right = ""; return; }
    const zone = carte.getContainer().getBoundingClientRect();
    const pt = carte.latLngToContainerPoint(ancreFiche);
    const x = zone.left + pt.x, y = zone.top + pt.y, ecart = 18, marge = 12;
    const l = f.offsetWidth, h = f.offsetHeight;
    let gauche = x + ecart;
    if (gauche + l > innerWidth - marge) gauche = x - ecart - l;
    gauche = Math.max(marge, Math.min(gauche, innerWidth - l - marge));
    const haut = Math.max(zone.top + marge, Math.min(y - h / 2, innerHeight - h - marge));
    f.style.right = "auto";
    f.style.left = `${gauche}px`;
    f.style.top = `${haut}px`;
  }
  carte.on("move zoom resize", placerFiche);
  // La colonne joueur change la largeur de la carte : Leaflet doit recalculer sa taille
  new ResizeObserver(() => carte.invalidateSize()).observe(carte.getContainer());

  // Panneau de gauche : largeur calée sur le texte, ou réglée à la main avec la poignée (double-clic pour revenir)
  (() => {
    const disposition = $(".disposition"), panneau = $(".panneau"), poignee = $("#poignee-panneau");
    const CLE = "atlas-bo-largeur-panneau";
    const borner = l => Math.round(Math.max(300, Math.min(l, innerWidth - 360)));
    function regler(l) {
      if (l == null) {
        disposition.style.removeProperty("--largeur-panneau");
        disposition.classList.remove("panneau-regle");
      } else {
        disposition.style.setProperty("--largeur-panneau", `${borner(l)}px`);
        disposition.classList.add("panneau-regle");
      }
      poignee.setAttribute("aria-valuenow", Math.round(panneau.getBoundingClientRect().width));
      try { l == null ? localStorage.removeItem(CLE) : localStorage.setItem(CLE, borner(l)); } catch (e) { /* stockage indisponible : réglage le temps de la visite */ }
    }
    let memo = null;
    try { memo = parseInt(localStorage.getItem(CLE), 10); } catch (e) { /* idem */ }
    if (memo > 0) regler(memo);

    poignee.addEventListener("pointerdown", e => {
      e.preventDefault();
      poignee.setPointerCapture(e.pointerId);
      const gauche = panneau.getBoundingClientRect().left;
      document.body.classList.add("redimension");
      const bouger = ev => regler(ev.clientX - gauche);
      const lacher = () => {
        document.body.classList.remove("redimension");
        poignee.removeEventListener("pointermove", bouger);
        poignee.removeEventListener("pointerup", lacher);
        poignee.removeEventListener("pointercancel", lacher);
      };
      poignee.addEventListener("pointermove", bouger);
      poignee.addEventListener("pointerup", lacher);
      poignee.addEventListener("pointercancel", lacher);
    });
    poignee.addEventListener("dblclick", () => regler(null));
    poignee.addEventListener("keydown", e => {
      const pas = { ArrowLeft: -20, ArrowRight: 20 }[e.key];
      if (pas) { e.preventDefault(); regler(panneau.getBoundingClientRect().width + pas); }
      else if (e.key === "Enter" || e.key === "Escape") { e.preventDefault(); regler(null); }
    });
  })();
  addEventListener("resize", placerFiche);

  // Sur la carte par continent, un clic sur un pays choisit tout son continent
  const ouvrirFicheOuContinent = (p, ancre) =>
    (parContinent() && juresDu[continentDe(p)] ? ouvrirFicheContinent(continentDe(p), ancre) : ouvrirFiche(p, ancre));

  function ouvrirFicheContinent(c, ancre) {
    ancreFiche = ancre;
    const jures = juresDu[c];
    const moy = j => moyenneSur(jures, p => pts[p][j]);
    const top = JOUEURS.filter(j => moy(j) > 0).sort((a, b) => moy(b) - moy(a)).slice(0, 10);
    const n1 = {};
    jures.forEach(p => { const j = premierChoix(p); n1[j] = (n1[j] || 0) + 1; });
    $("#fiche").innerHTML = `
      <button class="fermer" aria-label="Fermer">×</button>
      <h2>${esc(c)}</h2>
      <div class="meta">${jures.length} jurés · accord moyen avec le résultat final ${fmt(accordMoyen(c), 2)}</div>
      <p class="meta" style="margin-top:8px">Sur la carte : <b style="color:var(--texte)">${valeurContinent(c)}</b></p>
      <div class="section-titre">Classement du continent <span class="meta">(moyenne par juré)</span></div>
      <ol>${top.map(j => `<li><button type="button" class="lien-joueur" data-joueur="${esc(j)}">${esc(nomJoueur(j))}</button> <b>${fmt(moy(j), 1)}</b></li>`).join("")}</ol>
      <div class="section-titre">1ers choix</div>
      <p class="meta">${Object.entries(n1).sort((a, b) => b[1] - a[1]).map(([j, n]) => `${esc(j)} (${n})`).join(" · ")}</p>
      <div class="section-titre">Les ${jures.length} pays</div>
      <p class="meta">${jures.map(p => `<button type="button" class="lien-joueur" data-pays="${esc(p)}">${esc(p)}</button>`).join(" · ")}</p>`;
    etat.continentChoisi = c;
    styler();
    $("#fiche").hidden = false;
    $("#fiche").scrollTop = 0;
    placerFiche();
    $("#fiche .fermer").onclick = () => { $("#fiche").hidden = true; etat.continentChoisi = null; styler(); };
    $("#fiche").querySelectorAll("[data-joueur]").forEach(b => b.addEventListener("click", () => selectionnerJoueur(b.dataset.joueur)));
    $("#fiche").querySelectorAll("[data-pays]").forEach(b => b.addEventListener("click", () => {
      ouvrirFiche(b.dataset.pays);
      cadrer([b.dataset.pays], { maxZoom: 4 });
    }));
  }

  function ouvrirFiche(p, ancre) {
    if (etat.continentChoisi) { etat.continentChoisi = null; styler(); }
    ancreFiche = ancre || L.latLng(D.pays[p].lat, D.pays[p].lon);
    const j = D.jury[p], info = D.pays[p];
    const compatriotes = JOUEURS.filter(x => D.joueurs[x].nationalite === p);
    const rangOriginalite = parAccord.indexOf(p) + 1;
    const lauréats = D.palmares.filter(w => w.iso_num === info.iso && (info.iso !== "826" || w.nation_historique === p));
    $("#fiche").innerHTML = `
      <button class="fermer" aria-label="Fermer">×</button>
      <h2>${nomPays(p)}</h2>
      <div class="meta">${esc(info.continent)} · ${esc(info.confederation)}</div>
      <button type="button" class="bouton-partager fiche-duel" id="fiche-duel">Comparer avec un autre pays</button>
      <p class="meta" style="margin-top:8px">Juré : <b style="color:var(--texte)">${esc(j.journaliste)}</b> — ${esc(j.media)}</p>
      <ol>${j.votes.map(v => `<li><button type="button" class="lien-joueur" data-joueur="${esc(v.joueur)}">${esc(nomJoueur(v.joueur))}</button> <b>${v.points}</b></li>`).join("")}</ol>
      <div class="jauge">Accord avec le résultat final
        <div class="barre"><i style="width:${Math.max(0, accord[p]) * 100}%"></i></div>${fmt(accord[p], 2)}</div>
      <p class="meta">${rangOriginalite <= 50 ? `${rangOriginalite}e bulletin le plus original sur 100` : `${101 - rangOriginalite}e bulletin le plus conforme sur 100`}</p>
      ${compatriotes.length ? `<div class="section-titre">Ses compatriotes</div>` +
        compatriotes.map(x => `<p class="meta">${esc(nomJoueur(x))} : <b style="color:var(--texte)">${pts[p][x]} pts</b> (moyenne mondiale ${fmt(moyenne(x), 1)})</p>`).join("") : ""}
      ${lauréats.length ? `<div class="section-titre">Ballons d'or de l'histoire</div><p class="meta">${lauréats.map(w => `${w.annee} ${esc(w.joueur)}`).join(" · ")}</p>` : ""}`;
    $("#fiche").hidden = false;
    $("#fiche").scrollTop = 0;
    placerFiche();
    $("#fiche .fermer").onclick = () => { $("#fiche").hidden = true; };
    $("#fiche").querySelectorAll("[data-joueur]").forEach(b => b.addEventListener("click", () => selectionnerJoueur(b.dataset.joueur)));
    $("#fiche-duel").onclick = () => {
      duelLibre.a = p;
      if (duelLibre.b === p) duelLibre.b = PAYS.find(x => x !== p);
      $("#fiche").hidden = true;
      allerOnglet("conflits");
      $("#duel-b").focus({ preventScroll: true });
    };
  }

  // ---------- Onglets ----------
  const contenu = $("#contenu");
  const estMobile = () => matchMedia("(max-width: 900px)").matches;
  // Le monde entier, cadré comme à l'ouverture : les 100 pays d'un coup d'œil
  const MONDE = [25, 12], zoomMonde = () => (estMobile() ? 1.5 : 2);

  // ---------- Téléphone : la carte plein écran, le panneau en tiroir ----------
  // Trois crans : « bas » montre la carte, « milieu » partage l'écran, « haut » donne tout au texte (style dans mobile.css).
  // Sur ordinateur la poignée reste cachée et le cran ne sert à rien.
  const panneau = $(".panneau");
  panneau.dataset.cran = "milieu";
  const poigneeTiroir = document.createElement("button");
  poigneeTiroir.type = "button";
  poigneeTiroir.className = "tiroir-poignee";
  poigneeTiroir.setAttribute("aria-label", "Agrandir ou réduire le panneau");
  panneau.prepend(poigneeTiroir);
  const mettreTiroir = cran => { panneau.dataset.cran = cran; };
  const releverTiroir = () => { if (panneau.dataset.cran === "bas") mettreTiroir("milieu"); };
  // Décalage vers le bas du tiroir à chaque cran : mêmes hauteurs visibles que mobile.css (132px, 52dvh)
  const decalageDu = cran => Math.max(0, panneau.offsetHeight - { bas: 132, milieu: innerHeight * 0.52, haut: Infinity }[cran]);
  const cranSuivant = { bas: "milieu", milieu: "haut", haut: "milieu" };

  poigneeTiroir.addEventListener("pointerdown", e => {
    const depart = e.clientY, base = decalageDu(panneau.dataset.cran);
    let dernier = { y: e.clientY, t: e.timeStamp }, vitesse = 0, bouge = false;
    poigneeTiroir.setPointerCapture(e.pointerId);
    const bouger = ev => {
      if (!bouge && Math.abs(ev.clientY - depart) < 6) return;
      bouge = true;
      panneau.classList.add("glisse");
      vitesse = (ev.clientY - dernier.y) / Math.max(1, ev.timeStamp - dernier.t);
      dernier = { y: ev.clientY, t: ev.timeStamp };
      panneau.style.transform = `translateY(${Math.max(0, base + ev.clientY - depart)}px)`;
    };
    const lacher = ev => {
      poigneeTiroir.removeEventListener("pointermove", bouger);
      poigneeTiroir.removeEventListener("pointerup", lacher);
      poigneeTiroir.removeEventListener("pointercancel", lacher);
      panneau.classList.remove("glisse");
      panneau.style.transform = "";
      if (!bouge) { mettreTiroir(cranSuivant[panneau.dataset.cran]); return; }
      // Un geste vif file au cran suivant dans son sens ; sinon le tiroir se pose au cran le plus proche
      const vise = base + ev.clientY - depart + vitesse * 200;
      mettreTiroir(["haut", "milieu", "bas"].reduce((a, c) => Math.abs(decalageDu(c) - vise) < Math.abs(decalageDu(a) - vise) ? c : a));
    };
    poigneeTiroir.addEventListener("pointermove", bouger);
    poigneeTiroir.addEventListener("pointerup", lacher);
    poigneeTiroir.addEventListener("pointercancel", lacher);
  });
  // Au clavier (detail 0), la poignée passe au cran suivant ; au doigt, pointerup s'en charge
  poigneeTiroir.addEventListener("click", e => { if (e.detail === 0) mettreTiroir(cranSuivant[panneau.dataset.cran]); });

  // Faire défiler le texte vers le haut ouvre le tiroir ; le tirer vers le bas, quand il est en haut de sa page, le referme
  let toucheDepart = null;
  contenu.addEventListener("touchstart", e => {
    toucheDepart = { x: e.touches[0].clientX, y: e.touches[0].clientY, defile: contenu.scrollTop };
  }, { passive: true });
  contenu.addEventListener("touchmove", e => {
    if (!toucheDepart || !estMobile() || disposition.classList.contains("vote-plein")) return;
    const dx = e.touches[0].clientX - toucheDepart.x, dy = e.touches[0].clientY - toucheDepart.y, cran = panneau.dataset.cran;
    if (Math.abs(dy) < 12 || Math.abs(dy) < Math.abs(dx)) return;
    if (dy < 0 && cran !== "haut") mettreTiroir(cran === "bas" ? "milieu" : "haut");
    else if (dy > 0 && toucheDepart.defile <= 0 && cran !== "bas") mettreTiroir(cran === "haut" ? "milieu" : "bas");
    else return;
    toucheDepart = null;
  }, { passive: true });

  // Un élément qui modifie la carte baisse le tiroir pour la montrer. En capture : le tiroir est placé
  // avant que la carte ne se cadre sur la partie restée visible (margesCarte)
  contenu.addEventListener("click", e => {
    if (!estMobile() || e.target.closest("[data-partager], .vote-page")) return;
    const el = e.target.closest("[data-joueur], [data-pays], [data-c], [data-duel], [data-k], [data-h], [data-iso]");
    if (!el || el.matches(".classement li.actif")) return;
    // Les chocs défilent dans le tiroir à mi-hauteur : la carte est déjà visible au-dessus
    if (el.closest(".defile-chocs")) { if (panneau.dataset.cran === "haut") mettreTiroir("milieu"); }
    else mettreTiroir("bas");
  }, true);

  // Partie de la carte cachée par l'en-tête, la recherche, le tiroir et les fiches : la carte se cadre sur ce qui reste
  function margesCarte() {
    if (!estMobile()) return {};
    const zone = carte.getContainer().getBoundingClientRect();
    const haut = $("#recherche").getBoundingClientRect().bottom + 8;
    let bas = zone.bottom - (panneau.offsetHeight - decalageDu(panneau.dataset.cran));
    ["#fiche", "#volet-joueur"].forEach(s => { if (!$(s).hidden) bas = Math.min(bas, $(s).getBoundingClientRect().top); });
    bas = Math.max(bas, haut + 140);
    return { paddingTopLeft: [12, haut - zone.top], paddingBottomRight: [12, Math.max(0, zone.bottom - bas)] };
  }

  // En tête du panneau, comme les sous-onglets des Révélations : la bascule ne bouge pas d'une vue à l'autre
  const basculeClassement = vue => `<div class="filtres sous-onglets" role="group" aria-label="Classer">
      ${[["joueurs", "Joueurs"], ["pays", "Pays"]].map(([v, t]) =>
        `<button type="button" data-vue="${v}" class="${v === vue ? "actif" : ""}" aria-pressed="${v === vue}">${t}</button>`).join("")}</div>`;
  const brancherBascule = () => contenu.querySelectorAll("[data-vue]").forEach(b =>
    b.addEventListener("click", () => (b.dataset.vue === "pays" ? classementPays : ongletClassement)()));

  // Révélations : curiosités, duels et continents réunis sous un seul onglet
  const REVELATIONS = [["curiosites", "Chocs"], ["conflits", "Duels"], ["continents", "Continents"]];
  let revelation = "curiosites";
  const navRevelations = actif => `<div class="filtres sous-onglets" role="group" aria-label="Révélations">
      ${REVELATIONS.map(([v, t]) =>
        `<button type="button" data-revelation="${v}" class="${v === actif ? "actif" : ""}" aria-pressed="${v === actif}">${t}</button>`).join("")}</div>`;
  const brancherRevelations = () => contenu.querySelectorAll("[data-revelation]").forEach(b =>
    b.addEventListener("click", () => { revelation = b.dataset.revelation; contenu.scrollTop = 0; ONGLETS.revelations(); }));

  // Les 100 jurés, du bulletin le plus proche du classement final au plus original
  function classementPays() {
    const ordre = parAccord.slice().reverse();
    contenu.innerHTML = `
      ${basculeClassement("pays")}
      <p class="surtitre">Ballon d'or 2026 · vote des ${PAYS.length} jurés</p>
      <h2>Les ${PAYS.length} bulletins, du plus conforme au plus original</h2>
      <p class="intro">Ressemblance de chaque bulletin avec le classement final (corrélation des points : 1 = identique,
        0 = sans rapport). Cliquez sur un pays pour ouvrir sa fiche.</p>
      <ol class="classement accord">${ordre.map((p, i) => `
        <li data-pays="${esc(p)}">
          <span class="rang">${i + 1}</span>
          <span class="drapeau-rang" aria-hidden="true">${drapeau(p)}</span>
          <div><span class="nom">${esc(p)}</span>
            <div class="meta">${esc(D.jury[p].journaliste)} · 1er choix : ${esc(premierChoix(p))}</div>
            <div class="barre"><i style="width:${Math.max(0, accord[p]) * 100}%;background:${couleurAccord(p)}"></i></div>
          </div>
          <span class="pts">${fmt(accord[p], 2)}</span>
        </li>`).join("")}
      </ol>`;
    brancherBascule();
    contenu.querySelectorAll("[data-pays]").forEach(li => li.addEventListener("click", () => {
      contenu.querySelectorAll(".classement li").forEach(x => x.classList.toggle("actif", x === li));
      ouvrirFiche(li.dataset.pays);
      cadrer([li.dataset.pays], { maxZoom: 4 });
    }));
    changerMode({ mode: "accord" });
  }

  function ongletClassement() {
    const [vainqueur, dauphin] = classement, max = totaux[vainqueur];
    // Le titre donne la nouvelle (le vainqueur et son avance) : ce sont les chiffres clés du vote.
    // L'appel à voter suit la nouvelle ; le mode d'emploi, plus bas, se lit juste avant la liste qu'il explique.
    contenu.innerHTML = `
      ${basculeClassement("joueurs")}
      <p class="surtitre">Ballon d'or 2026 · vote des ${PAYS.length} jurés</p>
      <h2 class="titre-vote">${esc(vainqueur)} sacré, ${totaux[vainqueur] - totaux[dauphin]} points devant ${esc(dauphin)}</h2>
      <button type="button" class="appel-vote" id="appel-vote">
        <strong>Et toi, qui aurait gagné ?</strong>
        <span>Fais ton top 10 et découvre quel pays a voté comme toi →</span>
      </button>
      <p class="intro">Chaque juré, un par pays, classe dix joueurs : ${BAREME[0]} points pour son 1er, ${BAREME[BAREME.length - 1]} pour son 10e.
        Cliquez sur un joueur pour voir sa géographie.</p>
      <ol class="classement">${classement.filter(j => totaux[j] > 0).map((j, i) => `
        <li data-joueur="${esc(j)}">
          <span class="rang">${i + 1}</span>
          ${photo(j)}
          <div><span class="nom">${esc(nomJoueur(j))}</span>
            <div class="meta">${nomPays(D.joueurs[j].nationalite)} · ${esc(D.joueurs[j].club)} · ${soutiens[j]}&nbsp;pays${premiers[j] ? ` · ${premiers[j]}×&nbsp;1er` : ""}</div>
            <div class="barre"><i style="width:${totaux[j] / max * 100}%;background:${COULEUR_JOUEUR[j] || "var(--or)"}"></i></div>
          </div>
          <span class="pts">${fmt(totaux[j])}<small>pts</small></span>
        </li>`).join("")}
      </ol>
      ${blocCredits()}`;
    brancherBascule();
    $("#appel-vote").addEventListener("click", () => allerOnglet("tonvote"));
    contenu.querySelectorAll("[data-joueur]").forEach(li => li.addEventListener("click", () => {
      const dejaActif = li.classList.contains("actif");
      contenu.querySelectorAll(".classement li").forEach(x => x.classList.remove("actif"));
      if (dejaActif) { changerMode({}); $("#volet-joueur").hidden = true; return; }
      li.classList.add("actif");
      montrerJoueur(li.dataset.joueur);
    }));
    changerMode({});
  }

  // Carte des points du joueur, son club, son pays, et la fiche des pays qui l'ont choisi
  function montrerJoueur(j) {
    changerMode({ mode: "joueur", joueur: j });
    const jj = D.joueurs[j];
    L.marker([jj.lat_club, jj.lon_club], { icon: L.divIcon({ className: "epingle-club", html: "<span></span>", iconSize: [18, 18] }) })
      .addTo(calqueSurcouche)
      .bindPopup(`<h3>${esc(jj.club)}</h3>${esc(jj.ville_club)} — club de ${esc(nomJoueur(j))}`);
    const n = D.pays[jj.nationalite];
    if (n) L.circleMarker([n.lat, n.lon], { radius: 12, color: css("--texte"), weight: 2, fill: false })
      .addTo(calqueSurcouche).bindTooltip(`Pays de ${esc(nomJoueur(j))} : ${esc(jj.nationalite)}`, { className: "infobulle" });
    ouvrirFicheJoueur(j);
  }

  // Depuis la recherche ou une fiche pays : passe par l'onglet Classement pour garder la liste en phase avec la carte
  function selectionnerJoueur(j) {
    if (!contenu.querySelector(".classement:not(.accord)")) allerOnglet("classement");
    contenu.querySelectorAll(".classement li").forEach(x => x.classList.toggle("actif", x.dataset.joueur === j));
    const li = contenu.querySelector(".classement li.actif");
    if (li) li.scrollIntoView({ block: "nearest" });
    montrerJoueur(j);
  }

  // ---------- Fiche joueur ----------
  function ouvrirFicheJoueur(j) {
    const jj = D.joueurs[j];
    const parRang = BAREME.map((_, i) => PAYS.filter(p => D.jury[p].votes[i] && D.jury[p].votes[i].joueur === j));
    const absents = PAYS.filter(p => pts[p][j] === 0);
    const puces = liste => `<div class="puces">${liste.map(p => `<button type="button" class="puce" data-pays="${esc(p)}">${nomPays(p)}</button>`).join("")}</div>`;
    const volet = $("#volet-joueur");
    volet.innerHTML = `
      <button class="fermer" aria-label="Fermer">×</button>
      <h2>${esc(nomJoueur(j))}</h2>
      <div class="meta">${nomPays(jj.nationalite)} · ${esc(jj.club)}</div>
      <p class="meta" style="margin-top:8px"><b style="color:var(--texte)">${rangGlobal[j]}e</b> · ${fmt(totaux[j])} pts ·
        cité par <b style="color:var(--texte)">${soutiens[j]}</b> jurés sur ${PAYS.length}</p>
      ${parRang.map((liste, i) => liste.length ? `
        <div class="section-titre">${i === 0 ? "1er" : `${i + 1}e`} choix · ${BAREME[i]} pts <span style="opacity:.7">(${liste.length})</span></div>
        ${puces(liste)}` : "").join("")}
      ${absents.length ? `<details class="absents"><summary class="section-titre">Ne l'ont pas cité (${absents.length})</summary>${puces(absents)}</details>` : ""}`;
    volet.hidden = false;
    volet.scrollTop = 0;
    volet.querySelector(".fermer").onclick = () => { volet.hidden = true; };
    volet.querySelectorAll("[data-pays]").forEach(b => b.addEventListener("click", () => {
      ouvrirFiche(b.dataset.pays);
      cadrer([b.dataset.pays], { maxZoom: 4 });
    }));
  }

  function ongletContinents() {
    const stats = CONTINENTS.map(c => {
      const jures = PAYS.filter(p => continentDe(p) === c);
      const somme = {};
      JOUEURS.forEach(j => { somme[j] = jures.reduce((s, p) => s + pts[p][j], 0); });
      const top = JOUEURS.slice().sort((a, b) => somme[b] - somme[a]).slice(0, 5);
      const n1 = {};
      jures.forEach(p => { const x = premierChoix(p); n1[x] = (n1[x] || 0) + 1; });
      // Part des points donnés à des joueurs du même continent
      const local = jures.reduce((s, p) => s + JOUEURS.filter(j => continentDe(D.joueurs[j].nationalite) === c).reduce((t, j) => t + pts[p][j], 0), 0);
      return { c, jures, somme, top, n1, local: local / (jures.length * 70) };
    }).filter(s => s.jures.length);

    contenu.innerHTML = `
      ${navRevelations("continents")}
      <h2>Le Ballon d'or vu des continents</h2>
      <p class="intro">Les favoris ne sont pas les mêmes partout. Moyenne de points par juré du continent, et part des voix
        accordées à des joueurs du même continent.</p>
      <div class="filtres">${["Tous", ...stats.map(s => s.c)].map(c => `<button data-c="${esc(c)}" class="${c === "Tous" ? "actif" : ""}">${esc(c)}</button>`).join("")}</div>
      ${stats.map(s => `
        <div class="carte-info" data-c="${esc(s.c)}">
          <span class="etiquette" style="background:${COULEUR_CONTINENT[s.c]}22;color:${COULEUR_CONTINENT[s.c]}">${s.jures.length} jurés</span>
          <h3 style="margin-top:6px">${esc(s.c)}</h3>
          ${s.top.map(j => `<div class="jauge"><span style="width:118px;color:var(--texte)">${esc(j)}</span>
            <div class="barre"><i style="width:${s.somme[j] / s.jures.length / 15 * 100}%;background:${COULEUR_CONTINENT[s.c]}"></i></div>
            ${fmt(s.somme[j] / s.jures.length, 1)}</div>`).join("")}
          <p>1ers choix : ${Object.entries(s.n1).sort((a, b) => b[1] - a[1]).map(([j, n]) => `${esc(j)} (${n})`).join(", ")}</p>
          <p>Voix pour des joueurs du continent : <b style="color:var(--texte)">${fmt(s.local * 100)} %</b></p>
        </div>`).join("")}
      <p class="meta">Continents géographiques : l'Australie (AFC) est classée en Océanie, Israël (UEFA) en Asie, la Turquie, la Russie et la Géorgie en Europe.</p>`;

    const choisir = c => {
      contenu.querySelectorAll(".filtres [data-c]").forEach(b => b.classList.toggle("actif", b.dataset.c === c));
      contenu.querySelectorAll(".carte-info").forEach(b => b.classList.toggle("actif", b.dataset.c === c));
      if (c === "Tous") { changerMode({ mode: "continent" }); carte.flyTo([25, 12], 2); return; }
      changerMode({ mode: "continent", continent: c });
      cadrer(PAYS.filter(p => continentDe(p) === c && D.pays[p].lon > -170));
    };
    contenu.querySelectorAll("[data-c]").forEach(el => el.addEventListener("click", () => choisir(el.dataset.c)));
    brancherRevelations();
    changerMode({ mode: "continent" });
  }

  // ---------- Duels ----------
  // Le duel libre se souvient des deux pays choisis tant que la page est ouverte
  const duelLibre = { a: PAYS.includes("France") ? "France" : PAYS[0], b: PAYS.includes("Algérie") ? "Algérie" : PAYS[1] };
  const verdictDuel = sim => sim >= 0.85 ? "presque le même bulletin" : sim >= 0.6 ? "des bulletins assez proches"
    : sim >= 0.3 ? "pas vraiment d'accord" : "des bulletins aux antipodes";

  function analyseDuel(a, b) {
    const sim = correlation(vecteur(a), vecteur(b));
    return { a, b, sim, verdict: verdictDuel(sim) };
  }

  function carteDuel(a, b, etiquette, contexte) {
    const { sim, verdict } = analyseDuel(a, b);
    const memeN1 = premierChoix(a) === premierChoix(b);
    const envers = (de, vers) => {
      const cibles = JOUEURS.filter(j => D.joueurs[j].nationalite === vers && totaux[j] > 0);
      if (!cibles.length) return "";
      const donne = cibles.reduce((s, j) => s + pts[de][j], 0), attendu = cibles.reduce((s, j) => s + moyenne(j), 0);
      const ecart = donne - attendu;
      return `<p>${esc(de)} → ses voix pour ${nomPays(vers)} : <b style="color:var(--texte)">${donne} pt${donne > 1 ? "s" : ""}</b>
        (moyenne mondiale ${fmt(attendu, 1)} ; <span style="color:${ecart < 0 ? "#d64545" : "#2e9e74"}">${ecart > 0 ? "+" : ""}${fmt(ecart, 1)}</span>)</p>`;
    };
    return `
      <div class="carte-info" data-duel data-a="${esc(a)}" data-b="${esc(b)}">
        <div class="carte-tete"><span class="etiquette or">${esc(etiquette)}</span>
          <button type="button" class="bouton-partager" data-partager aria-label="Partager le duel ${esc(a)} contre ${esc(b)}">Partager</button></div>
        <h3 style="margin-top:6px">${nomPays(a)} <span class="contre">contre</span> ${nomPays(b)}</h3>
        ${contexte ? `<p>${esc(contexte)}</p>` : ""}
        <div class="choc"><strong>${pourcent(sim)}</strong><span>de ressemblance : ${verdict}</span></div>
        <p>${memeN1 ? `Même 1er choix : <b style="color:var(--texte)">${esc(nomJoueur(premierChoix(a)))}</b>` : "1ers choix différents"}</p>
        ${envers(a, b)}${envers(b, a)}
        <div class="duel">
          ${[a, b].map(p => `<div><h4>${nomPays(p)}</h4><ol>${D.jury[p].votes.slice(0, 5).map(v => `<li>${esc(v.joueur)}</li>`).join("")}</ol></div>`).join("")}
        </div>
      </div>`;
  }

  function montrerDuel(a, b) {
    changerMode({ surbrillance: new Set([a, b]) });
    const pa = D.pays[a], pb = D.pays[b];
    L.polyline([[pa.lat, pa.lon], [pb.lat, pb.lon]], { color: "#d64545", weight: 2.5, dashArray: "6 6" }).addTo(calqueSurcouche);
    cadrer([a, b]);
  }

  function partagerDuel(a, b) {
    const { sim, verdict } = analyseDuel(a, b);
    const top3 = p => D.jury[p].votes.slice(0, 3).map(v => `${v.rang}. ${nomJoueur(v.joueur)}`).join(", ");
    ouvrirPartage(ctx => dessinerChoc(ctx, {
      tag: "Duel de bulletins",
      titre: `${drapeau(a)} ${a} contre ${drapeau(b)} ${b}`,
      choc: { chiffre: pourcent(sim), phrase: `de ressemblance entre le juré ${deP(a)} et celui ${deP(b)} : ${verdict}.` },
      texte: `${a} : ${top3(a)}. ${b} : ${top3(b)}.`
    }), `${a} contre ${b} : ${pourcent(sim)} de ressemblance entre leurs bulletins du Ballon d'or 2026, ${verdict}. Fais ton duel : ${LIEN_PUBLIC}`);
  }

  function ongletConflits() {
    const options = choisi => PAYS.map(p => `<option value="${esc(p)}" ${p === choisi ? "selected" : ""}>${esc(p)}</option>`).join("");
    contenu.innerHTML = `
      ${navRevelations("conflits")}
      <h2>Duels de bulletins</h2>
      <p class="intro">Choisis deux pays et compare leurs bulletins. À lire avec prudence : chaque pays n'a qu'un juré,
        dont le choix est personnel.</p>
      <div class="selecteurs">
        <select id="duel-a" class="saisie" aria-label="Premier pays">${options(duelLibre.a)}</select>
        <span class="contre">contre</span>
        <select id="duel-b" class="saisie" aria-label="Second pays">${options(duelLibre.b)}</select>
      </div>
      <div id="duel-libre"></div>
      <div class="section-titre">Conflits et rivalités</div>
      <p class="intro">Les bulletins de pays en guerre ou en tension se ressemblent-ils ? Les compatriotes de l'autre camp sont-ils boudés ?</p>
      ${D.rivalites.map(r => carteDuel(r.pays_a, r.pays_b, r.type, r.contexte)).join("")}`;

    const brancher = racine => {
      racine.querySelectorAll("[data-duel]").forEach(el => el.addEventListener("click", e => {
        if (e.target.closest("[data-partager]")) { partagerDuel(el.dataset.a, el.dataset.b); return; }
        contenu.querySelectorAll(".carte-info").forEach(x => x.classList.toggle("actif", x === el));
        montrerDuel(el.dataset.a, el.dataset.b);
      }));
    };
    const majDuelLibre = () => {
      duelLibre.a = $("#duel-a").value;
      duelLibre.b = $("#duel-b").value;
      const zone = $("#duel-libre");
      if (duelLibre.a === duelLibre.b) {
        zone.innerHTML = `<p class="meta">Choisis deux pays différents.</p>`;
        changerMode({});
        return;
      }
      zone.innerHTML = carteDuel(duelLibre.a, duelLibre.b, "Ton duel");
      zone.firstElementChild.classList.add("actif");
      brancher(zone);
      montrerDuel(duelLibre.a, duelLibre.b);
    };
    $("#duel-a").addEventListener("change", majDuelLibre);
    $("#duel-b").addEventListener("change", majDuelLibre);
    brancher(contenu);
    brancherRevelations();
    majDuelLibre();
  }

  function ongletCuriosites() {
    const cartes = [];

    const patriotes = [];
    PAYS.forEach(p => D.jury[p].votes.forEach(v => { if (D.joueurs[v.joueur].nationalite === p) patriotes.push({ p, ...v }); }));
    patriotes.sort((a, b) => a.rang - b.rang);
    cartes.push({
      tag: "Patriotisme", titre: "Les votes du cœur",
      texte: `${patriotes.filter(x => x.rang === 1).length} jurés placent un compatriote en tête : ` +
        patriotes.filter(x => x.rang === 1).map(x => `${x.p} → ${x.joueur}`).join(", ") + ". " +
        `Au total, ${patriotes.length} votes vont à un joueur du pays du juré.`,
      choc: { chiffre: String(patriotes.filter(x => x.rang === 1).length), phrase: "jurés ont mis un joueur de leur propre pays en tête" },
      pays: patriotes.map(x => x.p)
    });

    const boudes = [];
    JOUEURS.forEach(j => {
      const n = D.joueurs[j].nationalite;
      if (D.jury[n] && moyenne(j) - pts[n][j] >= 0.5) boudes.push({ j, n, donne: pts[n][j] });
    });
    boudes.sort((a, b) => (a.donne - moyenne(a.j)) - (b.donne - moyenne(b.j)));
    if (boudes.length) cartes.push({
      choc: {
        chiffre: `${boudes[0].donne} pt${boudes[0].donne > 1 ? "s" : ""}`,
        phrase: `pour ${nomJoueur(boudes[0].j)} de la part du juré de son propre pays, ${boudes[0].n}. Le juré moyen lui en donne ${fmt(moyenne(boudes[0].j), 1)}.`
      },
      tag: "Paradoxe", titre: "Nul n'est prophète en son pays",
      texte: "Joueurs moins bien notés par leur propre pays que par le juré moyen : " +
        boudes.slice(0, 8).map(x => `${x.j} (${x.n} : ${x.donne} pt${x.donne > 1 ? "s" : ""}, moyenne ${fmt(moyenne(x.j), 1)})`).join(", ") + ".",
      pays: boudes.map(x => x.n)
    });

    const top5 = classement.slice(0, 5);
    const surprises = PAYS.filter(p => !top5.includes(premierChoix(p)));
    cartes.push({
      tag: "Surprise", titre: "Les 1ers choix hors du top 5",
      texte: surprises.map(p => `${p} → ${premierChoix(p)}`).join(", ") + ".",
      choc: { chiffre: String(surprises.length), phrase: "jurés ont choisi un n°1 qui ne finit même pas dans le top 5" },
      pays: surprises
    });

    cartes.push({
      tag: "Originalité", titre: "Les bulletins les plus originaux",
      texte: `Comparés au classement final, les jurés de ${parAccord.slice(0, 5).map(p => `${p} (${fmt(accord[p], 2)})`).join(", ")} s'en écartent le plus. ` +
        `Les plus conformes : ${parAccord.slice(-3).reverse().map(p => `${p} (${fmt(accord[p], 2)})`).join(", ")}.`,
      choc: { chiffre: parAccord[0], phrase: `a rendu le bulletin le plus original du monde, avec ${nomJoueur(premierChoix(parAccord[0]))} en tête` },
      pays: parAccord.slice(0, 5), mode: "accord"
    });

    const absences = top5.map(j => ({ j, zero: PAYS.filter(p => pts[p][j] === 0) }));
    // Le vainqueur oublié frappe plus fort ; sinon le favori le plus souvent oublié
    const oublie = absences[0].zero.length ? absences[0] : absences.slice().sort((a, b) => b.zero.length - a.zero.length)[0];
    cartes.push({
      choc: {
        chiffre: String(oublie.zero.length),
        phrase: `jurés n'ont donné aucun point à ${nomJoueur(oublie.j)}, ${rangGlobal[oublie.j] === 1 ? "pourtant vainqueur" : `${rangGlobal[oublie.j]}e du vote`}`
      },
      tag: "Absences", titre: "Les favoris oubliés",
      texte: absences.map(a => `${a.j} : 0 point de ${a.zero.length} pays${a.zero.length && a.zero.length <= 6 ? ` (${a.zero.join(", ")})` : ""}`).join(" ; ") + ".",
      pays: [...new Set(absences.flatMap(a => a.zero))]
    });

    const rares = JOUEURS.filter(j => soutiens[j] > 0 && soutiens[j] <= 2);
    if (rares.length) cartes.push({
      choc: { chiffre: String(rares.length), phrase: `joueurs n'ont été cités que par un ou deux jurés, comme ${nomJoueur(rares[0])}` },
      tag: "Rareté", titre: "Un seul pays (ou presque) y a cru",
      texte: rares.map(j => `${j} (${PAYS.filter(p => pts[p][j] > 0).map(p => `${p} ${pts[p][j]}`).join(", ")})`).join(", ") + ".",
      pays: [...new Set(rares.flatMap(j => PAYS.filter(p => pts[p][j] > 0)))]
    });

    const championnat = PAYS.map(p => {
      const local = JOUEURS.filter(j => D.joueurs[j].pays_club === p).reduce((s, j) => s + pts[p][j], 0);
      const attendu = JOUEURS.filter(j => D.joueurs[j].pays_club === p).reduce((s, j) => s + moyenne(j), 0);
      return { p, local, attendu };
    }).filter(x => x.attendu > 0).sort((a, b) => (b.local - b.attendu) - (a.local - a.attendu));
    if (championnat.length) cartes.push({
      choc: {
        chiffre: `+${fmt(championnat[0].local - championnat[0].attendu)} pts`,
        phrase: `donnés par le juré ${deP(championnat[0].p)} aux joueurs de son championnat, par rapport au juré moyen`
      },
      tag: "Championnat", titre: "Chacun voit midi à son clocher",
      texte: "Points donnés aux joueurs évoluant dans le championnat du juré, comparés à la moyenne mondiale : " +
        championnat.map(x => `${x.p} ${x.local} pts (attendu ${fmt(x.attendu, 1)})`).join(", ") + ".",
      pays: championnat.map(x => x.p)
    });

    const parClub = {};
    PAYS.forEach(p => { const c = D.joueurs[premierChoix(p)].ville_club; parClub[c] = (parClub[c] || 0) + 1; });
    const villes = Object.entries(parClub).sort((a, b) => b[1] - a[1]);
    cartes.push({
      tag: "Flux", titre: `Toutes les routes mènent à ${villes[0][0]}`,
      texte: "Chaque ligne relie un juré à la ville du club de son 1er choix : " +
        villes.map(([v, n]) => `${v} (${n})`).join(", ") + ".",
      choc: { chiffre: String(villes[0][1]), phrase: `jurés sur ${PAYS.length} ont voté en premier pour un joueur de ${villes[0][0]}` },
      pays: PAYS, flux: true
    });

    // Les révélations d'abord ; le carrousel, qui les reprend toutes, vient après elles
    contenu.innerHTML = `
      ${navRevelations("curiosites")}
      <h2>Curiosités du vote</h2>
      <p class="intro">Détectées automatiquement dans les bulletins. Cliquez sur une carte pour voir les pays concernés.</p>
      <div class="defile-chocs">${cartes.map((c, i) => `<div class="carte-info" data-k="${i}">
        <div class="carte-tete"><span class="etiquette or">${esc(c.tag)}</span>
          <button type="button" class="bouton-partager" data-partager="${i}" aria-label="Partager « ${esc(c.titre)} »">Partager</button></div>
        <h3 style="margin-top:6px">${esc(c.titre)}</h3>
        <div class="choc"><strong>${esc(c.choc.chiffre)}</strong><span>${esc(c.choc.phrase)}</span></div>
        <p class="detail">${esc(c.texte)}</p></div>`).join("")}</div>
      <button type="button" class="bouton-second bouton-carrousel" id="bouton-carrousel">Télécharger toutes ces cartes (carrousel PDF pour LinkedIn)</button>`;

    $("#bouton-carrousel").addEventListener("click", () => telechargerCarrousel(cartes));
    contenu.querySelectorAll("[data-partager]").forEach(b => b.addEventListener("click", () => {
      const c = cartes[+b.dataset.partager];
      ouvrirPartage(ctx => dessinerChoc(ctx, c), `${c.choc.chiffre} ${c.choc.phrase} 🤯 Le vote du Ballon d'or 2026, pays par pays : ${LIEN_PUBLIC}`);
    }));
    contenu.querySelectorAll("[data-k]").forEach(el => el.addEventListener("click", e => {
      if (e.target.closest("[data-partager]")) return;
      const c = cartes[+el.dataset.k];
      contenu.querySelectorAll(".carte-info").forEach(x => x.classList.toggle("actif", x === el));
      changerMode(c.mode ? { mode: c.mode } : { surbrillance: new Set(c.pays) });
      if (c.flux) {
        PAYS.forEach(p => {
          const j = D.joueurs[premierChoix(p)];
          L.polyline([[D.pays[p].lat, D.pays[p].lon], [j.lat_club, j.lon_club]],
            { color: COULEUR_JOUEUR[premierChoix(p)], weight: 1.2, opacity: 0.6 }).addTo(calqueSurcouche);
        });
        carte.flyTo([30, 10], 2.25);
      } else {
        cadrer(c.pays.filter(p => D.pays[p].lon > -170));
      }
    }));
    brancherRevelations();
    changerMode({});

    // Sur téléphone, les chocs défilent de côté et la carte suit celui qu'on regarde
    if (estMobile()) {
      const defile = contenu.querySelector(".defile-chocs");
      defile.insertAdjacentHTML("afterend", `<div class="pastilles-chocs" aria-hidden="true">${cartes.map(() => "<i></i>").join("")}</div>`);
      const pastilles = contenu.querySelectorAll(".pastilles-chocs i");
      const vues = new IntersectionObserver(entrees => entrees.forEach(en => {
        if (!en.isIntersecting) return;
        pastilles.forEach((p, i) => p.classList.toggle("actif", i === +en.target.dataset.k));
        if (!en.target.classList.contains("actif")) en.target.click();
      }), { root: defile, threshold: 0.75 });
      defile.querySelectorAll("[data-k]").forEach(el => vues.observe(el));
    }
  }

  function ongletHistoire() {
    const compte = cle => {
      const c = {};
      D.palmares.forEach(w => { c[w[cle]] = (c[w[cle]] || 0) + 1; });
      return Object.entries(c).sort((a, b) => b[1] - a[1]);
    };
    const continentClub = pays => ({ "États-Unis": "Amérique du Nord" }[pays] || "Europe");
    const clubs = {};
    D.palmares.forEach(w => { const c = continentClub(w.pays_club); clubs[c] = (clubs[c] || 0) + 1; });
    const n = D.palmares.length;
    const barres = (titre, liste) => `<div class="section-titre">${titre}</div>` + liste.map(([k, v]) =>
      `<div class="jauge"><span style="width:150px;color:var(--texte)">${esc(k)}</span><div class="barre"><i style="width:${v / n * 100}%"></i></div>${v}</div>`).join("");
    const categories = ["Toutes", ...new Set(D.histoires.map(h => h.categorie))];
    const histoires = D.histoires.slice().sort((a, b) => a.annee - b.annee);

    contenu.innerHTML = `
      ${D.trophee ? `<figure class="vitrine"><img src="${esc(D.trophee)}" alt="Le trophée du Ballon d'or exposé en vitrine">
        <figcaption>Le trophée, créé par <i>France Football</i> en 1956</figcaption></figure>` : ""}
      <h2>70 ans d'histoire</h2>
      <p class="intro">${n} trophées attribués de 1956 à 2025 (pas d'édition en 2020). La carte compte les lauréats par pays
        actuel : l'URSS est répartie entre Russie et Ukraine, la RFA comptée avec l'Allemagne, l'Angleterre, l'Écosse et l'Irlande du Nord avec le Royaume-Uni.</p>
      ${barres("Continent de la nationalité", compte("continent_nation"))}
      ${barres("Continent de naissance", compte("continent_naissance"))}
      ${barres("Continent du club", Object.entries(clubs))}
      <p class="meta">Réservé aux Européens jusqu'en 1995, le trophée s'ouvre ensuite aux étrangers jouant en Europe, puis au monde entier en 2007.
        Seul Messi, en 2023 à Miami, l'a gagné en jouant hors d'Europe.</p>
      <div class="section-titre">Histoires</div>
      <div class="filtres">${categories.map(c => `<button data-cat="${esc(c)}" class="${c === "Toutes" ? "actif" : ""}">${esc(c)}</button>`).join("")}</div>
      <div id="histoires">${histoires.map((h, i) => `
        <div class="carte-info" data-h="${i}" data-categorie="${esc(h.categorie)}">
          <span class="etiquette or">${h.annee}</span><span class="etiquette">${esc(h.categorie)}</span>
          <h3 style="margin-top:6px">${esc(h.titre)}</h3><p>${esc(h.recit)}</p></div>`).join("")}</div>
      <div class="section-titre">Palmarès</div>
      <table class="tableau"><thead><tr><th>Année</th><th>Lauréat</th><th>Nation</th><th>Club</th></tr></thead>
        <tbody>${D.palmares.slice().reverse().map(w => `<tr data-iso="${esc(w.iso_num)}"><td>${w.annee}</td><td>${esc(w.joueur)}</td><td>${esc(w.nation_historique)}</td><td>${esc(w.club)}</td></tr>`).join("")}</tbody></table>
      <p class="meta" style="margin-top:12px">Palmarès et récits ajoutés à partir de sources générales (fichiers donnees/palmares_historique.csv et donnees/histoires.csv), modifiables.</p>`;

    changerMode({ mode: "historique" });
    const points = histoires.map(h => L.circleMarker([h.lat, h.lon], { radius: 6, color: css("--surface"), weight: 1.5, fillColor: "#b8860b", fillOpacity: 1 })
      .bindPopup(`<h3>${esc(h.titre)}</h3><b>${h.annee} · ${esc(h.lieu)}</b><br>${esc(h.recit)}`)
      .addTo(calqueSurcouche));

    contenu.querySelectorAll("[data-cat]").forEach(b => b.addEventListener("click", () => {
      const c = b.dataset.cat;
      contenu.querySelectorAll("[data-cat]").forEach(x => x.classList.toggle("actif", x === b));
      contenu.querySelectorAll("[data-h]").forEach(el => { el.hidden = c !== "Toutes" && el.dataset.categorie !== c; });
      histoires.forEach((h, i) => points[i].setStyle({ opacity: c === "Toutes" || h.categorie === c ? 1 : 0, fillOpacity: c === "Toutes" || h.categorie === c ? 1 : 0 }));
    }));
    contenu.querySelectorAll("[data-h]").forEach(el => el.addEventListener("click", () => {
      const i = +el.dataset.h;
      contenu.querySelectorAll("[data-h]").forEach(x => x.classList.toggle("actif", x === el));
      carte.flyTo([histoires[i].lat, histoires[i].lon], 5, { duration: 0.8 });
      carte.once("moveend", () => points[i].openPopup());
    }));
    contenu.querySelectorAll("[data-iso]").forEach(tr => tr.addEventListener("click", () => {
      const b = boundsParIso[tr.dataset.iso];
      if (b) carte.flyToBounds(b.pad(0.4), { maxZoom: 5, duration: 0.8 });
    }));
  }

  // ---------- Ton vote : le visiteur joue au juré ----------
  // Lien glissé dans les images et les textes partagés ; à changer si l'appli est hébergée ailleurs
  const LIEN_PUBLIC = "https://foxraa.github.io/atlas-ballon-or/";
  const memoire = {
    lire: () => { try { return JSON.parse(localStorage.getItem("atlas-bo-vote")) || {}; } catch (e) { return {}; } },
    ecrire: v => { try { localStorage.setItem("atlas-bo-vote", JSON.stringify(v)); } catch (e) { /* stockage indisponible : le vote reste en mémoire */ } }
  };
  const souvenir = memoire.lire();
  // Les 10 cases du bulletin, qui peuvent rester vides (null) ; monVote en est la version tassée
  const cases = BAREME.map((_, i) => {
    const j = (souvenir.vote || [])[i];
    return typeof j === "string" && Object.hasOwn(D.joueurs, j) ? j : null;
  });
  let monVote = cases.filter(Boolean);
  let monPrenom = souvenir.prenom || "";
  let affinite = {}; // corrélation entre mon bulletin et celui de chaque pays
  const sauver = () => memoire.ecrire({ vote: cases, prenom: monPrenom });

  function analyserMonVote() {
    const mes = {};
    monVote.forEach((j, i) => { mes[j] = BAREME[i]; });
    const v = JOUEURS.map(j => mes[j] || 0);
    affinite = {};
    PAYS.forEach(p => { affinite[p] = correlation(v, vecteur(p)); });
    const tri = PAYS.slice().sort((a, b) => affinite[b] - affinite[a]);
    return {
      jumeau: tri[0], suivants: tri.slice(1, 5), oppose: tri[tri.length - 1], monde: correlation(v, vecteurMonde),
      coupDeCoeur: monVote.slice().sort((a, b) => totaux[a] - totaux[b])[0]
    };
  }

  // « Ton vote » prend toute la page ; la carte revient sur demande pour voir les pays qui te ressemblent
  const disposition = $(".disposition");
  const enPleinePage = () => disposition.classList.contains("vote-plein");
  function basculerCarte(voirCarte) {
    disposition.classList.toggle("vote-plein", !voirCarte);
    const b = $("#bascule-carte");
    if (b) b.textContent = voirCarte ? "Agrandir le vote" : "Voir sur la carte";
    if (voirCarte) {
      carte.invalidateSize();
      // Vue monde plutôt que le seul pays jumeau : on voit tous les pays qui votent comme toi
      carte.setView(MONDE, zoomMonde());
      if (estMobile()) mettreTiroir("bas");
    }
  }

  function ongletTonVote() {
    disposition.classList.add("vote-plein");
    $("#podium").hidden = true;
    contenu.innerHTML = `
      <div class="vote-page">
        <header class="vote-tete">
          <div>
            <h2>Ton Ballon d'or</h2>
            <p class="intro">Classe 10 joueurs comme un juré : 15 points pour ton 1er, 1 pour ton 10e.
              On te dit ensuite quel pays a voté comme toi.</p>
          </div>
          <button type="button" class="bouton-second" id="bascule-carte">Voir sur la carte</button>
        </header>
        <div class="vote-colonnes">
          <section class="vote-bulletin" aria-labelledby="titre-bulletin">
            <div class="bulletin-tete">
              <div class="section-titre" id="titre-bulletin">Ton bulletin</div>
              <button type="button" class="lien-discret" id="remise-a-zero"></button>
            </div>
            <ol class="bulletin" id="bulletin"></ol>
            <button type="button" class="lien-discret" id="completer">Compléter avec le classement officiel</button>
            <button type="button" class="bouton-principal" id="reveler"></button>
          </section>
          <section class="vote-choix" aria-labelledby="titre-choix">
            <div class="section-titre" id="titre-choix">Choisis tes joueurs</div>
            <p class="meta">Touche un joueur pour le mettre dans la première case libre, touche-le encore pour le retirer.</p>
            <div class="vivier-outils">
              <label class="cache" for="vivier-recherche">Filtrer les joueurs</label>
              <input id="vivier-recherche" class="saisie" type="search" placeholder="Nom, club ou pays…" autocomplete="off" spellcheck="false">
              <div class="filtres" id="vivier-postes" role="group" aria-label="Poste">
                ${["Tous", "Attaquant", "Ailier", "Milieu", "Défenseur"].map((p, i) =>
                  `<button type="button" data-poste="${p}" class="${i ? "" : "actif"}" aria-pressed="${!i}">${p}</button>`).join("")}
              </div>
            </div>
            <ul class="vivier" id="vivier"></ul>
          </section>
        </div>
        <div id="resultat"></div>
      </div>`;

    // Le bulletin d'avant la remise à zéro : le même bouton le rétablit tant qu'aucun joueur n'est rechoisi
    let avantRaz = null;
    const dessiner = () => {
      $("#bulletin").innerHTML = BAREME.map((pts, i) => {
        const j = cases[i], nom = j ? esc(nomJoueur(j)) : "";
        return `<li class="${j ? "" : "vide"}"><span class="rang">${i + 1}</span>
          <input class="nom" data-case="${i}" value="${nom}" placeholder="Tape un nom…" autocomplete="off" spellcheck="false"
            role="combobox" aria-expanded="false" aria-controls="suggestions-${i}" aria-autocomplete="list"
            aria-label="${i + 1}${i ? "e" : "er"} choix (${pts} points)">
          <span class="pts">${pts}</span>
          <button type="button" data-monter="${i}" aria-label="Monter ${nom || "cette case"}" ${i ? "" : "disabled"}>↑</button>
          <button type="button" data-descendre="${i}" aria-label="Descendre ${nom || "cette case"}" ${i < BAREME.length - 1 ? "" : "disabled"}>↓</button>
          <button type="button" data-retirer="${i}" aria-label="Vider ${nom || "cette case"}" ${j ? "" : "disabled"}>×</button>
          <ul class="suggestions" id="suggestions-${i}" role="listbox" aria-label="Joueurs proposés" hidden></ul></li>`;
      }).join("");
      dessinerVivier();
      const reste = 10 - monVote.length;
      $("#reveler").disabled = reste > 0;
      $("#reveler").textContent = reste ? `Encore ${reste} joueur${reste > 1 ? "s" : ""} à classer` : "Quel pays a voté comme moi ?";
      $("#completer").hidden = !reste;
      $("#remise-a-zero").hidden = !monVote.length && !avantRaz;
      $("#remise-a-zero").textContent = monVote.length ? "Remettre à zéro" : "Annuler";
      sauver();
    };
    const modifier = action => {
      action();
      monVote = cases.filter(Boolean);
      if (monVote.length) avantRaz = null;
      $("#resultat").innerHTML = "";
      if (etat.mode === "moi") changerMode({});
      dessiner();
    };
    const premiereVide = () => cases.indexOf(null);
    // Après un déplacement, le focus suit le joueur : on peut l'emmener de plusieurs places d'affilée au clavier
    function deplacer(de, vers) {
      modifier(() => { [cases[de], cases[vers]] = [cases[vers], cases[de]]; });
      const [sens, inverse] = vers < de ? ["monter", "descendre"] : ["descendre", "monter"];
      const bouton = $(`#bulletin [data-${sens}="${vers}"]`);
      (bouton.disabled ? $(`#bulletin [data-${inverse}="${vers}"]`) : bouton).focus();
    }

    // Le vivier : les 30 joueurs en cartes, filtrables par nom et par poste
    let filtreTexte = "", filtrePoste = "Tous";
    function dessinerVivier() {
      const plein = premiereVide() < 0;
      const visibles = classement.filter(j => {
        const f = D.joueurs[j];
        return (filtrePoste === "Tous" || f.poste === filtrePoste) &&
          sansAccents(`${j} ${f.nom_complet} ${f.club} ${f.nationalite}`).includes(filtreTexte);
      });
      $("#vivier").innerHTML = visibles.length ? visibles.map(j => {
        const f = D.joueurs[j], place = cases.indexOf(j);
        return `<li><button type="button" data-joueur="${esc(j)}" aria-pressed="${place >= 0}" ${place < 0 && plein ? "disabled" : ""}
            aria-label="${esc(f.nom_complet)}${place >= 0 ? `, ${place + 1}${place ? "e" : "er"} de ton bulletin` : ""}">
          ${photo(j, "moyen")}
          <span class="nom">${esc(f.nom_complet)}</span>
          <span class="meta">${esc(f.poste)} · ${esc(f.club)}</span>
          <span class="etiquette">${place >= 0 ? `${place + 1}${place ? "e" : "er"} choix` : `${rangGlobal[j]}${rangGlobal[j] > 1 ? "e" : "er"} du vote`}</span>
        </button></li>`;
      }).join("") : `<li class="aucun meta">Aucun joueur ne correspond.</li>`;
    }

    // Autocomplétion des cases : une seule liste ouverte à la fois
    let proposes = [], actif = -1, caseOuverte = -1;
    const champCase = i => $(`#bulletin input[data-case="${i}"]`);
    function dessinerSuggestions() {
      document.querySelectorAll("#bulletin .suggestions").forEach(ul => { ul.hidden = true; ul.innerHTML = ""; });
      document.querySelectorAll("#bulletin input[data-case]").forEach(c => {
        c.setAttribute("aria-expanded", "false"); c.removeAttribute("aria-activedescendant");
      });
      if (caseOuverte < 0 || !proposes.length) return;
      const champ = champCase(caseOuverte), ul = champ.parentElement.querySelector(".suggestions");
      ul.innerHTML = proposes.map((j, k) => `
        <li role="option" id="propose-${k}" data-joueur="${esc(j)}" aria-selected="${k === actif}">
          <span>${esc(nomJoueur(j))}</span><span class="meta">${esc(D.joueurs[j].poste)} · ${esc(D.joueurs[j].club)}</span></li>`).join("");
      ul.hidden = false;
      champ.setAttribute("aria-expanded", "true");
      if (actif >= 0) champ.setAttribute("aria-activedescendant", `propose-${actif}`);
      ul.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
    }
    function proposer(champ) {
      const i = +champ.dataset.case, q = sansAccents(champ.value.trim());
      const pris = new Set(cases.filter((j, k) => j && k !== i));
      const libres = classement.filter(j => !pris.has(j));
      // Un nom qui commence par la saisie, ou dont un mot commence par elle, passe devant ; sinon l'ordre du vote officiel
      const debut = j => sansAccents(nomJoueur(j)).startsWith(q) ? 0 : sansAccents(nomJoueur(j)).split(/[\s-]+/).some(m => m.startsWith(q)) ? 1 : 2;
      proposes = q ? libres.filter(j => sansAccents(`${j} ${nomJoueur(j)}`).includes(q)).sort((a, b) => debut(a) - debut(b)) : libres;
      caseOuverte = i;
      actif = q && proposes.length ? 0 : -1;
      dessinerSuggestions();
    }
    function fermerSuggestions() { proposes = []; actif = -1; caseOuverte = -1; dessinerSuggestions(); }
    function placer(i, j) {
      fermerSuggestions();
      modifier(() => { cases[i] = j; });
      // On enchaîne sur la prochaine case vide pour taper les 10 noms d'affilée
      const suivante = premiereVide();
      if (suivante >= 0) champCase(suivante).focus();
    }

    $("#vivier").addEventListener("click", e => {
      const b = e.target.closest("[data-joueur]");
      if (!b || b.disabled) return;
      const j = b.dataset.joueur, place = cases.indexOf(j);
      modifier(() => { cases[place >= 0 ? place : premiereVide()] = place >= 0 ? null : j; });
      $(`#vivier [data-joueur="${CSS.escape(j)}"]`)?.focus();
    });
    $("#vivier-recherche").addEventListener("input", e => { filtreTexte = sansAccents(e.target.value.trim()); dessinerVivier(); });
    $("#vivier-postes").addEventListener("click", e => {
      const b = e.target.closest("[data-poste]");
      if (!b) return;
      filtrePoste = b.dataset.poste;
      $("#vivier-postes").querySelectorAll("[data-poste]").forEach(x => {
        x.classList.toggle("actif", x === b); x.setAttribute("aria-pressed", String(x === b));
      });
      dessinerVivier();
    });
    $("#bascule-carte").addEventListener("click", () => basculerCarte(enPleinePage()));
    $("#bulletin").addEventListener("click", e => {
      const monter = e.target.closest("[data-monter]"), descendre = e.target.closest("[data-descendre]"), retirer = e.target.closest("[data-retirer]");
      if (monter && !monter.disabled) deplacer(+monter.dataset.monter, +monter.dataset.monter - 1);
      else if (descendre && !descendre.disabled) deplacer(+descendre.dataset.descendre, +descendre.dataset.descendre + 1);
      else if (retirer && !retirer.disabled) modifier(() => { cases[+retirer.dataset.retirer] = null; });
    });
    $("#bulletin").addEventListener("focusin", e => {
      if (e.target.matches("input[data-case]")) { e.target.select(); proposer(e.target); }
    });
    $("#bulletin").addEventListener("input", e => { if (e.target.matches("input[data-case]")) proposer(e.target); });
    $("#bulletin").addEventListener("keydown", e => {
      const champ = e.target.closest("input[data-case]");
      if (!champ) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        if (!proposes.length) return;
        e.preventDefault();
        actif = (actif + (e.key === "ArrowDown" ? 1 : -1) + proposes.length) % proposes.length;
        dessinerSuggestions();
      } else if (e.key === "Enter" && actif >= 0) {
        e.preventDefault();
        placer(+champ.dataset.case, proposes[actif]);
      } else if (e.key === "Escape") {
        const j = cases[+champ.dataset.case];
        champ.value = j ? nomJoueur(j) : "";
        fermerSuggestions();
      }
    });
    // mousedown plutôt que click : le choix passe avant que le champ perde le focus
    $("#bulletin").addEventListener("mousedown", e => {
      const li = e.target.closest(".suggestions [data-joueur]");
      if (li) { e.preventDefault(); placer(caseOuverte, li.dataset.joueur); }
    });
    // En quittant une case sans choisir, elle reprend son joueur ; un champ vidé libère la case
    $("#bulletin").addEventListener("focusout", e => {
      const champ = e.target.closest("input[data-case]");
      if (!champ) return;
      const i = +champ.dataset.case;
      setTimeout(() => {
        if (caseOuverte === i) fermerSuggestions();
        if (!champ.isConnected) return;
        if (!champ.value.trim() && cases[i]) {
          const suivant = document.activeElement?.dataset?.case;
          modifier(() => { cases[i] = null; });
          if (suivant !== undefined) champCase(suivant).focus();
        } else champ.value = cases[i] ? nomJoueur(cases[i]) : "";
      }, 120);
    });
    $("#completer").addEventListener("click", () => modifier(() => {
      const libres = classement.filter(j => !cases.includes(j));
      cases.forEach((j, i) => { if (!j) cases[i] = libres.shift(); });
    }));
    $("#reveler").addEventListener("click", () => revelerJumeau(true));
    $("#remise-a-zero").addEventListener("click", () => {
      if (monVote.length) {
        avantRaz = cases.slice();
        modifier(() => cases.fill(null));
      } else if (avantRaz) {
        const retour = avantRaz;
        modifier(() => retour.forEach((j, i) => { cases[i] = j; }));
        // Un bulletin rétabli au complet retrouve son verdict, comme à l'ouverture de l'onglet
        if (monVote.length === 10) revelerJumeau(false);
      }
    });

    dessiner();
    if (monVote.length === 10) revelerJumeau(false);
    else changerMode({});
  }

  function revelerJumeau(anime) {
    const r = analyserMonVote();
    const zone = $("#resultat");
    const afficher = () => {
      const top5 = liste => `<ol>${liste.slice(0, 5).map(j => `<li>${esc(j)}</li>`).join("")}</ol>`;
      const jure = D.jury[r.jumeau], opp = D.jury[r.oppose];
      // Le partage suit le verdict, avant les détails ; le prénom n'est demandé qu'ici, là où il sert (sur l'image)
      zone.innerHTML = `
        <div class="jumeau">
          <span class="surtitre">Tu as voté comme…</span>
          <h3>${nomPays(r.jumeau)}</h3>
          <p class="score-jumeau">${pourcent(affinite[r.jumeau])} de ressemblance</p>
          <p class="meta">Juré : <b>${esc(jure.journaliste)}</b> · ${esc(jure.media)}</p>
          <div class="section-titre">Et aussi comme…</div>
          <ol class="voisins">${r.suivants.map(p => `
            <li><span class="pays">${nomPays(p)}</span>
              <span class="jauge" aria-hidden="true"><span style="width:${Math.max(0, affinite[p]) * 100}%"></span></span>
              <b>${pourcent(affinite[p])}</b></li>`).join("")}</ol>
          <div class="duel">
            <div><h4>Toi</h4>${top5(monVote)}</div>
            <div><h4>${esc(r.jumeau)}</h4>${top5(jure.votes.map(v => v.joueur))}</div>
          </div>
        </div>
        <div class="partage-vote">
          <label class="champ" for="ton-prenom">Ton prénom <span>(facultatif, il apparaîtra sur ton image)</span></label>
          <input id="ton-prenom" class="saisie" maxlength="20" autocomplete="given-name" placeholder="Ex. Karim" value="${esc(monPrenom)}">
          <button type="button" class="bouton-principal" id="mon-image">Créer mon image à partager</button>
          <button type="button" class="lien-discret" id="voir-mes-pays">Voir sur la carte les pays qui votent comme toi</button>
        </div>
        <div class="carte-info statique">
          <p>Ton opposé : <b>${esc(r.oppose)}</b> (${pourcent(affinite[r.oppose])}), qui avait mis ${esc(opp.votes[0].joueur)} en tête.</p>
          <p>Ressemblance avec le résultat final : <b>${pourcent(r.monde)}</b>.</p>
          <p>Ton coup de cœur : <b>${esc(nomJoueur(r.coupDeCoeur))}</b>, ${rangGlobal[r.coupDeCoeur]}e du vote, cité par ${soutiens[r.coupDeCoeur]} jurés sur ${PAYS.length}.</p>
        </div>`;
      $("#ton-prenom").addEventListener("input", e => { monPrenom = e.target.value.trim(); sauver(); });
      $("#mon-image").addEventListener("click", () => ouvrirPartage(ctx => dessinerBulletin(ctx, r), texteBulletin(r)));
      $("#voir-mes-pays").addEventListener("click", () => basculerCarte(true));
      changerMode({ mode: "moi" });
      const n = D.pays[r.jumeau];
      L.circleMarker([n.lat, n.lon], { radius: 13, color: css("--or"), weight: 3, fill: false }).addTo(calqueSurcouche)
        .bindTooltip(`Tu as voté comme : ${esc(r.jumeau)}`, { className: "infobulle", permanent: true, direction: "top", offset: [0, -12] });
      if (anime) {
        if (!enPleinePage()) carte.flyTo(MONDE, zoomMonde(), { duration: 0.8 });
        zone.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    if (!anime || matchMedia("(prefers-reduced-motion: reduce)").matches) { afficher(); return; }
    // Petit suspense : les pays défilent avant le verdict
    zone.innerHTML = `<div class="jumeau recherche"><span class="surtitre">Quel pays a voté comme toi…</span><h3 id="defile">&nbsp;</h3></div>`;
    zone.scrollIntoView({ behavior: "smooth", block: "nearest" });
    const defile = setInterval(() => { $("#defile").textContent = PAYS[Math.floor(Math.random() * PAYS.length)]; }, 70);
    setTimeout(() => { clearInterval(defile); afficher(); }, 1300);
  }

  const texteBulletin = r =>
    `Mon Ballon d'or 2026 : ${monVote.slice(0, 3).map((j, i) => `${i + 1}. ${nomJoueur(j)}`).join(", ")}… ` +
    `J'ai voté comme le juré ${deP(r.jumeau)} (${pourcent(affinite[r.jumeau])} de ressemblance). Et toi ? ${LIEN_PUBLIC}`;

  // ---------- Images à partager (1080 × 1350, format portrait des réseaux) ----------
  // Le ballon d'or du logo, mêmes tracés que ballon.svg (repère 64×64, ballon de rayon 30 centré en 32,32)
  const BALLON = {
    pieces: new Path2D("M32 23 L40.6 29.2 L37.3 39.3 L26.7 39.3 L23.4 29.2Z M32 12 L24.4 6.5 L27.3 -2.5 L36.7 -2.5 L39.6 6.5Z M51 25.8 L53.9 16.9 L63.3 16.9 L66.2 25.8 L58.6 31.3Z M43.8 48.2 L53.2 48.2 L56.1 57.1 L48.5 62.7 L40.8 57.1Z M20.2 48.2 L23.2 57.1 L15.5 62.7 L7.9 57.1 L10.8 48.2Z M13 25.8 L5.4 31.3 L-2.2 25.8 L0.7 16.9 L10.1 16.9Z"),
    coutures: new Path2D("M32 23 L32 12 M40.6 29.2 L51 25.8 M37.3 39.3 L43.8 48.2 M26.7 39.3 L20.2 48.2 M23.4 29.2 L13 25.8 M39.6 6.5 L53.9 16.9 M58.6 31.3 L53.2 48.2 M40.8 57.1 L23.2 57.1 M10.8 48.2 L5.4 31.3 M10.1 16.9 L24.4 6.5")
  };
  function dessinerBallon(ctx, x, y, r) {
    const s = r / 30;
    ctx.save();
    ctx.translate(x - 32 * s, y - 32 * s); ctx.scale(s, s);
    const degrade = ctx.createRadialGradient(23, 19, 0, 23, 19, 45);
    degrade.addColorStop(0, "#f7e2a0"); degrade.addColorStop(0.55, IMG.or); degrade.addColorStop(1, "#7a5a08");
    ctx.beginPath(); ctx.arc(32, 32, 30, 0, Math.PI * 2);
    ctx.fillStyle = degrade; ctx.fill(); ctx.clip();
    ctx.fillStyle = "rgba(107,76,6,.85)"; ctx.strokeStyle = "#6b4c06"; ctx.lineWidth = 1.6; ctx.lineJoin = "round";
    ctx.fill(BALLON.pieces); ctx.stroke(BALLON.pieces); ctx.stroke(BALLON.coutures);
    ctx.fillStyle = "rgba(255,255,255,.3)"; ctx.beginPath(); ctx.ellipse(23, 18, 9, 5, -Math.PI / 6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  const IMG = {fond: "#141311", or: "#e2b54a", texte: "#f1ede4", gris: "#a8a294",
    serif: 'Fraunces, Georgia, "Noto Color Emoji", serif', sans: 'Inter, system-ui, "Noto Color Emoji", sans-serif' };

  function coupeLignes(ctx, texte, largeur, maxLignes) {
    const mots = texte.split(/\s+/), lignes = [];
    let ligne = "";
    mots.forEach(m => {
      const essai = ligne ? `${ligne} ${m}` : m;
      if (ctx.measureText(essai).width > largeur && ligne) { lignes.push(ligne); ligne = m; } else ligne = essai;
    });
    if (ligne) lignes.push(ligne);
    if (lignes.length > maxLignes) {
      lignes.length = maxLignes;
      lignes[maxLignes - 1] = lignes[maxLignes - 1].replace(/\s*\S*$/, "") + "…";
    }
    return lignes;
  }
  // Plus grande taille (≤ max) pour que le texte tienne sur une ligne
  function tailleAjustee(ctx, texte, poids, max, largeur) {
    let t = max;
    do { ctx.font = `${poids} ${t}px ${IMG.serif}`; t -= 4; } while (ctx.measureText(texte).width > largeur && t > 40);
    return t + 4;
  }

  async function creerImage(dessin, type = "image/png") {
    await Promise.all(["800 80px Fraunces", "600 40px Fraunces", "500 30px Inter", "600 30px Inter"]
      .map(f => document.fonts.load(f).catch(() => null))
      .concat(document.fonts.load('40px "Noto Color Emoji"', "\u{1F1EB}\u{1F1F7}").catch(() => null)));
    const c = document.createElement("canvas");
    c.width = 1080; c.height = 1350;
    const ctx = c.getContext("2d");
    ctx.fillStyle = IMG.fond; ctx.fillRect(0, 0, 1080, 1350);
    const halo = ctx.createRadialGradient(540, -120, 0, 540, -120, 1000);
    halo.addColorStop(0, "rgba(226,181,74,.30)"); halo.addColorStop(1, "rgba(226,181,74,0)");
    ctx.fillStyle = halo; ctx.fillRect(0, 0, 1080, 1350);
    dessinerBallon(ctx, 130, 120, 40);
    ctx.fillStyle = IMG.texte; ctx.font = `800 40px ${IMG.serif}`; ctx.fillText("Atlas du Ballon d'or", 192, 134);
    ctx.fillStyle = IMG.gris; ctx.font = `500 22px ${IMG.sans}`; ctx.fillText("Source : Ballon d'or, France Football 2026", 192, 168);

    dessin(ctx);

    ctx.fillStyle = "rgba(226,181,74,.35)"; ctx.fillRect(90, 1214, 900, 2);
    ctx.textAlign = "left";
    ctx.fillStyle = IMG.texte; ctx.font = `600 32px ${IMG.sans}`; ctx.fillText("Et toi ? Fais ton top 10 : quel pays a voté comme toi ?", 90, 1268);
    ctx.fillStyle = IMG.or; ctx.font = `500 28px ${IMG.sans}`; ctx.fillText(LIEN_PUBLIC.replace(/^https?:\/\//, ""), 90, 1310);
    return new Promise(res => c.toBlob(blob => res({ blob, url: URL.createObjectURL(blob) }), type, 0.92));
  }

  // ---------- Carrousel LinkedIn ----------
  // Une couverture, les cartes-chocs, un appel à voter : un PDF que LinkedIn affiche en carrousel
  const chargerScript = src => new Promise((ok, ko) => {
    const s = document.createElement("script");
    s.src = src; s.onload = ok; s.onerror = ko;
    document.head.appendChild(s);
  });

  async function telechargerCarrousel(cartes) {
    const bouton = $("#bouton-carrousel"), libelle = bouton.textContent;
    bouton.disabled = true;
    try {
      if (!window.jspdf) {
        bouton.textContent = "Chargement…";
        await chargerScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
      }
      const [premier, second] = classement;
      const pages = [
        {
          tag: "Ballon d'or 2026 · le vote décortiqué", titre: `${PAYS.length} pays, ${PAYS.length} jurés, un seul trophée`,
          choc: { chiffre: `+${totaux[premier] - totaux[second]} pts`, phrase: `C'est tout ce qui sépare ${nomJoueur(premier)} de ${nomJoueur(second)}. Mais qui a voté pour qui ?` },
          texte: "Glisse pour voir ce que les bulletins révèlent →"
        },
        ...cartes,
        {
          tag: "À toi de jouer", titre: "Et si tu avais été juré ?",
          choc: { chiffre: "10", phrase: "joueurs à classer pour découvrir quel pays a voté comme toi" },
          texte: "Le lien est en commentaire. Dis-nous quel pays a voté comme toi !"
        }
      ];
      const pdf = new window.jspdf.jsPDF({ orientation: "portrait", unit: "px", format: [1080, 1350], hotfixes: ["px_scaling"] });
      for (let i = 0; i < pages.length; i++) {
        bouton.textContent = `Page ${i + 1}/${pages.length}…`;
        const { blob, url } = await creerImage(ctx => dessinerChoc(ctx, pages[i]), "image/jpeg");
        URL.revokeObjectURL(url);
        if (i) pdf.addPage([1080, 1350], "portrait");
        pdf.addImage(new Uint8Array(await blob.arrayBuffer()), "JPEG", 0, 0, 1080, 1350);
      }
      pdf.save("ballon-dor-2026-carrousel.pdf");
      bouton.textContent = "Carrousel téléchargé ✓";
    } catch (e) {
      bouton.textContent = "Échec du téléchargement, réessaie";
    }
    setTimeout(() => { bouton.textContent = libelle; bouton.disabled = false; }, 2500);
  }

  function dessinerBulletin(ctx, r) {
    ctx.fillStyle = IMG.gris; ctx.font = `600 30px ${IMG.sans}`;
    ctx.fillText((monPrenom ? `Le Ballon d'or de ${monPrenom}` : "Mon Ballon d'or 2026").toUpperCase(), 90, 250);
    let y = 270;
    monVote.forEach((j, i) => {
      const grand = i < 3;
      y += grand ? 88 : 54;
      ctx.textAlign = "right";
      ctx.fillStyle = i === 0 ? IMG.or : IMG.gris; ctx.font = `600 ${grand ? 50 : 32}px ${IMG.serif}`; ctx.fillText(i + 1, 150, y);
      ctx.font = `500 ${grand ? 30 : 26}px ${IMG.sans}`; ctx.fillStyle = IMG.gris; ctx.fillText(`${BAREME[i]} pt${BAREME[i] > 1 ? "s" : ""}`, 990, y);
      ctx.textAlign = "left"; ctx.fillStyle = i === 0 ? IMG.or : IMG.texte;
      tailleAjustee(ctx, nomJoueur(j), grand ? 800 : 600, grand ? 58 : 36, 680);
      ctx.fillText(nomJoueur(j), 180, y);
    });
    // Encadré du jumeau
    const haut = 990;
    ctx.fillStyle = "rgba(226,181,74,.10)"; ctx.strokeStyle = "rgba(226,181,74,.6)"; ctx.lineWidth = 2;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(90, haut, 900, 180, 24); else ctx.rect(90, haut, 900, 180);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = IMG.gris; ctx.font = `600 26px ${IMG.sans}`; ctx.fillText("J'AI VOTÉ COMME…", 126, haut + 50);
    const jumeau = `${drapeau(r.jumeau)} ${r.jumeau}`.trim();
    ctx.fillStyle = IMG.or; tailleAjustee(ctx, jumeau, 800, 64, 560); ctx.fillText(jumeau, 126, haut + 124);
    ctx.fillStyle = IMG.gris; ctx.font = `500 24px ${IMG.sans}`;
    ctx.fillText(`Juré : ${D.jury[r.jumeau].journaliste} · ${D.jury[r.jumeau].media}`, 126, haut + 158);
    ctx.textAlign = "right"; ctx.fillStyle = IMG.texte; ctx.font = `800 64px ${IMG.serif}`;
    ctx.fillText(pourcent(affinite[r.jumeau]), 954, haut + 124);
    ctx.textAlign = "left";
  }

  function dessinerChoc(ctx, c) {
    let y = 290;
    ctx.fillStyle = IMG.or; ctx.font = `600 30px ${IMG.sans}`; ctx.fillText(c.tag.toUpperCase(), 90, y);
    ctx.fillStyle = IMG.texte; ctx.font = `600 46px ${IMG.serif}`;
    coupeLignes(ctx, c.titre, 900, 2).forEach(l => { y += 62; ctx.fillText(l, 90, y); });
    y += 40;
    const t = tailleAjustee(ctx, c.choc.chiffre, 800, 230, 900);
    y += t * 0.95; ctx.fillStyle = IMG.or; ctx.fillText(c.choc.chiffre, 84, y);
    ctx.fillStyle = IMG.texte; ctx.font = `600 54px ${IMG.serif}`;
    y += t * 0.25 + 10; // place pour les jambages (p, j…) du gros chiffre
    coupeLignes(ctx, c.choc.phrase, 900, 4).forEach(l => { y += 68; ctx.fillText(l, 90, y); });
    y += 30;
    ctx.fillStyle = IMG.gris; ctx.font = `400 32px ${IMG.sans}`;
    coupeLignes(ctx, c.texte, 900, Math.max(1, Math.floor((1170 - y) / 46))).forEach(l => { y += 46; ctx.fillText(l, 90, y); });
  }

  let imageCourante = null;
  async function ouvrirPartage(dessin, texte) {
    const m = $("#partage");
    m.hidden = false;
    $("#partage-image").removeAttribute("src");
    $("#partage-etat").textContent = "Création de l'image…";
    $("#partage-texte").value = texte;
    $("#partage-natif").hidden = true;
    if (imageCourante) URL.revokeObjectURL(imageCourante.url);
    imageCourante = await creerImage(dessin);
    $("#partage-image").src = imageCourante.url;
    $("#partage-etat").textContent = estMobile() || matchMedia("(pointer: coarse)").matches
      ? "Appui long sur l'image pour l'enregistrer, puis envoie-la avec le texte."
      : "Clic droit sur l'image, « Enregistrer l'image », puis envoie-la avec le texte.";
    const fichier = new File([imageCourante.blob], "ballon-dor-2026.png", { type: "image/png" });
    try { $("#partage-natif").hidden = !(navigator.canShare && navigator.canShare({ files: [fichier] })); } catch (e) { /* partage natif absent */ }
    $("#partage-natif").onclick = () => navigator.share({ files: [fichier], text: texte }).catch(() => {});
  }
  const fermerPartage = () => { $("#partage").hidden = true; };

  // ---------- Crédits ----------
  const fenetreCredits = $("#credits");
  const ouvrirCredits = () => {
    $("#credits-contenu").innerHTML = blocCredits("h2");
    fenetreCredits.hidden = false;
    $("#credits-fermer").focus();
  };
  const fermerCredits = () => { fenetreCredits.hidden = true; $("#bouton-credits").focus(); };
  $("#bouton-credits").addEventListener("click", ouvrirCredits);
  $("#credits-fermer").addEventListener("click", fermerCredits);
  fenetreCredits.addEventListener("click", e => { if (e.target === fenetreCredits) fermerCredits(); });
  carte.getContainer().addEventListener("click", e => {
    if (!e.target.closest(".lien-credits")) return;
    e.preventDefault();
    ouvrirCredits();
  });
  $("#partage-fermer").addEventListener("click", fermerPartage);
  $("#partage").addEventListener("click", e => { if (e.target === $("#partage")) fermerPartage(); });
  $("#partage-copier").addEventListener("click", () => {
    const zone = $("#partage-texte");
    const fait = () => { $("#partage-copier").textContent = "Texte copié ✓"; setTimeout(() => { $("#partage-copier").textContent = "Copier le texte"; }, 1800); };
    const repli = () => { zone.focus(); zone.select(); try { if (document.execCommand("copy")) fait(); } catch (e) { /* le texte reste sélectionné */ } };
    try { navigator.clipboard.writeText(zone.value).then(fait, repli); } catch (e) { repli(); }
  });

  const ONGLETS = {
    classement: ongletClassement, tonvote: ongletTonVote, histoire: ongletHistoire,
    revelations: () => ({ continents: ongletContinents, conflits: ongletConflits, curiosites: ongletCuriosites })[revelation]()
  };
  const allerOnglet = nom => {
    if (REVELATIONS.some(([v]) => v === nom)) { revelation = nom; nom = "revelations"; }
    document.querySelector(`[data-onglet="${nom}"]`).click();
    if (estMobile()) releverTiroir();
  };
  document.querySelectorAll("[data-onglet]").forEach(b => b.addEventListener("click", e => {
    document.querySelectorAll("[data-onglet]").forEach(x => x.setAttribute("aria-selected", x === b));
    disposition.classList.remove("vote-plein");
    contenu.scrollTop = 0;
    ONGLETS[b.dataset.onglet]();
    // Sur téléphone, changer de rubrique remonte le tiroir s'il ne montrait que la carte
    if (e.isTrusted && estMobile()) releverTiroir();
  }));

  // ---------- En-tête ----------
  // Pas de chiffres du vote ici : ils gâcheraient le dépouillement, le panneau « Le vote » les donne ensuite
  const [premier, second, troisieme] = classement;

  $("#bouton-theme").addEventListener("click", () => {
    document.documentElement.dataset.theme = estSombre() ? "light" : "dark";
    styler();
  });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", styler);

  // Légende repliable (repliée par défaut sur mobile, où elle masquerait la carte)
  $("#legende").classList.toggle("repliee", estMobile());
  $("#legende").addEventListener("click", e => { if (e.target.closest("h3")) $("#legende").classList.toggle("repliee"); });

  // ---------- Intro : dépouillement en direct ----------
  // Les bulletins s'ouvrent d'est en ouest, comme le jour se lève, et une course en direct suit les points
  const ordreDepouillement = PAYS.slice().sort((a, b) => D.pays[b].lon - D.pays[a].lon);
  const COUREURS = classement.slice(0, 6);
  let minuterie = null;

  $("#course").innerHTML = COUREURS.map(j => `
    <li data-coureur="${esc(j)}">
      <span class="pos"></span>${photo(j, "mini")}<span class="nom-court">${esc(j)}</span>
      <span class="piste"><i style="background:${COULEUR_JOUEUR[j] || "var(--or)"}"></i></span>
      <span class="score">0</span>
    </li>`).join("");

  function dessinerCourse(scores) {
    const ordre = COUREURS.slice().sort((a, b) => scores[b] - scores[a] || rangGlobal[a] - rangGlobal[b]);
    const max = Math.max(1, scores[ordre[0]]);
    ordre.forEach((j, i) => {
      const li = $(`#course [data-coureur="${CSS.escape(j)}"]`);
      li.style.setProperty("--rang", i);
      li.classList.toggle("hors-course", i >= 5);
      li.querySelector(".pos").textContent = i + 1;
      li.querySelector(".piste i").style.width = `${scores[j] / max * 100}%`;
      li.querySelector(".score").textContent = fmt(scores[j]);
    });
  }

  function lancerIntro() {
    terminerIntro(false);
    $("#fiche").hidden = $("#volet-joueur").hidden = true;
    $("#podium").hidden = true;
    document.querySelectorAll("[data-onglet]").forEach(x => x.setAttribute("aria-selected", x.dataset.onglet === "classement"));
    disposition.classList.remove("vote-plein");
    ongletClassement();
    carte.setView(MONDE, zoomMonde());

    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { afficherPodium(); return; }

    const scores = {};
    COUREURS.forEach(j => { scores[j] = 0; });
    etat.intro = new Set();
    styler();
    dessinerCourse(scores);
    $("#depouillement").hidden = false;
    $(".zone-carte").classList.add("en-intro");

    let i = 0;
    const etape = () => {
      const p = ordreDepouillement[i];
      etat.intro.add(p);
      D.jury[p].votes.forEach(v => { if (v.joueur in scores) scores[v.joueur] += v.points; });
      styler();
      marqueurs[p].setRadius(10);
      setTimeout(() => marqueurs[p].setRadius(5), 260);
      $("#compteur-bulletins").textContent = i + 1;
      $("#dernier-bulletin").innerHTML = `<b>${nomPays(p)}</b> vote <b>${esc(premierChoix(p))}</b>`;
      dessinerCourse(scores);
      i++;
      if (i === ordreDepouillement.length) { minuterie = setTimeout(() => terminerIntro(true), 700); return; }
      // Les derniers bulletins ralentissent pour le suspense
      minuterie = setTimeout(etape, 28 + Math.max(0, i - 82) * 14);
    };
    minuterie = setTimeout(etape, 400);
  }

  function terminerIntro(avecPodium) {
    clearTimeout(minuterie);
    $("#depouillement").hidden = true;
    $(".zone-carte").classList.remove("en-intro");
    if (etat.intro) { etat.intro = null; styler(); }
    if (avecPodium) afficherPodium();
  }

  function afficherPodium() {
    const marche = (j, place) => `
      <div class="marche marche-${place}">
        ${photo(j, "moyen")}
        <span class="place">${place}</span>
        <span class="qui">${esc(nomJoueur(j))}</span>
        <span class="combien">${fmt(totaux[j])} pts</span>
      </div>`;
    $("#podium").innerHTML = `
      <div class="podium-carte">
        <button type="button" class="fermer" id="podium-fermer" aria-label="Fermer">×</button>
        <div class="sacre">
          ${D.trophee ? `<img class="trophee" src="${esc(D.trophee)}" alt="Le trophée du Ballon d'or">` : `<span class="pastille grande" aria-hidden="true"></span>`}
          ${photo(premier, "vainqueur")}
        </div>
        <p class="surtitre">Ballon d'or 2026 · vote des ${PAYS.length} jurés</p>
        <h2 id="podium-nom">${esc(nomJoueur(premier))}</h2>
        <p class="exploit">${fmt(totaux[premier])} points · 1er sur ${premiers[premier]} bulletins sur ${PAYS.length}<br>
          <b>+${totaux[premier] - totaux[second]} pts</b> devant ${esc(nomJoueur(second))}</p>
        <div class="marches">${marche(second, 2)}${marche(troisieme, 3)}</div>
        <p class="question">Et toi, qui aurait eu ton vote ?</p>
        <button type="button" class="bouton-principal" id="bouton-mon-vote">Fais ton top 10</button>
        <button type="button" class="lien-discret" id="bouton-explorer">Explorer les 100 bulletins</button>
      </div>`;
    $("#podium").hidden = false;
    $("#bouton-mon-vote").focus({ preventScroll: true });
    const fermer = () => { $("#podium").hidden = true; };
    $("#bouton-explorer").onclick = fermer;
    $("#podium-fermer").onclick = fermer;
    $("#bouton-mon-vote").onclick = () => { fermer(); allerOnglet("tonvote"); };
    $("#podium").onclick = e => { if (e.target === $("#podium")) fermer(); };
  }

  $("#bouton-passer").addEventListener("click", () => terminerIntro(true));
  $("#bouton-rejouer").addEventListener("click", lancerIntro);
  document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    if (!$("#partage").hidden) fermerPartage();
    else if (!fenetreCredits.hidden) fermerCredits();
    else if (etat.intro) terminerIntro(true);
    else if (!$("#podium").hidden) $("#podium").hidden = true;
  });

  // ---------- Recherche de pays et de joueurs ----------
  const ALIAS = { "Eire": "irlande", "États-Unis": "usa etats-unis amerique", "Pays-Bas": "hollande", "RD Congo": "congo kinshasa",
    "Corée du Sud": "coree", "Côte d'Ivoire": "cote d'ivoire", "Angleterre": "royaume-uni uk", "République tchèque": "tchequie" };
  const champRecherche = $("#recherche-pays"), listeRecherche = $("#recherche-liste");
  let trouves = [], actif = -1;

  function dessinerRecherche() {
    listeRecherche.hidden = !trouves.length;
    champRecherche.setAttribute("aria-expanded", String(trouves.length > 0));
    listeRecherche.innerHTML = trouves.map((t, i) => t.joueur ? `
      <li role="option" id="trouve-${i}" data-joueur="${esc(t.joueur)}" aria-selected="${i === actif}">
        <span>${esc(nomJoueur(t.joueur))}</span><span class="meta">joueur · ${soutiens[t.joueur]} pays</span></li>` : `
      <li role="option" id="trouve-${i}" data-pays="${esc(t.pays)}" aria-selected="${i === actif}">
        <span>${nomPays(t.pays)}</span><span class="meta">1er : ${esc(premierChoix(t.pays))}</span></li>`).join("");
    if (actif >= 0) champRecherche.setAttribute("aria-activedescendant", `trouve-${actif}`);
    else champRecherche.removeAttribute("aria-activedescendant");
  }
  function choisir(t) {
    champRecherche.value = "";
    trouves = []; actif = -1;
    dessinerRecherche();
    champRecherche.blur();
    if (t.joueur) selectionnerJoueur(t.joueur);
    else choisirPays(t.pays);
  }
  function choisirPays(p) {
    if (etat.mode === "historique") allerOnglet("classement");
    ouvrirFiche(p);
    cadrer([p], { maxZoom: 4 });
    marqueurs[p].setRadius(11);
    setTimeout(() => styler(), 1500);
  }
  champRecherche.addEventListener("input", () => {
    const q = sansAccents(champRecherche.value.trim());
    if (!q) { trouves = []; actif = -1; dessinerRecherche(); return; }
    const candidats = [
      ...PAYS.map(p => ({ pays: p, nom: p, texte: sansAccents(`${p} ${ALIAS[p] || ""}`) })),
      ...classement.filter(j => totaux[j] > 0).map(j => ({ joueur: j, nom: nomJoueur(j), texte: sansAccents(`${j} ${nomJoueur(j)}`) }))
    ];
    // Un nom qui commence par la saisie, ou dont un mot commence par elle, passe devant
    const debut = t => sansAccents(t.nom).startsWith(q) ? 0 : sansAccents(t.nom).split(/[\s-]+/).some(m => m.startsWith(q)) ? 1 : 2;
    trouves = candidats.filter(t => t.texte.includes(q))
      .sort((a, b) => debut(a) - debut(b) || a.nom.localeCompare(b.nom, "fr"))
      .slice(0, 8);
    actif = trouves.length ? 0 : -1;
    dessinerRecherche();
  });
  champRecherche.addEventListener("keydown", e => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!trouves.length) return;
      e.preventDefault();
      actif = (actif + (e.key === "ArrowDown" ? 1 : -1) + trouves.length) % trouves.length;
      dessinerRecherche();
    } else if (e.key === "Enter" && actif >= 0) {
      e.preventDefault();
      choisir(trouves[actif]);
    } else if (e.key === "Escape") {
      champRecherche.value = ""; trouves = []; actif = -1; dessinerRecherche();
    }
  });
  // mousedown plutôt que click : le choix passe avant que le champ perde le focus
  listeRecherche.addEventListener("mousedown", e => {
    const li = e.target.closest("[data-pays], [data-joueur]");
    if (li) { e.preventDefault(); choisir(li.dataset.joueur ? { joueur: li.dataset.joueur } : { pays: li.dataset.pays }); }
  });
  champRecherche.addEventListener("blur", () => { setTimeout(() => { trouves = []; actif = -1; dessinerRecherche(); }, 120); });

  ongletClassement();
  // L'intro attend les contours (ou 3 s au plus) pour que la carte s'allume vraiment
  Promise.race([contoursPrets, new Promise(r => setTimeout(r, 3000))]).then(lancerIntro);
})();

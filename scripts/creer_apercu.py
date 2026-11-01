"""Dessine app/apercu.png (1200x627), l'image d'aperçu des liens partagés (LinkedIn, X, messageries).

Usage : python scripts/creer_apercu.py
Carte du 1er choix de chaque juré, avec les mêmes couleurs que l'application. Nécessite Pillow.
A relancer apres toute modification des votes.
"""
import csv
import json
from collections import Counter, defaultdict
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

RACINE = Path(__file__).resolve().parent.parent
DONNEES = RACINE / "donnees"
SORTIE = RACINE / "app" / "apercu.png"
POLICES = Path("C:/Windows/Fonts")

LARGEUR, HAUTEUR = 1200, 627
FOND, OR, TEXTE, GRIS, TERRE = "#141311", "#e2b54a", "#f1ede4", "#a8a294", "#2a2824"
# Même palette et même ordre que app.js : couleurs attribuées par classement, aux seuls joueurs choisis 1ers
PALETTE = ["#d64545", "#3d6fd9", "#e9a23b", "#4fb3d4", "#8f5fd0", "#2e9e74", "#c4589b", "#9a7b2f", "#e0703a"]
# Cadre de la carte (équirectangulaire), sans l'Antarctique
LON_MIN, LON_MAX, LAT_MIN, LAT_MAX = -170, 190, -56, 80
CARTE_HAUT = 160


def lire(nom):
    with open(DONNEES / nom, encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def police(nom, taille):
    try:
        return ImageFont.truetype(str(POLICES / nom), taille)
    except OSError:
        return ImageFont.load_default(taille)


def anneaux(topo):
    """Décode les arcs TopoJSON (quantifiés, codés en delta) en coordonnées lon/lat."""
    sx, sy = topo["transform"]["scale"]
    tx, ty = topo["transform"]["translate"]
    arcs = []
    for arc in topo["arcs"]:
        x = y = 0
        points = []
        for dx, dy in arc:
            x += dx
            y += dy
            points.append((x * sx + tx, y * sy + ty))
        arcs.append(points)

    def anneau(indices):
        points = []
        for i in indices:
            morceau = arcs[i] if i >= 0 else arcs[~i][::-1]
            points.extend(morceau[1:] if points else morceau)
        # Les anneaux qui traversent l'antiméridien (Russie, Fidji) sont recollés côté est, comme dans app.js
        if any(p[0] < -170 for p in points) and any(p[0] > 170 for p in points):
            points = [(lon + 360 if lon < 0 else lon, lat) for lon, lat in points]
        return points

    for g in topo["objects"]["countries"]["geometries"]:
        if g.get("id") == "010":
            continue
        polys = [g["arcs"]] if g["type"] == "Polygon" else g["arcs"] if g["type"] == "MultiPolygon" else []
        yield g.get("id"), [[anneau(a) for a in poly] for poly in polys]


def projeter(lon, lat):
    x = (lon - LON_MIN) / (LON_MAX - LON_MIN) * LARGEUR
    y = CARTE_HAUT + (LAT_MAX - lat) / (LAT_MAX - LAT_MIN) * (HAUTEUR - CARTE_HAUT)
    return x, y


def main():
    votes = lire("ballon_or_2026_votes_long.csv")
    pays = {p["pays"]: p for p in lire("pays.csv")}
    totaux, premier = defaultdict(int), {}
    for v in votes:
        totaux[v["joueur"]] += int(v["points"])
        if v["rang"] == "1":
            premier[v["pays"]] = v["joueur"]
    classement = sorted(totaux, key=lambda j: -totaux[j])
    n_premiers = Counter(premier.values())
    couleurs = {j: PALETTE[i % len(PALETTE)] for i, j in enumerate(j for j in classement if n_premiers[j])}

    # Un polygone par code ISO ; le Royaume-Uni prend la couleur du juré anglais
    couleur_iso = {}
    for nom, j in premier.items():
        iso = pays[nom]["iso_num"]
        if iso not in couleur_iso or nom == "Angleterre":
            couleur_iso[iso] = couleurs[j]

    image = Image.new("RGB", (LARGEUR, HAUTEUR), FOND)
    dessin = ImageDraw.Draw(image)
    topo = json.loads((RACINE / "app" / "countries-50m.json").read_text(encoding="utf-8"))
    for iso, polys in anneaux(topo):
        teinte = couleur_iso.get(iso, TERRE)
        for poly in polys:
            for k, anneau in enumerate(poly):
                if len(anneau) > 2:
                    dessin.polygon([projeter(*p) for p in anneau], fill=teinte if k == 0 else FOND, outline=FOND)

    # Fondu du haut de la carte vers le bandeau de titre
    fondu = Image.new("L", (1, 120))
    for y in range(120):
        fondu.putpixel((0, y), 255 - int(255 * y / 119))
    voile = Image.new("RGB", (LARGEUR, 120), FOND)
    image.paste(voile, (0, CARTE_HAUT - 20), fondu.resize((LARGEUR, 120)))

    gagnant, second = classement[0], classement[1]
    ecart = totaux[gagnant] - totaux[second]
    dessin = ImageDraw.Draw(image)
    dessin.text((56, 44), "Qui a voté pour qui ?", font=police("georgiab.ttf", 64), fill=OR)
    dessin.text((58, 124), f"Ballon d'or 2026 : les {len(premier)} bulletins, pays par pays",
                font=police("segoeui.ttf", 30), fill=TEXTE)
    dessin.text((LARGEUR - 56, 50), f"+{ecart} pts", font=police("georgiab.ttf", 64), fill=TEXTE, anchor="ra")
    dessin.text((LARGEUR - 56, 124), f"{gagnant} devant {second}", font=police("segoeui.ttf", 26), fill=GRIS, anchor="ra")

    # Légende des 1ers choix, dans le Pacifique sud
    x, y = 40, HAUTEUR - 36 - 30 * min(5, len(couleurs))
    for j in [j for j in classement if n_premiers[j]][:5]:
        dessin.rounded_rectangle((x, y + 6, x + 18, y + 24), radius=4, fill=couleurs[j])
        dessin.text((x + 28, y + 2), f"{j} · {n_premiers[j]} pays", font=police("segoeuib.ttf", 20), fill=TEXTE)
        y += 30

    image.save(SORTIE, optimize=True)
    print(f"OK : {SORTIE} ({SORTIE.stat().st_size // 1024} Ko)")


if __name__ == "__main__":
    main()

"""Convertit les fichiers de donnees/ en app/data.js pour l'application.

Usage : python scripts/preparer_donnees.py
A relancer apres toute modification des fichiers CSV.
"""
import csv
import json
import sys
from collections import defaultdict
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
DONNEES = RACINE / "donnees"
SORTIE = RACINE / "app" / "data.js"


def lire(nom):
    with open(DONNEES / nom, encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def main():
    votes = lire("ballon_or_2026_votes_long.csv")
    matrice = lire("ballon_or_2026_votes_matrice.csv")
    pays = {p["pays"]: p for p in lire("pays.csv")}
    joueurs = {j["joueur"]: j for j in lire("joueurs.csv")}
    # Photos facultatives, téléchargées par scripts/telecharger_images.py
    images = lire("images.csv") if (DONNEES / "images.csv").exists() else []
    photos = {i["cle"]: i["fichier"] for i in images}
    erreurs = []

    # Controle de coherence entre le format long et la matrice
    points_long = defaultdict(int)
    for v in votes:
        points_long[(v["pays"], v["joueur"])] += int(v["points"])
    for ligne in matrice:
        for joueur, pts in ligne.items():
            if joueur != "pays" and int(pts) != points_long.get((ligne["pays"], joueur), 0):
                erreurs.append(f"Écart {ligne['pays']} / {joueur} : matrice {pts}, long {points_long.get((ligne['pays'], joueur), 0)}")

    for nom in sorted({v["pays"] for v in votes} - pays.keys()):
        erreurs.append(f"Pays sans métadonnées dans pays.csv : {nom}")
    for nom in sorted({v["joueur"] for v in votes} - joueurs.keys()):
        erreurs.append(f"Joueur sans métadonnées dans joueurs.csv : {nom}")
    if erreurs:
        print("\n".join(erreurs))
        sys.exit(1)

    jury = {}
    for v in votes:
        j = jury.setdefault(v["pays"], {"journaliste": v["journaliste"], "media": v["media"], "votes": []})
        j["votes"].append({"rang": int(v["rang"]), "joueur": v["joueur"], "points": int(v["points"])})
    for j in jury.values():
        j["votes"].sort(key=lambda x: x["rang"])

    pays_jury = {nom: pays[nom] for nom in jury}
    rivalites = [r for r in lire("rivalites.csv") if r["pays_a"] in jury and r["pays_b"] in jury]

    donnees = {
        "jury": jury,
        "pays": {
            nom: {"iso": p["iso_num"], "code": p.get("code_drapeau", ""),
                  "continent": p["continent"], "confederation": p["confederation"],
                  "lat": float(p["lat"]), "lon": float(p["lon"])}
            for nom, p in pays_jury.items()
        },
        "joueurs": {
            nom: {**{k: j[k] for k in ("nom_complet", "nationalite", "poste", "club", "ville_club", "pays_club")},
                  "lat_club": float(j["lat_club"]), "lon_club": float(j["lon_club"]),
                  "photo": photos.get(nom, "")}
            for nom, j in joueurs.items()
        },
        "trophee": photos.get("trophee", ""),
        "credits_images": [{k: i[k] for k in ("cle", "page", "auteur", "licence", "source")} for i in images],
        "rivalites": rivalites,
        "palmares": [{**p, "annee": int(p["annee"])} for p in lire("palmares_historique.csv")],
        "histoires": [{**h, "annee": int(h["annee"]), "lat": float(h["lat"]), "lon": float(h["lon"])}
                      for h in lire("histoires.csv")],
    }

    SORTIE.write_text("// Généré par scripts/preparer_donnees.py — ne pas modifier à la main\n"
                      "window.DONNEES = " + json.dumps(donnees, ensure_ascii=False) + ";\n", encoding="utf-8")
    print(f"OK : {len(jury)} pays votants, {len(votes)} votes, {len(rivalites)} rivalités -> {SORTIE}")


if __name__ == "__main__":
    main()

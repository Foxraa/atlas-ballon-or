"""Télécharge les photos des joueurs et du trophée depuis Wikimedia Commons.

Les images (licences libres) vont dans app/images/, leurs crédits dans donnees/images.csv.
À relancer seulement quand joueurs.csv gagne un joueur : les images déjà présentes sont gardées.
"""
import csv
import json
import re
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
DOSSIER = RACINE / "app" / "images"
CREDITS = RACINE / "donnees" / "images.csv"
API = "https://en.wikipedia.org/w/api.php"
ENTETE = {"User-Agent": "AtlasBallonOr/1.0 (projet personnel)"}
LARGEUR = 320

# Pages Wikipedia dont le titre ne se trouve pas par la recherche « nom footballer »
TITRES = {
    "Rodri": "Rodri (footballer, born 1996)",
    "Vitinha": "Vitinha (footballer, born February 2000)",
    "Messi": "Lionel Messi",
    "N. Mendes": "Nuno Mendes (footballer, born 2002)",
    "Luis Diaz": "Luis Díaz (footballer, born 1997)",
    "Gabriel": "Gabriel Magalhães",
    "Pacho": "Willian Pacho",
    "Marquinhos": "Marquinhos",
}
TROPHEE = ("trophee", "Ballon d'Or")


def lire_url(url, essais=6):
    for i in range(essais):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=ENTETE)) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code != 429 or i == essais - 1:
                raise
            time.sleep(5 * 2 ** i)


def api(**params):
    params.update(format="json", formatversion=2)
    return json.loads(lire_url(API + "?" + urllib.parse.urlencode(params)))


def nettoyer(html):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", html or "")).strip()


def slug(texte):
    t = unicodedata.normalize("NFKD", texte).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-")


def image_de_page(titre=None, recherche=None):
    if titre:
        pages = api(action="query", titles=titre, redirects=1, prop="pageimages", piprop="name")["query"]["pages"]
    else:
        pages = api(action="query", generator="search", gsrsearch=recherche, gsrlimit=1,
                    prop="pageimages", piprop="name")["query"]["pages"]
    page = pages[0]
    return page["title"], page.get("pageimage")


def infos_fichier(nom):
    page = api(action="query", titles=f"File:{nom}", prop="imageinfo",
               iiprop="url|extmetadata", iiurlwidth=LARGEUR)["query"]["pages"][0]
    info = page["imageinfo"][0]
    meta = info.get("extmetadata", {})
    return {
        "url": info.get("thumburl") or info["url"],
        "auteur": nettoyer(meta.get("Artist", {}).get("value")),
        "licence": nettoyer(meta.get("LicenseShortName", {}).get("value")),
        "source": info["descriptionurl"],
    }


def ecrire_credits(lignes):
    with open(CREDITS, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["cle", "fichier", "page", "auteur", "licence", "source"])
        w.writeheader()
        w.writerows(lignes)


def main():
    DOSSIER.mkdir(parents=True, exist_ok=True)
    with open(RACINE / "donnees" / "joueurs.csv", encoding="utf-8") as f:
        joueurs = [(j["joueur"], j["nom_complet"]) for j in csv.DictReader(f)]
    anciens = {}
    if CREDITS.exists():
        with open(CREDITS, encoding="utf-8") as f:
            anciens = {l["cle"]: l for l in csv.DictReader(f)}

    cibles = [(TROPHEE[0], TROPHEE[1], None)] + [(j, TITRES.get(j), f"{nom} footballer") for j, nom in joueurs]
    lignes = []
    for cle, titre, recherche in cibles:
        if cle in anciens and (RACINE / "app" / anciens[cle]["fichier"]).exists():
            lignes.append(anciens[cle])
            continue
        page, fichier = image_de_page(titre, recherche)
        if not fichier:
            print(f"  sans image : {cle} ({page})")
            continue
        info = infos_fichier(fichier)
        ext = Path(urllib.parse.urlparse(info["url"]).path).suffix.lower() or ".jpg"
        local = f"images/{slug(cle)}{ext}"
        (RACINE / "app" / local).write_bytes(lire_url(info["url"]))
        lignes.append({"cle": cle, "fichier": local, "page": page, "auteur": info["auteur"],
                       "licence": info["licence"], "source": info["source"]})
        print(f"  {cle} : {page}")
        ecrire_credits(lignes)
        time.sleep(2)

    ecrire_credits(lignes)
    print(f"{len(lignes)} images, crédits dans {CREDITS.relative_to(RACINE)}")


if __name__ == "__main__":
    main()

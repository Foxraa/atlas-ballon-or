"""Extrait l'Angleterre, l'Écosse, le pays de Galles et l'Irlande du Nord de Natural Earth.

Les contours de pays (countries-50m.json) ne connaissent que le Royaume-Uni ; or chaque nation a son juré.
Source : ne_50m_admin_0_map_units.geojson (Natural Earth, domaine public), téléchargé depuis
https://github.com/nvkelso/natural-earth-vector/tree/master/geojson

Usage : python scripts/extraire_royaume_uni.py chemin/vers/ne_50m_admin_0_map_units.geojson
Écrit app/royaume-uni.js (window.ROYAUME_UNI, une FeatureCollection dont chaque élément porte le nom du pays du jury).
Un script plutôt qu'un JSON : la page ouverte en file:// ne peut pas lire un JSON local.
"""
import json
import sys
from pathlib import Path

NATIONS = {"ENG": "Angleterre", "SCT": "Écosse", "WLS": "Galles", "NIR": "Irlande du Nord"}


def arrondir(c):
    return [arrondir(x) for x in c] if isinstance(c[0], list) else [round(c[0], 3), round(c[1], 3)]


source = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
nations = [
    {"type": "Feature", "properties": {"pays": NATIONS[f["properties"]["SU_A3"]]},
     "geometry": {"type": f["geometry"]["type"], "coordinates": arrondir(f["geometry"]["coordinates"])}}
    for f in source["features"] if f["properties"].get("SU_A3") in NATIONS
]
assert len(nations) == 4, f"{len(nations)} nations trouvées au lieu de 4"
sortie = Path(__file__).resolve().parent.parent / "app" / "royaume-uni.js"
contenu = json.dumps({"type": "FeatureCollection", "features": nations}, ensure_ascii=False, separators=(",", ":"))
sortie.write_text("// Généré par scripts/extraire_royaume_uni.py — ne pas modifier à la main\n"
                  f"window.ROYAUME_UNI = {contenu};\n", encoding="utf-8")
print(f"{sortie} : {sortie.stat().st_size // 1024} Ko")

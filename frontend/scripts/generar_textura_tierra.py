"""Genera la textura de la Tierra que usa el globo 3D (sin depender de internet).

Dibuja una proyección equirectangular (2:1) a partir de los contornos de países
de Natural Earth 1:110m (dominio público) incluidos en node_modules/globe.gl,
con la paleta de AstroShield: océano azul noche, continentes azul acero,
costas en azul eléctrico y una retícula sutil cada 30°.

Uso (desde frontend/):  python scripts/generar_textura_tierra.py
Requiere Pillow:          pip install pillow
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

HERE = Path(__file__).resolve().parent
GEOJSON = HERE.parent / "node_modules/globe.gl/example/datasets/ne_110m_admin_0_countries.geojson"
OUTPUT = HERE.parent / "public/textures/tierra-astroshield.jpg"

WIDTH, HEIGHT = 4096, 2048
SS = 2  # supermuestreo para suavizar bordes

OCEAN_TOP = (6, 12, 26)
OCEAN_MID = (9, 22, 46)
LAND = (28, 47, 82)
LAND_HIGHLIGHT = (38, 63, 108)
COAST = (59, 130, 246)
GRID = (56, 189, 248)


def project(lon: float, lat: float, w: int, h: int) -> tuple[float, float]:
    return (lon + 180.0) / 360.0 * w, (90.0 - lat) / 180.0 * h


def polygons(geometry: dict) -> list[list[list[list[float]]]]:
    if geometry["type"] == "Polygon":
        return [geometry["coordinates"]]
    if geometry["type"] == "MultiPolygon":
        return geometry["coordinates"]
    return []


def main(geojson: Path = GEOJSON, output: Path = OUTPUT) -> Path:
    data = json.loads(geojson.read_text(encoding="utf-8"))
    w, h = WIDTH * SS, HEIGHT * SS

    # Océano con degradado vertical (más claro en el ecuador).
    ocean = Image.new("RGB", (w, h), OCEAN_TOP)
    draw = ImageDraw.Draw(ocean)
    for y in range(0, h, SS):
        t = 1 - abs(y / h - 0.5) * 2
        color = tuple(int(OCEAN_TOP[i] + (OCEAN_MID[i] - OCEAN_TOP[i]) * t) for i in range(3))
        draw.rectangle([0, y, w, y + SS], fill=color)

    land_mask = Image.new("L", (w, h), 0)
    mask_draw = ImageDraw.Draw(land_mask)
    coast = Image.new("L", (w, h), 0)
    coast_draw = ImageDraw.Draw(coast)
    for feature in data["features"]:
        for poly in polygons(feature["geometry"]):
            for ring_index, ring in enumerate(poly):
                points = [project(lon, lat, w, h) for lon, lat in ring]
                if len(points) < 3:
                    continue
                mask_draw.polygon(points, fill=0 if ring_index else 255)
                coast_draw.line(points + [points[0]], fill=255, width=2 * SS)

    # Relieve sutil: el interior de los continentes un poco más claro que los bordes.
    inner = land_mask.filter(ImageFilter.GaussianBlur(18 * SS))
    land = Image.composite(Image.new("RGB", (w, h), LAND_HIGHLIGHT), Image.new("RGB", (w, h), LAND), inner)
    image = Image.composite(land, ocean, land_mask)

    # Retícula cada 30° (meridianos y paralelos) muy tenue.
    grid = Image.new("L", (w, h), 0)
    grid_draw = ImageDraw.Draw(grid)
    for lon in range(-180, 181, 30):
        x, _ = project(lon, 0, w, h)
        grid_draw.line([(x, 0), (x, h)], fill=60, width=SS)
    for lat in range(-60, 61, 30):
        _, y = project(0, lat, w, h)
        grid_draw.line([(0, y), (w, y)], fill=90 if lat == 0 else 60, width=SS)
    image = Image.composite(Image.new("RGB", (w, h), GRID), image, grid.point(lambda v: v * 0.35))

    # Costas con un halo suave.
    glow = coast.filter(ImageFilter.GaussianBlur(3 * SS)).point(lambda v: min(255, v * 2))
    image = Image.composite(Image.new("RGB", (w, h), COAST), image, glow.point(lambda v: v * 0.45))
    image = Image.composite(Image.new("RGB", (w, h), (120, 170, 255)), image, coast.point(lambda v: v * 0.55))

    image = image.resize((WIDTH, HEIGHT), Image.LANCZOS)
    output.parent.mkdir(parents=True, exist_ok=True)
    image.save(output, "JPEG", quality=90, optimize=True, progressive=True)
    return output


if __name__ == "__main__":
    args = [Path(a) for a in sys.argv[1:3]]
    print(f"Textura guardada en {main(*args)}")

"""Clasificación orbital determinística a partir de apogeo/perigeo (SATCAT).

Solo usa magnitudes presentes en SATCAT. No calcula posiciones: para eso
se necesitan elementos completos (TLE/OMM), ver `propagation.py`.

Constantes: WGS-84 (radio ecuatorial) y GM terrestre estándar.
Las fronteras entre regímenes son convenciones habituales en la literatura de
tráfico espacial, no una clasificación oficial de la fuente.
"""

from __future__ import annotations

import numpy as np
import numpy.typing as npt

EARTH_RADIUS_KM = 6378.137
EARTH_MU_KM3_S2 = 398600.4418
GEO_ALTITUDE_KM = 35786.0
GEO_TOLERANCE_KM = 200.0
LEO_MAX_APOGEE_KM = 2000.0

ORBIT_CLASSES = ("LEO", "MEO", "GEO", "HEO")

ORBIT_CLASS_RULES: list[dict[str, str]] = [
    {"class": "LEO", "rule": "apogeo ≤ 2,000 km", "description": "Órbita terrestre baja"},
    {
        "class": "MEO",
        "rule": "perigeo > 2,000 km y apogeo < 35,586 km",
        "description": "Órbita terrestre media (p. ej. navegación GNSS)",
    },
    {
        "class": "GEO",
        "rule": "perigeo y apogeo dentro de 35,786 ± 200 km",
        "description": "Banda geosíncrona (incluye órbitas inclinadas)",
    },
    {
        "class": "HEO",
        "rule": "cualquier otra combinación",
        "description": "Órbitas elípticas que cruzan regímenes o están por encima de GEO",
    },
]

FloatArray = npt.NDArray[np.float64]


def kepler_period_minutes(apogee_km: FloatArray, perigee_km: FloatArray) -> FloatArray:
    """Periodo de una órbita kepleriana con semieje mayor (ra + rp) / 2."""
    semi_major = (np.asarray(apogee_km) + np.asarray(perigee_km)) / 2.0 + EARTH_RADIUS_KM
    return 2.0 * np.pi * np.sqrt(semi_major**3 / EARTH_MU_KM3_S2) / 60.0


def eccentricity(apogee_km: FloatArray, perigee_km: FloatArray) -> FloatArray:
    ra = np.asarray(apogee_km) + EARTH_RADIUS_KM
    rp = np.asarray(perigee_km) + EARTH_RADIUS_KM
    return np.abs(ra - rp) / (ra + rp)


def classify_orbit(apogee_km: FloatArray, perigee_km: FloatArray) -> npt.NDArray[np.object_]:
    """Devuelve LEO/MEO/GEO/HEO por elemento, o None si falta algún dato.

    Usa max/min de los dos valores para tolerar registros con apogeo y
    perigeo intercambiados (se marcan aparte como anomalía de calidad).
    """
    a = np.asarray(apogee_km, dtype=float)
    p = np.asarray(perigee_km, dtype=float)
    high, low = np.fmax(a, p), np.fmin(a, p)
    valid = ~(np.isnan(a) | np.isnan(p))

    geo_low, geo_high = GEO_ALTITUDE_KM - GEO_TOLERANCE_KM, GEO_ALTITUDE_KM + GEO_TOLERANCE_KM
    result = np.full(a.shape, "HEO", dtype=object)
    result[high <= LEO_MAX_APOGEE_KM] = "LEO"
    result[(low > LEO_MAX_APOGEE_KM) & (high < geo_low)] = "MEO"
    result[(low >= geo_low) & (high <= geo_high)] = "GEO"
    result[~valid] = None
    return result

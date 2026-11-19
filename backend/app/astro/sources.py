"""Registro de fuentes de datos: procedencia, diccionario de campos y limitaciones.

`unit_status` indica cómo se verificó cada unidad:
* documented: lo dice la documentación oficial de la fuente.
* validated: además se comprobó numéricamente con los datos (ver tests/unit).
* inferred: la fuente no lo documenta; es la interpretación más coherente.
"""

from typing import Any

SOURCES: dict[str, dict[str, Any]] = {
    "satcat": {
        "code": "satcat",
        "name": "SATCAT (catálogo de satélites)",
        "default_file": "satcat_celestrak.csv",
        "provider": "CelesTrak (catálogo derivado de datos de 18 SDS / space-track.org)",
        "source_url": "https://celestrak.org/satcat/",
        "documentation_url": "https://celestrak.org/satcat/satcat-format.php",
        "license_note": "Datos públicos de CelesTrak; citar la fuente al redistribuir.",
        "description": (
            "Catálogo de objetos artificiales con parámetros orbitales resumidos "
            "(periodo, inclinación, apogeo, perigeo) y metadatos de lanzamiento."
        ),
        "field_dictionary": {
            "PERIOD": {"unit": "min", "unit_status": "validated", "note": "Coincide con 3.ª ley de Kepler"},
            "INCLINATION": {"unit": "deg", "unit_status": "documented"},
            "APOGEE": {"unit": "km (altitud)", "unit_status": "validated"},
            "PERIGEE": {"unit": "km (altitud)", "unit_status": "validated"},
            "RCS": {"unit": "m²", "unit_status": "documented", "note": "Sección radar; vacía en ~53 % de filas"},
            "OPS_STATUS_CODE": {"unit": "código", "unit_status": "documented",
                                "note": "+ operativo, - inactivo, P parcial, B respaldo, S reserva, "
                                        "X misión extendida, D reingresado, ? desconocido; vacío = sin dato"},
            "DATA_STATUS_CODE": {"unit": "código", "unit_status": "documented",
                                 "note": "NCE sin elementos actuales, NIE sin elementos iniciales, "
                                         "NEA sin elementos disponibles"},
            "ORBIT_CENTER": {"unit": "código", "unit_status": "documented",
                             "note": "EA Tierra, MO Luna, SU Sol…; un número es el NORAD del objeto anfitrión"},
            "ORBIT_TYPE": {"unit": "código", "unit_status": "documented",
                           "note": "ORB órbita, LAN aterrizaje, IMP impacto, DOC acoplado, R/T ida y vuelta"},
            "DECAY_DATE": {"unit": "fecha ISO", "unit_status": "documented",
                           "note": "Solo existe si el objeto reingresó"},
        },
        "limitations": [
            "No contiene TLE/OMM ni elementos orbitales completos: no permite calcular posiciones reales.",
            "Faltan RAAN, argumento del perigeo y época: los planos orbitales no pueden dibujarse con precisión.",
            "Apogeo/perigeo de objetos no terrestres (Sol, Luna…) no son comparables con los terrestres.",
        ],
    },
    "neo": {
        "code": "neo",
        "name": "NEO (objetos cercanos a la Tierra)",
        "default_file": "neo_nasa.csv",
        "provider": "NASA NeoWs (Open API), compilado en Kaggle: 'NASA - Nearest Earth Objects'",
        "source_url": "https://www.kaggle.com/datasets/sameepvani/nasa-nearest-earth-objects",
        "documentation_url": "https://api.nasa.gov/",
        "license_note": "Datos de NASA de dominio público; la compilación pertenece a su autor en Kaggle.",
        "description": (
            "Registros de aproximación de asteroides a la Tierra con diámetro estimado, "
            "velocidad relativa, distancia de paso y clasificación de peligrosidad de la fuente."
        ),
        "field_dictionary": {
            "id": {"unit": "identificador", "unit_status": "validated",
                   "note": "Identifica al asteroide (27,423 únicos en 90,836 filas), no al registro"},
            "est_diameter_min": {"unit": "km", "unit_status": "validated",
                                 "note": "Derivado de H con albedo 0.25; no es una medición"},
            "est_diameter_max": {"unit": "km", "unit_status": "validated",
                                 "note": "Derivado de H con albedo 0.05; no es una medición"},
            "relative_velocity": {"unit": "km/h", "unit_status": "inferred",
                                  "note": "La fuente no documenta la unidad"},
            "miss_distance": {"unit": "km", "unit_status": "documented", "note": "Máximo ≈ 0.5 UA"},
            "absolute_magnitude": {"unit": "mag (H)", "unit_status": "documented"},
            "hazardous": {"unit": "booleano", "unit_status": "documented",
                          "note": "Clasificación PHA de la fuente (MOID ≤ 0.05 UA y H ≤ 22); no se recalcula"},
            "sentry_object": {"unit": "booleano", "unit_status": "documented",
                              "note": "Constante (False) en este archivo; no se usa en análisis"},
        },
        "limitations": [
            "No incluye fecha de aproximación: no hay serie temporal ni orden de eventos.",
            "No incluye elementos orbitales ni MOID: no se pueden calcular trayectorias.",
            "Los diámetros son rangos derivados de la magnitud absoluta, con un factor ~2.2 de incertidumbre.",
            "hazardous depende de la órbita (MOID), no de la distancia de cada aproximación registrada.",
        ],
    },
}

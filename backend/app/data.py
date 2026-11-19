"""Carga y validación del dataset NEO oficial para el modelo de IA."""

from functools import lru_cache
from pathlib import Path

import pandas as pd

from backend.app.config import FEATURE_COLUMNS, PROCESSED_DATA_PATH, RAW_DATA_PATH

REQUIRED_COLUMNS = {
    "id",
    "name",
    *FEATURE_COLUMNS,
    "orbiting_body",
    "sentry_object",
    "is_hazardous",
}


def read_neo_csv(path: Path) -> pd.DataFrame:
    """Lee el CSV de NASA NeoWs y unifica el nombre del objetivo (`hazardous` → `is_hazardous`)."""
    frame = pd.read_csv(path)
    if "is_hazardous" not in frame.columns and "hazardous" in frame.columns:
        frame = frame.rename(columns={"hazardous": "is_hazardous"})
    for column in ("is_hazardous", "sentry_object"):
        if column in frame.columns and frame[column].dtype == object:
            frame[column] = frame[column].astype(str).str.lower().map({"true": True, "false": False})
    return frame


@lru_cache(maxsize=1)
def load_neos() -> pd.DataFrame:
    """Carga el CSV procesado o el CSV oficial sin inventar registros."""
    path = PROCESSED_DATA_PATH if PROCESSED_DATA_PATH.exists() else RAW_DATA_PATH
    if not path.exists():
        raise FileNotFoundError(
            f"No se encontró el dataset NEO. Coloca el CSV oficial en {RAW_DATA_PATH}."
        )
    frame = read_neo_csv(path)
    missing = REQUIRED_COLUMNS.difference(frame.columns)
    if missing:
        raise ValueError(f"Faltan columnas requeridas en {path}: {sorted(missing)}")
    return frame

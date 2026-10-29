"""Carga y validación del dataset NEO oficial."""

from functools import lru_cache

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


@lru_cache(maxsize=1)
def load_neos() -> pd.DataFrame:
    """Carga el CSV procesado o el CSV oficial sin inventar registros."""
    path = PROCESSED_DATA_PATH if PROCESSED_DATA_PATH.exists() else RAW_DATA_PATH
    if not path.exists():
        raise FileNotFoundError(
            f"No se encontró el dataset NEO. Coloca el CSV oficial en {RAW_DATA_PATH}."
        )
    frame = pd.read_csv(path)
    missing = REQUIRED_COLUMNS.difference(frame.columns)
    if missing:
        raise ValueError(f"Faltan columnas requeridas en {path}: {sorted(missing)}")
    return frame

"""Configuración y rutas compartidas del backend."""

from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT_DIR / "backend" / "data"
MODEL_DIR = ROOT_DIR / "backend" / "app" / "models"
PROCESSED_DATA_PATH = DATA_DIR / "neos_processed.csv"
RAW_DATA_PATH = DATA_DIR / "neos.csv"
FEATURE_COLUMNS = [
    "est_diameter_min",
    "est_diameter_max",
    "relative_velocity",
    "miss_distance",
    "absolute_magnitude",
]

"""Configuración y rutas compartidas del backend."""

from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT_DIR / "backend" / "data"
MODEL_DIR = ROOT_DIR / "backend" / "app" / "models"
PROCESSED_DATA_PATH = DATA_DIR / "neos_processed.csv"
RAW_DATA_PATH = DATA_DIR / "neos.csv"
SATCAT_DATA_PATH = DATA_DIR / "satcat.csv"
JWT_SECRET = __import__("os").environ.get("ASTROSHIELD_JWT_SECRET", "change-this-secret-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 30
CORS_ORIGINS = [
    origin.strip()
    for origin in __import__("os").environ.get(
        "ASTROSHIELD_CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]
FEATURE_COLUMNS = [
    "est_diameter_min",
    "est_diameter_max",
    "relative_velocity",
    "miss_distance",
    "absolute_magnitude",
]

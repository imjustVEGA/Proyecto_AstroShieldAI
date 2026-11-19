"""Configuración y rutas compartidas del backend."""

import os
from pathlib import Path
from secrets import token_urlsafe

ROOT_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT_DIR / "backend" / "data"
MODEL_DIR = ROOT_DIR / "backend" / "app" / "models"
PROCESSED_DATA_PATH = DATA_DIR / "neos_processed.csv"
RAW_DATA_PATH = DATA_DIR / "neos.csv"
SATCAT_DATA_PATH = DATA_DIR / "satcat.csv"
DATABASE_URL = os.environ.get(
    "ASTROSHIELD_DATABASE_URL",
    f"sqlite:///{(DATA_DIR / 'astroshield.db').as_posix()}",
)
JWT_SECRET = os.environ.get("ASTROSHIELD_JWT_SECRET") or token_urlsafe(48)
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 30
CORS_ORIGINS = [
    origin.strip()
    for origin in os.environ.get(
        "ASTROSHIELD_CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]
ADMIN_EMAIL = os.environ.get("ASTROSHIELD_ADMIN_EMAIL", "admin@astroshield.com")
ADMIN_USERNAME = os.environ.get("ASTROSHIELD_ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ASTROSHIELD_ADMIN_PASSWORD", "admin123")
FEATURE_COLUMNS = [
    "est_diameter_min",
    "est_diameter_max",
    "relative_velocity",
    "miss_distance",
    "absolute_magnitude",
]

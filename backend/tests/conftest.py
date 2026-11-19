"""Fixtures: datasets reales de backend/data (se omiten las pruebas si no están)."""
from pathlib import Path

import pandas as pd
import pytest

DATA_DIR = Path(__file__).resolve().parents[1] / "data"


def _read(name: str) -> pd.DataFrame:
    path = DATA_DIR / name
    if not path.is_file():
        pytest.skip(f"Dataset real no disponible: {path}")
    return pd.read_csv(path, dtype=str, keep_default_na=False)


@pytest.fixture(scope="session")
def raw_satcat() -> pd.DataFrame:
    return _read("satcat_celestrak.csv")


@pytest.fixture(scope="session")
def raw_neo() -> pd.DataFrame:
    return _read("neo_nasa.csv")

"""Carga perezosa y en caché de los datasets reales (SATCAT y NEO).

Sustituye a la importación a PostgreSQL de Astroshield AI: cada CSV se lee,
se limpia una sola vez por proceso y se guarda en memoria junto con su
informe de calidad. Si el archivo cambia (fecha de modificación), se recarga.
"""

from __future__ import annotations

import hashlib
import threading
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

from backend.app.astro.neo_cleaner import NeoResult, clean_neo
from backend.app.astro.prioritization import prioritize
from backend.app.astro.satcat_cleaner import SatcatResult, clean_satcat
from backend.app.config import NEO_RAW_PATH, SATCAT_RAW_PATH


class DataUnavailableError(RuntimeError):
    """El CSV no existe o no pudo procesarse."""


@dataclass
class LoadedSource:
    path: Path
    mtime: float
    sha256: str
    loaded_at: datetime
    seconds: float
    result: SatcatResult | NeoResult
    prioritized: pd.DataFrame | None = None


_lock = threading.Lock()
_cache: dict[str, LoadedSource] = {}
_errors: dict[str, str] = {}


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _read_csv(path: Path) -> pd.DataFrame:
    # Texto tal cual: la limpieza decide qué es número, fecha o nulo.
    return pd.read_csv(path, dtype=str, keep_default_na=False, encoding="utf-8-sig")


def _load(code: str, path: Path) -> LoadedSource:
    if not path.exists():
        raise DataUnavailableError(
            f"No se encontró {path.name}. Copia el CSV a backend/data/{path.name} y reinicia el backend."
        )
    mtime = path.stat().st_mtime
    cached = _cache.get(code)
    if cached and cached.path == path and cached.mtime == mtime:
        return cached
    with _lock:
        cached = _cache.get(code)
        if cached and cached.path == path and cached.mtime == mtime:
            return cached
        started = datetime.now(timezone.utc)
        try:
            raw = _read_csv(path)
            if code == "satcat":
                result: SatcatResult | NeoResult = clean_satcat(raw)
                prioritized = None
            else:
                result = clean_neo(raw)
                prioritized = prioritize(result.objects.reset_index(drop=True)).reset_index(drop=True)
                prioritized["rank"] = prioritized.index + 1
                prioritized = prioritized.set_index("neo_id", drop=False)
                prioritized.index.name = None
        except Exception as error:  # el detalle se muestra en /datasets
            _errors[code] = f"{type(error).__name__}: {error}"
            raise DataUnavailableError(f"No se pudo procesar {path.name}: {error}") from error
        finished = datetime.now(timezone.utc)
        loaded = LoadedSource(
            path=path, mtime=mtime, sha256=_sha256(path), loaded_at=finished,
            seconds=(finished - started).total_seconds(), result=result, prioritized=prioritized,
        )
        _cache[code] = loaded
        _errors.pop(code, None)
        return loaded


def satcat() -> LoadedSource:
    return _load("satcat", SATCAT_RAW_PATH)


def neo() -> LoadedSource:
    return _load("neo", NEO_RAW_PATH)


def satcat_objects() -> pd.DataFrame:
    return satcat().result.objects


def neo_objects() -> pd.DataFrame:
    return neo().result.objects


def neo_observations() -> pd.DataFrame:
    return neo().result.observations  # type: ignore[union-attr]


def prioritized_neo() -> pd.DataFrame:
    frame = neo().prioritized
    assert frame is not None
    return frame


def status() -> dict[str, dict[str, object]]:
    out: dict[str, dict[str, object]] = {}
    for code, path in (("satcat", SATCAT_RAW_PATH), ("neo", NEO_RAW_PATH)):
        cached = _cache.get(code)
        out[code] = {
            "file_name": path.name,
            "exists": path.exists(),
            "loaded": cached is not None,
            "error": _errors.get(code),
            "source": cached,
        }
    return out


def warm_up() -> None:
    """Precarga ambos datasets (se llama en un hilo al iniciar la API)."""
    for loader in (satcat, neo):
        try:
            loader()
        except DataUnavailableError:
            pass

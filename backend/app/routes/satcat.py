"""Endpoint protegido para el catálogo SATCAT."""

from functools import lru_cache

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, Query

from backend.app.auth import get_current_user
from backend.app.config import SATCAT_DATA_PATH

router = APIRouter(tags=["satcat"])

REQUIRED_COLUMNS = {"norad", "name", "type", "orbit", "status"}


@lru_cache(maxsize=1)
def load_satcat() -> pd.DataFrame:
    if not SATCAT_DATA_PATH.exists():
        raise FileNotFoundError(
            f"No se encontró el catálogo SATCAT en {SATCAT_DATA_PATH}"
        )
    frame = pd.read_csv(SATCAT_DATA_PATH, encoding="utf-8-sig")
    missing = REQUIRED_COLUMNS.difference(frame.columns)
    if missing:
        raise ValueError(f"Faltan columnas requeridas en satcat.csv: {sorted(missing)}")
    numeric_columns = {"apogee", "perigee", "inclination", "launch_year"}
    for column in numeric_columns.intersection(frame.columns):
        frame[column] = pd.to_numeric(frame[column], errors="coerce").fillna(0)
    return frame


@router.get("/satcat")
def list_satcat(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    _: dict = Depends(get_current_user),
) -> dict[str, object]:
    try:
        frame = load_satcat()
    except (FileNotFoundError, ValueError) as error:
        raise HTTPException(status_code=503, detail=str(error)) from error

    start = (page - 1) * page_size
    records = (
        frame.iloc[start : start + page_size]
        .where(frame.notna(), None)
        .to_dict(orient="records")
    )
    numeric_frame = frame.select_dtypes(include="number")
    statistics = {
        column: round(float(numeric_frame[column].mean()), 2)
        for column in numeric_frame.columns
        if numeric_frame[column].count()
    }
    return {
        "items": records,
        "page": page,
        "page_size": page_size,
        "total": int(len(frame)),
        "pages": (len(frame) + page_size - 1) // page_size,
        "statistics": statistics,
    }

"""Endpoint de métricas agregadas."""

from fastapi import APIRouter, Depends, HTTPException

from backend.app.auth import get_current_user
from backend.app.routes.satcat import load_satcat

router = APIRouter()


@router.get("/stats")
def stats(_: dict = Depends(get_current_user)) -> dict[str, object]:
    """Calcula métricas del catálogo SATCAT."""
    try:
        frame = load_satcat()
    except (FileNotFoundError, ValueError) as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    numeric = frame.select_dtypes(include="number")
    active = frame["status"].astype(str).str.casefold().eq("activo")
    return {
        "total_objects": int(len(frame)),
        "active_objects": int(active.sum()),
        "average_apogee_km": round(float(numeric["apogee"].mean()), 2)
        if "apogee" in numeric and len(frame)
        else 0,
        "average_perigee_km": round(float(numeric["perigee"].mean()), 2)
        if "perigee" in numeric and len(frame)
        else 0,
        "average_inclination_deg": round(float(numeric["inclination"].mean()), 2)
        if "inclination" in numeric and len(frame)
        else 0,
    }

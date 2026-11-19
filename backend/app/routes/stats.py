"""Indicadores agregados (compatibilidad con la versión anterior de FER)."""

from fastapi import APIRouter, Depends

from backend.app.astro import service, store
from backend.app.auth import get_current_user

router = APIRouter(tags=["dashboard"], dependencies=[Depends(get_current_user)])


@router.get("/stats")
def stats() -> dict[str, object]:
    """Métricas del catálogo SATCAT real."""
    frame = store.satcat_objects()
    alive = frame[~frame["is_decayed"]]
    return {
        "total_objects": int(len(frame)),
        "active_objects": int(frame["is_active"].sum()),
        "in_orbit": int(len(alive)),
        "average_apogee_km": round(float(alive["apogee_km"].mean()), 2),
        "average_perigee_km": round(float(alive["perigee_km"].mean()), 2),
        "average_inclination_deg": round(float(alive["inclination_deg"].mean()), 2),
    }


@router.get("/dashboard/summary", summary="Indicadores generales del dashboard")
def dashboard_summary() -> dict:
    return service.dashboard_summary()

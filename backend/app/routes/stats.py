"""Endpoint de métricas agregadas."""

from fastapi import APIRouter, HTTPException

from backend.app.services import get_stats

router = APIRouter()


@router.get("/stats")
def stats() -> dict[str, object]:
    """Devuelve métricas para el dashboard."""
    try:
        return get_stats()
    except (FileNotFoundError, ValueError) as error:
        raise HTTPException(status_code=503, detail=str(error)) from error

"""Endpoint de métricas agregadas."""

from fastapi import APIRouter, Depends, HTTPException

from backend.app.auth import get_current_user
from backend.app.services import get_stats

router = APIRouter()


@router.get("/stats")
def stats(_: dict = Depends(get_current_user)) -> dict[str, object]:
    """Devuelve métricas para el dashboard."""
    try:
        return get_stats()
    except (FileNotFoundError, ValueError) as error:
        raise HTTPException(status_code=503, detail=str(error)) from error

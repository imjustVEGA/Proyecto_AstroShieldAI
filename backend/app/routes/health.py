"""Endpoint de salud."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
def health_check() -> dict[str, str]:
    """Confirma que la API está disponible."""
    return {"status": "ok"}

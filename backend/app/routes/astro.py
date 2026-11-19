"""Búsqueda global, analítica, visualización orbital y fuentes de datos."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from backend.app.astro import service
from backend.app.auth import get_current_user

router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get("/search", tags=["Búsqueda"], summary="Búsqueda global en SATCAT y NEO")
def search(q: Annotated[str, Query(min_length=2, max_length=64)],
           limit: Annotated[int, Query(ge=1, le=20)] = 8) -> list[dict]:
    return service.global_search(q, limit)


@router.get("/analytics/orbital-distribution", tags=["Analítica"])
def orbital_distribution(object_type: Annotated[list[str] | None, Query()] = None) -> dict:
    return service.orbital_distribution(object_type)


@router.get("/analytics/object-classification", tags=["Analítica"])
def object_classification() -> dict:
    return service.object_classification()


@router.get("/analytics/neo-prioritization", tags=["Analítica"],
            summary="Índice transparente de prioridad de revisión (no es probabilidad de impacto)")
def neo_prioritization(
    tier: Annotated[str | None, Query(pattern="^[ABC]$")] = None,
    hazardous: bool | None = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=200)] = 25,
) -> dict:
    return service.neo_prioritization(tier, hazardous, page, page_size)


@router.get("/visualization/orbital-shells", tags=["Visualización"],
            summary="Capas orbitales agregadas por altitud media (representación conceptual)")
def orbital_shells() -> dict:
    return service.orbital_shells()


@router.get("/visualization/capabilities", tags=["Visualización"])
def capabilities() -> dict:
    return service.capabilities()


@router.get("/datasets", tags=["Datos"], summary="Fuentes, estado de carga e informe de calidad")
def datasets() -> list[dict]:
    return service.datasets_status()

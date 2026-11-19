"""Asteroides cercanos (NASA NeoWs): un registro por objeto con todas sus aproximaciones."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Query

from backend.app.astro import service
from backend.app.auth import get_current_user

router = APIRouter(tags=["NEO"], dependencies=[Depends(get_current_user)])


@router.get("/neo", summary="Listar asteroides (uno por objeto)")
def list_neo(
    q: Annotated[str | None, Query(max_length=64)] = None,
    hazardous: bool | None = None,
    tier: Annotated[str | None, Query(pattern="^[ABC]$")] = None,
    min_diameter_km: Annotated[float | None, Query(ge=0)] = None,
    max_diameter_km: Annotated[float | None, Query(ge=0)] = None,
    min_velocity_kmh: Annotated[float | None, Query(ge=0)] = None,
    max_velocity_kmh: Annotated[float | None, Query(ge=0)] = None,
    min_distance_km: Annotated[float | None, Query(ge=0)] = None,
    max_distance_km: Annotated[float | None, Query(ge=0)] = None,
    sort: str = "min_miss_distance_km",
    order: Annotated[str, Query(pattern="^(asc|desc)$")] = "asc",
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=200)] = 25,
) -> dict:
    return service.neo_list(q=q, hazardous=hazardous, tier=tier, min_diameter_km=min_diameter_km,
                            max_diameter_km=max_diameter_km, min_velocity_kmh=min_velocity_kmh,
                            max_velocity_kmh=max_velocity_kmh, min_distance_km=min_distance_km,
                            max_distance_km=max_distance_km, sort=sort, order=order, page=page, page_size=page_size)


@router.get("/neos", summary="Alias de /neo (compatibilidad con la versión anterior)", include_in_schema=False)
def list_neos_legacy(page: Annotated[int, Query(ge=1)] = 1, page_size: Annotated[int, Query(ge=1, le=200)] = 25) -> dict:
    return service.neo_list(page=page, page_size=page_size)


@router.get("/neo/statistics", summary="Estadísticas de NEO")
def neo_statistics() -> dict:
    return service.neo_statistics()


@router.get("/neo/distance-diameter", summary="Distancia mínima (LD) vs. diámetro máx. (m) de todos los objetos")
def neo_distance_diameter() -> dict:
    return service.neo_distance_diameter()


@router.get("/neo/{neo_id}", summary="Asteroide y todas sus aproximaciones registradas")
def neo_detail(neo_id: Annotated[int, Path(gt=0)]) -> dict:
    detail = service.neo_detail(neo_id)
    if detail is None:
        raise HTTPException(status_code=404, detail=f"No existe el NEO con id {neo_id}")
    return detail

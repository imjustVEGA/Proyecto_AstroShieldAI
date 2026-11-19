"""Catálogo SATCAT real (CelesTrak): lista con filtros, estadísticas y ficha."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Query

from backend.app.astro import service
from backend.app.auth import get_current_user

router = APIRouter(prefix="/satcat", tags=["SATCAT"], dependencies=[Depends(get_current_user)])


@router.get("", summary="Listar objetos artificiales")
def list_satcat(
    q: Annotated[str | None, Query(max_length=64, description="Nombre, designación o NORAD")] = None,
    object_type: Annotated[list[str] | None, Query(description="PAY, R/B, DEB, UNK (repetible)")] = None,
    owner: Annotated[str | None, Query(max_length=16)] = None,
    state: Annotated[str, Query(pattern="^(all|in_orbit|decayed)$")] = "all",
    ops_status: Annotated[str | None, Query(max_length=1)] = None,
    orbit_class: Annotated[str | None, Query(pattern="^(LEO|MEO|GEO|HEO)$")] = None,
    incomplete_only: bool = False,
    sort: str = "norad_cat_id",
    order: Annotated[str, Query(pattern="^(asc|desc)$")] = "asc",
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=200)] = 25,
) -> dict:
    return service.satcat_list(q=q, object_type=object_type, owner=owner, state=state, ops_status=ops_status,
                               orbit_class=orbit_class, incomplete_only=incomplete_only, sort=sort, order=order,
                               page=page, page_size=page_size)


# Debe declararse antes de /{norad_id} para que "statistics" no se lea como id.
@router.get("/statistics", summary="Estadísticas del catálogo")
def satcat_statistics() -> dict:
    return service.satcat_statistics()


@router.get("/{norad_id}", summary="Ficha por NORAD_CAT_ID")
def satcat_detail(norad_id: Annotated[int, Path(gt=0)]) -> dict:
    detail = service.satcat_detail(norad_id)
    if detail is None:
        raise HTTPException(status_code=404, detail=f"No existe el objeto con NORAD_CAT_ID {norad_id}")
    return detail

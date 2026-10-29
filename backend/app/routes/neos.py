"""Endpoint de consulta paginada de NEOs."""

from fastapi import APIRouter, HTTPException, Query

from backend.app.data import load_neos

router = APIRouter()


@router.get("/neos")
def list_neos(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
) -> dict[str, object]:
    """Devuelve una página de asteroides del CSV procesado."""
    try:
        frame = load_neos()
    except (FileNotFoundError, ValueError) as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    start = (page - 1) * page_size
    records = frame.iloc[start : start + page_size].where(frame.notna(), None).to_dict(
        orient="records"
    )
    return {
        "items": records,
        "page": page,
        "page_size": page_size,
        "total": int(len(frame)),
        "pages": (len(frame) + page_size - 1) // page_size,
    }

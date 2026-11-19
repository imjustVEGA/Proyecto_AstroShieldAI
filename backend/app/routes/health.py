"""Endpoint de salud."""

from fastapi import APIRouter

from backend.app.astro import store

router = APIRouter()


@router.get("/health")
def health_check() -> dict[str, object]:
    """Confirma que la API está disponible e informa si los datasets están cargados."""
    status = store.status()
    return {
        "status": "ok",
        "datasets": {code: {"file": info["file_name"], "exists": info["exists"], "loaded": info["loaded"],
                            "error": info["error"]} for code, info in status.items()},
    }

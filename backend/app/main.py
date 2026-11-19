"""Punto de entrada de la API FastAPI."""

import threading
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.astro import store
from backend.app.config import CORS_ORIGINS
from backend.app.routes import astro, auth, health, neos, predict, satcat, stats, users
from backend.app.users import initialize_database


@asynccontextmanager
async def lifespan(_: FastAPI):
    initialize_database()
    # Precarga SATCAT y NEO en segundo plano para que la primera pantalla responda rápido.
    threading.Thread(target=store.warm_up, name="astro-warmup", daemon=True).start()
    yield


app = FastAPI(title="AstroShieldAI API", version="2.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.exception_handler(store.DataUnavailableError)
async def data_unavailable(_: Request, error: store.DataUnavailableError) -> JSONResponse:
    return JSONResponse(status_code=503, content={"detail": str(error), "code": "data_unavailable"})


app.include_router(auth.router)
app.include_router(health.router)
app.include_router(neos.router)
app.include_router(predict.router)
app.include_router(stats.router)
app.include_router(satcat.router)
app.include_router(astro.router)
app.include_router(users.router)

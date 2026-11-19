"""Punto de entrada de la API FastAPI."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.config import CORS_ORIGINS
from backend.app.routes import auth, health, neos, predict, satcat, stats

app = FastAPI(title="AstroShieldAI API", version="1.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)
app.include_router(auth.router)
app.include_router(health.router)
app.include_router(neos.router)
app.include_router(predict.router)
app.include_router(stats.router)
app.include_router(satcat.router)

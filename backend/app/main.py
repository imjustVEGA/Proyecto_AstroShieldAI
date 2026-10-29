"""Punto de entrada de la API FastAPI."""

from fastapi import FastAPI

from backend.app.routes import health, neos, predict, stats

app = FastAPI(title="AstroShieldAI API", version="1.0.0")
app.include_router(health.router)
app.include_router(neos.router)
app.include_router(predict.router)
app.include_router(stats.router)

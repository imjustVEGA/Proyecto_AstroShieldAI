"""Modelos Pydantic del contrato público."""

from pydantic import BaseModel, Field


class PredictionRequest(BaseModel):
    """Features numéricas necesarias para una predicción."""

    est_diameter_min: float = Field(ge=0)
    est_diameter_max: float = Field(ge=0)
    relative_velocity: float = Field(ge=0)
    miss_distance: float = Field(ge=0)
    absolute_magnitude: float


class PredictionResponse(BaseModel):
    """Resultado normalizado de los modelos persistidos."""

    hazardous: bool
    probability: float
    anomaly_score: float
    model_version: str

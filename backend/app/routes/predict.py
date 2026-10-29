"""Endpoint de inferencia."""

from fastapi import APIRouter, HTTPException

from backend.app.schemas import PredictionRequest, PredictionResponse
from backend.app.services import predict

router = APIRouter()


@router.post("/predict", response_model=PredictionResponse)
def make_prediction(request: PredictionRequest) -> PredictionResponse:
    """Predice riesgo y anomalía orbital para un NEO."""
    try:
        hazardous, probability, anomaly_score = predict(request.model_dump())
    except (FileNotFoundError, ValueError) as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    return PredictionResponse(
        hazardous=hazardous,
        probability=probability,
        anomaly_score=anomaly_score,
        model_version="rf-v1",
    )

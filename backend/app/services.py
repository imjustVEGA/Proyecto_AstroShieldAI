"""Servicios de modelos y métricas."""

from pathlib import Path

import joblib
import pandas as pd

from backend.app.config import FEATURE_COLUMNS, MODEL_DIR
from backend.app.data import load_neos


def _model_path(name: str) -> Path:
    """Devuelve la ruta de un artefacto persistido."""
    return MODEL_DIR / name


def load_models() -> tuple[object, object, object]:
    """Carga clasificador, escalador y detector persistidos."""
    classifier_path = _model_path("random_forest.joblib")
    scaler_path = _model_path("feature_scaler.joblib")
    anomaly_path = _model_path("isolation_forest.joblib")
    if not classifier_path.exists() or not scaler_path.exists() or not anomaly_path.exists():
        raise FileNotFoundError(
            "Faltan modelos persistidos. Ejecuta `python -m backend.train` con el CSV oficial."
        )
    return joblib.load(classifier_path), joblib.load(scaler_path), joblib.load(anomaly_path)


def predict(features: dict[str, float]) -> tuple[bool, float, float]:
    """Calcula peligrosidad, probabilidad y puntuación de anomalía."""
    classifier, scaler, anomaly_detector = load_models()
    values = pd.DataFrame([features], columns=FEATURE_COLUMNS)
    probability = float(classifier.predict_proba(values)[0, 1])
    hazardous = bool(classifier.predict(values)[0])
    anomaly_score = float(anomaly_detector.decision_function(scaler.transform(values))[0])
    return hazardous, probability, anomaly_score


def get_stats() -> dict[str, object]:
    """Calcula métricas agregadas directamente sobre el CSV cargado."""
    frame = load_neos()
    hazardous = frame["is_hazardous"].astype(bool)
    return {
        "total_neos": int(len(frame)),
        "hazardous_neos": int(hazardous.sum()),
        "hazardous_rate": float(hazardous.mean()) if len(frame) else 0.0,
        "average_velocity": float(frame["relative_velocity"].mean()),
        "average_miss_distance": float(frame["miss_distance"].mean()),
    }

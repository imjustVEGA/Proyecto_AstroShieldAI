"""Entrenamiento reproducible de los modelos del MVP."""

import joblib
import pandas as pd
from imblearn.over_sampling import SMOTE
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.preprocessing import StandardScaler

from backend.app.config import FEATURE_COLUMNS, MODEL_DIR, RAW_DATA_PATH, PROCESSED_DATA_PATH


def train_models() -> None:
    """Limpia el CSV oficial, balancea el target y persiste ambos modelos."""
    if not RAW_DATA_PATH.exists():
        raise FileNotFoundError(
            f"Coloca el dataset oficial de NASA CNEOS en {RAW_DATA_PATH}."
        )
    frame = pd.read_csv(RAW_DATA_PATH).dropna(
        subset=[*FEATURE_COLUMNS, "is_hazardous"]
    )
    frame["is_hazardous"] = frame["is_hazardous"].astype(bool)
    features = frame[FEATURE_COLUMNS].astype(float)
    target = frame["is_hazardous"].astype(int)
    if target.nunique() < 2:
        raise ValueError("El dataset debe contener ambas clases de is_hazardous.")
    balanced_features, balanced_target = SMOTE(random_state=42).fit_resample(
        features, target
    )
    classifier = RandomForestClassifier(
        n_estimators=200, random_state=42, class_weight="balanced"
    )
    classifier.fit(balanced_features, balanced_target)
    scaler = StandardScaler()
    scaled_features = scaler.fit_transform(features)
    anomaly_detector = IsolationForest(random_state=42, contamination="auto")
    anomaly_detector.fit(scaled_features)
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    PROCESSED_DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    frame.to_csv(PROCESSED_DATA_PATH, index=False)
    joblib.dump(classifier, MODEL_DIR / "random_forest.joblib")
    joblib.dump(scaler, MODEL_DIR / "feature_scaler.joblib")
    joblib.dump(anomaly_detector, MODEL_DIR / "isolation_forest.joblib")


if __name__ == "__main__":
    train_models()

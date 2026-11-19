"""Índice transparente de prioridad de revisión para NEO.

QUÉ ES: una ordenación descriptiva para decidir qué registros revisar primero.
QUÉ NO ES: una probabilidad de impacto ni una evaluación de riesgo. No usa
órbitas, incertidumbres ni MOID (no están en el dataset).

Reglas (deterministas, versionadas en METHODOLOGY):

1. Nivel (tier), por reglas explícitas:
   A · Revisión prioritaria: hazardous=True según la fuente Y alguna aproximación
       registrada a ≤ 0.05 UA.
   B · Seguimiento: hazardous=True, o diámetro máx. estimado ≥ 140 m con alguna
       aproximación registrada a ≤ 0.05 UA.
   C · Rutina: el resto.
2. Puntuación 0-100 para ordenar dentro de cada nivel, combinación ponderada de
   rangos percentiles (relativos a ESTE dataset):
   proximidad (menor distancia mínima) 45 %, tamaño (diámetro máx.) 35 %,
   velocidad (velocidad relativa máx.) 20 %. Los pesos son una decisión
   editorial documentada, no un resultado empírico.
"""

from __future__ import annotations

from dataclasses import dataclass, field

import pandas as pd

from backend.app.astro.neo_cleaner import AU_KM

CLOSE_APPROACH_KM = 0.05 * AU_KM
LARGE_DIAMETER_KM = 0.14


@dataclass(frozen=True)
class Weights:
    proximity: float = 0.45
    size: float = 0.35
    speed: float = 0.20

    def __post_init__(self) -> None:
        if abs(self.proximity + self.size + self.speed - 1.0) > 1e-9:
            raise ValueError("Los pesos deben sumar 1")


TIER_LABELS = {"A": "Revisión prioritaria", "B": "Seguimiento", "C": "Rutina"}


@dataclass(frozen=True)
class Methodology:
    version: str = "1.0"
    weights: Weights = field(default_factory=Weights)
    close_approach_au: float = 0.05
    large_diameter_km: float = LARGE_DIAMETER_KM

    def describe(self) -> dict[str, object]:
        return {
            "version": self.version,
            "summary": "Índice descriptivo para ordenar la revisión. No es una probabilidad de impacto.",
            "tiers": [
                {"tier": "A", "label": TIER_LABELS["A"],
                 "rule": "hazardous = True (fuente) y alguna aproximación registrada ≤ 0.05 UA"},
                {"tier": "B", "label": TIER_LABELS["B"],
                 "rule": "hazardous = True, o diámetro máx. estimado ≥ 140 m con aproximación ≤ 0.05 UA"},
                {"tier": "C", "label": TIER_LABELS["C"], "rule": "Resto de objetos"},
            ],
            "score": {
                "range": [0, 100],
                "components": [
                    {"name": "proximity", "variable": "min_miss_distance_km",
                     "weight": self.weights.proximity, "transform": "rango percentil inverso"},
                    {"name": "size", "variable": "est_diameter_max_km",
                     "weight": self.weights.size, "transform": "rango percentil"},
                    {"name": "speed", "variable": "max_relative_velocity_kmh",
                     "weight": self.weights.speed, "transform": "rango percentil"},
                ],
            },
            "limitations": [
                "Los percentiles son relativos a este dataset; cambian si cambia la cobertura de datos.",
                "No hay fechas de aproximación: no distingue eventos pasados de futuros.",
                "hazardous es la clasificación de la fuente (basada en MOID y H); no se recalcula.",
                "El diámetro es una estimación derivada de H, con incertidumbre de un factor ~2.2.",
                "Los pesos son una decisión editorial y pueden ajustarse.",
            ],
        }


def prioritize(frame: pd.DataFrame, methodology: Methodology | None = None) -> pd.DataFrame:
    """Añade tier, review_score, componentes y razones. No modifica `frame`."""
    m = methodology or Methodology()
    w = m.weights
    out = frame.copy()
    close = out["min_miss_distance_km"] <= m.close_approach_au * AU_KM
    large = out["est_diameter_max_km"] >= m.large_diameter_km
    hazardous = out["is_hazardous"].astype(bool)

    out["tier"] = "C"
    out.loc[hazardous | (large & close), "tier"] = "B"
    out.loc[hazardous & close, "tier"] = "A"

    out["proximity_component"] = out["min_miss_distance_km"].rank(pct=True, ascending=False)
    out["size_component"] = out["est_diameter_max_km"].rank(pct=True)
    out["speed_component"] = out["max_relative_velocity_kmh"].rank(pct=True)
    score = (
        w.proximity * out["proximity_component"]
        + w.size * out["size_component"]
        + w.speed * out["speed_component"]
    )
    out["review_score"] = (100 * score).round(2)

    reasons = pd.DataFrame({
        "Clasificado como potencialmente peligroso por la fuente": hazardous,
        f"Aproximación registrada ≤ {m.close_approach_au} UA": close,
        f"Diámetro máx. estimado ≥ {int(m.large_diameter_km * 1000)} m": large,
    })
    out["reasons"] = reasons.apply(lambda r: [k for k, v in r.items() if v], axis=1)
    return out.sort_values(["tier", "review_score", "neo_id"], ascending=[True, False, True], kind="stable")

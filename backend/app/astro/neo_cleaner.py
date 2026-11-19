"""Limpieza y normalización del dataset NEO (NASA NeoWs, versión Kaggle).

Mismas reglas que Astroshield AI (`modules/processing/neo_cleaner.py`).
Hallazgo clave: `id` identifica al ASTEROIDE, no al registro. Cada fila es una
aproximación; nombre, diámetros, H y `hazardous` son constantes por `id`.
La salida separa `objects` (uno por asteroide) y `observations` (una por fila).

Unidades: est_diameter_* en km (derivados de H), miss_distance en km,
relative_velocity se asume en km/h (la fuente no lo documenta).
"""

from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np
import pandas as pd

from backend.app.astro.quality import (
    IssueCollector,
    blank_counts,
    normalize_blanks,
    parse_float,
    require_columns,
)

NEO_COLUMNS = [
    "id", "name", "est_diameter_min", "est_diameter_max", "relative_velocity", "miss_distance",
    "orbiting_body", "sentry_object", "absolute_magnitude", "hazardous",
]
STATIC_COLUMNS = ["name", "est_diameter_min", "est_diameter_max", "absolute_magnitude", "hazardous", "sentry_object"]

AU_KM = 149_597_870.7
LUNAR_DISTANCE_KM = 384_399.0
PHA_H_THRESHOLD = 22.0
DIAMETER_REL_TOLERANCE = 1e-3


@dataclass
class NeoResult:
    objects: pd.DataFrame
    observations: pd.DataFrame
    issues: IssueCollector
    report: dict[str, object] = field(default_factory=dict)


def estimated_diameter_km(h, albedo: float) -> np.ndarray:
    """Diámetro estimado a partir de la magnitud absoluta H y un albedo supuesto."""
    return 1329.0 / np.sqrt(albedo) * np.power(10.0, -np.asarray(h, dtype=float) / 5.0)


def _parse_bool(frame: pd.DataFrame, column: str, issues: IssueCollector) -> pd.Series:
    parsed = frame[column].str.lower().map({"true": True, "false": False})
    issues.add_mask(frame, parsed.isna(), code="invalid_boolean", severity="error",
                    message=f"{column} no es True/False; registro rechazado", field_name=column, key_column="id")
    return parsed


def clean_neo(raw: pd.DataFrame) -> NeoResult:
    require_columns(raw, NEO_COLUMNS, "NEO")
    issues = IssueCollector()
    df = normalize_blanks(raw, NEO_COLUMNS)

    neo_id = pd.to_numeric(df["id"], errors="coerce")
    bad_id = neo_id.isna() | (neo_id % 1 != 0)
    issues.add_mask(df, bad_id, code="invalid_key", severity="error",
                    message="id ausente o inválido; registro rechazado", field_name="id")

    numbers = {
        c: parse_float(df, c, issues, "id")
        for c in ["est_diameter_min", "est_diameter_max", "relative_velocity", "miss_distance", "absolute_magnitude"]
    }
    hazardous = _parse_bool(df, "hazardous", issues)
    sentry = _parse_bool(df, "sentry_object", issues)

    required_missing = numbers["relative_velocity"].isna() | numbers["miss_distance"].isna()
    issues.add_mask(df, required_missing & ~bad_id, code="missing_required", severity="error",
                    message="Falta velocidad o distancia de aproximación; registro rechazado", key_column="id")
    reject = bad_id | hazardous.isna() | sentry.isna() | required_missing

    df = df.loc[~reject].copy()
    df["neo_id"] = neo_id.loc[~reject].astype("int64")
    for c, series in numbers.items():
        df[c] = series.loc[~reject]
    df["hazardous"] = hazardous.loc[~reject].astype(bool)
    df["sentry_object"] = sentry.loc[~reject].astype(bool)

    nonpositive = (df["relative_velocity"] <= 0) | (df["miss_distance"] <= 0)
    issues.add_mask(df, nonpositive, code="nonpositive_value", severity="warning",
                    message="Velocidad o distancia no positiva", key_column="id")
    other_body = df["orbiting_body"].ne("Earth").fillna(True)
    issues.add_mask(df, other_body, code="non_earth_approach", severity="info",
                    message="Aproximación a un cuerpo distinto de la Tierra", key_column="id")
    identical = df.duplicated(NEO_COLUMNS, keep=False)
    issues.add_mask(df, identical, code="identical_record", severity="warning",
                    message="Fila idéntica a otra; se conserva (sin fecha no se puede confirmar duplicado)",
                    key_column="id")

    observations = pd.DataFrame({
        "neo_id": df["neo_id"],
        "source_row_number": df["_row_number"].astype("int64"),
        "relative_velocity_kmh": df["relative_velocity"],
        "miss_distance_km": df["miss_distance"],
        "orbiting_body": df["orbiting_body"],
        "flag_nonpositive_value": nonpositive,
        "flag_identical_record": identical,
    }).reset_index(drop=True)

    grouped = df.groupby("neo_id", sort=True)
    inconsistent = grouped[STATIC_COLUMNS].nunique(dropna=False).gt(1).any(axis=1)
    first_rows = grouped.head(1).set_index("neo_id").sort_index()
    if inconsistent.any():
        frame = first_rows.reset_index()
        issues.add_mask(frame, frame["neo_id"].isin(set(inconsistent[inconsistent].index)),
                        code="inconsistent_object_attributes", severity="warning",
                        message="Atributos físicos distintos entre registros del mismo id; se usa el primero",
                        key_column="neo_id")

    h = first_rows["absolute_magnitude"]
    dmin_expected = estimated_diameter_km(h, 0.25)
    dmax_expected = estimated_diameter_km(h, 0.05)
    diameter_mismatch = (
        ((first_rows["est_diameter_min"] - dmin_expected).abs() / dmin_expected > DIAMETER_REL_TOLERANCE)
        | ((first_rows["est_diameter_max"] - dmax_expected).abs() / dmax_expected > DIAMETER_REL_TOLERANCE)
    )
    hazardous_faint = first_rows["hazardous"] & (h > PHA_H_THRESHOLD)
    min_gt_max = first_rows["est_diameter_min"] > first_rows["est_diameter_max"]
    for mask, code, severity, message in [
        (diameter_mismatch, "diameter_h_mismatch", "info", "Diámetro no coincide con el derivado de H"),
        (hazardous_faint, "hazardous_h_above_threshold", "info",
         "Marcado hazardous con H > 22.0; se respeta la clasificación de la fuente"),
        (min_gt_max, "diameter_min_gt_max", "warning", "est_diameter_min mayor que est_diameter_max"),
    ]:
        frame = first_rows.reset_index()
        issues.add_mask(frame, mask.reset_index(drop=True), code=code, severity=severity,
                        message=message, key_column="neo_id")

    objects = pd.DataFrame({
        "neo_id": first_rows.index.astype("int64"),
        "name": first_rows["name"].to_numpy(),
        "absolute_magnitude_h": h.to_numpy(),
        "est_diameter_min_km": first_rows["est_diameter_min"].to_numpy(),
        "est_diameter_max_km": first_rows["est_diameter_max"].to_numpy(),
        "is_hazardous": first_rows["hazardous"].to_numpy(dtype=bool),
        "is_sentry_object": first_rows["sentry_object"].to_numpy(dtype=bool),
        "observation_count": grouped.size().to_numpy().astype("int64"),
        "min_miss_distance_km": grouped["miss_distance"].min().to_numpy(),
        "max_miss_distance_km": grouped["miss_distance"].max().to_numpy(),
        "max_relative_velocity_kmh": grouped["relative_velocity"].max().to_numpy(),
        "mean_relative_velocity_kmh": grouped["relative_velocity"].mean().round(6).to_numpy(),
        "flag_inconsistent_object_attributes": inconsistent.reindex(first_rows.index, fill_value=False).to_numpy(dtype=bool),
        "flag_diameter_h_mismatch": diameter_mismatch.fillna(False).to_numpy(dtype=bool),
        "flag_hazardous_h_above_threshold": hazardous_faint.fillna(False).to_numpy(dtype=bool),
        "flag_diameter_min_gt_max": min_gt_max.fillna(False).to_numpy(dtype=bool),
    }).set_index("neo_id", drop=False)
    objects.index.name = None

    per_object = objects["observation_count"]
    obs_flagged = observations["flag_nonpositive_value"] | observations["flag_identical_record"]
    report: dict[str, object] = {
        "rows_read": int(len(raw)),
        "rows_valid": int(len(observations)),
        "rows_rejected": int(len(raw) - len(observations)),
        "rows_flagged": int(obs_flagged.sum()),
        "unique_objects": int(len(objects)),
        "observations_per_object": {
            "min": int(per_object.min()), "median": float(per_object.median()), "max": int(per_object.max()),
        },
        "hazardous_objects": int(objects["is_hazardous"].sum()),
        "blank_cells_by_column": blank_counts(raw, NEO_COLUMNS),
        "constant_columns": [c for c in NEO_COLUMNS if raw[c].nunique(dropna=False) <= 1],
        "issue_counts_by_code": issues.counts_by_code(),
        "issue_counts_by_severity": issues.counts_by_severity(),
        "notes": [
            "id identifica al asteroide; cada fila es una aproximación distinta.",
            "El CSV no incluye fecha de aproximación: no se pueden ordenar las aproximaciones en el tiempo.",
            "sentry_object es constante (False) en todo el archivo; no se usa como variable analítica.",
            "relative_velocity se interpreta como km/h (unidad no documentada por la fuente).",
        ],
    }
    return NeoResult(objects=objects, observations=observations, issues=issues, report=report)


OBJECT_FLAGS = ["inconsistent_object_attributes", "diameter_h_mismatch", "hazardous_h_above_threshold", "diameter_min_gt_max"]

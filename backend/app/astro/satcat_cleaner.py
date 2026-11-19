"""Limpieza, validación y normalización de SATCAT (formato CSV de CelesTrak).

Mismas reglas que Astroshield AI (`modules/processing/satcat_cleaner.py`):
un registro limpio por NORAD_CAT_ID, indicadores de calidad por fila y un
registro de incidencias.

Unidades (documentación de CelesTrak, validadas con la 3.ª ley de Kepler):
PERIOD min, INCLINATION grados, APOGEE/PERIGEE km de altitud, RCS m².
"""

from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np
import pandas as pd

from backend.app.astro.orbital import classify_orbit, eccentricity, kepler_period_minutes
from backend.app.astro.quality import (
    IssueCollector,
    blank_counts,
    normalize_blanks,
    parse_date,
    parse_float,
    require_columns,
)

SATCAT_COLUMNS = [
    "OBJECT_NAME", "OBJECT_ID", "NORAD_CAT_ID", "OBJECT_TYPE", "OPS_STATUS_CODE", "OWNER",
    "LAUNCH_DATE", "LAUNCH_SITE", "DECAY_DATE", "PERIOD", "INCLINATION", "APOGEE", "PERIGEE",
    "RCS", "DATA_STATUS_CODE", "ORBIT_CENTER", "ORBIT_TYPE",
]
ORBITAL_FIELDS = ["PERIOD", "INCLINATION", "APOGEE", "PERIGEE"]

OBJECT_TYPES = {"PAY", "R/B", "DEB", "UNK"}
OPS_STATUS_CODES = {"+", "-", "P", "B", "S", "X", "D", "?"}
ACTIVE_STATUS_CODES = {"+", "P", "B", "S", "X"}
DATA_STATUS_CODES = {"NCE", "NIE", "NEA"}
ORBIT_TYPES = {"ORB", "LAN", "IMP", "DOC", "R/T"}

VALID_RANGES = {"PERIOD": (0.001, float("inf")), "INCLINATION": (0.0, 180.0), "RCS": (0.0, float("inf"))}
PERIOD_TOLERANCE = 0.05
FLAG_COLUMNS = [
    "missing_orbital_params", "missing_rcs", "no_orbital_elements",
    "apogee_below_perigee", "period_inconsistent", "decay_status_mismatch",
]


@dataclass
class SatcatResult:
    objects: pd.DataFrame
    raw: pd.DataFrame
    issues: IssueCollector
    report: dict[str, object] = field(default_factory=dict)


def _code_check(frame, column, allowed, issues, *, replacement):
    values = frame[column]
    invalid = values.notna() & ~values.isin(allowed)
    issues.add_mask(
        frame, invalid, code="unknown_code", severity="warning",
        message=f"Código de {column} no documentado por la fuente", field_name=column,
        key_column="NORAD_CAT_ID",
    )
    return values.mask(invalid, replacement)


def clean_satcat(raw: pd.DataFrame) -> SatcatResult:
    require_columns(raw, SATCAT_COLUMNS, "SATCAT")
    issues = IssueCollector()
    df = normalize_blanks(raw, SATCAT_COLUMNS)

    norad = pd.to_numeric(df["NORAD_CAT_ID"], errors="coerce")
    bad_key = norad.isna() | (norad <= 0) | (norad % 1 != 0)
    issues.add_mask(df, bad_key, code="invalid_key", severity="error",
                    message="NORAD_CAT_ID ausente o inválido; registro rechazado", field_name="NORAD_CAT_ID")
    df = df.loc[~bad_key].copy()
    df["norad_cat_id"] = norad.loc[~bad_key].astype("int64")

    dup_key = df.duplicated("norad_cat_id", keep="first")
    identical = df.duplicated(SATCAT_COLUMNS, keep="first")
    issues.add_mask(df, dup_key & identical, code="duplicate_identical", severity="warning",
                    message="Fila idéntica a otra anterior; se conserva la primera", key_column="NORAD_CAT_ID")
    issues.add_mask(df, dup_key & ~identical, code="duplicate_key_conflict", severity="error",
                    message="NORAD_CAT_ID repetido con datos distintos; se conserva la primera aparición",
                    key_column="NORAD_CAT_ID")
    df = df.loc[~dup_key].copy()

    key = "NORAD_CAT_ID"
    numbers = {c: parse_float(df, c, issues, key) for c in [*ORBITAL_FIELDS, "RCS"]}
    for column, (low, high) in VALID_RANGES.items():
        out_of_range = numbers[column].notna() & ~numbers[column].between(low, high)
        issues.add_mask(df, out_of_range, code="out_of_range", severity="warning",
                        message=f"{column} fuera del rango físico [{low}, {high}]; se guarda como nulo",
                        field_name=column, key_column=key)
        numbers[column] = numbers[column].mask(out_of_range)
    launch_date = parse_date(df, "LAUNCH_DATE", issues, key)
    decay_date = parse_date(df, "DECAY_DATE", issues, key)

    object_type = _code_check(df, "OBJECT_TYPE", OBJECT_TYPES, issues, replacement="UNK").fillna("UNK")
    ops_status = _code_check(df, "OPS_STATUS_CODE", OPS_STATUS_CODES, issues, replacement=None)
    data_status = _code_check(df, "DATA_STATUS_CODE", DATA_STATUS_CODES, issues, replacement=None)
    orbit_type = _code_check(df, "ORBIT_TYPE", ORBIT_TYPES, issues, replacement=None)

    # ORBIT_CENTER contiene el NORAD_CAT_ID del objeto anfitrión cuando está acoplado (DOC).
    center = df["ORBIT_CENTER"]
    docked_to = pd.to_numeric(center.where(center.str.fullmatch(r"\d+", na=False)), errors="coerce")

    apogee, perigee, period = numbers["APOGEE"], numbers["PERIGEE"], numbers["PERIOD"]
    is_decayed = decay_date.notna()
    earth_centered = center.eq("EA").fillna(False)

    swapped = apogee < perigee
    issues.add_mask(df, swapped, code="apogee_below_perigee", severity="warning",
                    message="APOGEE menor que PERIGEE (posible inversión de campos)", key_column=key)
    expected_period = pd.Series(
        kepler_period_minutes(np.fmax(apogee, perigee), np.fmin(apogee, perigee)), index=df.index
    )
    ratio = period / expected_period
    inconsistent_period = earth_centered & ratio.notna() & ((ratio - 1).abs() > PERIOD_TOLERANCE)
    issues.add_mask(df, inconsistent_period, code="period_inconsistent", severity="warning",
                    message=f"PERIOD difiere más de {PERIOD_TOLERANCE:.0%} del periodo kepleriano de apogeo/perigeo",
                    key_column=key)
    status_mismatch = (ops_status.eq("D").fillna(False) & ~is_decayed) | (
        is_decayed & ops_status.notna() & ops_status.ne("D").fillna(False)
    )
    issues.add_mask(df, status_mismatch, code="decay_status_mismatch", severity="warning",
                    message="OPS_STATUS_CODE y DECAY_DATE no son coherentes", key_column=key)

    missing_orbit = pd.concat([numbers[c].isna() for c in ORBITAL_FIELDS], axis=1).any(axis=1)
    in_earth_orbit = earth_centered & ~is_decayed
    orbit_class = pd.Series(classify_orbit(apogee, perigee), index=df.index, dtype=object).where(in_earth_orbit, None)
    ecc = pd.Series(eccentricity(np.fmax(apogee, perigee), np.fmin(apogee, perigee)), index=df.index)

    flags = {
        "missing_orbital_params": missing_orbit,
        "missing_rcs": numbers["RCS"].isna(),
        "no_orbital_elements": data_status.notna(),
        "apogee_below_perigee": swapped,
        "period_inconsistent": inconsistent_period,
        "decay_status_mismatch": status_mismatch,
    }
    flags = {name: mask.fillna(False).astype(bool) for name, mask in flags.items()}

    out = pd.DataFrame(
        {
            "norad_cat_id": df["norad_cat_id"],
            "object_id": df["OBJECT_ID"],
            "object_name": df["OBJECT_NAME"],
            "object_type": object_type,
            "ops_status_code": ops_status,
            "owner_code": df["OWNER"],
            "launch_date": launch_date,
            "launch_site_code": df["LAUNCH_SITE"],
            "decay_date": decay_date,
            "period_min": period,
            "inclination_deg": numbers["INCLINATION"],
            "apogee_km": apogee,
            "perigee_km": perigee,
            "rcs_m2": numbers["RCS"],
            "data_status_code": data_status,
            "orbit_center": center,
            "orbit_type": orbit_type,
            "docked_to_norad_id": docked_to,
            "is_decayed": is_decayed,
            "is_active": ops_status.isin(ACTIVE_STATUS_CODES),
            "orbit_class": orbit_class,
            "eccentricity": ecc.round(6),
            "has_complete_orbit": ~missing_orbit,
            **{f"flag_{k}": v for k, v in flags.items()},
        },
        index=df.index,
    )
    out["_row_number"] = df["_row_number"]
    raw_records = raw.loc[out.index, SATCAT_COLUMNS].copy()
    raw_records.index = out["norad_cat_id"].to_numpy()
    out = out.set_index("norad_cat_id", drop=False).sort_index()
    out.index.name = None  # evita ambigüedad índice/columna al ordenar

    flagged = pd.concat(list(flags.values()), axis=1).any(axis=1)
    report: dict[str, object] = {
        "rows_read": int(len(raw)),
        "rows_valid": int(len(out)),
        "rows_rejected": int(len(raw) - len(out)),
        "rows_flagged": int(flagged.sum()),
        "blank_cells_by_column": blank_counts(raw, SATCAT_COLUMNS),
        "quality_flag_counts": {k: int(v.sum()) for k, v in flags.items()},
        "issue_counts_by_code": issues.counts_by_code(),
        "issue_counts_by_severity": issues.counts_by_severity(),
        "notes": [
            "DECAY_DATE vacío significa que el objeto no ha reingresado (no es un dato faltante).",
            "OPS_STATUS_CODE vacío se interpreta como estado desconocido.",
            "orbit_class solo se calcula para objetos centrados en la Tierra que siguen en órbita.",
        ],
    }
    return SatcatResult(objects=out, raw=raw_records, issues=issues, report=report)


def quality_flags(row: pd.Series) -> list[str]:
    return [name for name in FLAG_COLUMNS if bool(row.get(f"flag_{name}", False))]

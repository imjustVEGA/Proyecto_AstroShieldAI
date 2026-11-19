"""Respuestas de la API construidas sobre los DataFrames en memoria.

Reproduce el contrato de Astroshield AI (`/api/v1/...`) para SATCAT, NEO,
analítica, visualización, dashboard, búsqueda y fuentes de datos.
"""

from __future__ import annotations

import math
from datetime import datetime, timezone

import numpy as np
import pandas as pd

from backend.app.astro import store
from backend.app.astro.codes import (
    DATA_STATUS_LABELS,
    OBJECT_TYPE_LABELS,
    OPS_STATUS_LABELS,
    ORBIT_CENTER_LABELS,
    ORBIT_TYPE_LABELS,
    label,
)
from backend.app.astro.neo_cleaner import AU_KM, LUNAR_DISTANCE_KM, OBJECT_FLAGS
from backend.app.astro.orbital import ORBIT_CLASS_RULES, ORBIT_CLASSES
from backend.app.astro.prioritization import TIER_LABELS, Methodology
from backend.app.astro.satcat_cleaner import SATCAT_COLUMNS, quality_flags
from backend.app.astro.sources import SOURCES

DISCLAIMER = (
    "AstroShield AI es un sistema de apoyo a decisiones. Los indicadores son descriptivos y "
    "no constituyen predicciones de colisión ni de impacto."
)


# --------------------------------------------------------------------------- utilidades


def clean(value):
    """Convierte valores de numpy/pandas en tipos JSON (NaN/NaT → None)."""
    if value is None:
        return None
    if isinstance(value, (pd.Timestamp, datetime)):
        return None if pd.isna(value) else value.date().isoformat()
    if isinstance(value, (np.bool_, bool)):
        return bool(value)
    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.floating, float)):
        return None if math.isnan(value) or math.isinf(value) else float(value)
    try:
        if pd.isna(value):
            return None
    except (TypeError, ValueError):
        pass
    return value


def page_of(frame: pd.DataFrame, page: int, page_size: int) -> tuple[pd.DataFrame, dict[str, int]]:
    total = int(len(frame))
    chunk = frame.iloc[(page - 1) * page_size: page * page_size]
    return chunk, {"total": total, "page": page, "page_size": page_size, "pages": max(1, math.ceil(total / page_size))}


def sort_frame(frame: pd.DataFrame, column: str, descending: bool, tiebreak: str) -> pd.DataFrame:
    return frame.sort_values([column, tiebreak], ascending=[not descending, True], na_position="last", kind="stable")


def histogram(values: pd.Series | np.ndarray, edges: list[float], include_overflow: bool = True) -> list[dict]:
    """Cuenta valores en [edges[i], edges[i+1]); fuera de rango → bins abiertos (start o end = None)."""
    data = np.asarray(pd.Series(values).dropna(), dtype=float)
    idx = np.searchsorted(np.asarray(edges, dtype=float), data, side="right")  # 0 = bajo el primer borde
    counts = np.bincount(idx, minlength=len(edges) + 1)
    bins: list[dict] = []
    if include_overflow and counts[0]:
        bins.append({"start": None, "end": edges[0], "count": int(counts[0])})
    for i in range(1, len(edges)):
        bins.append({"start": edges[i - 1], "end": edges[i], "count": int(counts[i])})
    if include_overflow and counts[len(edges)]:
        bins.append({"start": edges[-1], "end": None, "count": int(counts[len(edges)])})
    return bins


def linear_edges(start: float, stop: float, step: float) -> list[float]:
    count = int(round((stop - start) / step))
    return [round(start + i * step, 6) for i in range(count + 1)]


def count_items(series: pd.Series, labels: dict | None = None, order: list[str] | None = None) -> list[dict]:
    counts = series.value_counts(dropna=False)
    keys = order or list(counts.index)
    return [
        {"key": clean(k) if clean(k) is not None else "blank",
         "label": label(labels, clean(k)) if labels else (clean(k) or "Sin dato"),
         "count": int(counts.get(k, 0))}
        for k in keys
    ]


# --------------------------------------------------------------------------- SATCAT

SATCAT_SUMMARY_FIELDS = [
    "norad_cat_id", "object_id", "object_name", "object_type", "ops_status_code", "owner_code",
    "launch_date", "decay_date", "period_min", "inclination_deg", "apogee_km", "perigee_km",
    "orbit_center", "orbit_class", "is_decayed", "is_active", "has_complete_orbit",
]
SATCAT_SORTS = {"norad_cat_id", "object_name", "launch_date", "inclination_deg", "apogee_km", "perigee_km", "period_min"}


def _satcat_row(row: pd.Series) -> dict:
    out = {f: clean(row[f]) for f in SATCAT_SUMMARY_FIELDS}
    out["quality_flags"] = quality_flags(row)
    return out


def satcat_text_mask(frame: pd.DataFrame, q: str) -> pd.Series:
    term = q.strip()
    mask = frame["object_name"].str.contains(term, case=False, regex=False, na=False)
    mask |= frame["object_id"].str.upper().str.startswith(term.upper(), na=False)
    if term.isdigit():
        mask |= frame["norad_cat_id"] == int(term)
    return mask


def satcat_list(*, q=None, object_type=None, owner=None, state="all", ops_status=None, orbit_class=None,
                incomplete_only=False, sort="norad_cat_id", order="asc", page=1, page_size=25) -> dict:
    frame = store.satcat_objects()
    mask = pd.Series(True, index=frame.index)
    if q:
        mask &= satcat_text_mask(frame, q)
    if object_type:
        mask &= frame["object_type"].isin([t.upper() for t in object_type])
    if owner:
        mask &= frame["owner_code"].eq(owner.upper()).fillna(False)
    if state == "in_orbit":
        mask &= ~frame["is_decayed"]
    elif state == "decayed":
        mask &= frame["is_decayed"]
    if ops_status:
        mask &= frame["ops_status_code"].eq(ops_status.upper()).fillna(False)
    if orbit_class:
        mask &= frame["orbit_class"].eq(orbit_class)
    if incomplete_only:
        mask &= ~frame["has_complete_orbit"]
    view = frame.loc[mask]
    sort = sort if sort in SATCAT_SORTS else "norad_cat_id"
    view = sort_frame(view, sort, order == "desc", "norad_cat_id") if sort != "norad_cat_id" else (
        view.sort_index(ascending=order != "desc"))
    chunk, meta = page_of(view, page, page_size)
    return {"items": [_satcat_row(r) for _, r in chunk.iterrows()], **meta}


def satcat_detail(norad_cat_id: int) -> dict | None:
    frame = store.satcat_objects()
    if norad_cat_id not in frame.index:
        return None
    row = frame.loc[norad_cat_id]
    loaded = store.satcat()
    raw = loaded.result.raw.loc[norad_cat_id, SATCAT_COLUMNS].to_dict()  # type: ignore[union-attr]
    docked = clean(row["docked_to_norad_id"])
    detail = {
        **_satcat_row(row),
        "launch_site_code": clean(row["launch_site_code"]),
        "rcs_m2": clean(row["rcs_m2"]),
        "data_status_code": clean(row["data_status_code"]),
        "orbit_type": clean(row["orbit_type"]),
        "docked_to_norad_id": int(docked) if docked is not None else None,
        "eccentricity": clean(row["eccentricity"]),
        "source_row_number": int(row["_row_number"]),
        "raw_record": raw,
        "labels": {
            "object_type": label(OBJECT_TYPE_LABELS, clean(row["object_type"])),
            "ops_status_code": label(OPS_STATUS_LABELS, clean(row["ops_status_code"])),
            "orbit_type": label(ORBIT_TYPE_LABELS, clean(row["orbit_type"])),
            "orbit_center": label(ORBIT_CENTER_LABELS, clean(row["orbit_center"]))
            if docked is None else f"Acoplado a NORAD {int(docked)}",
            "data_status_code": label(DATA_STATUS_LABELS, clean(row["data_status_code"])),
        },
    }
    return detail


def satcat_statistics() -> dict:
    s = store.satcat_objects()
    in_orbit = ~s["is_decayed"]
    totals = {
        "total": int(len(s)),
        "in_orbit": int(in_orbit.sum()),
        "decayed": int(s["is_decayed"].sum()),
        "active_payloads": int((s["object_type"].eq("PAY") & s["is_active"]).sum()),
        "debris_in_orbit": int((s["object_type"].eq("DEB") & in_orbit).sum()),
        "incomplete_orbit": int((~s["has_complete_orbit"]).sum()),
        "missing_rcs": int(s["rcs_m2"].isna().sum()),
    }
    by_type = (
        s.assign(_in=in_orbit).groupby("object_type").agg(count=("norad_cat_id", "size"), in_orbit=("_in", "sum"))
        .sort_values("count", ascending=False)
    )
    owners = s.assign(_in=in_orbit, owner=s["owner_code"].fillna("Sin dato"))
    by_owner = owners.groupby("owner").agg(total=("norad_cat_id", "size"), in_orbit=("_in", "sum")) \
        .sort_values("total", ascending=False).head(15)
    years = s["launch_date"].dropna().dt.year.value_counts().sort_index()
    by_class = s["orbit_class"].dropna().value_counts()
    return {
        "totals": totals,
        "by_type": [{"key": k, "label": label(OBJECT_TYPE_LABELS, k), "count": int(r["count"]), "in_orbit": int(r["in_orbit"])}
                    for k, r in by_type.iterrows()],
        "by_owner": [{"owner": k, "total": int(r["total"]), "in_orbit": int(r["in_orbit"])} for k, r in by_owner.iterrows()],
        "by_orbit_class": [{"key": k, "label": k, "count": int(c)} for k, c in by_class.items()],
        "by_ops_status": count_items(s["ops_status_code"], OPS_STATUS_LABELS),
        "launches_by_year": [{"year": int(y), "count": int(c)} for y, c in years.items()],
    }


# --------------------------------------------------------------------------- NEO

NEO_SORTS = {"name", "est_diameter_max_km", "max_relative_velocity_kmh", "min_miss_distance_km",
             "observation_count", "absolute_magnitude_h", "neo_id"}


def _neo_row(row: pd.Series, prio: pd.DataFrame) -> dict:
    neo_id = int(row["neo_id"])
    p = prio.loc[neo_id]
    return {
        "neo_id": neo_id,
        "name": row["name"],
        "absolute_magnitude_h": clean(row["absolute_magnitude_h"]),
        "est_diameter_min_km": clean(row["est_diameter_min_km"]),
        "est_diameter_max_km": clean(row["est_diameter_max_km"]),
        "is_hazardous": bool(row["is_hazardous"]),
        "observation_count": int(row["observation_count"]),
        "min_miss_distance_km": float(row["min_miss_distance_km"]),
        "min_miss_distance_ld": float(row["min_miss_distance_km"]) / LUNAR_DISTANCE_KM,
        "max_miss_distance_km": float(row["max_miss_distance_km"]),
        "max_relative_velocity_kmh": float(row["max_relative_velocity_kmh"]),
        "max_relative_velocity_kms": float(row["max_relative_velocity_kmh"]) / 3600.0,
        "mean_relative_velocity_kmh": float(row["mean_relative_velocity_kmh"]),
        "tier": p["tier"],
        "review_score": float(p["review_score"]),
        "quality_flags": [f for f in OBJECT_FLAGS if bool(row.get(f"flag_{f}", False))],
    }


def neo_text_mask(frame: pd.DataFrame, q: str) -> pd.Series:
    term = q.strip()
    mask = frame["name"].str.contains(term, case=False, regex=False, na=False)
    if term.isdigit():
        mask |= frame["neo_id"] == int(term)
    return mask


def neo_list(*, q=None, hazardous=None, tier=None, min_diameter_km=None, max_diameter_km=None, min_velocity_kmh=None,
             max_velocity_kmh=None, min_distance_km=None, max_distance_km=None,
             sort="min_miss_distance_km", order="asc", page=1, page_size=25) -> dict:
    o = store.neo_objects()
    prio = store.prioritized_neo()
    mask = pd.Series(True, index=o.index)
    if q:
        mask &= neo_text_mask(o, q)
    if hazardous is not None:
        mask &= o["is_hazardous"] == hazardous
    if tier:
        mask &= prio["tier"].reindex(o.index) == tier
    # El diámetro se filtra sobre el rango estimado [mín, máx].
    if min_diameter_km is not None:
        mask &= o["est_diameter_max_km"] >= min_diameter_km
    if max_diameter_km is not None:
        mask &= o["est_diameter_min_km"] <= max_diameter_km
    if min_velocity_kmh is not None:
        mask &= o["max_relative_velocity_kmh"] >= min_velocity_kmh
    if max_velocity_kmh is not None:
        mask &= o["max_relative_velocity_kmh"] <= max_velocity_kmh
    if min_distance_km is not None:
        mask &= o["min_miss_distance_km"] >= min_distance_km
    if max_distance_km is not None:
        mask &= o["min_miss_distance_km"] <= max_distance_km
    view = o.loc[mask]
    sort = sort if sort in NEO_SORTS else "min_miss_distance_km"
    view = sort_frame(view, sort, order == "desc", "neo_id") if sort != "neo_id" else view.sort_index(ascending=order != "desc")
    chunk, meta = page_of(view, page, page_size)
    return {"items": [_neo_row(r, prio) for _, r in chunk.iterrows()], **meta}


def neo_detail(neo_id: int) -> dict | None:
    o = store.neo_objects()
    if neo_id not in o.index:
        return None
    prio = store.prioritized_neo()
    row = o.loc[neo_id]
    obs = store.neo_observations()
    rows = obs[obs["neo_id"] == neo_id].sort_values("miss_distance_km")
    p = prio.loc[neo_id]
    detail = _neo_row(row, prio)
    detail.update({
        "rank": int(p["rank"]),
        "tier_label": TIER_LABELS[p["tier"]],
        "reasons": list(p["reasons"]),
        "components": {
            "proximity": round(float(p["proximity_component"]), 4),
            "size": round(float(p["size_component"]), 4),
            "speed": round(float(p["speed_component"]), 4),
        },
        "observations": [
            {
                "source_row_number": int(r["source_row_number"]),
                "relative_velocity_kmh": float(r["relative_velocity_kmh"]),
                "relative_velocity_kms": float(r["relative_velocity_kmh"]) / 3600.0,
                "miss_distance_km": float(r["miss_distance_km"]),
                "miss_distance_ld": float(r["miss_distance_km"]) / LUNAR_DISTANCE_KM,
                "orbiting_body": clean(r["orbiting_body"]),
            }
            for _, r in rows.iterrows()
        ],
        "notes": [
            f"{int(row['observation_count'])} aproximaciones registradas; el CSV no incluye sus fechas.",
            "Diámetro: rango estimado con albedo 0.25 (mín.) y 0.05 (máx.).",
        ] + (["Marcado como potencialmente peligroso por la fuente (criterio orbital, no por esta aproximación)."]
             if row["is_hazardous"] else []),
    })
    return detail


DIAMETER_EDGES_KM = [0.001, 0.003, 0.01, 0.03, 0.1, 0.14, 0.3, 1.0, 3.0, 10.0, 100.0]
VELOCITY_EDGES_KMS = [float(v) for v in range(0, 50, 5)]
DISTANCE_EDGES_LD = [0, 1, 5, 10, 19.46, 50, 100, 150, 200]  # 19.46 LD ≈ 0.05 UA


def neo_statistics() -> dict:
    o = store.neo_objects()
    obs = store.neo_observations()
    haz_ids = set(o.index[o["is_hazardous"]])
    obs_haz = obs["neo_id"].isin(haz_ids)
    totals = {
        "objects": int(len(o)),
        "hazardous_objects": int(o["is_hazardous"].sum()),
        "observations": int(len(obs)),
        "hazardous_observations": int(obs_haz.sum()),
    }
    totals["hazardous_object_share"] = totals["hazardous_objects"] / totals["objects"] if totals["objects"] else 0
    totals["median_velocity_kms"] = clean(obs["relative_velocity_kmh"].median() / 3600.0)
    totals["median_diameter_max_km"] = clean(o["est_diameter_max_km"].median())
    near = obs["miss_distance_km"] <= 0.05 * AU_KM
    comparison = []
    for flag in (True, False):
        g = o[o["is_hazardous"] == flag]
        mask = obs_haz if flag else ~obs_haz
        comparison.append({
            "group": "hazardous" if flag else "non_hazardous",
            "objects": int(len(g)),
            "median_diameter_max_km": clean(g["est_diameter_max_km"].median()),
            "median_velocity_kms": clean(g["max_relative_velocity_kmh"].median() / 3600.0),
            "median_min_distance_ld": clean(g["min_miss_distance_km"].median() / LUNAR_DISTANCE_KM),
            "approaches_within_0_05_au": int((near & mask).sum()),
        })
    return {
        "totals": totals,
        "diameter_max_km": histogram(o["est_diameter_max_km"], DIAMETER_EDGES_KM),
        "velocity_kms": histogram(obs["relative_velocity_kmh"] / 3600.0, VELOCITY_EDGES_KMS),
        "miss_distance_ld": histogram(obs["miss_distance_km"] / LUNAR_DISTANCE_KM, [float(e) for e in DISTANCE_EDGES_LD]),
        "hazardous_comparison": comparison,
        "units": {
            "diameter": "km (estimado a partir de H)",
            "velocity": "km/s (convertido desde km/h; unidad de origen inferida)",
            "distance": "LD = distancia lunar media (384,399 km); 1 UA = 149,597,870.7 km",
        },
    }


def neo_distance_diameter() -> dict:
    o = store.neo_objects().dropna(subset=["est_diameter_max_km"])
    points = pd.DataFrame({
        "x": (o["min_miss_distance_km"] / LUNAR_DISTANCE_KM).round(2),
        "y": (o["est_diameter_max_km"] * 1000).round(1),
        "h": o["is_hazardous"],
    })
    return {
        "units": {"x": "distancia mínima registrada (LD)", "y": "diámetro máximo estimado (m)"},
        "hazardous": points.loc[points["h"], ["x", "y"]].to_numpy().tolist(),
        "non_hazardous": points.loc[~points["h"], ["x", "y"]].to_numpy().tolist(),
    }


# --------------------------------------------------------------------------- analítica

ALL_ALTITUDE_EDGES = [0, 500, 1000, 2000, 5000, 10000, 20000, 30000, 35586, 35986, 40000, 100000]
STATUS_GROUPS = {
    "active": "Activo (+, P, B, S, X)",
    "inactive": "No operativo (-)",
    "unknown": "Sin dato / desconocido",
    "decayed": "Reingresado",
}


def _in_earth_orbit(s: pd.DataFrame, object_types: list[str] | None = None) -> pd.DataFrame:
    scope = s[~s["is_decayed"] & s["orbit_center"].eq("EA").fillna(False)]
    if object_types:
        scope = scope[scope["object_type"].isin([t.upper() for t in object_types])]
    return scope


def orbital_distribution(object_types: list[str] | None) -> dict:
    s = store.satcat_objects()
    scope = _in_earth_orbit(s, object_types)
    mean_alt = (scope["apogee_km"] + scope["perigee_km"]) / 2.0
    leo = scope["orbit_class"].eq("LEO")
    summaries = []
    for cls in ORBIT_CLASSES:
        g = scope[scope["orbit_class"].eq(cls)]
        if g.empty:
            continue
        q = lambda col, p: clean(g[col].quantile(p))  # noqa: E731
        summaries.append({
            "orbit_class": cls, "objects": int(len(g)),
            "apogee_p10_km": q("apogee_km", 0.1), "apogee_median_km": q("apogee_km", 0.5), "apogee_p90_km": q("apogee_km", 0.9),
            "perigee_p10_km": q("perigee_km", 0.1), "perigee_median_km": q("perigee_km", 0.5), "perigee_p90_km": q("perigee_km", 0.9),
        })
    by_class = scope["orbit_class"].value_counts()
    return {
        "scope": "Objetos centrados en la Tierra que siguen en órbita",
        "object_types": object_types,
        "objects_considered": int(len(scope)),
        "by_orbit_class": [{"key": c, "label": c, "count": int(by_class.get(c, 0))} for c in ORBIT_CLASSES],
        "inclination_deg": histogram(scope["inclination_deg"], linear_edges(0, 180, 5)),
        "mean_altitude_leo_km": histogram(mean_alt[leo], linear_edges(100, 2000, 50)),
        "mean_altitude_all_km": histogram(mean_alt, [float(e) for e in ALL_ALTITUDE_EDGES]),
        "period_min": histogram(scope["period_min"], linear_edges(85, 130, 2.5)),
        "apogee_perigee_by_class": summaries,
        "notes": [
            "Altitud media = (apogeo + perigeo) / 2, sobre el elipsoide WGS-84.",
            "Clases orbitales por umbrales convencionales (ver /visualization/capabilities).",
            "Distribuciones agregadas: no representan posiciones actuales de los objetos.",
        ],
    }


def _status_group(s: pd.DataFrame, with_decayed: bool = True) -> pd.Series:
    group = pd.Series("unknown", index=s.index)
    group[s["ops_status_code"].eq("-").fillna(False)] = "inactive"
    group[s["is_active"]] = "active"
    if with_decayed:
        group[s["is_decayed"]] = "decayed"
    return group


def _matrix(rows: pd.Series, columns: pd.Series) -> list[dict]:
    counts = pd.crosstab(rows, columns)
    return [{"row": r, "column": c, "count": int(counts.loc[r, c])} for r in counts.index for c in counts.columns]


def object_classification() -> dict:
    s = store.satcat_objects()
    alive = s[~s["is_decayed"]]
    payloads = alive[alive["object_type"].eq("PAY") & alive["orbit_class"].notna()]
    return {
        "type_by_status": _matrix(s["object_type"], _status_group(s)),
        "type_by_orbit_class": _matrix(alive["object_type"], alive["orbit_class"].fillna("N/D")),
        "payload_status_by_orbit_class": _matrix(payloads["orbit_class"], _status_group(payloads, with_decayed=False)),
        "status_groups": STATUS_GROUPS,
    }


def _prioritized_item(r: pd.Series) -> dict:
    return {
        "rank": int(r["rank"]), "neo_id": int(r["neo_id"]), "name": r["name"], "tier": r["tier"],
        "tier_label": TIER_LABELS[r["tier"]], "review_score": float(r["review_score"]),
        "is_hazardous": bool(r["is_hazardous"]),
        "est_diameter_max_km": clean(r["est_diameter_max_km"]),
        "min_miss_distance_km": float(r["min_miss_distance_km"]),
        "min_miss_distance_ld": float(r["min_miss_distance_km"]) / LUNAR_DISTANCE_KM,
        "max_relative_velocity_kms": float(r["max_relative_velocity_kmh"]) / 3600.0,
        "observation_count": int(r["observation_count"]),
        "proximity_component": round(float(r["proximity_component"]), 4),
        "size_component": round(float(r["size_component"]), 4),
        "speed_component": round(float(r["speed_component"]), 4),
        "reasons": list(r["reasons"]),
    }


def neo_prioritization(tier: str | None, hazardous: bool | None, page: int, page_size: int) -> dict:
    frame = store.prioritized_neo()
    tier_counts = {t: int((frame["tier"] == t).sum()) for t in TIER_LABELS}
    view = frame
    if tier:
        view = view[view["tier"] == tier]
    if hazardous is not None:
        view = view[view["is_hazardous"] == hazardous]
    chunk, meta = page_of(view, page, page_size)
    return {
        "methodology": Methodology().describe(), "tier_counts": tier_counts,
        "items": [_prioritized_item(r) for _, r in chunk.iterrows()], **meta,
    }


# --------------------------------------------------------------------------- visualización

SHELL_BANDS: list[tuple[str, str, float, float]] = [
    ("leo-1", "LEO < 400 km", 0, 400),
    ("leo-2", "LEO 400–600 km", 400, 600),
    ("leo-3", "LEO 600–800 km", 600, 800),
    ("leo-4", "LEO 800–1,000 km", 800, 1000),
    ("leo-5", "LEO 1,000–2,000 km", 1000, 2000),
    ("meo-1", "MEO 2,000–19,000 km", 2000, 19000),
    ("meo-2", "MEO 19,000–24,000 km (GNSS)", 19000, 24000),
    ("meo-3", "MEO 24,000–35,586 km", 24000, 35586),
    ("geo", "Banda GEO 35,586–35,986 km", 35586, 35986),
    ("high", "> 35,986 km", 35986, 500000),
]


def orbital_shells() -> dict:
    s = store.satcat_objects()
    scope = s[~s["is_decayed"] & s["orbit_center"].eq("EA").fillna(False)].dropna(subset=["apogee_km", "perigee_km"])
    alt = (scope["apogee_km"] + scope["perigee_km"]) / 2.0
    bands = []
    for band_id, band_label, low, high in SHELL_BANDS:
        in_band = scope[(alt >= low) & (alt < high)]
        by_type = {k: int(v) for k, v in in_band["object_type"].value_counts().items()}
        bands.append({"id": band_id, "label": band_label, "min_km": low, "max_km": high,
                      "count": int(len(in_band)), "by_type": by_type})
    return {
        "representation": "conceptual",
        "description": ("Cada capa agrupa objetos por altitud media (apogeo+perigeo)/2. "
                        "No muestra posiciones reales: SATCAT no incluye elementos orbitales completos."),
        "total_objects": int(len(scope)),
        "bands": bands,
    }


def capabilities() -> dict:
    return {
        "aggregated_shells": True,
        "real_time_positions": False,
        "trajectories": False,
        "reason": ("Los datasets actuales no contienen TLE/OMM ni época, RAAN o argumento del perigeo. "
                   "Las trayectorias se habilitarán al importar elementos orbitales (SGP4/Skyfield)."),
        "orbit_class_rules": ORBIT_CLASS_RULES,
    }


# --------------------------------------------------------------------------- dashboard y búsqueda


def datasets_status() -> list[dict]:
    out = []
    for code, info in store.status().items():
        loaded = info["source"]
        meta = {k: v for k, v in SOURCES[code].items() if k != "default_file"}
        entry = {**meta, "file_name": info["file_name"], "file_exists": info["exists"], "error": info["error"]}
        if loaded is not None:
            result = loaded.result
            entry["latest_import"] = {
                "status": "completed",
                "file_name": loaded.path.name,
                "file_sha256": loaded.sha256,
                "finished_at": loaded.loaded_at.isoformat(),
                "seconds": round(loaded.seconds, 2),
                "rows_read": result.report["rows_read"],
                "rows_inserted": result.report["rows_valid"],
                "rows_rejected": result.report["rows_rejected"],
                "rows_flagged": result.report["rows_flagged"],
                "quality_report": result.report,
                "issues": result.issues.summary(),
                "issue_samples": result.issues.sample_dicts(),
            }
        else:
            entry["latest_import"] = {"status": "failed", "error_message": info["error"]} if info["error"] else None
        out.append(entry)
    return out


def dashboard_summary() -> dict:
    satcat = neo = None
    highlighted: list[dict] = []
    recent: list[dict] = []
    errors: dict[str, str] = {}
    try:
        stats = satcat_statistics()
        s = store.satcat_objects()
        alive = s[~s["is_decayed"]]
        by_type = alive["object_type"].value_counts()
        by_class = alive["orbit_class"].dropna().value_counts()
        t = stats["totals"]
        satcat = {
            "total": t["total"], "in_orbit": t["in_orbit"], "active_payloads": t["active_payloads"],
            "debris_in_orbit": t["debris_in_orbit"], "rocket_bodies_in_orbit": int(by_type.get("R/B", 0)),
            "in_orbit_by_type": [{"key": k, "label": label(OBJECT_TYPE_LABELS, k), "count": int(v)} for k, v in by_type.items()],
            "in_orbit_by_class": [{"key": k, "label": k, "count": int(v)} for k, v in by_class.items()],
        }
        launches = s[s["object_type"].eq("PAY") & s["launch_date"].notna()] \
            .sort_values(["launch_date", "norad_cat_id"], ascending=[False, False]).head(5)
        recent = [{"norad_cat_id": int(r["norad_cat_id"]), "object_name": clean(r["object_name"]),
                   "owner_code": clean(r["owner_code"]), "launch_date": clean(r["launch_date"]),
                   "orbit_class": clean(r["orbit_class"])} for _, r in launches.iterrows()]
    except store.DataUnavailableError as error:
        errors["satcat"] = str(error)
    try:
        ranking = neo_prioritization(None, None, 1, 5)
        o = store.neo_objects()
        neo = {"objects": int(len(o)), "observations": int(len(store.neo_observations())),
               "hazardous_objects": int(o["is_hazardous"].sum()), "priority_tier_a": ranking["tier_counts"]["A"],
               "tier_counts": ranking["tier_counts"]}
        highlighted = ranking["items"]
    except store.DataUnavailableError as error:
        errors["neo"] = str(error)
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "satcat": satcat, "neo": neo, "highlighted_neo": highlighted, "recent_launches": recent,
        "errors": errors, "disclaimer": DISCLAIMER,
    }


def global_search(q: str, limit: int) -> list[dict]:
    hits: list[dict] = []
    try:
        s = store.satcat_objects()
        sats = s[satcat_text_mask(s, q)].sort_values(["is_decayed", "norad_cat_id"]).head(limit)
        hits += [{
            "kind": "satcat", "id": int(r["norad_cat_id"]),
            "name": clean(r["object_name"]) or clean(r["object_id"]) or str(r["norad_cat_id"]),
            "subtitle": f"NORAD {int(r['norad_cat_id'])} · {r['object_type']} · {clean(r['owner_code']) or 'N/D'}"
                        f"{' · reingresado' if r['is_decayed'] else ''}",
        } for _, r in sats.iterrows()]
    except store.DataUnavailableError:
        pass
    try:
        o = store.neo_objects()
        neos = o[neo_text_mask(o, q)].sort_values("name").head(limit)
        hits += [{
            "kind": "neo", "id": int(r["neo_id"]), "name": r["name"],
            "subtitle": f"NEO {int(r['neo_id'])}{' · potencialmente peligroso' if r['is_hazardous'] else ''}",
        } for _, r in neos.iterrows()]
    except store.DataUnavailableError:
        pass
    return hits

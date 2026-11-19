"""Pruebas unitarias del núcleo portado de Astroshield AI (limpieza, clasificación orbital, priorización)."""
import numpy as np
import pandas as pd
import pytest

from backend.app.astro.neo_cleaner import NEO_COLUMNS, clean_neo, estimated_diameter_km
from backend.app.astro.orbital import classify_orbit, eccentricity, kepler_period_minutes
from backend.app.astro.prioritization import Methodology, Weights, prioritize
from backend.app.astro.quality import SchemaError
from backend.app.astro.satcat_cleaner import SATCAT_COLUMNS, clean_satcat, quality_flags

AU_KM = 149_597_870.7
CLOSE = 0.05 * AU_KM

SAT = {
    "OBJECT_NAME": "TEST SAT", "OBJECT_ID": "2020-001A", "NORAD_CAT_ID": "100", "OBJECT_TYPE": "PAY",
    "OPS_STATUS_CODE": "+", "OWNER": "US", "LAUNCH_DATE": "2020-01-01", "LAUNCH_SITE": "AFETR",
    "DECAY_DATE": "", "PERIOD": "95.0", "INCLINATION": "53.0", "APOGEE": "550", "PERIGEE": "540",
    "RCS": "", "DATA_STATUS_CODE": "", "ORBIT_CENTER": "EA", "ORBIT_TYPE": "ORB",
}
NEO = {
    "id": "2000433", "name": "433 Eros (A898 PA)", "est_diameter_min": "", "est_diameter_max": "",
    "relative_velocity": "20000.0", "miss_distance": "30000000.0", "orbiting_body": "Earth",
    "sentry_object": "False", "absolute_magnitude": "10.4", "hazardous": "False",
}


def satcat(*overrides):
    return pd.DataFrame([{**SAT, **o} for o in overrides], columns=SATCAT_COLUMNS)


def neo(*overrides):
    rows = []
    for o in overrides:
        row = {**NEO, **o}
        h = float(row["absolute_magnitude"])
        row["est_diameter_min"] = row["est_diameter_min"] or str(estimated_diameter_km([h], 0.25)[0])
        row["est_diameter_max"] = row["est_diameter_max"] or str(estimated_diameter_km([h], 0.05)[0])
        rows.append(row)
    return pd.DataFrame(rows, columns=NEO_COLUMNS)


# --------------------------------------------------------------- clasificación orbital
def test_iss_like_orbit_period_is_about_93_minutes():
    assert kepler_period_minutes(np.array([423.0]), np.array([416.0]))[0] == pytest.approx(92.9, abs=0.2)


def test_geostationary_period_is_one_sidereal_day():
    assert kepler_period_minutes(np.array([35786.0]), np.array([35786.0]))[0] == pytest.approx(1436.1, abs=0.2)


def test_classification_rules():
    apogee = np.array([550, 2000, 20200, 35790, 39000, 35800, np.nan])
    perigee = np.array([540, 1900, 20180, 35780, 500, 250, 400])
    assert list(classify_orbit(apogee, perigee)) == ["LEO", "LEO", "MEO", "GEO", "HEO", "HEO", None]


def test_circular_orbit_has_zero_eccentricity():
    assert eccentricity(np.array([700.0]), np.array([700.0]))[0] == 0.0


# --------------------------------------------------------------- SATCAT
def test_valid_satcat_record_is_normalized():
    result = clean_satcat(satcat({}))
    row = result.objects.iloc[0]
    assert row["norad_cat_id"] == 100
    assert row["orbit_class"] == "LEO"
    assert row["is_active"] and not row["is_decayed"]
    assert quality_flags(row) == ["missing_rcs"]
    assert result.raw.loc[100, "RCS"] == ""  # el original se conserva tal cual
    assert result.report["rows_rejected"] == 0


def test_invalid_key_is_rejected_and_logged():
    result = clean_satcat(satcat({}, {"NORAD_CAT_ID": "abc"}))
    assert len(result.objects) == 1
    assert result.issues.counts_by_code() == {"invalid_key": 1}


def test_identical_rows_vs_conflicting_keys_are_distinguished():
    codes = clean_satcat(satcat({}, {}, {"OBJECT_NAME": "OTRO"})).issues.counts_by_code()
    assert codes["duplicate_identical"] == 1
    assert codes["duplicate_key_conflict"] == 1


def test_non_numeric_and_out_of_range_become_null():
    result = clean_satcat(satcat({"PERIOD": "n/a", "INCLINATION": "190"}))
    row = result.objects.iloc[0]
    assert np.isnan(row["period_min"]) and np.isnan(row["inclination_deg"])
    assert {"invalid_number", "out_of_range"} <= set(result.issues.counts_by_code())


def test_docked_and_decayed_objects_have_no_orbit_class():
    docked = clean_satcat(satcat({"ORBIT_CENTER": "25544", "ORBIT_TYPE": "DOC"})).objects.iloc[0]
    assert docked["docked_to_norad_id"] == 25544 and pd.isna(docked["orbit_class"])
    decayed = clean_satcat(satcat({"DECAY_DATE": "2021-05-01", "OPS_STATUS_CODE": "D"})).objects.iloc[0]
    assert decayed["is_decayed"] and pd.isna(decayed["orbit_class"])


def test_swapped_apogee_perigee_is_flagged():
    row = clean_satcat(satcat({"APOGEE": "381", "PERIGEE": "36028", "PERIOD": "1502"})).objects.iloc[0]
    assert "apogee_below_perigee" in quality_flags(row)


def test_missing_columns_raise_schema_error():
    with pytest.raises(SchemaError):
        clean_satcat(satcat({}).drop(columns=["RCS"]))


# --------------------------------------------------------------- NEO
def test_repeated_id_means_multiple_approaches_of_one_object():
    result = clean_neo(neo({}, {"relative_velocity": "30000", "miss_distance": "1000000"}))
    assert len(result.objects) == 1 and len(result.observations) == 2
    obj = result.objects.iloc[0]
    assert obj["observation_count"] == 2
    assert obj["min_miss_distance_km"] == 1_000_000
    assert obj["max_relative_velocity_kmh"] == 30_000


def test_aggregates_align_with_object_ids_when_file_is_unsorted():
    result = clean_neo(neo({"id": "9"}, {"id": "1", "name": "B"}, {"id": "9"}))
    assert dict(zip(result.objects["neo_id"], result.objects["observation_count"])) == {1: 1, 9: 2}


def test_invalid_boolean_rejects_row():
    result = clean_neo(neo({}, {"hazardous": "maybe"}))
    assert result.report["rows_rejected"] == 1
    assert "invalid_boolean" in result.issues.counts_by_code()


def test_identical_rows_are_kept_and_flagged():
    result = clean_neo(neo({}, {}))
    assert len(result.observations) == 2
    assert result.observations["flag_identical_record"].all()


# --------------------------------------------------------------- priorización
def _prio_sample():
    return pd.DataFrame({
        "neo_id": [1, 2, 3, 4],
        "name": ["haz-near", "haz-far", "big-near", "small-far"],
        "is_hazardous": [True, True, False, False],
        "est_diameter_max_km": [0.5, 0.5, 0.3, 0.01],
        "min_miss_distance_km": [CLOSE / 2, CLOSE * 5, CLOSE / 2, CLOSE * 5],
        "max_relative_velocity_kmh": [50000.0, 40000.0, 30000.0, 20000.0],
    })


def test_tiers_follow_documented_rules():
    result = prioritize(_prio_sample()).set_index("name")
    assert result.loc["haz-near", "tier"] == "A"
    assert result.loc["haz-far", "tier"] == "B"
    assert result.loc["big-near", "tier"] == "B"
    assert result.loc["small-far", "tier"] == "C"


def test_output_is_sorted_and_explained():
    result = prioritize(_prio_sample())
    assert list(result["tier"]) == ["A", "B", "B", "C"]
    assert result["review_score"].between(0, 100).all()
    assert len(result.iloc[0]["reasons"]) == 3


def test_weights_must_sum_to_one():
    with pytest.raises(ValueError):
        Weights(proximity=0.5, size=0.5, speed=0.5)


def test_methodology_documents_limitations():
    described = Methodology().describe()
    assert "probabilidad" in str(described["summary"])
    assert len(described["limitations"]) >= 3


# --------------------------------------------------------------- datos reales
def test_real_satcat_units_match_kepler(raw_satcat):
    objects = clean_satcat(raw_satcat).objects
    earth = objects[(objects["orbit_center"] == "EA") & objects["has_complete_orbit"]]
    ratio = earth["period_min"] / kepler_period_minutes(earth["apogee_km"], earth["perigee_km"])
    assert ratio.median() == pytest.approx(1.0, abs=0.002)
    assert (ratio.sub(1).abs() < 0.05).mean() > 0.999


def test_real_satcat_report(raw_satcat):
    result = clean_satcat(raw_satcat)
    assert result.report["rows_read"] == len(raw_satcat) == 70587
    assert result.report["rows_rejected"] == 0
    assert result.objects["norad_cat_id"].is_unique


def test_real_neo_id_identifies_objects(raw_neo):
    result = clean_neo(raw_neo)
    assert result.report["rows_rejected"] == 0
    assert len(result.observations) == len(raw_neo) == 90836
    assert len(result.objects) == raw_neo["id"].nunique() == 27423
    assert result.objects["observation_count"].sum() == len(raw_neo)


def test_real_dataset_tiers(raw_neo):
    objects = clean_neo(raw_neo).objects.reset_index(drop=True)
    counts = prioritize(objects)["tier"].value_counts().to_dict()
    hazardous = int(objects["is_hazardous"].sum())
    assert counts["A"] + counts["B"] >= hazardous
    assert counts["A"] < hazardous

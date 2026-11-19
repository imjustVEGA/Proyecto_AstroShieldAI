"""Pruebas de las respuestas de la API (capa de servicio) con los datasets reales.

Equivalen a los chequeos del smoke test de Astroshield AI: totales, filtros, fichas,
histogramas, priorización y capas orbitales.
"""
import pytest

from backend.app.astro import service, store


@pytest.fixture(scope="module", autouse=True)
def datasets(raw_satcat, raw_neo):  # noqa: ARG001 - omite el módulo si faltan los CSV
    store.satcat()
    store.neo()


def test_dashboard_summary():
    body = service.dashboard_summary()
    assert body["satcat"]["total"] == 70587
    assert body["neo"]["objects"] == 27423
    assert len(body["highlighted_neo"]) == 5
    assert body["errors"] == {}


def test_search_finds_iss():
    assert any(h["kind"] == "satcat" and h["id"] == 25544 for h in service.global_search("ISS", 8))


def test_satcat_filters_and_detail():
    stats = service.satcat_statistics()
    debris = service.satcat_list(object_type=["DEB"], state="in_orbit", page_size=10)
    assert debris["total"] == stats["totals"]["debris_in_orbit"]
    assert all(i["object_type"] == "DEB" and not i["is_decayed"] for i in debris["items"])
    starlink = service.satcat_list(q="starlink", page_size=25)
    assert starlink["total"] > 0 and all("STARLINK" in i["object_name"].upper() for i in starlink["items"])
    page2 = service.satcat_list(page=2, page_size=25)
    assert page2["page"] == 2 and len(page2["items"]) == 25
    iss = service.satcat_detail(25544)
    assert iss["object_name"] == "ISS (ZARYA)" and iss["orbit_class"] == "LEO"
    assert service.satcat_detail(999999999) is None


def test_satcat_sorting_puts_nulls_last():
    items = service.satcat_list(sort="launch_date", order="desc", page_size=5)["items"]
    dates = [i["launch_date"] for i in items]
    assert dates == sorted(dates, reverse=True) and None not in dates


def test_neo_statistics_and_filters():
    stats = service.neo_statistics()
    assert sum(b["count"] for b in stats["velocity_kms"]) == stats["totals"]["observations"]
    assert service.neo_list(hazardous=True)["total"] == stats["totals"]["hazardous_objects"] == 2173
    assert len(service.neo_list(page_size=20)["items"]) == 20
    detail = service.neo_detail(2469219)
    assert detail["observation_count"] == 43 and len(detail["observations"]) == 43
    assert service.neo_detail(999999999) is None


def test_distance_diameter_has_all_objects():
    body = service.neo_distance_diameter()
    assert len(body["hazardous"]) + len(body["non_hazardous"]) == 27423


def test_orbital_distribution_and_classification():
    dist = service.orbital_distribution(None)
    assert sum(c["count"] for c in dist["by_orbit_class"]) <= dist["objects_considered"]
    assert 0 < sum(b["count"] for b in dist["inclination_deg"]) <= dist["objects_considered"]  # sin contar inclinaciones nulas
    cls = service.object_classification()
    assert sum(c["count"] for c in cls["type_by_status"]) == 70587


def test_prioritization_tiers():
    body = service.neo_prioritization("A", None, 1, 25)
    assert sum(body["tier_counts"].values()) == 27423
    assert all(i["tier"] == "A" for i in body["items"])
    assert body["total"] == body["tier_counts"]["A"]


def test_orbital_shells_and_capabilities():
    shells = service.orbital_shells()
    assert shells["representation"] == "conceptual"
    assert sum(b["count"] for b in shells["bands"]) == shells["total_objects"]
    assert service.capabilities()["real_time_positions"] is False


def test_datasets_report():
    sources = service.datasets_status()
    assert {s["code"] for s in sources} == {"satcat", "neo"}
    assert all(s["latest_import"]["status"] == "completed" for s in sources)


def test_missing_csv_is_reported_not_crashing(monkeypatch, tmp_path):
    monkeypatch.setattr(store, "NEO_RAW_PATH", tmp_path / "no_existe.csv")
    with pytest.raises(store.DataUnavailableError):
        service.neo_list()
    summary = service.dashboard_summary()  # el dashboard sigue respondiendo con SATCAT
    assert summary["neo"] is None and "neo" in summary["errors"]
    assert summary["satcat"]["total"] == 70587

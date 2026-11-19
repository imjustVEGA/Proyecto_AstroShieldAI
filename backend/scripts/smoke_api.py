"""Prueba de humo de la API en ejecución (solo biblioteca estándar).

Uso (con el backend encendido):
    python backend/scripts/smoke_api.py                     # http://127.0.0.1:8000, admin/admin123
    python backend/scripts/smoke_api.py http://127.0.0.1:8030
"""

import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000"
USER, PASSWORD = "admin", "admin123"
results: list[tuple[str, bool, str]] = []


def call(path, *, token=None, data=None, json_body=None):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if json_body is not None:
        data = json.dumps(json_body).encode()
        headers["Content-Type"] = "application/json"
    elif data is not None:
        headers["Content-Type"] = "application/x-www-form-urlencoded"
    request = urllib.request.Request(BASE + path, data=data, headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=300) as response:
            return response.status, json.loads(response.read() or b"null")
    except urllib.error.HTTPError as error:
        body = error.read()
        try:
            return error.code, json.loads(body or b"null")
        except ValueError:
            return error.code, body.decode(errors="replace")


def check(name, path, verify=None, *, status=200, token=None, **kwargs):
    started = time.time()
    try:
        code, body = call(path, token=token, **kwargs)
        ok = code == status and (verify is None or verify(body))
        detail = f"HTTP {code}" + ("" if ok else f" · {str(body)[:160]}")
    except Exception as error:  # noqa: BLE001
        ok, body, detail = False, None, f"{type(error).__name__}: {error}"
    results.append((name, ok, f"{detail} · {time.time() - started:.2f}s"))
    return body if ok else None


check("health", "/health", lambda b: b["status"] == "ok")
login = check("login admin", "/token", lambda b: "access_token" in b,
              data=urllib.parse.urlencode({"username": USER, "password": PASSWORD}).encode())
T = (login or {}).get("access_token")

check("sin token → 401", "/satcat", status=401)
check("dashboard/summary", "/dashboard/summary",
      lambda b: b["satcat"]["total"] == 70587 and b["neo"]["objects"] == 27423 and len(b["highlighted_neo"]) == 5, token=T)
check("search ?q=ISS", "/search?q=ISS", lambda b: any(h["kind"] == "satcat" and h["id"] == 25544 for h in b), token=T)
sat_stats = check("satcat/statistics", "/satcat/statistics", lambda b: b["totals"]["total"] == 70587, token=T)
check("satcat DEB en órbita", "/satcat?object_type=DEB&state=in_orbit&page_size=10",
      lambda b: len(b["items"]) == 10 and (sat_stats is None or b["total"] == sat_stats["totals"]["debris_in_orbit"]), token=T)
check("satcat ?q=starlink", "/satcat?q=starlink", lambda b: b["total"] > 0, token=T)
check("satcat/25544", "/satcat/25544", lambda b: b["object_name"] == "ISS (ZARYA)", token=T)
check("satcat/999999999 → 404", "/satcat/999999999", status=404, token=T)
check("satcat/0 → 422", "/satcat/0", status=422, token=T)
neo_stats = check("neo/statistics", "/neo/statistics",
                  lambda b: sum(x["count"] for x in b["velocity_kms"]) == b["totals"]["observations"], token=T)
check("neo ?hazardous=true", "/neo?hazardous=true",
      lambda b: neo_stats is None or b["total"] == neo_stats["totals"]["hazardous_objects"], token=T)
check("neo/2469219 (43 aproximaciones)", "/neo/2469219", lambda b: len(b["observations"]) == 43, token=T)
check("neo/distance-diameter", "/neo/distance-diameter",
      lambda b: len(b["hazardous"]) + len(b["non_hazardous"]) == 27423, token=T)
check("analytics/orbital-distribution", "/analytics/orbital-distribution?object_type=PAY",
      lambda b: b["object_types"] == ["PAY"], token=T)
check("analytics/object-classification", "/analytics/object-classification", lambda b: len(b["type_by_status"]) > 0, token=T)
check("analytics/neo-prioritization ?tier=A", "/analytics/neo-prioritization?tier=A",
      lambda b: sum(b["tier_counts"].values()) == 27423 and all(i["tier"] == "A" for i in b["items"]), token=T)
check("visualization/orbital-shells", "/visualization/orbital-shells", lambda b: b["representation"] == "conceptual", token=T)
check("visualization/capabilities", "/visualization/capabilities", lambda b: b["real_time_positions"] is False, token=T)
check("datasets", "/datasets", lambda b: all(s["latest_import"]["status"] == "completed" for s in b), token=T)
check("stats (compatibilidad)", "/stats", lambda b: b["total_objects"] == 70587, token=T)
check("users (admin)", "/users/", lambda b: any(u["username"] == USER for u in b), token=T)

code, body = call("/predict", json_body={"est_diameter_min": 0.42, "est_diameter_max": 0.94, "relative_velocity": 75227,
                                         "miss_distance": 526974, "absolute_magnitude": 19.0})
if code == 503:
    results.append(("predict (IA)", True, "HTTP 503 · modelos sin entrenar: ejecuta python -m backend.train"))
else:
    results.append(("predict (IA)", code == 200 and "probability" in body, f"HTTP {code} · {body}"))

width = max(len(n) for n, _, _ in results)
for name, ok, detail in results:
    print(f"{'OK   ' if ok else 'FALLA'}  {name:<{width}}  {detail}")
passed = sum(ok for _, ok, _ in results)
print(f"\n{passed}/{len(results)} comprobaciones correctas")
sys.exit(0 if passed == len(results) else 1)

/**
 * Simulación orbital (laboratorio):
 * 1) Órbita kepleriana: con apogeo, perigeo e inclinación se dibuja la órbita en el globo 3D
 *    y se calculan periodo, excentricidad y velocidades (vis-viva). La capa de altitud se
 *    compara con los objetos reales de SATCAT.
 * 2) Clasificador de IA (Random Forest + Isolation Forest) de la versión FER, entrenado con el
 *    dataset NEO real.
 */
import { Activity, BrainCircuit, Gauge, Loader2, Orbit, Ruler, Satellite, Timer } from "lucide-react";
import { lazy, Suspense, useMemo, useState } from "react";
import { toast } from "sonner";

import { ErrorState, FieldGrid, Notice, PageFooter, PageHeader, Panel, StatCard } from "@/components/common";
import { HazardBadge } from "@/components/labels";
import { Badge, Button, Card, Input, Label, NativeSelect, Skeleton } from "@/components/ui/primitives";
import { useShells } from "@/hooks/queries";
import { getNeoDetail, getSatcatDetail, predictNeo } from "@/services/astroService";
import { formatInt, formatNumber, formatPercent } from "@/utils/format";
import { orbitClass, orbitDynamics } from "@/utils/orbit";

const GlobeView = lazy(() => import("@/components/globe/GlobeView"));

const PRESETS = [
  { id: "iss", label: "ISS (LEO, 51,6°)", apogee: 423, perigee: 416, inclination: 51.6 },
  { id: "sso", label: "Heliosíncrona (LEO, 98°)", apogee: 705, perigee: 700, inclination: 98.2 },
  { id: "gps", label: "GPS (MEO, 55°)", apogee: 20_200, perigee: 20_160, inclination: 55 },
  { id: "geo", label: "Geoestacionaria (GEO, 0°)", apogee: 35_800, perigee: 35_772, inclination: 0.05 },
  { id: "molniya", label: "Molniya (HEO, 63,4°)", apogee: 39_700, perigee: 600, inclination: 63.4 },
];

const NEO_FIELDS = [
  ["est_diameter_min", "Diámetro mín. estimado (km)"],
  ["est_diameter_max", "Diámetro máx. estimado (km)"],
  ["relative_velocity", "Velocidad relativa (km/h)"],
  ["miss_distance", "Distancia de paso (km)"],
  ["absolute_magnitude", "Magnitud absoluta (H)"],
];

function NumberField({ label, value, onChange, min, max, step = 1, unit }) {
  return (
    <Label>
      <span className="flex justify-between"><span>{label}</span><span className="tabular text-foreground">{formatNumber(value, step < 1 ? 2 : 0)} {unit}</span></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blue-500" aria-label={`${label} (deslizador)`} />
      <Input type="number" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-label={label} />
    </Label>
  );
}

function OrbitLab() {
  const shells = useShells();
  const [params, setParams] = useState({ apogee: 423, perigee: 416, inclination: 51.6, label: "Órbita simulada" });
  const [norad, setNorad] = useState("");
  const [loading, setLoading] = useState(false);

  const valid = params.apogee >= 100 && params.perigee >= 100 && params.inclination >= 0 && params.inclination <= 180;
  const spec = { apogeeKm: Math.max(params.apogee, params.perigee), perigeeKm: Math.min(params.apogee, params.perigee), inclinationDeg: params.inclination };
  const dyn = valid ? orbitDynamics(spec) : null;
  const cls = valid ? orbitClass(spec.apogeeKm, spec.perigeeKm) : "—";
  const meanAlt = (spec.apogeeKm + spec.perigeeKm) / 2;
  const band = shells.data?.bands.find((b) => meanAlt >= b.min_km && meanAlt < b.max_km);
  const orbit = useMemo(() => (valid ? { ...spec, label: params.label, sublabel: `${cls} · ${formatNumber(spec.inclinationDeg, 1)}°` } : null),
    [valid, spec.apogeeKm, spec.perigeeKm, spec.inclinationDeg, params.label, cls]);

  // Al mover un parámetro a mano, la órbita deja de ser la de un objeto concreto.
  const update = (field) => (value) => setParams((p) => ({ ...p, [field]: value, label: "Órbita simulada" }));
  const applyPreset = (id) => {
    const preset = PRESETS.find((p) => p.id === id);
    if (preset) setParams({ apogee: preset.apogee, perigee: preset.perigee, inclination: preset.inclination, label: preset.label.split(" (")[0] });
  };
  const loadFromCatalog = async (event) => {
    event.preventDefault();
    if (!norad) return;
    setLoading(true);
    try {
      const o = await getSatcatDetail(Number(norad));
      if (o.apogee_km == null || o.perigee_km == null || o.inclination_deg == null || o.orbit_center !== "EA") {
        toast.error("Ese objeto no tiene parámetros orbitales terrestres completos.");
      } else {
        setParams({ apogee: o.apogee_km, perigee: o.perigee_km, inclination: o.inclination_deg, label: o.object_name ?? `NORAD ${o.norad_cat_id}` });
        toast.success(`Órbita de ${o.object_name ?? norad} cargada`);
      }
    } catch (error) {
      toast.error(error.userMessage ?? "No se encontró el objeto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="flex flex-col gap-4 p-5">
          <div>
            <h3 className="flex items-center gap-2 text-[14px] font-semibold"><Activity className="size-4 text-blue-300" /> Parámetros de la órbita</h3>
            <p className="text-[10.5px] text-muted-foreground">Altitudes sobre el elipsoide WGS-84</p>
          </div>
          <Label>
            Ejemplo
            <NativeSelect defaultValue="" onChange={(e) => applyPreset(e.target.value)}>
              <option value="" disabled>Elegir una órbita típica…</option>
              {PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </NativeSelect>
          </Label>
          <form onSubmit={loadFromCatalog} className="flex items-end gap-2">
            <Label className="flex-1">
              Cargar del catálogo (NORAD)
              <Input inputMode="numeric" placeholder="25544" value={norad} onChange={(e) => setNorad(e.target.value.replace(/\D/g, ""))} />
            </Label>
            <Button type="submit" variant="outline" disabled={loading || !norad} aria-label="Cargar órbita del catálogo">
              {loading ? <Loader2 className="animate-spin" /> : <Satellite />}
            </Button>
          </form>
          <NumberField label="Apogeo" unit="km" value={params.apogee} min={150} max={60000} onChange={update("apogee")} />
          <NumberField label="Perigeo" unit="km" value={params.perigee} min={150} max={60000} onChange={update("perigee")} />
          <NumberField label="Inclinación" unit="°" value={params.inclination} min={0} max={180} step={0.1} onChange={update("inclination")} />
          {!valid && <p className="text-[11px] text-red-300">Usa altitudes ≥ 100 km y una inclinación entre 0° y 180°.</p>}
        </Card>

        <Card className="relative h-[520px] overflow-hidden lg:h-[600px]">
          <Suspense fallback={<Skeleton className="h-full w-full rounded-none" />}>
            <GlobeView bands={shells.data?.bands ?? []} orbit={orbit} cameraAltitudeKm={Math.max(30_000, Math.ceil((spec.apogeeKm * 2.6) / 20_000) * 20_000)}
              title={orbit?.label ?? "Simulación"}
              footer={
                <div className="flex items-center gap-4 text-secondary-foreground">
                  <span className="flex items-center gap-1.5"><span className="h-px w-3 bg-sky-300" /> Órbita kepleriana (RAAN = ω = 0)</span>
                  <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-white" /> Perigeo</span>
                </div>
              } />
          </Suspense>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Régimen orbital" value={cls} icon={Orbit} caption={`Altitud media ${formatInt(meanAlt)} km`}
          help="Mismos umbrales que el backend: LEO apogeo ≤ 2.000 km; GEO 35.786 ± 200 km; MEO intermedio; HEO el resto." />
        <StatCard label="Periodo orbital" value={dyn ? `${formatNumber(dyn.periodMin, 1)} min` : "—"} icon={Timer} tone="teal"
          caption={dyn ? `${formatNumber(dyn.revsPerDay, 2)} vueltas por día` : ""} help="3.ª ley de Kepler con μ = 398.600,4418 km³/s²." />
        <StatCard label="Velocidad en perigeo / apogeo" value={dyn ? `${formatNumber(dyn.vPerigee, 2)} / ${formatNumber(dyn.vApogee, 2)}` : "—"}
          icon={Gauge} tone="violet" caption="km/s · ecuación vis-viva" />
        <StatCard label="Objetos reales en su capa" value={band ? band.count : "—"} icon={Ruler} tone="amber"
          caption={band ? `${band.label} · datos SATCAT` : "Fuera de las capas registradas"}
          help="Cuenta los objetos en órbita cuya altitud media cae en la misma banda que esta órbita." />
      </div>
      <p className="mt-2 text-[10.5px] text-muted-foreground">
        Excentricidad {dyn ? formatNumber(dyn.e, 4) : "—"} · semieje mayor {dyn ? formatInt(dyn.a) : "—"} km. Modelo de dos cuerpos sin perturbaciones
        (J2, arrastre atmosférico): sirve para comparar órbitas, no para predecir posiciones ni colisiones.
      </p>
    </>
  );
}

const EMPTY_NEO = { est_diameter_min: 0.12, est_diameter_max: 0.27, relative_velocity: 54000, miss_distance: 7_500_000, absolute_magnitude: 22.1 };

function AiClassifier() {
  const [features, setFeatures] = useState(EMPTY_NEO);
  const [source, setSource] = useState(null);
  const [neoId, setNeoId] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [running, setRunning] = useState(false);

  const loadNeo = async (event) => {
    event.preventDefault();
    if (!neoId) return;
    try {
      const n = await getNeoDetail(Number(neoId));
      const closest = n.observations[0];
      setFeatures({
        est_diameter_min: n.est_diameter_min_km, est_diameter_max: n.est_diameter_max_km,
        relative_velocity: Math.round(closest.relative_velocity_kmh), miss_distance: Math.round(closest.miss_distance_km),
        absolute_magnitude: n.absolute_magnitude_h,
      });
      setSource({ name: n.name, hazardous: n.is_hazardous });
      setResult(null);
      toast.success(`${n.name}: aproximación más cercana cargada`);
    } catch (err) {
      toast.error(err.userMessage ?? "No se encontró el NEO");
    }
  };

  const run = async () => {
    setRunning(true);
    setError(null);
    try {
      setResult(await predictNeo(features));
    } catch (err) {
      setError(err);
      setResult(null);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Panel title="Características del objeto" description="Las mismas 5 variables con las que se entrenó el modelo (unidades del CSV de NASA)."
        actions={<Badge variant="violet">Random Forest</Badge>}>
        <form onSubmit={loadNeo} className="mb-4 flex items-end gap-2">
          <Label className="flex-1">
            Cargar un NEO real (id de la fuente)
            <Input inputMode="numeric" placeholder="3131063" value={neoId} onChange={(e) => setNeoId(e.target.value.replace(/\D/g, ""))} />
          </Label>
          <Button type="submit" variant="outline" disabled={!neoId}>Cargar</Button>
        </form>
        <div className="grid gap-3 sm:grid-cols-2">
          {NEO_FIELDS.map(([key, label]) => (
            <Label key={key}>
              {label}
              <Input type="number" step="any" min={key === "absolute_magnitude" ? undefined : 0} value={features[key]}
                onChange={(e) => { setFeatures((f) => ({ ...f, [key]: e.target.value === "" ? "" : Number(e.target.value) })); setSource(null); }} />
            </Label>
          ))}
        </div>
        <Button className="mt-4 w-full" onClick={run} disabled={running || NEO_FIELDS.some(([k]) => features[k] === "")}>
          {running ? <Loader2 className="animate-spin" /> : <BrainCircuit />} {running ? "Evaluando…" : "Evaluar con el modelo"}
        </Button>
      </Panel>

      <Panel title="Resultado del modelo" description="Apoyo experimental: no sustituye la clasificación oficial de la fuente.">
        {error ? (
          <div className="flex flex-col gap-3">
            <ErrorState error={error} onRetry={run} />
            {error.response?.status === 503 && (
              <p className="text-[11.5px] text-muted-foreground">
                Entrena los modelos una vez con <code className="rounded bg-muted px-1.5 py-0.5">python -m backend.train</code> (desde la carpeta del proyecto) y vuelve a intentarlo.
              </p>
            )}
          </div>
        ) : !result ? (
          <p className="text-[12px] text-muted-foreground">Ajusta las variables o carga un NEO real y pulsa “Evaluar con el modelo”.</p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[13px]">Predicción:</span>
              <HazardBadge hazardous={result.hazardous} />
              {source && (
                <span className="text-[11px] text-muted-foreground">
                  Clasificación de NASA para {source.name}: {source.hazardous ? "potencialmente peligroso" : "no peligroso"}
                  {source.hazardous === result.hazardous ? " · coincide" : " · no coincide"}
                </span>
              )}
            </div>
            <div>
              <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
                <span>Probabilidad de clase PHA</span><span className="tabular text-foreground">{formatPercent(result.probability)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full" style={{ width: `${result.probability * 100}%`, background: result.hazardous ? "#c98500" : "#3987e5" }} />
              </div>
            </div>
            <FieldGrid items={[
              ["Puntuación de anomalía (Isolation Forest)", formatNumber(result.anomaly_score, 3)],
              ["Interpretación", result.anomaly_score < 0 ? "Atípico respecto al dataset" : "Dentro de lo habitual"],
              ["Versión del modelo", result.model_version],
            ]} />
            <p className="text-[10.5px] text-muted-foreground">
              El modelo estima si el objeto se parece a los clasificados como PHA por NASA. No calcula órbitas, MOID ni probabilidad de impacto.
            </p>
          </div>
        )}
      </Panel>
    </div>
  );
}

export default function Simulacion() {
  return (
    <>
      <PageHeader eyebrow="Laboratorio orbital" title="Simulación orbital"
        description="Dibuja una órbita kepleriana en el globo, compárala con la ocupación real de cada capa y prueba el clasificador de IA." />
      <Notice label="Modelo físico simplificado" tag="Dos cuerpos">
        La órbita respeta tamaño, forma e inclinación; la orientación se fija en RAAN = ω = 0 porque los datos no incluyen TLE/OMM.
      </Notice>
      <OrbitLab />
      <p className="eyebrow mb-3 mt-8">Clasificador de IA · objetos cercanos a la Tierra</p>
      <AiClassifier />
      <PageFooter note="Simulación educativa · no predice trayectorias reales, colisiones ni impactos." />
    </>
  );
}

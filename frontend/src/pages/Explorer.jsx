/** Explorador espacial: globo con capas por altitud y la órbita esquemática del objeto elegido. */
import { ArrowUpRight, CheckCircle2, Rocket, Satellite, ShieldCheck, XCircle } from "lucide-react";
import { lazy, Suspense, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { ErrorState, FieldGrid, IconTile, LoadingBlock, Notice, PageFooter, PageHeader, Panel } from "@/components/common";
import { FEATURED_OBJECTS, OBJECT_TYPE_COLOR, OBJECT_TYPE_LABEL, OPS_STATUS_LABEL } from "@/components/labels";
import { Badge, Card, NativeSelect, Skeleton } from "@/components/ui/primitives";
import { useCapabilities, useSatcatDetail, useShells } from "@/hooks/queries";
import useUrlParams from "@/hooks/useUrlParams";
import { cn } from "@/utils/cn";
import { formatDate, formatInt, formatNumber } from "@/utils/format";

const GlobeView = lazy(() => import("@/components/globe/GlobeView"));
const TYPES = ["PAY", "R/B", "DEB", "UNK"];

/** Solo se dibuja la órbita si hay datos suficientes y el objeto orbita la Tierra. */
export function orbitFor(o) {
  if (!o || o.orbit_center !== "EA" || o.apogee_km == null || o.perigee_km == null || o.inclination_deg == null) return null;
  return {
    apogeeKm: o.apogee_km, perigeeKm: o.perigee_km, inclinationDeg: o.inclination_deg,
    label: o.object_name ?? `NORAD ${o.norad_cat_id}`, sublabel: `NORAD ${o.norad_cat_id} · ${o.orbit_class ?? "órbita"}`,
  };
}

function SelectedObjectPanel({ id, onSelect }) {
  const { data, error, isPending } = useSatcatDetail(id);
  const inList = FEATURED_OBJECTS.some((f) => f.id === id);

  return (
    <Card className="flex flex-col p-5">
      <h3 className="text-[14px] font-semibold">Objeto seleccionado</h3>
      <p className="text-[10.5px] text-muted-foreground">Parámetros reales del catálogo SATCAT</p>
      <label className="eyebrow mb-2 mt-5 block" htmlFor="explorer-object">Objeto del catálogo</label>
      <NativeSelect id="explorer-object" value={id} onChange={(e) => onSelect(Number(e.target.value))}>
        {!inList && <option value={id}>NORAD {id}{data?.object_name ? ` · ${data.object_name}` : ""}</option>}
        {FEATURED_OBJECTS.map((f) => <option key={f.id} value={f.id}>{f.name} — {f.note}</option>)}
      </NativeSelect>
      <p className="mt-1.5 text-[10px] text-muted-foreground">Para otro objeto, búscalo con Ctrl K y, en su ficha, elige “Ver órbita esquemática en el explorador”.</p>

      {isPending && <LoadingBlock className="mt-6 h-64" />}
      {error && <div className="mt-6"><ErrorState error={error} /></div>}
      {data && (
        <>
          <div className="mt-6 flex flex-col items-center text-center">
            <IconTile icon={Satellite} className="size-10" />
            <p className="mt-3 text-lg font-medium">{data.object_name ?? "Sin nombre"}</p>
            <p className="eyebrow mt-1">NORAD {data.norad_cat_id}</p>
            <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
              <Badge variant="accent">{data.orbit_class ?? "Sin clase"} · {data.labels.orbit_center}</Badge>
              <Badge variant="muted" dot><span className="sr-only">Tipo:</span>{OBJECT_TYPE_LABEL[data.object_type]}</Badge>
            </div>
          </div>
          <div className="mt-4">
            <FieldGrid items={[
              ["Periodo orbital", data.period_min != null ? `${formatNumber(data.period_min, 1)} min` : "—"],
              ["Inclinación", data.inclination_deg != null ? `${formatNumber(data.inclination_deg, 2)}°` : "—"],
              ["Apogeo", data.apogee_km != null ? `${formatInt(data.apogee_km)} km` : "—"],
              ["Perigeo", data.perigee_km != null ? `${formatInt(data.perigee_km)} km` : "—"],
              ["Excentricidad", data.eccentricity != null ? formatNumber(data.eccentricity, 4) : "—"],
              ["Estado operativo", data.ops_status_code ? (OPS_STATUS_LABEL[data.ops_status_code] ?? data.ops_status_code) : "Sin dato"],
              ["Propietario", data.owner_code ?? "—"],
              ["Lanzamiento", formatDate(data.launch_date)],
            ]} />
          </div>
          {data.is_decayed && <p className="mt-3 text-[11px] text-amber-200">Reingresó el {formatDate(data.decay_date)}: la órbita mostrada es la última registrada.</p>}
          {!orbitFor(data) && <p className="mt-3 text-[11px] text-muted-foreground">Este objeto no tiene datos suficientes (o no orbita la Tierra) para dibujar su órbita.</p>}
          <Link to={`/satcat?id=${data.norad_cat_id}`}
            className="mt-5 flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-[12px] hover:bg-secondary">
            Ver ficha completa <ArrowUpRight className="size-3.5" />
          </Link>
          <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
            El marcador señala el perigeo en una orientación arbitraria (sin RAAN ni argumento del perigeo): no representa la posición real.
          </p>
        </>
      )}
    </Card>
  );
}

const EXPLORE_CARDS = [
  { to: "/estadisticas", icon: Rocket, title: "Planificación de lanzamientos",
    text: "Distribución real de inclinaciones, altitudes y periodos para identificar regímenes congestionados." },
  { to: "/estadisticas", icon: Satellite, title: "Operaciones satelitales",
    text: "Cargas útiles activas e inactivas por régimen orbital, útil para planificar constelaciones." },
  { to: "/risks", icon: ShieldCheck, title: "Seguridad del entorno orbital",
    text: "Priorización transparente de objetos cercanos a la Tierra para su revisión posterior." },
];

export default function Explorer() {
  const { get, set } = useUrlParams();
  const id = Number(get("id")) || FEATURED_OBJECTS[0].id;
  const shells = useShells();
  const caps = useCapabilities();
  const detail = useSatcatDetail(id);
  const orbit = useMemo(() => orbitFor(detail.data), [detail.data]);
  const [selectedBand, setSelectedBand] = useState(null);
  const [hidden, setHidden] = useState(() => new Set());
  const bands = useMemo(() => shells.data?.bands ?? [], [shells.data]);
  const visible = useMemo(() => new Set(bands.filter((b) => !hidden.has(b.id)).map((b) => b.id)), [bands, hidden]);

  const toggle = (bandId) => setHidden((prev) => {
    const next = new Set(prev);
    if (next.has(bandId)) next.delete(bandId);
    else next.add(bandId);
    return next;
  });

  return (
    <>
      <PageHeader title="Explorador espacial" description="Una vista de los objetos que rodean nuestro planeta, construida con los parámetros reales del catálogo." />
      <Notice label="Visualización conceptual" tag="Sin TLE / OMM">
        Las capas agrupan objetos reales por altitud. La órbita del objeto respeta su tamaño, forma e inclinación; su orientación y posición no están en los datos.
      </Notice>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="relative h-[520px] overflow-hidden lg:h-[600px]">
          {shells.error ? <div className="p-6"><ErrorState error={shells.error} onRetry={() => shells.refetch()} /></div> : (
            <Suspense fallback={<Skeleton className="h-full w-full rounded-none" />}>
              <GlobeView bands={bands} visibleIds={visible} selectedBandId={selectedBand} orbit={orbit} cameraAltitudeKm={110_000}
                title={orbit?.label ?? "Entorno espacial"}
                footer={
                  <div className="flex items-center gap-4 text-secondary-foreground">
                    <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-primary" /> Capas por altitud</span>
                    <span className="flex items-center gap-1.5"><span className="h-px w-3 bg-sky-300" /> Órbita esquemática</span>
                    <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-white" /> Perigeo</span>
                  </div>
                } />
            </Suspense>
          )}
        </Card>
        <SelectedObjectPanel id={id} onSelect={(next) => set({ id: next })} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel title="Capas orbitales" description="Objetos en órbita terrestre por altitud media. Activa, oculta o resalta cada banda.">
          {shells.isPending ? <LoadingBlock className="h-40" /> : (
            <ul className="grid gap-1 sm:grid-cols-2">
              {bands.map((b) => (
                <li key={b.id} className={cn("rounded-md border px-2.5 py-2", selectedBand === b.id ? "border-primary/50 bg-primary/5" : "border-transparent")}>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="accent-blue-500" checked={!hidden.has(b.id)} onChange={() => toggle(b.id)} aria-label={`Mostrar ${b.label}`} />
                    <button type="button" className="flex flex-1 items-center justify-between gap-2 text-left text-[12px]"
                      onClick={() => setSelectedBand(selectedBand === b.id ? null : b.id)}>
                      <span>{b.label}</span>
                      <span className="tabular text-[11px] text-muted-foreground">{formatInt(b.count)}</span>
                    </button>
                  </div>
                  {selectedBand === b.id && (
                    <dl className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-0.5 pl-5 text-[10.5px]">
                      {TYPES.map((t) => (
                        <div key={t} className="flex justify-between gap-2">
                          <dt className="flex items-center gap-1 text-muted-foreground">
                            <span className="size-1.5 rounded-full" style={{ background: OBJECT_TYPE_COLOR[t] }} />{OBJECT_TYPE_LABEL[t]}
                          </dt>
                          <dd className="tabular">{formatInt(b.by_type[t] ?? 0)}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="¿Qué se puede visualizar hoy?">
          {caps.data ? (
            <>
              <ul className="flex flex-col gap-2 text-[12.5px]">
                {[
                  [caps.data.aggregated_shells, "Distribución agregada por altitud"],
                  [true, "Órbita esquemática (tamaño, forma, inclinación)"],
                  [caps.data.real_time_positions, "Posiciones en tiempo real"],
                  [caps.data.trajectories, "Trayectorias y trazas terrestres"],
                ].map(([ok, label]) => (
                  <li key={label} className="flex items-center gap-2">
                    {ok ? <CheckCircle2 className="size-4 text-status-good" /> : <XCircle className="size-4 text-muted-foreground" />}
                    {label}<span className="sr-only">{ok ? "disponible" : "no disponible"}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] text-muted-foreground">{caps.data.reason}</p>
            </>
          ) : caps.error ? <ErrorState error={caps.error} /> : <LoadingBlock className="h-32" />}
        </Panel>
      </div>

      <p className="eyebrow mb-3 mt-8">Explora el entorno espacial</p>
      <div className="grid gap-4 md:grid-cols-3">
        {EXPLORE_CARDS.map(({ to, icon, title, text }) => (
          <Link key={title} to={to} className="group rounded-lg border bg-card p-5 hover:border-primary/40">
            <div className="flex items-start justify-between">
              <IconTile icon={icon} />
              <Badge variant="outline">Análisis descriptivo</Badge>
            </div>
            <p className="mt-4 text-[13.5px] font-semibold">{title}</p>
            <p className="mt-1 text-[11.5px] text-muted-foreground">{text}</p>
          </Link>
        ))}
      </div>

      <PageFooter note="La vista no calcula trayectorias, ventanas de lanzamiento ni predicciones de colisión." />
    </>
  );
}

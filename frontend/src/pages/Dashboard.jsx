/**
 * Dashboard (vista general). Responde, en este orden:
 *   1. ¿Qué se monitorea?  2. ¿Qué requiere atención?  3. ¿Qué tan cerca pasan?  4. ¿Dónde están?
 * Todo con datos reales de SATCAT y NEO. Las gráficas quedan en una sección de análisis aparte.
 */
import { ArrowRight, ArrowUpRight, ChevronRight, Globe2, Orbit, Radar, Satellite, ShieldAlert } from "lucide-react";
import { Telescope } from "@/components/icons";
import { lazy, Suspense, useMemo } from "react";
import { Link } from "react-router-dom";

import { BarChartCard } from "@/components/charts/BarChartCard";
import { CHART } from "@/components/charts/theme";
import { ErrorState, IconTile, LoadingBlock, PageFooter, PageHeader } from "@/components/common";
import { GLOSSARY, OBJECT_TYPE_COLOR } from "@/components/labels";
import { Badge, Card, InfoTip, Skeleton } from "@/components/ui/primitives";
import { globeObjectFor } from "@/features/map/mapModel";
import { useMapObjects } from "@/features/map/useMapSelection";
import { useDashboard, useNeoList, useSatcatDetail } from "@/hooks/queries";
import { formatDate, formatDiameter, formatInt, formatNumber, LUNAR_DISTANCE_KM } from "@/utils/format";

const GlobeView = lazy(() => import("@/components/globe/GlobeView"));
const ISS_NORAD = 25544;
const PREVIEW = [{ kind: "satcat", id: ISS_NORAD, key: `s${ISS_NORAD}` }];
const CLOSEST_PARAMS = { sort: "min_miss_distance_km", order: "asc", page: 1, page_size: 1 };
const INSIDE_MOON_PARAMS = { max_distance_km: LUNAR_DISTANCE_KM, page: 1, page_size: 1 };

function Kpi({ question, label, value, caption, icon: Icon, help, to, tone = "text-foreground" }) {
  const body = (
    <>
      <p className="eyebrow">{question}</p>
      <div className="mt-2 flex items-center justify-between gap-2 text-[0.8125rem] text-secondary-foreground">
        <span className="flex items-center gap-1.5">{label}{help && <InfoTip>{help}</InfoTip>}</span>
        <Icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.6} aria-hidden />
      </div>
      <span className={`tabular mt-2 block text-[2rem] font-light leading-none tracking-tight ${tone}`}>{value ?? "—"}</span>
      <span className="mt-2 block text-[0.75rem] text-muted-foreground">{caption}</span>
    </>
  );
  return to ? (
    <Link to={to} className="block rounded-lg border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-secondary/30">{body}</Link>
  ) : (
    <div className="rounded-lg border bg-card p-4">{body}</div>
  );
}

function KpiStrip({ data }) {
  const s = data.satcat;
  const n = data.neo;
  const closest = useNeoList(CLOSEST_PARAMS);
  const insideMoon = useNeoList(INSIDE_MOON_PARAMS);
  const near = closest.data?.items?.[0];
  return (
    <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Kpi question="¿Qué se monitorea?" label="Objetos en los catálogos" icon={Globe2}
        value={s && n ? formatInt(s.total + n.objects) : undefined}
        caption={s && n ? `${formatInt(s.total)} artificiales · ${formatInt(n.objects)} asteroides cercanos` : "Catálogos sin cargar"}
        help="Objetos artificiales de SATCAT (incluidos los que ya reingresaron) más asteroides cercanos (NEO) únicos." />
      <Kpi question="¿Qué requiere atención?" label="NEO de atención alta" icon={ShieldAlert} to="/risks" tone="text-red-200"
        value={n ? formatInt(n.priority_tier_a) : undefined}
        caption={n ? `${formatInt(n.hazardous_objects)} clasificados como PHA por NASA` : "NEO sin cargar"}
        help={`Nivel A del índice de revisión: ${GLOSSARY.PHA.split(":")[0]} con alguna aproximación registrada ≤ 0,05 UA. Es una prioridad de revisión, no una probabilidad de impacto.`} />
      <Kpi question="¿Qué tan cerca pasan?" label="Pasaron más cerca que la Luna" icon={Radar} to="/neos?ldmax=1"
        value={insideMoon.data ? formatInt(insideMoon.data.total) : undefined}
        caption={near ? `El más cercano: ${near.name} a ${formatNumber(near.min_miss_distance_ld, 2)} LD` : "Calculando…"}
        help={`${GLOSSARY.LD} Cuenta los asteroides con alguna aproximación registrada a menos de 1 LD.`} />
      <Kpi question="¿Qué hay en órbita?" label="Objetos artificiales en órbita" icon={Satellite} to="/satcat?state=in_orbit"
        value={s ? formatInt(s.in_orbit) : undefined}
        caption={s ? `${formatInt(s.active_payloads)} satélites activos · ${formatInt(s.debris_in_orbit)} fragmentos` : "SATCAT sin cargar"}
        help="Objetos de SATCAT sin fecha de reingreso." />
    </div>
  );
}

function RadarItem({ to, icon, color, name, sub, tag, tagVariant = "muted" }) {
  return (
    <li>
      <Link to={to} className="flex items-center gap-3 rounded-md border-b border-border/70 px-1 py-3 hover:bg-secondary/30">
        <IconTile icon={icon} tone={tagVariant === "critical" ? "red" : "blue"} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.875rem] font-medium">
            {color && <span className="mr-1.5 inline-block size-2 rounded-full align-middle" style={{ background: color }} aria-hidden />}
            {name}
          </span>
          <span className="block truncate text-[0.75rem] text-muted-foreground">{sub}</span>
        </span>
        {tag && <Badge variant={tagVariant}>{tag}</Badge>}
        <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
      </Link>
    </li>
  );
}

function RadarPanel({ data }) {
  const iss = useSatcatDetail(ISS_NORAD);
  const launch = data?.recent_launches?.[0];
  const neo = data?.highlighted_neo?.[0];
  return (
    <div className="flex h-full flex-col border-t p-5 lg:border-l lg:border-t-0">
      <h2 className="text-[0.9375rem] font-semibold">En el radar</h2>
      <p className="text-[0.75rem] text-muted-foreground">Abre cualquiera en el mapa 3D</p>
      <ul className="mt-2">
        {neo && (
          <RadarItem to={`/explorer?sel=n${neo.neo_id}`} icon={Telescope} name={neo.name} tagVariant="critical" tag="Atención alta"
            sub={`Primer puesto del ranking · ${formatNumber(neo.min_miss_distance_ld, 2)} LD · Ø máx. ${formatDiameter(neo.est_diameter_max_km)}`} />
        )}
        {iss.data && (
          <RadarItem to={`/explorer?sel=s${ISS_NORAD}`} icon={Satellite} color={OBJECT_TYPE_COLOR.PAY} name={iss.data.object_name ?? "ISS"}
            sub={`Estación espacial · NORAD ${ISS_NORAD}`} tag={iss.data.orbit_class} />
        )}
        {launch && (
          <RadarItem to={`/explorer?sel=s${launch.norad_cat_id}`} icon={Satellite} color={OBJECT_TYPE_COLOR.PAY} name={launch.object_name ?? `NORAD ${launch.norad_cat_id}`}
            sub={`Lanzamiento más reciente · ${formatDate(launch.launch_date)}`} tag={launch.orbit_class} />
        )}
        {!data && <Skeleton className="mt-3 h-40 w-full" />}
      </ul>
      <div className="mt-auto pt-6">
        <Link to="/explorer" className="flex items-center justify-between rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-[0.875rem] font-medium text-blue-100 hover:bg-primary/20">
          Abrir el mapa 3D <ArrowRight className="size-4" aria-hidden />
        </Link>
        <p className="mt-2 text-[0.75rem] text-muted-foreground">Busca cualquier objeto, compáralos y consulta su órbita o su distancia.</p>
      </div>
    </div>
  );
}

function MapPreview() {
  const items = useMapObjects(PREVIEW);
  const objects = useMemo(() => items.map((i) => globeObjectFor(i, null)).filter(Boolean), [items]);
  return (
    <GlobeView objects={objects} autoRotate title="Ejemplo: órbita de la ISS"
      footer={
        <span className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border bg-card/85 px-3 py-1.5 text-secondary-foreground backdrop-blur">
          <span className="flex items-center gap-1.5"><span className="h-0.5 w-4" style={{ background: OBJECT_TYPE_COLOR.PAY }} aria-hidden /> Órbita esquemática de un satélite real</span>
          <Link to={`/explorer?sel=s${ISS_NORAD}`} className="flex items-center gap-1 text-blue-300 hover:text-blue-200">Explorar en el mapa 3D <ArrowUpRight className="size-3" /></Link>
        </span>
      } />
  );
}

const QUICK_LINKS = [
  { to: "/satcat", icon: Satellite, title: "Catálogo SATCAT", text: "Satélites, cohetes y basura espacial" },
  { to: "/neos", icon: Telescope, title: "Objetos NEO", text: "Asteroides que se acercan a la Tierra" },
  { to: "/risks", icon: ShieldAlert, title: "Análisis de riesgos", text: "Niveles de atención y metodología" },
  { to: "/simulacion", icon: Orbit, title: "Simulación orbital", text: "Dibuja una órbita y prueba el modelo de IA" },
];

export default function Dashboard() {
  const query = useDashboard();
  const data = query.data;

  return (
    <>
      <PageHeader eyebrow="Observatorio espacial" title="El espacio, en perspectiva"
        description="Qué objetos rodean la Tierra, cuáles requieren atención y qué tan cerca pasan. Datos reales de SATCAT y NASA." />
      {query.error && <div className="mb-5"><ErrorState error={query.error} onRetry={() => query.refetch()} /></div>}
      {data ? <KpiStrip data={data} /> : !query.error && <LoadingBlock className="mb-6 h-28" />}

      <Card className="grid grid-cols-[minmax(0,1fr)] overflow-hidden lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="relative h-[26rem] lg:h-[30rem]">
          <Suspense fallback={<Skeleton className="h-full w-full rounded-none" />}>
            <MapPreview />
          </Suspense>
        </div>
        <RadarPanel data={data} />
      </Card>

      <nav aria-label="Accesos rápidos" className="mt-4 grid divide-y rounded-lg border bg-card md:grid-cols-2 md:divide-y-0 xl:grid-cols-4 xl:divide-x">
        {QUICK_LINKS.map(({ to, icon: Icon, title, text }) => (
          <Link key={to} to={to} className="flex items-center gap-3 px-5 py-4 hover:bg-secondary/40">
            <Icon className="size-4 text-muted-foreground" strokeWidth={1.6} aria-hidden />
            <span className="flex-1">
              <span className="block text-[0.875rem] font-medium">{title}</span>
              <span className="block text-[0.75rem] text-muted-foreground">{text}</span>
            </span>
            <ArrowUpRight className="size-4 text-muted-foreground" aria-hidden />
          </Link>
        ))}
      </nav>

      {data?.satcat && (
        <section aria-labelledby="dashboard-analysis" className="mt-8">
          <h2 id="dashboard-analysis" className="eyebrow mb-1">Análisis</h2>
          <p className="mb-3 text-[0.8125rem] text-muted-foreground">Cómo se reparten los objetos artificiales que siguen en órbita.</p>
          <div className="grid gap-4 lg:grid-cols-2">
            <BarChartCard title="Objetos en órbita por tipo" description="Objetos sin fecha de reingreso" horizontal height={150}
              data={data.satcat.in_orbit_by_type.map((t) => ({ label: t.label.split(" (")[0], value: t.count, color: OBJECT_TYPE_COLOR[t.key] }))} />
            <BarChartCard title="Régimen orbital" description="Objetos en órbita terrestre por clase" height={150} color={CHART.series1}
              data={["LEO", "MEO", "GEO", "HEO"].map((k) => ({ label: k, value: data.satcat.in_orbit_by_class.find((c) => c.key === k)?.count ?? 0 }))}
              help={`${GLOSSARY.LEO} ${GLOSSARY.MEO} ${GLOSSARY.GEO} ${GLOSSARY.HEO}`} />
          </div>
        </section>
      )}

      <PageFooter />
    </>
  );
}

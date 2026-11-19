/** Dashboard: indicadores reales, globo con capas por altitud, "En el radar" y gráficas resumidas. */
import { ArrowRight, ArrowUpRight, ChevronRight, Globe2, Orbit, Satellite, ShieldAlert } from "lucide-react";
import { Telescope } from "@/components/icons";
import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";

import { BarChartCard } from "@/components/charts/BarChartCard";
import { CHART } from "@/components/charts/theme";
import { ErrorState, IconTile, LoadingBlock, PageFooter, PageHeader } from "@/components/common";
import { OBJECT_TYPE_COLOR } from "@/components/labels";
import { Badge, Card, InfoTip, Skeleton } from "@/components/ui/primitives";
import { useDashboard, useSatcatDetail, useShells } from "@/hooks/queries";
import { formatDate, formatDiameter, formatInt, formatNumber } from "@/utils/format";

const GlobeView = lazy(() => import("@/components/globe/GlobeView"));
const ISS_NORAD = 25544;

function Kpi({ label, value, caption, icon: Icon, help }) {
  return (
    <div className="flex flex-col gap-2 py-1 lg:px-6 lg:first:pl-0">
      <div className="flex items-center justify-between gap-2 text-[12px] text-secondary-foreground">
        <span className="flex items-center gap-1.5">{label}<InfoTip>{help}</InfoTip></span>
        <Icon className="size-4 text-muted-foreground" strokeWidth={1.6} />
      </div>
      <span className="tabular text-[34px] font-light leading-none tracking-tight">{value == null ? "—" : formatInt(value)}</span>
      <span className="text-[10px] text-muted-foreground">{caption}</span>
    </div>
  );
}

function KpiStrip({ data }) {
  const s = data.satcat;
  const n = data.neo;
  return (
    <div className="mb-6 grid grid-cols-2 gap-y-5 border-b pb-6 lg:grid-cols-4 lg:divide-x lg:divide-border">
      <Kpi label="Objetos monitoreados" icon={Globe2} value={s && n ? s.total + n.objects : undefined} caption="NEO + SATCAT"
        help="Objetos artificiales catalogados (incluidos los reingresados) más asteroides cercanos únicos." />
      <Kpi label="NEO potencialmente peligrosos" icon={Telescope} value={n?.hazardous_objects} caption="Clasificación PHA de la fuente"
        help="Criterio de NASA: MOID ≤ 0,05 UA y H ≤ 22. No significa riesgo de impacto." />
      <Kpi label="Objetos SATCAT en órbita" icon={Satellite} value={s?.in_orbit} caption={s ? `de ${formatInt(s.total)} catalogados` : "SATCAT sin cargar"}
        help="Objetos sin fecha de reingreso en SATCAT." />
      <Kpi label="Objetos para revisión" icon={ShieldAlert} value={n?.priority_tier_a} caption="Nivel A · índice transparente"
        help="NEO peligrosos según la fuente con alguna aproximación registrada ≤ 0,05 UA." />
    </div>
  );
}

function RadarItem({ to, icon, name, sub, tag, tagVariant = "muted" }) {
  return (
    <li>
      <Link to={to} className="flex items-center gap-3 border-b border-border/70 py-3.5 hover:bg-secondary/30">
        <IconTile icon={icon} tone={tagVariant === "warning" ? "amber" : "blue"} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium">{name}</span>
          <span className="block truncate text-[10.5px] text-muted-foreground">{sub}</span>
        </span>
        {tag && <Badge variant={tagVariant}>{tag}</Badge>}
        <ChevronRight className="size-3.5 text-muted-foreground" />
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
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-[14px] font-semibold">En el radar</h3>
          <p className="text-[10.5px] text-muted-foreground">Una selección real del catálogo</p>
        </div>
        <span className="tabular text-[10px] text-muted-foreground">03</span>
      </div>
      <ul className="mt-2">
        {iss.data && (
          <RadarItem to={`/explorer?id=${ISS_NORAD}`} icon={Satellite} name={iss.data.object_name ?? "ISS"}
            sub={`Estación espacial · NORAD ${ISS_NORAD}`} tag={iss.data.orbit_class} />
        )}
        {launch && (
          <RadarItem to={`/explorer?id=${launch.norad_cat_id}`} icon={Satellite} name={launch.object_name ?? `NORAD ${launch.norad_cat_id}`}
            sub={`Lanzamiento más reciente · ${formatDate(launch.launch_date)}`} tag={launch.orbit_class} />
        )}
        {neo && (
          <RadarItem to={`/neos?id=${neo.neo_id}`} icon={Telescope} name={neo.name} tagVariant="warning"
            sub={`NEO · Ø máx. ${formatDiameter(neo.est_diameter_max_km)} · ${formatNumber(neo.min_miss_distance_ld)} LD`}
            tag={neo.is_hazardous ? "PHA" : null} />
        )}
        {!data && <Skeleton className="mt-3 h-40 w-full" />}
      </ul>
      {data?.neo && (
        <Link to="/risks" className="mt-5 flex items-center justify-between rounded-lg border bg-secondary/40 px-3.5 py-3 hover:bg-secondary">
          <span>
            <span className="flex items-center gap-1.5 text-[12px] font-medium">
              <span className="size-1.5 rounded-full bg-status-critical" /> {formatInt(data.neo.priority_tier_a)} objetos para revisión
            </span>
            <span className="block pl-3 text-[10px] text-muted-foreground">Nivel A del índice de priorización</span>
          </span>
          <ArrowUpRight className="size-3.5 text-muted-foreground" />
        </Link>
      )}
      <div className="mt-auto pt-6">
        <p className="text-[13px] font-medium">Amplía la perspectiva.</p>
        <p className="mt-1 text-[11px] text-muted-foreground">Explora la órbita esquemática y los parámetros de cada objeto del catálogo.</p>
        <Link to="/explorer" className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-blue-300 hover:text-blue-200">
          Abrir explorador <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}

function GlobeLegend() {
  return (
    <>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-4 text-secondary-foreground">
          <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-primary" /> Capas por altitud</span>
          <span className="flex items-center gap-1.5"><span className="h-px w-3 bg-accent" /> Referencia GEO</span>
        </div>
        <span className="text-muted-foreground/80">Representación conceptual: agregados reales de SATCAT, sin posiciones reales.</span>
      </div>
      <Link to="/explorer" className="flex items-center gap-1 text-blue-300 hover:text-blue-200">Explorador espacial <ArrowUpRight className="size-3" /></Link>
    </>
  );
}

const QUICK_LINKS = [
  { to: "/satcat", icon: Satellite, title: "Catálogo SATCAT", text: "Explora los objetos artificiales" },
  { to: "/neos", icon: Telescope, title: "Explorar NEO", text: "Conoce los objetos cercanos" },
  { to: "/risks", icon: ShieldAlert, title: "Análisis de riesgos", text: "Consulta las prioridades de revisión" },
  { to: "/simulacion", icon: Orbit, title: "Simulación orbital", text: "Dibuja una órbita y prueba el modelo de IA" },
];

export default function Dashboard() {
  const query = useDashboard();
  const shells = useShells();
  const data = query.data;

  return (
    <>
      <PageHeader eyebrow="Observatorio espacial" title="El espacio, en perspectiva"
        description="Una visión clara de nuestro entorno orbital, construida con los datos reales de SATCAT y NEO." />
      {query.error && <div className="mb-5"><ErrorState error={query.error} onRetry={() => query.refetch()} /></div>}
      {data ? <KpiStrip data={data} /> : !query.error && <LoadingBlock className="mb-6 h-24" />}

      <Card className="grid overflow-hidden lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="relative h-[440px] lg:h-[500px]">
          {shells.error ? (
            <div className="p-6"><ErrorState error={shells.error} onRetry={() => shells.refetch()} /></div>
          ) : (
            <Suspense fallback={<Skeleton className="h-full w-full rounded-none" />}>
              <GlobeView bands={shells.data?.bands ?? []} footer={<GlobeLegend />} autoRotate />
            </Suspense>
          )}
        </div>
        <RadarPanel data={data} />
      </Card>

      {data?.satcat && (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <BarChartCard title="Objetos en órbita por tipo" description="Objetos sin fecha de reingreso" horizontal height={150}
            data={data.satcat.in_orbit_by_type.map((t) => ({ label: t.label.split(" (")[0], value: t.count, color: OBJECT_TYPE_COLOR[t.key] }))} />
          <BarChartCard title="Régimen orbital" description="Objetos en órbita terrestre por clase" height={150} color={CHART.series1}
            data={["LEO", "MEO", "GEO", "HEO"].map((k) => ({ label: k, value: data.satcat.in_orbit_by_class.find((c) => c.key === k)?.count ?? 0 }))}
            help="Umbrales convencionales: LEO apogeo ≤ 2.000 km; GEO 35.786 ± 200 km; MEO intermedio; HEO el resto." />
        </div>
      )}

      <div className="mt-4 grid divide-y rounded-lg border bg-card md:grid-cols-4 md:divide-x md:divide-y-0">
        {QUICK_LINKS.map(({ to, icon: Icon, title, text }) => (
          <Link key={to} to={to} className="flex items-center gap-3 px-5 py-4 hover:bg-secondary/40">
            <Icon className="size-4 text-muted-foreground" strokeWidth={1.6} />
            <span className="flex-1">
              <span className="block text-[13px] font-medium">{title}</span>
              <span className="block text-[11px] text-muted-foreground">{text}</span>
            </span>
            <ArrowUpRight className="size-3.5 text-muted-foreground" />
          </Link>
        ))}
      </div>

      <PageFooter />
    </>
  );
}

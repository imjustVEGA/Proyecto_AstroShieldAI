/** Objetos NEO: indicadores, 4 gráficas y catálogo con filtros y ficha (datos reales de NASA NeoWs). */
import { Activity, AlertTriangle, ChevronRight, Ruler } from "lucide-react";
import { Telescope } from "@/components/icons";
import { useEffect, useMemo, useRef, useState } from "react";

import { BarChartCard } from "@/components/charts/BarChartCard";
import { DonutCard } from "@/components/charts/DonutCard";
import { ScatterCard } from "@/components/charts/ScatterCard";
import { CHART } from "@/components/charts/theme";
import { ErrorState, IconTile, LoadingBlock, Notice, PageFooter, PageHeader, Pagination, StatCard } from "@/components/common";
import { HazardBadge, TierBadge } from "@/components/labels";
import SortableHead from "@/components/SortableHead";
import TableToolbar from "@/components/TableToolbar";
import {
  Card, Input, Label, NativeSelect, Skeleton, Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/primitives";
import NeoDetailPanel from "@/features/NeoDetailPanel";
import { useNeoDistanceDiameter, useNeoList, useNeoStats } from "@/hooks/queries";
import useDebounce from "@/hooks/useDebounce";
import useUrlParams from "@/hooks/useUrlParams";
import { formatBin, formatDiameterRange, formatInt, formatNumber, formatPercent, LUNAR_DISTANCE_KM } from "@/utils/format";

const num = (v) => (v === "" ? undefined : Number(v));
const ADVANCED = ["dmin", "dmax", "vmin", "ldmax"];

/** Campo numérico que confirma el valor al salir o con Enter (evita una consulta por tecla). */
function NumberFilter({ label, value, onCommit, placeholder }) {
  return (
    <Label>
      {label}
      <Input type="number" min={0} step="any" defaultValue={value} placeholder={placeholder}
        onBlur={(e) => onCommit(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onCommit(e.currentTarget.value)} />
    </Label>
  );
}

function Overview() {
  const stats = useNeoStats();
  const scatter = useNeoDistanceDiameter();
  const view = useMemo(() => stats.data && {
    diameter: stats.data.diameter_max_km.map((b) => ({
      label: formatBin(b.start != null ? b.start * 1000 : null, b.end != null ? b.end * 1000 : null), value: b.count,
    })),
    velocity: stats.data.velocity_kms.map((b) => ({ label: formatBin(b.start, b.end), value: b.count })),
    slices: [
      { label: "Potencialmente peligrosos", value: stats.data.totals.hazardous_objects, color: CHART.hazardous },
      { label: "No peligrosos", value: stats.data.totals.objects - stats.data.totals.hazardous_objects, color: CHART.series1 },
    ],
  }, [stats.data]);
  const scatterSeries = useMemo(() => scatter.data && [
    { name: "No peligrosos", color: CHART.series1, points: scatter.data.non_hazardous },
    { name: "Potencialmente peligrosos", color: CHART.hazardous, points: scatter.data.hazardous },
  ], [scatter.data]);

  if (stats.error) return <ErrorState error={stats.error} onRetry={() => stats.refetch()} />;
  if (!stats.data || !view) return <LoadingBlock className="h-72" />;
  const t = stats.data.totals;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="NEO registrados" value={t.objects} icon={Telescope} caption={`${formatInt(t.observations)} aproximaciones en el dataset`} />
        <StatCard label="Clasificados como PHA" value={t.hazardous_objects} icon={AlertTriangle} tone="amber"
          caption={`${formatPercent(t.hazardous_object_share)} de los objetos · criterio de la fuente`} />
        <StatCard label="Velocidad relativa mediana" value={`${formatNumber(t.median_velocity_kms, 1)} km/s`} icon={Activity} tone="teal"
          spark={stats.data.velocity_kms.map((b) => b.count)} sparkColor={CHART.series2}
          caption="Por aproximación · unidad de origen inferida (km/h)" />
        <StatCard label="Diámetro máx. mediano" value={t.median_diameter_max_km != null ? `${formatInt(t.median_diameter_max_km * 1000)} m` : "—"}
          icon={Ruler} tone="violet" spark={stats.data.diameter_max_km.map((b) => b.count)} sparkColor={CHART.series3}
          caption="Estimado a partir de la magnitud H (albedo 0,05)" />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DonutCard title="Clasificación NEO" description="Objetos únicos por clasificación" slices={view.slices} centerLabel="PHA"
          help="La clasificación depende de la órbita (MOID ≤ 0,05 UA) y del brillo (H ≤ 22), no de cada aproximación." />
        <BarChartCard title="Diámetros estimados" description="Objetos por diámetro máx. (m)" data={view.diameter} color={CHART.series1} />
        <BarChartCard title="Velocidades relativas" description="Aproximaciones por velocidad (km/s)" data={view.velocity}
          color={CHART.series2} valueLabel="Aproximaciones" />
        {scatterSeries ? (
          <ScatterCard title="Distancia y diámetro" description="Distancia mín. (LD) vs. diámetro máx. (m) · escala log"
            series={scatterSeries} xName="LD" yName="m" />
        ) : <Card className="p-4"><Skeleton className="h-full min-h-48 w-full" /></Card>}
      </div>
    </>
  );
}

export default function Neos() {
  const { get, set } = useUrlParams();
  const [text, setText] = useState(get("q"));
  const [filtersOpen, setFiltersOpen] = useState(ADVANCED.some((k) => get(k)));
  const q = useDebounce(text, 300);
  const lastQ = useRef(q);
  useEffect(() => {
    if (lastQ.current !== q) { lastQ.current = q; set({ q }); }
  }, [q, set]);

  const sort = get("sort") || "min_miss_distance_km";
  const order = get("order") || "asc";
  const page = Number(get("page") || 1);
  const selected = get("id") ? Number(get("id")) : null;

  // La interfaz usa m, km/s y LD; la API recibe las unidades de origen (km, km/h, km).
  const params = useMemo(() => {
    const dmin = num(get("dmin"));
    const dmax = num(get("dmax"));
    const vmin = num(get("vmin"));
    const ldmax = num(get("ldmax"));
    return {
      q: get("q") || undefined,
      hazardous: get("hazardous") === "" ? undefined : get("hazardous") === "true",
      tier: get("tier") || undefined,
      min_diameter_km: dmin != null ? dmin / 1000 : undefined,
      max_diameter_km: dmax != null ? dmax / 1000 : undefined,
      min_velocity_kmh: vmin != null ? vmin * 3600 : undefined,
      max_distance_km: ldmax != null ? ldmax * LUNAR_DISTANCE_KM : undefined,
      sort, order, page, page_size: 25,
    };
  }, [get, sort, order, page]);
  const query = useNeoList(params);
  const onSort = (s, o) => set({ sort: s, order: o });

  return (
    <>
      <PageHeader title="Objetos NEO" description="Explora y compara los asteroides que se acercan a la Tierra." />
      <Notice label="Datos reales · NASA NeoWs" tag="Indicadores descriptivos">
        Un registro por asteroide con todas sus aproximaciones. Los diámetros son estimaciones derivadas de H; la clasificación PHA es la de la fuente.
      </Notice>

      <Overview />

      <Card className="mt-4">
        <div className="flex items-start justify-between gap-3 px-5 pb-4 pt-5">
          <div>
            <h3 className="text-[14px] font-semibold">Catálogo de objetos NEO</h3>
            <p className="text-[10.5px] text-muted-foreground">Selecciona una fila para ver todas sus aproximaciones</p>
          </div>
          <span className="rounded-[4px] border px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Dataset real</span>
        </div>
        <TableToolbar search={text} onSearch={setText} placeholder="Buscar nombre o identificador…"
          filtersOpen={filtersOpen} onToggleFilters={() => setFiltersOpen((v) => !v)}
          activeFilters={ADVANCED.filter((k) => get(k)).length} total={query.data?.total}
          select={
            <>
              <NativeSelect aria-label="Clasificación" className="w-48" value={get("hazardous")} onChange={(e) => set({ hazardous: e.target.value })}>
                <option value="">Todos</option>
                <option value="true">Potencialmente peligrosos</option>
                <option value="false">No peligrosos</option>
              </NativeSelect>
              <NativeSelect aria-label="Prioridad" className="w-40" value={get("tier")} onChange={(e) => set({ tier: e.target.value })}>
                <option value="">Toda prioridad</option>
                <option value="A">Prioridad alta (A)</option>
                <option value="B">Prioridad media (B)</option>
                <option value="C">Prioridad baja (C)</option>
              </NativeSelect>
            </>
          }>
          <NumberFilter label="Diámetro mín. (m)" value={get("dmin")} onCommit={(v) => set({ dmin: v })} />
          <NumberFilter label="Diámetro máx. (m)" value={get("dmax")} onCommit={(v) => set({ dmax: v })} />
          <NumberFilter label="Velocidad mín. (km/s)" value={get("vmin")} onCommit={(v) => set({ vmin: v })} />
          <NumberFilter label="Distancia mín. ≤ (LD)" value={get("ldmax")} placeholder="19,46 LD ≈ 0,05 UA" onCommit={(v) => set({ ldmax: v })} />
        </TableToolbar>

        {query.error ? (
          <div className="p-5"><ErrorState error={query.error} onRetry={() => query.refetch()} /></div>
        ) : !query.data ? (
          <LoadingBlock className="h-80 p-5" />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead field="name" sort={sort} order={order} onSort={onSort} className="pl-5">Objeto / ID</SortableHead>
                  <SortableHead field="est_diameter_max_km" sort={sort} order={order} onSort={onSort}>Diámetro est.</SortableHead>
                  <SortableHead field="max_relative_velocity_kmh" sort={sort} order={order} onSort={onSort}>Velocidad máx.</SortableHead>
                  <SortableHead field="min_miss_distance_km" sort={sort} order={order} onSort={onSort}>Aproximación mín.</SortableHead>
                  <SortableHead field="observation_count" sort={sort} order={order} onSort={onSort}>Registros</SortableHead>
                  <TableHead>Clasificación</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.items.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="py-10 text-center text-muted-foreground">Ningún objeto coincide con los filtros.</TableCell></TableRow>
                )}
                {query.data.items.map((n) => (
                  <TableRow key={n.neo_id} data-selected={n.neo_id === selected} className="cursor-pointer" onClick={() => set({ id: n.neo_id })}>
                    <TableCell className="pl-5">
                      <div className="flex items-center gap-3">
                        <IconTile icon={Telescope} tone={n.is_hazardous ? "amber" : "blue"} />
                        <span>
                          <span className="block font-medium">{n.name}</span>
                          <span className="block text-[10.5px] text-muted-foreground">NEO {n.neo_id} · H {formatNumber(n.absolute_magnitude_h, 1)}</span>
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="tabular">{formatDiameterRange(n.est_diameter_min_km, n.est_diameter_max_km)}</TableCell>
                    <TableCell className="tabular">{formatNumber(n.max_relative_velocity_kms, 1)} <span className="text-[10.5px] text-muted-foreground">km/s</span></TableCell>
                    <TableCell className="tabular">
                      {formatNumber(n.min_miss_distance_km / 1e6, 1)} <span className="text-[10.5px] text-muted-foreground">mill. km · {formatNumber(n.min_miss_distance_ld, 1)} LD</span>
                    </TableCell>
                    <TableCell className="tabular">{formatInt(n.observation_count)}</TableCell>
                    <TableCell><HazardBadge hazardous={n.is_hazardous} /></TableCell>
                    <TableCell><TierBadge tier={n.tier} short /></TableCell>
                    <TableCell><ChevronRight className="size-4 text-muted-foreground" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination page={query.data.page} pages={query.data.pages} total={query.data.total}
              fetching={query.isFetching} onPage={(p) => set({ page: p })} />
          </>
        )}
      </Card>

      <PageFooter note="LD = distancia lunar media (384.399 km). La velocidad no tiene unidad documentada en la fuente." />
      {selected != null && <NeoDetailPanel id={selected} onClose={() => set({ id: null })} />}
    </>
  );
}

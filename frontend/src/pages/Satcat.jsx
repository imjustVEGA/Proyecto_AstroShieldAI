/** Catálogo SATCAT: indicadores, 4 gráficas y tabla con filtros y ficha completa (datos reales de CelesTrak). */
import { CheckCircle2, ChevronRight, Orbit, Radio, Satellite } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { BarChartCard } from "@/components/charts/BarChartCard";
import { CHART } from "@/components/charts/theme";
import { ErrorState, IconTile, LoadingBlock, Notice, PageFooter, PageHeader, Pagination, StatCard } from "@/components/common";
import { OBJECT_TYPE_COLOR, ObjectTypeLabel, StateBadge } from "@/components/labels";
import SortableHead from "@/components/SortableHead";
import TableToolbar from "@/components/TableToolbar";
import {
  Badge, Card, Input, Label, NativeSelect, Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/primitives";
import SatelliteDetailPanel from "@/features/SatelliteDetailPanel";
import { useOrbitalDistribution, useSatcatList, useSatcatStats } from "@/hooks/queries";
import useDebounce from "@/hooks/useDebounce";
import useUrlParams from "@/hooks/useUrlParams";
import { formatBin, formatDate, formatInt, formatNumber, formatPercent } from "@/utils/format";

const ADVANCED = ["state", "class", "owner", "incomplete"];
const NO_TYPES = [];

function Overview() {
  const stats = useSatcatStats();
  const dist = useOrbitalDistribution(NO_TYPES);
  const view = useMemo(() => stats.data && {
    types: stats.data.by_type.map((t) => ({ label: t.label.split(" (")[0], value: t.count, color: OBJECT_TYPE_COLOR[t.key] })),
    years: stats.data.launches_by_year.map((y) => ({ label: String(y.year), value: y.count })),
    spark: stats.data.launches_by_year.slice(-30).map((y) => y.count),
  }, [stats.data]);
  const orbital = useMemo(() => dist.data && {
    inclination: dist.data.inclination_deg.map((b) => ({ label: formatBin(b.start, b.end, "°"), value: b.count })),
    apsides: {
      categories: dist.data.apogee_perigee_by_class.map((r) => r.orbit_class),
      items: [
        { name: "Apogeo (mediana)", color: CHART.series1, values: dist.data.apogee_perigee_by_class.map((r) => r.apogee_median_km ?? 0) },
        { name: "Perigeo (mediana)", color: CHART.series2, values: dist.data.apogee_perigee_by_class.map((r) => r.perigee_median_km ?? 0) },
      ],
    },
  }, [dist.data]);

  if (stats.error) return <ErrorState error={stats.error} onRetry={() => stats.refetch()} />;
  if (!stats.data || !view) return <LoadingBlock className="h-72" />;
  const t = stats.data.totals;
  const complete = t.total - t.incomplete_orbit;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Objetos catalogados" value={t.total} icon={Satellite} spark={view.spark}
          caption="Desde 1957 · tendencia: objetos por año de lanzamiento (30 años)" />
        <StatCard label="En órbita" value={t.in_orbit} icon={Orbit} tone="teal" caption={`${formatInt(t.decayed)} ya reingresaron`} />
        <StatCard label="Cargas útiles activas" value={t.active_payloads} icon={Radio} tone="violet"
          caption={`${formatInt(t.debris_in_orbit)} fragmentos de basura en órbita`} />
        <StatCard label="Con parámetros orbitales" value={complete} icon={CheckCircle2} tone="green"
          caption={`${formatPercent(complete / t.total)} completos · RCS sin dato en ${formatInt(t.missing_rcs)}`} />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <BarChartCard title="Tipos de objeto" description="Registros por tipo (todo el catálogo)" data={view.types} />
        <BarChartCard title="Lanzamientos por año" description="Objetos catalogados por año de lanzamiento" data={view.years} color={CHART.series2} />
        {orbital ? (
          <BarChartCard title="Apogeo y perigeo" description="Mediana por régimen · km · escala log" series={orbital.apsides} logScale
            valueLabel="km" help="Objetos en órbita terrestre. Escala logarítmica: LEO (~500 km) y GEO (~35.786 km) en el mismo eje." />
        ) : <LoadingBlock className="h-56" />}
        {orbital ? (
          <BarChartCard title="Inclinación orbital" description="Objetos en órbita por inclinación (5°)" data={orbital.inclination} color={CHART.series3}
            help="Picos: ~51,6° (ISS), ~53° (constelaciones LEO) y ~97–99° (órbitas heliosíncronas)." />
        ) : <LoadingBlock className="h-56" />}
      </div>
    </>
  );
}

export default function Satcat() {
  const { get, set } = useUrlParams();
  const [text, setText] = useState(get("q"));
  const [filtersOpen, setFiltersOpen] = useState(ADVANCED.some((k) => get(k)));
  const q = useDebounce(text, 300);
  const lastQ = useRef(q);
  useEffect(() => {
    // Solo sincroniza cuando cambia lo escrito (no cuando otra navegación cambia la URL).
    if (lastQ.current !== q) { lastQ.current = q; set({ q }); }
  }, [q, set]);

  const sort = get("sort") || "norad_cat_id";
  const order = get("order") || "asc";
  const page = Number(get("page") || 1);
  const selected = get("id") ? Number(get("id")) : null;
  const onSort = (s, o) => set({ sort: s, order: o });

  const params = useMemo(() => ({
    q: get("q") || undefined, object_type: get("type") ? [get("type")] : undefined, owner: get("owner") || undefined,
    state: get("state") || "all", orbit_class: get("class") || undefined, incomplete_only: get("incomplete") === "1" || undefined,
    sort, order, page, page_size: 25,
  }), [get, sort, order, page]);
  const query = useSatcatList(params);

  return (
    <>
      <PageHeader title="Catálogo SATCAT" description="Descubre los objetos artificiales de nuestro entorno orbital." />
      <Notice label="Datos reales · CelesTrak SATCAT" tag="Sin posiciones en tiempo real">
        Parámetros orbitales resumidos (periodo, inclinación, apogeo y perigeo) con unidades validadas. No incluye TLE/OMM.
      </Notice>

      <Overview />

      <Card className="mt-4">
        <div className="flex items-start justify-between gap-3 px-5 pb-4 pt-5">
          <div>
            <h3 className="text-[14px] font-semibold">Catálogo de objetos artificiales</h3>
            <p className="text-[10.5px] text-muted-foreground">Selecciona una fila para ver su ficha completa</p>
          </div>
          <span className="rounded-[4px] border px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Dataset real</span>
        </div>
        <TableToolbar search={text} onSearch={setText} placeholder="Nombre, designación o NORAD…"
          filtersOpen={filtersOpen} onToggleFilters={() => setFiltersOpen((v) => !v)}
          activeFilters={ADVANCED.filter((k) => get(k)).length} total={query.data?.total}
          select={
            <NativeSelect aria-label="Tipo de objeto" className="w-44" value={get("type")} onChange={(e) => set({ type: e.target.value })}>
              <option value="">Todos los tipos</option>
              <option value="PAY">Carga útil</option>
              <option value="R/B">Cuerpo de cohete</option>
              <option value="DEB">Fragmento</option>
              <option value="UNK">Desconocido</option>
            </NativeSelect>
          }>
          <Label>
            Situación
            <NativeSelect value={get("state") || "all"} onChange={(e) => set({ state: e.target.value === "all" ? null : e.target.value })}>
              <option value="all">Todos</option>
              <option value="in_orbit">En órbita</option>
              <option value="decayed">Reingresados</option>
            </NativeSelect>
          </Label>
          <Label>
            Régimen orbital
            <NativeSelect value={get("class")} onChange={(e) => set({ class: e.target.value })}>
              <option value="">Todos</option>
              {["LEO", "MEO", "GEO", "HEO"].map((c) => <option key={c} value={c}>{c}</option>)}
            </NativeSelect>
          </Label>
          <Label>
            Propietario
            <Input defaultValue={get("owner")} placeholder="US, PRC, CIS…" maxLength={16}
              onBlur={(e) => set({ owner: e.target.value.trim().toUpperCase() })}
              onKeyDown={(e) => e.key === "Enter" && set({ owner: e.currentTarget.value.trim().toUpperCase() })} />
          </Label>
          <label className="flex items-end gap-2 pb-2 text-[11px] text-muted-foreground">
            <input type="checkbox" className="accent-blue-500" checked={get("incomplete") === "1"}
              onChange={(e) => set({ incomplete: e.target.checked ? "1" : null })} />
            Solo con parámetros incompletos
          </label>
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
                  <SortableHead field="object_name" sort={sort} order={order} onSort={onSort} className="pl-5">Objeto / NORAD</SortableHead>
                  <TableHead>Tipo / propietario</TableHead>
                  <SortableHead field="inclination_deg" sort={sort} order={order} onSort={onSort}>Órbita / inclinación</SortableHead>
                  <SortableHead field="apogee_km" sort={sort} order={order} onSort={onSort}>Apogeo / perigeo</SortableHead>
                  <SortableHead field="launch_date" sort={sort} order={order} onSort={onSort}>Lanzamiento</SortableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.items.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">Ningún objeto coincide con los filtros.</TableCell></TableRow>
                )}
                {query.data.items.map((o) => (
                  <TableRow key={o.norad_cat_id} data-selected={o.norad_cat_id === selected} className="cursor-pointer"
                    onClick={() => set({ id: o.norad_cat_id })}>
                    <TableCell className="pl-5">
                      <div className="flex items-center gap-3">
                        <IconTile icon={Satellite} />
                        <span className="min-w-0">
                          <span className="block max-w-56 truncate font-medium">{o.object_name ?? "—"}</span>
                          <span className="block text-[10.5px] text-muted-foreground">NORAD {o.norad_cat_id} · {o.object_id ?? "—"}</span>
                        </span>
                      </div>
                    </TableCell>
                    <TableCell><ObjectTypeLabel type={o.object_type} owner={o.owner_code} /></TableCell>
                    <TableCell>
                      <span className="block">{o.orbit_class ?? "—"}</span>
                      <span className="tabular block text-[10.5px] text-muted-foreground">{o.inclination_deg != null ? `${formatNumber(o.inclination_deg, 2)}°` : "sin dato"}</span>
                    </TableCell>
                    <TableCell className="tabular">
                      {o.apogee_km != null ? <>{formatInt(o.apogee_km)} / {formatInt(o.perigee_km)} <span className="text-[10.5px] text-muted-foreground">km</span></> : (
                        <Badge variant="muted">Incompleto</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(o.launch_date)}</TableCell>
                    <TableCell><StateBadge decayed={o.is_decayed} active={o.is_active} status={o.ops_status_code} /></TableCell>
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

      <PageFooter />
      {selected != null && <SatelliteDetailPanel id={selected} onClose={() => set({ id: null })} />}
    </>
  );
}

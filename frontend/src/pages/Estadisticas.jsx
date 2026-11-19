/** Estadísticas descriptivas de ambos catálogos (distribuciones orbitales, matrices y comparación NEO). */
import { useMemo } from "react";

import { BarChartCard } from "@/components/charts/BarChartCard";
import { CHART } from "@/components/charts/theme";
import { ErrorState, LoadingBlock, Notice, PageFooter, PageHeader, Panel } from "@/components/common";
import { OBJECT_TYPE_COLOR, OBJECT_TYPE_LABEL } from "@/components/labels";
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/primitives";
import { useClassification, useNeoStats, useOrbitalDistribution, useSatcatStats } from "@/hooks/queries";
import useUrlParams from "@/hooks/useUrlParams";
import { cn } from "@/utils/cn";
import { formatBin, formatInt, formatNumber } from "@/utils/format";

const TABS = [
  { id: "orbital", label: "Objetos orbitales" },
  { id: "neo", label: "Objetos cercanos (NEO)" },
];
const TYPES = ["PAY", "R/B", "DEB", "UNK"];
const STATUS_COLUMNS = ["active", "inactive", "unknown", "decayed"];
const CLOSE_APPROACH_MARK = { label: "0,05 UA", category: "19–50" };

const binsToBars = (bins, unit = "", digits = 0) => bins.map((b) => ({ label: formatBin(b.start, b.end, unit, digits), value: b.count }));

function Matrix({ cells, rows, columns, rowLabel, columnLabels }) {
  const lookup = new Map(cells.map((c) => [`${c.row}|${c.column}`, c.count]));
  const max = Math.max(1, ...cells.map((c) => c.count));
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead />
          {columns.map((c) => <TableHead key={c} className="text-right">{columnLabels[c] ?? c}</TableHead>)}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r}>
            <TableCell className="font-medium">{rowLabel(r)}</TableCell>
            {columns.map((c) => {
              const v = lookup.get(`${r}|${c}`) ?? 0;
              return (
                <TableCell key={c} className="tabular text-right" style={{ background: `rgb(57 135 229 / ${(0.04 + 0.4 * (v / max)).toFixed(3)})` }}>
                  {formatInt(v)}
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function OrbitalTab() {
  const { get, set } = useUrlParams();
  const selectedTypes = useMemo(() => (get("types") ? get("types").split(",") : []), [get]);
  const dist = useOrbitalDistribution(selectedTypes);
  const classification = useClassification();
  const stats = useSatcatStats();

  const charts = useMemo(() => dist.data && {
    inclination: binsToBars(dist.data.inclination_deg, "°"),
    leo: binsToBars(dist.data.mean_altitude_leo_km),
    period: binsToBars(dist.data.period_min, "", 1),
  }, [dist.data]);
  const owners = useMemo(() => stats.data && {
    categories: stats.data.by_owner.map((o) => o.owner),
    items: [
      { name: "En órbita", color: CHART.series1, values: stats.data.by_owner.map((o) => o.in_orbit) },
      { name: "Reingresados", color: CHART.series2, values: stats.data.by_owner.map((o) => o.total - o.in_orbit) },
    ],
  }, [stats.data]);

  const toggleType = (t) => {
    const next = selectedTypes.includes(t) ? selectedTypes.filter((x) => x !== t) : [...selectedTypes, t];
    set({ types: next.join(",") });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar por tipo de objeto">
        <span className="text-xs text-muted-foreground">Tipo de objeto:</span>
        {TYPES.map((t) => (
          <Button key={t} size="sm" variant={selectedTypes.includes(t) ? "secondary" : "outline"} aria-pressed={selectedTypes.includes(t)} onClick={() => toggleType(t)}>
            <span className="size-2 rounded-full" style={{ background: OBJECT_TYPE_COLOR[t] }} aria-hidden /> {OBJECT_TYPE_LABEL[t]}
          </Button>
        ))}
        {dist.data && <span className="tabular text-xs text-muted-foreground">· {formatInt(dist.data.objects_considered)} objetos en órbita terrestre</span>}
      </div>

      {dist.error && <ErrorState error={dist.error} onRetry={() => dist.refetch()} />}
      {!charts && !dist.error && <LoadingBlock className="h-64" />}
      {charts && dist.data && (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <BarChartCard title="Distribución de inclinaciones" axisName="Inclinación (grados)" data={charts.inclination} color={CHART.series3}
              help="Picos típicos: ~51,6° (ISS), ~53° (constelaciones LEO) y ~97–99° (órbitas heliosíncronas)." />
            <BarChartCard title="Altitud media en LEO" axisName="Altitud media (km)" data={charts.leo}
              help="(apogeo + perigeo) / 2 para objetos LEO. Muestra las capas más congestionadas." />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <BarChartCard title="Periodos orbitales" axisName="Periodo (min)" data={charts.period}
              help="Los periodos > 130 min se agrupan en la última barra (MEO, GEO y elípticas)." />
            <Panel title="Apogeo y perigeo por régimen" description="Percentiles 10 / 50 / 90 (km).">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Régimen</TableHead>
                    <TableHead className="text-right">Objetos</TableHead>
                    <TableHead className="text-right">Apogeo p10 · p50 · p90</TableHead>
                    <TableHead className="text-right">Perigeo p10 · p50 · p90</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dist.data.apogee_perigee_by_class.map((r) => (
                    <TableRow key={r.orbit_class}>
                      <TableCell className="font-medium">{r.orbit_class}</TableCell>
                      <TableCell className="tabular text-right">{formatInt(r.objects)}</TableCell>
                      <TableCell className="tabular text-right">{formatInt(r.apogee_p10_km)} · {formatInt(r.apogee_median_km)} · {formatInt(r.apogee_p90_km)}</TableCell>
                      <TableCell className="tabular text-right">{formatInt(r.perigee_p10_km)} · {formatInt(r.perigee_median_km)} · {formatInt(r.perigee_p90_km)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <ul className="mt-3 list-disc space-y-0.5 pl-4 text-[11px] text-muted-foreground">
                {dist.data.notes.map((n) => <li key={n}>{n}</li>)}
              </ul>
            </Panel>
          </div>
        </>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {classification.data && (
          <Panel title="Tipo de objeto × estado operativo" description="Todo el catálogo, incluidos los reingresados.">
            <Matrix cells={classification.data.type_by_status} rows={TYPES} columns={STATUS_COLUMNS}
              rowLabel={(r) => OBJECT_TYPE_LABEL[r]} columnLabels={classification.data.status_groups} />
          </Panel>
        )}
        {classification.data && (
          <Panel title="Cargas útiles en órbita por régimen y estado"
            help="Útil para planificación de constelaciones: cuántos satélites activos e inactivos ocupan cada régimen.">
            <Matrix cells={classification.data.payload_status_by_orbit_class} rows={["LEO", "MEO", "GEO", "HEO"]}
              columns={["active", "inactive", "unknown"]} rowLabel={(r) => r} columnLabels={classification.data.status_groups} />
          </Panel>
        )}
      </div>

      {owners && (
        <BarChartCard title="Principales propietarios" description="15 propietarios con más objetos catalogados." series={owners}
          horizontal height={380} help="Códigos de propietario de SATCAT (CIS = antigua URSS/Rusia, PRC = China…)." />
      )}
    </div>
  );
}

function NeoTab() {
  const stats = useNeoStats();
  const charts = useMemo(() => stats.data && {
    diameter: stats.data.diameter_max_km.map((b) => ({
      label: formatBin(b.start != null ? b.start * 1000 : null, b.end != null ? b.end * 1000 : null, " m"),
      value: b.count,
    })),
    velocity: binsToBars(stats.data.velocity_kms),
    distance: binsToBars(stats.data.miss_distance_ld),
  }, [stats.data]);

  if (stats.isPending) return <LoadingBlock className="h-64" />;
  if (stats.error || !stats.data || !charts) return <ErrorState error={stats.error} onRetry={() => stats.refetch()} />;
  const t = stats.data.totals;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <BarChartCard title="Diámetro máximo estimado" axisName="Diámetro (m)" data={charts.diameter} valueLabel="Objetos"
          help="Límite superior del rango estimado (albedo 0,05). 140 m es el umbral usado en la priorización." />
        <BarChartCard title="Velocidad relativa" axisName="km/s" data={charts.velocity} valueLabel="Aproximaciones" color={CHART.series2}
          help="Por aproximación registrada. Unidad de origen inferida (km/h)." />
        <BarChartCard title="Distancia de aproximación" axisName="Distancia lunar (LD)" data={charts.distance} valueLabel="Aproximaciones"
          markLineAt={CLOSE_APPROACH_MARK} help="19,46 LD ≈ 0,05 UA. El dataset solo incluye aproximaciones ≤ 0,5 UA." />
      </div>
      <Panel title="Peligrosos vs. no peligrosos"
        description={`${formatInt(t.hazardous_objects)} de ${formatInt(t.objects)} objetos (${formatNumber(t.hazardous_object_share * 100)} %) están clasificados como potencialmente peligrosos.`}
        help="La clasificación depende de la órbita (MOID ≤ 0,05 UA) y del brillo (H ≤ 22), no de la distancia de cada aproximación.">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Grupo</TableHead>
              <TableHead className="text-right">Objetos</TableHead>
              <TableHead className="text-right">Mediana Ø máx.</TableHead>
              <TableHead className="text-right">Mediana vel. máx. (km/s)</TableHead>
              <TableHead className="text-right">Mediana dist. mín. (LD)</TableHead>
              <TableHead className="text-right">Aproximaciones ≤ 0,05 UA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.data.hazardous_comparison.map((g) => (
              <TableRow key={g.group}>
                <TableCell className="font-medium">{g.group === "hazardous" ? "Potencialmente peligrosos" : "No peligrosos"}</TableCell>
                <TableCell className="tabular text-right">{formatInt(g.objects)}</TableCell>
                <TableCell className="tabular text-right">{g.median_diameter_max_km != null ? `${formatInt(g.median_diameter_max_km * 1000)} m` : "—"}</TableCell>
                <TableCell className="tabular text-right">{formatNumber(g.median_velocity_kms, 2)}</TableCell>
                <TableCell className="tabular text-right">{formatNumber(g.median_min_distance_ld, 1)}</TableCell>
                <TableCell className="tabular text-right">{formatInt(g.approaches_within_0_05_au)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </div>
  );
}

export default function Estadisticas() {
  const { get, set } = useUrlParams();
  const tab = get("tab") || "orbital";

  return (
    <>
      <PageHeader title="Estadísticas" description="Análisis descriptivos y determinísticos de ambos catálogos." />
      <Notice label="Análisis descriptivo" tag="Datos reales">
        Distribuciones calculadas sobre todos los registros cargados. Ningún indicador es una probabilidad de colisión o de impacto.
      </Notice>
      <div role="tablist" className="mb-5 inline-flex rounded-lg border bg-card p-1">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id}
            onClick={() => set({ tab: t.id === "orbital" ? null : t.id, types: null })}
            className={cn("rounded-md px-4 py-1.5 text-[12.5px] text-muted-foreground transition-colors", tab === t.id && "bg-secondary text-foreground")}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === "orbital" && <OrbitalTab />}
      {tab === "neo" && <NeoTab />}
      <PageFooter />
    </>
  );
}

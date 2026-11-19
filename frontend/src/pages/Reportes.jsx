/** Reportes: vista previa y exportación CSV de consultas reales de SATCAT, NEO y la priorización. */
import { Download, FileText, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ErrorState, LoadingBlock, Notice, PageFooter, PageHeader, Panel } from "@/components/common";
import { Button, Label, NativeSelect, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/primitives";
import useQuery from "@/hooks/useQuery";
import { getNeoList, getPrioritization, getSatcatList } from "@/services/astroService";
import { formatInt } from "@/utils/format";

const MAX_ROWS = 5000;
const PAGE = 200;

const REPORTS = {
  priority: {
    label: "Ranking de revisión NEO (priorización)",
    filters: { tier: ["", "A", "B", "C"] },
    fetch: (f, page, size) => getPrioritization({ tier: f.tier || undefined, page, page_size: size }),
    columns: [
      ["rank", "Puesto"], ["neo_id", "ID NEO"], ["name", "Nombre"], ["tier", "Nivel"], ["review_score", "Puntuación"],
      ["is_hazardous", "PHA"], ["min_miss_distance_ld", "Dist. mín. (LD)"], ["est_diameter_max_km", "Ø máx. (km)"],
      ["max_relative_velocity_kms", "Vel. máx. (km/s)"], ["reasons", "Reglas activadas"],
    ],
  },
  neo: {
    label: "Catálogo NEO (un registro por asteroide)",
    filters: { hazardous: ["", "true", "false"] },
    fetch: (f, page, size) => getNeoList({ hazardous: f.hazardous === "" || f.hazardous == null ? undefined : f.hazardous === "true", page, page_size: size }),
    columns: [
      ["neo_id", "ID NEO"], ["name", "Nombre"], ["absolute_magnitude_h", "H"], ["est_diameter_min_km", "Ø mín. (km)"],
      ["est_diameter_max_km", "Ø máx. (km)"], ["min_miss_distance_km", "Dist. mín. (km)"], ["max_relative_velocity_kms", "Vel. máx. (km/s)"],
      ["observation_count", "Aproximaciones"], ["is_hazardous", "PHA"], ["tier", "Nivel"],
    ],
  },
  satcat: {
    label: "Catálogo SATCAT",
    filters: { type: ["", "PAY", "R/B", "DEB", "UNK"], state: ["all", "in_orbit", "decayed"], orbit_class: ["", "LEO", "MEO", "GEO", "HEO"] },
    fetch: (f, page, size) => getSatcatList({
      object_type: f.type ? [f.type] : undefined, state: f.state || "all", orbit_class: f.orbit_class || undefined, page, page_size: size,
    }),
    columns: [
      ["norad_cat_id", "NORAD"], ["object_name", "Nombre"], ["object_id", "Designación"], ["object_type", "Tipo"], ["owner_code", "Propietario"],
      ["launch_date", "Lanzamiento"], ["decay_date", "Reingreso"], ["orbit_class", "Régimen"], ["inclination_deg", "Inclinación (°)"],
      ["apogee_km", "Apogeo (km)"], ["perigee_km", "Perigeo (km)"], ["period_min", "Periodo (min)"],
    ],
  },
};

const FILTER_LABELS = {
  tier: { label: "Nivel", options: { "": "Todos", A: "A · Alta", B: "B · Media", C: "C · Baja" } },
  hazardous: { label: "Clasificación", options: { "": "Todos", true: "Potencialmente peligrosos", false: "No peligrosos" } },
  type: { label: "Tipo", options: { "": "Todos", PAY: "Carga útil", "R/B": "Cuerpo de cohete", DEB: "Fragmento", UNK: "Desconocido" } },
  state: { label: "Situación", options: { all: "Todos", in_orbit: "En órbita", decayed: "Reingresados" } },
  orbit_class: { label: "Régimen", options: { "": "Todos", LEO: "LEO", MEO: "MEO", GEO: "GEO", HEO: "HEO" } },
};

const cell = (value) => (Array.isArray(value) ? value.join(" · ") : typeof value === "boolean" ? (value ? "Sí" : "No") : value ?? "");

export default function Reportes() {
  const [kind, setKind] = useState("priority");
  const [filters, setFilters] = useState({ tier: "A" });
  const [exporting, setExporting] = useState(false);
  const report = REPORTS[kind];
  const preview = useQuery(["report", kind, filters], () => report.fetch(filters, 1, 25), { keepPrevious: true });

  const changeKind = (next) => {
    setKind(next);
    setFilters(next === "priority" ? { tier: "A" } : next === "satcat" ? { state: "in_orbit" } : {});
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const rows = [];
      for (let page = 1; rows.length < MAX_ROWS; page++) {
        const data = await report.fetch(filters, page, PAGE);
        rows.push(...data.items);
        if (page >= data.pages) break;
      }
      if (!rows.length) {
        toast.error("No hay registros para exportar");
        return;
      }
      const escape = (value) => `"${String(cell(value)).replaceAll('"', '""')}"`;
      const csv = [
        report.columns.map(([, header]) => escape(header)).join(","),
        ...rows.slice(0, MAX_ROWS).map((row) => report.columns.map(([key]) => escape(row[key])).join(",")),
      ].join("\n");
      const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `astroshield_${kind}_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(`Reporte exportado · ${formatInt(Math.min(rows.length, MAX_ROWS))} filas`);
    } catch (error) {
      toast.error(error.userMessage ?? "No se pudo exportar el reporte");
    } finally {
      setExporting(false);
    }
  };

  const columns = useMemo(() => report.columns.slice(0, 7), [report]);

  return (
    <>
      <PageHeader eyebrow="Laboratorio  /  Documentación" title="Reportes"
        description="Genera tablas a partir de los datos reales y descárgalas en CSV (abre en Excel o Google Sheets)."
        actions={
          <Button onClick={exportCsv} disabled={exporting || !preview.data?.total}>
            {exporting ? <Loader2 className="animate-spin" /> : <Download />} Exportar CSV
          </Button>
        } />
      <Notice label="Exportación trazable" tag={`Máx. ${formatInt(MAX_ROWS)} filas`}>
        El archivo incluye todas las columnas del reporte y respeta los filtros elegidos. Los valores salen tal cual de la API.
      </Notice>

      <Panel title="Configuración del reporte" className="mb-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Label>
            Reporte
            <NativeSelect value={kind} onChange={(e) => changeKind(e.target.value)}>
              {Object.entries(REPORTS).map(([id, r]) => <option key={id} value={id}>{r.label}</option>)}
            </NativeSelect>
          </Label>
          {Object.entries(report.filters).map(([key, values]) => (
            <Label key={key}>
              {FILTER_LABELS[key].label}
              <NativeSelect value={filters[key] ?? values[0]} onChange={(e) => setFilters((f) => ({ ...f, [key]: e.target.value }))}>
                {values.map((v) => <option key={v} value={v}>{FILTER_LABELS[key].options[v]}</option>)}
              </NativeSelect>
            </Label>
          ))}
        </div>
      </Panel>

      <Panel title={report.label} description={preview.data ? `${formatInt(preview.data.total)} registros · vista previa de los primeros 25` : "Cargando…"}
        contentClassName="px-0 pb-0" actions={<FileText className="size-4 text-muted-foreground" />}>
        {preview.error ? <div className="p-4"><ErrorState error={preview.error} onRetry={() => preview.refetch()} /></div>
          : !preview.data ? <LoadingBlock className="h-64 p-4" /> : (
            <Table>
              <TableHeader>
                <TableRow>{columns.map(([key, header]) => <TableHead key={key} className="first:pl-5">{header}</TableHead>)}</TableRow>
              </TableHeader>
              <TableBody>
                {preview.data.items.map((row, i) => (
                  <TableRow key={i}>
                    {columns.map(([key]) => (
                      <TableCell key={key} className="max-w-64 truncate first:pl-5">
                        {typeof row[key] === "number" && !Number.isInteger(row[key]) ? row[key].toFixed(3) : cell(row[key])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
      </Panel>
      <PageFooter />
    </>
  );
}

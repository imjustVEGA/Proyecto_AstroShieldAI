/** Fuentes de datos: procedencia, estado de carga, unidades verificadas e incidencias de calidad. */
import { ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";

import { FieldGrid, LoadingBlock, Notice, PageFooter, PageHeader, Panel, QueryBoundary } from "@/components/common";
import { Badge, NativeSelect, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/primitives";
import { useDatasets } from "@/hooks/queries";
import { API_BASE_URL } from "@/services/api";
import { formatDateTime, formatInt, formatNumber } from "@/utils/format";

const UNIT_STATUS = {
  validated: { label: "Validada con los datos", variant: "good" },
  documented: { label: "Documentada por la fuente", variant: "default" },
  inferred: { label: "Inferida (no documentada)", variant: "warning" },
};
const SEVERITY_VARIANT = { error: "critical", warning: "warning", info: "muted" };

function IssuesTable({ issues, samples }) {
  const [severity, setSeverity] = useState("");
  const visible = useMemo(() => samples.filter((i) => !severity || i.severity === severity), [samples, severity]);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h4 className="eyebrow">Incidencias registradas</h4>
        <NativeSelect aria-label="Filtrar severidad" className="h-8 text-xs" value={severity} onChange={(e) => setSeverity(e.target.value)}>
          <option value="">Todas</option>
          <option value="error">Errores</option>
          <option value="warning">Advertencias</option>
          <option value="info">Informativas</option>
        </NativeSelect>
      </div>
      {issues.length === 0 ? (
        <p className="text-sm text-muted-foreground">El archivo no generó incidencias.</p>
      ) : (
        <>
          <ul className="mb-3 flex flex-wrap gap-1.5">
            {issues.map((i) => (
              <Badge key={i.code} variant={SEVERITY_VARIANT[i.severity]} title={i.message}>{i.code} · {formatInt(i.count)}</Badge>
            ))}
          </ul>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Fila</TableHead><TableHead>Clave</TableHead><TableHead>Código</TableHead><TableHead>Detalle</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {visible.slice(0, 40).map((i, k) => (
                <TableRow key={`${i.code}-${i.row_number}-${k}`}>
                  <TableCell className="tabular text-muted-foreground">{i.row_number ?? "—"}</TableCell>
                  <TableCell className="tabular">{i.record_key ?? "—"}</TableCell>
                  <TableCell><Badge variant={SEVERITY_VARIANT[i.severity]}>{i.code}</Badge></TableCell>
                  <TableCell className="whitespace-normal text-xs text-muted-foreground">{i.message}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="mt-2 text-[10.5px] text-muted-foreground">Se muestra una muestra de hasta 25 filas por tipo de incidencia.</p>
        </>
      )}
    </div>
  );
}

function SourceCard({ source }) {
  const imp = source.latest_import;
  const report = imp?.quality_report ?? {};
  const blanks = Object.entries(report.blank_cells_by_column ?? {}).filter(([, n]) => n > 0);
  const status = imp?.status === "completed" ? <Badge variant="good">cargado</Badge>
    : imp?.status === "failed" ? <Badge variant="critical">error</Badge> : <Badge variant="muted">sin cargar</Badge>;

  return (
    <Panel title={source.name} description={source.description} actions={status}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>{source.provider}</span>
          {source.source_url && <a href={source.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent hover:underline">Fuente <ExternalLink className="size-3" /></a>}
          {source.documentation_url && <a href={source.documentation_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent hover:underline">Documentación <ExternalLink className="size-3" /></a>}
        </div>

        {imp?.status === "completed" ? (
          <FieldGrid items={[
            ["Archivo", <code key="f" className="text-xs">backend/data/{imp.file_name}</code>],
            ["SHA-256", <code key="sha" className="text-xs">{imp.file_sha256.slice(0, 16)}…</code>],
            ["Cargado", `${formatDateTime(imp.finished_at)} · ${formatNumber(imp.seconds, 1)} s`],
            ["Filas leídas / válidas", `${formatInt(imp.rows_read)} / ${formatInt(imp.rows_inserted)}`],
            ["Filas rechazadas", formatInt(imp.rows_rejected)],
            ["Filas con observaciones de calidad", formatInt(imp.rows_flagged)],
          ]} />
        ) : (
          <p className="text-[12px] text-muted-foreground">
            Copia el archivo en <code className="rounded bg-muted px-1.5 py-0.5 text-xs">backend/data/{source.file_name}</code> y reinicia el backend.
            {imp?.error_message && <span className="mt-1 block text-red-300">{imp.error_message}</span>}
          </p>
        )}

        {blanks.length > 0 && (
          <div>
            <h4 className="eyebrow mb-2">Celdas vacías en el archivo original</h4>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              {blanks.map(([col, n]) => (
                <li key={col} className="flex justify-between"><span className="text-muted-foreground">{col}</span><span className="tabular">{formatInt(n)}</span></li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <h4 className="eyebrow mb-2">Diccionario de campos y unidades</h4>
          <Table>
            <TableBody>
              {Object.entries(source.field_dictionary).map(([field, info]) => (
                <TableRow key={field}>
                  <TableCell className="font-mono text-xs">{field}</TableCell>
                  <TableCell className="text-xs">{info.unit}</TableCell>
                  <TableCell><Badge variant={UNIT_STATUS[info.unit_status].variant}>{UNIT_STATUS[info.unit_status].label}</Badge></TableCell>
                  <TableCell className="whitespace-normal text-xs text-muted-foreground">{info.note}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div>
          <h4 className="eyebrow mb-2">Limitaciones</h4>
          <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
            {[...source.limitations, ...(report.notes ?? [])].map((l) => <li key={l}>{l}</li>)}
          </ul>
        </div>

        {imp?.status === "completed" && <IssuesTable issues={imp.issues} samples={imp.issue_samples} />}
      </div>
    </Panel>
  );
}

export default function Fuentes() {
  const query = useDatasets();
  return (
    <>
      <PageHeader eyebrow="Sistema  /  Datos" title="Fuentes de datos"
        description="Procedencia, estado de carga, unidades verificadas y registro de incidencias de calidad." />
      <Notice label="Trazabilidad" tag="Archivos originales intactos">
        El backend lee los CSV originales, calcula su SHA-256 y aplica las mismas reglas de limpieza de Astroshield AI sin modificar los archivos.
      </Notice>
      <Panel title="Configuración del cliente" className="mb-4">
        <FieldGrid items={[
          ["URL de la API", <code key="api" className="text-[11px]">{API_BASE_URL}</code>],
          ["Documentación OpenAPI", <a key="docs" className="text-blue-300 hover:underline" href={`${API_BASE_URL}/docs`} target="_blank" rel="noreferrer">{API_BASE_URL}/docs</a>],
          ["Textura del globo", <code key="tex" className="text-[11px]">public/textures/tierra-astroshield.jpg (offline)</code>],
          ["Actualizar datos", "Reemplaza el CSV en backend/data y reinicia el backend"],
        ]} />
      </Panel>
      <QueryBoundary query={query} loading={<LoadingBlock className="h-96" />}>
        {(sources) => (
          <div className="grid gap-4 xl:grid-cols-2">
            {sources.map((s) => <SourceCard key={s.code} source={s} />)}
          </div>
        )}
      </QueryBoundary>
      <PageFooter />
    </>
  );
}

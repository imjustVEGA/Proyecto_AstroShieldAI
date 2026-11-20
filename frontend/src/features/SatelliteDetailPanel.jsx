import { Globe2 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { DetailPanel, ErrorState, FieldGrid, LoadingBlock, SectionLabel } from "@/components/common";
import { ObjectTypeLabel, QUALITY_FLAG_LABEL, StateBadge } from "@/components/labels";
import { Badge } from "@/components/ui/primitives";
import { useSatcatDetail } from "@/hooks/queries";
import { formatDate, formatInt, formatNumber } from "@/utils/format";

export default function SatelliteDetailPanel({ id, onClose }) {
  const { data, error, isPending, refetch } = useSatcatDetail(id);
  const onMap = useLocation().pathname === "/explorer";

  return (
    <DetailPanel
      title={data?.object_name ?? `NORAD ${id}`}
      subtitle={data ? `NORAD ${data.norad_cat_id} · ${data.object_id ?? "sin designación"}` : "Cargando…"}
      onClose={onClose}
    >
      {isPending && <LoadingBlock className="h-48" />}
      {error && <ErrorState error={error} onRetry={() => refetch()} />}
      {data && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3 text-[0.8125rem]">
            <ObjectTypeLabel type={data.object_type} />
            <StateBadge decayed={data.is_decayed} active={data.is_active} status={data.ops_status_code} />
            {data.orbit_class && <Badge variant="accent">{data.orbit_class}</Badge>}
          </div>

          {!onMap && data.orbit_center === "EA" && data.apogee_km != null && (
            <Link to={`/explorer?sel=s${data.norad_cat_id}`}
              className="flex items-center justify-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-[0.8125rem] text-blue-100 hover:bg-primary/20">
              <Globe2 className="size-3.5" /> Ver su órbita en el mapa 3D
            </Link>
          )}

          <section>
            <SectionLabel>Identificación</SectionLabel>
            <FieldGrid items={[
              ["Propietario", data.owner_code ?? "—"],
              ["Lanzamiento", formatDate(data.launch_date)],
              ["Sitio de lanzamiento", data.launch_site_code ?? "—"],
              ["Reingreso", data.decay_date ? formatDate(data.decay_date) : "No ha reingresado"],
              ["Estado operativo", data.labels.ops_status_code],
              ["Centro / tipo de órbita", `${data.labels.orbit_center} · ${data.labels.orbit_type}`],
            ]} />
          </section>

          <section>
            <SectionLabel>Parámetros orbitales (SATCAT)</SectionLabel>
            <FieldGrid items={[
              ["Periodo", data.period_min != null ? `${formatNumber(data.period_min, 2)} min` : "—"],
              ["Inclinación", data.inclination_deg != null ? `${formatNumber(data.inclination_deg, 2)}°` : "—"],
              ["Apogeo", data.apogee_km != null ? `${formatInt(data.apogee_km)} km` : "—"],
              ["Perigeo", data.perigee_km != null ? `${formatInt(data.perigee_km)} km` : "—"],
              ["Excentricidad (derivada)", data.eccentricity != null ? formatNumber(data.eccentricity, 4) : "—"],
              ["RCS", data.rcs_m2 != null ? `${formatNumber(data.rcs_m2, 3)} m²` : "Sin dato"],
              ["Elementos orbitales", data.data_status_code ? data.labels.data_status_code : "Sin observaciones"],
            ]} />
            <p className="mt-2 text-[0.75rem] text-muted-foreground">SATCAT no incluye TLE/OMM: no es posible calcular la posición actual de este objeto.</p>
          </section>

          <section>
            <SectionLabel>Calidad del registro</SectionLabel>
            {data.quality_flags.length === 0 ? (
              <p className="text-[0.8125rem] text-muted-foreground">Sin observaciones de calidad.</p>
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {data.quality_flags.map((f) => <Badge key={f} variant="muted" dot>{QUALITY_FLAG_LABEL[f] ?? f}</Badge>)}
              </ul>
            )}
          </section>

          <details className="rounded-md border p-3 text-[0.75rem]">
            <summary className="cursor-pointer text-muted-foreground">Registro original (fila {data.source_row_number} del CSV)</summary>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(data.raw_record, null, 2)}</pre>
          </details>
        </div>
      )}
    </DetailPanel>
  );
}

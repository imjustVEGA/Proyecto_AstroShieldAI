import { Globe2 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { DetailPanel, ErrorState, FieldGrid, LoadingBlock, SectionLabel } from "@/components/common";
import { HazardBadge, QUALITY_FLAG_LABEL, TierBadge } from "@/components/labels";
import { Badge } from "@/components/ui/primitives";
import { useNeoDetail } from "@/hooks/queries";
import { AU_KM, formatApproach, formatDiameterRange, formatInt, formatNumber } from "@/utils/format";

const COMPONENT_LABEL = { proximity: "Proximidad (45 %)", size: "Tamaño (35 %)", speed: "Velocidad (20 %)" };

export default function NeoDetailPanel({ id, onClose }) {
  const { data, error, isPending, refetch } = useNeoDetail(id);
  const onMap = useLocation().pathname === "/explorer";

  return (
    <DetailPanel title={data?.name ?? `NEO ${id}`} subtitle={`id de la fuente: ${id}`} onClose={onClose}>
      {isPending && <LoadingBlock className="h-48" />}
      {error && <ErrorState error={error} onRetry={() => refetch()} />}
      {data && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-2">
            <HazardBadge hazardous={data.is_hazardous} />
            <TierBadge tier={data.tier} />
          </div>
          {!onMap && (
            <Link to={`/explorer?sel=n${data.neo_id}`}
              className="flex items-center justify-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-[0.8125rem] text-blue-100 hover:bg-primary/20">
              <Globe2 className="size-3.5" /> Ver su distancia en el mapa 3D
            </Link>
          )}
          <section>
            <SectionLabel>Características físicas</SectionLabel>
            <FieldGrid items={[
              ["Magnitud absoluta (H)", formatNumber(data.absolute_magnitude_h, 2)],
              ["Diámetro estimado", formatDiameterRange(data.est_diameter_min_km, data.est_diameter_max_km)],
              ["Aproximaciones registradas", formatInt(data.observation_count)],
              ["Distancia mínima", `${formatApproach(data.min_miss_distance_km).ld} · ${formatApproach(data.min_miss_distance_km).km}`],
              ["Velocidad relativa máx.", `${formatNumber(data.max_relative_velocity_kms)} km/s`],
            ]} />
          </section>
          <section>
            <SectionLabel>Índice de revisión</SectionLabel>
            <FieldGrid items={[
              ["Puesto en el ranking", `#${formatInt(data.rank)}`],
              ["Puntuación (0–100)", formatNumber(data.review_score, 1)],
              ...Object.entries(data.components).map(([k, v]) => [COMPONENT_LABEL[k] ?? k, `percentil ${formatNumber(v * 100, 0)}`]),
            ]} />
            {data.reasons.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {data.reasons.map((r) => <Badge key={r} variant="muted">{r}</Badge>)}
              </ul>
            )}
          </section>
          <ul className="list-disc space-y-1 pl-4 text-[0.75rem] text-muted-foreground">
            {data.notes.map((n) => <li key={n}>{n}</li>)}
            {data.quality_flags.map((f) => <li key={f}>Calidad: {QUALITY_FLAG_LABEL[f] ?? f}</li>)}
          </ul>
          <section>
            <SectionLabel>Aproximaciones (por distancia)</SectionLabel>
            <table className="w-full text-[0.75rem]">
              <thead className="text-[0.6875rem] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="py-1.5 text-left font-medium">Fila CSV</th>
                  <th className="py-1.5 text-right font-medium">LD</th>
                  <th className="py-1.5 text-right font-medium">UA</th>
                  <th className="py-1.5 text-right font-medium">km/s</th>
                </tr>
              </thead>
              <tbody>
                {data.observations.map((o) => (
                  <tr key={o.source_row_number} className="border-t border-border/60">
                    <td className="tabular py-1.5 text-muted-foreground">#{o.source_row_number}</td>
                    <td className="tabular py-1.5 text-right">{formatNumber(o.miss_distance_ld, 2)}</td>
                    <td className="tabular py-1.5 text-right">{formatNumber(o.miss_distance_km / AU_KM, 4)}</td>
                    <td className="tabular py-1.5 text-right">{formatNumber(o.relative_velocity_kms, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-[0.75rem] text-muted-foreground">
              La fuente no incluye fechas ni documenta la unidad de velocidad (se interpreta como km/h y se muestra en km/s).
            </p>
          </section>
        </div>
      )}
    </DetailPanel>
  );
}

/** Análisis de riesgos: niveles A/B/C, objetos prioritarios, metodología y ranking completo. */
import { AlertTriangle, ChevronRight, Eye, Info, Shield } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";

import { BarChartCard } from "@/components/charts/BarChartCard";
import { CHART } from "@/components/charts/theme";
import { ErrorState, IconTile, LoadingBlock, Notice, PageFooter, PageHeader, Panel } from "@/components/common";
import { TierBadge, tierInfo } from "@/components/labels";
import { Badge, Card } from "@/components/ui/primitives";
import PrioritizationView from "@/features/PrioritizationView";
import { usePrioritization } from "@/hooks/queries";
import { formatDiameter, formatInt, formatNumber } from "@/utils/format";

const TIER_CARDS = [
  { tier: "C", icon: Shield, tone: "green", badge: "good", level: "Prioridad baja" },
  { tier: "B", icon: Eye, tone: "amber", badge: "warning", level: "Prioridad media" },
  { tier: "A", icon: AlertTriangle, tone: "red", badge: "critical", level: "Prioridad alta" },
];
const TOP_PARAMS = { tier: "A", page: 1, page_size: 8 };

export default function Risks() {
  const top = usePrioritization(TOP_PARAMS);
  const data = top.data;
  const chart = useMemo(() => data && data.items.slice(0, 6).map((n) => ({
    label: n.name.replace(/^\d+\s/, "").replace(/[()]/g, ""), value: n.max_relative_velocity_kms,
  })), [data]);

  return (
    <>
      <PageHeader title="Análisis de riesgos" description="Un espacio para organizar la revisión de objetos cercanos con reglas transparentes." />
      <Notice label="Priorización transparente" tag="Sin probabilidad de impacto">
        Los niveles provienen de reglas documentadas y la puntuación de percentiles de este dataset. No se estiman probabilidades de colisión ni de impacto.
      </Notice>

      {top.error && <ErrorState error={top.error} onRetry={() => top.refetch()} />}
      {!data && !top.error && <LoadingBlock className="h-40" />}
      {data && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {TIER_CARDS.map(({ tier, icon, tone, badge, level }) => {
              const rule = data.methodology.tiers.find((t) => t.tier === tier)?.rule;
              return (
                <Card key={tier} className="p-5">
                  <div className="flex items-start justify-between">
                    <IconTile icon={icon} tone={tone} className="size-10" />
                    <Badge variant={badge} className="uppercase">{level}</Badge>
                  </div>
                  <p className="tabular mt-5 text-[38px] font-light leading-none">{formatInt(data.tier_counts[tier])}</p>
                  <p className="mt-3 text-[13px] font-semibold">Nivel {tier} · {tierInfo(tier).label}</p>
                  <p className="mt-1 text-[10.5px] text-muted-foreground">{rule}</p>
                </Card>
              );
            })}
          </div>

          <Card className="mt-4 flex gap-3 p-5">
            <Info className="mt-0.5 size-4 shrink-0 text-blue-300" />
            <div>
              <p className="flex flex-wrap items-center gap-3 text-[13px] font-semibold">
                Clasificación del catálogo y priorización
                <Badge variant="violet">IA · Simulación orbital</Badge>
              </p>
              <p className="mt-1 text-[11.5px] text-muted-foreground">
                PHA es la clasificación de peligrosidad de la fuente (NASA). El nivel y la puntuación salen de reglas explícitas que puedes revisar abajo.
                El clasificador Random Forest de la sección <Link to="/simulacion" className="text-blue-300 hover:underline">Simulación orbital</Link> es
                un apoyo experimental: estima la clase PHA a partir de diámetro, velocidad, distancia y magnitud, sin fechas ni órbitas.
              </p>
            </div>
          </Card>

          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <Panel title="Objetos prioritarios" description="Primeros puestos del nivel A, para revisión humana">
              <ol>
                {data.items.map((n, i) => (
                  <li key={n.neo_id}>
                    <Link to={`/neos?id=${n.neo_id}`} className="flex items-center gap-3 border-b border-border/70 py-3 hover:bg-secondary/30">
                      <span className="tabular grid size-7 place-items-center rounded-md border border-status-critical/30 bg-status-critical/10 text-[10px] text-red-200">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium">{n.name}</span>
                        <span className="block text-[10.5px] text-muted-foreground">
                          NEO {n.neo_id} · {formatNumber(n.min_miss_distance_km / 1e6, 1)} mill. km · Ø máx. {formatDiameter(n.est_diameter_max_km)}
                        </span>
                      </span>
                      <span className="tabular text-[12px] text-muted-foreground">{formatNumber(n.review_score, 0)}</span>
                      <TierBadge tier={n.tier} short />
                      <ChevronRight className="size-3.5 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-[10px] text-muted-foreground">Puntuación 0–100 del índice de revisión; no es una probabilidad de colisión.</p>
            </Panel>
            <div className="flex flex-col gap-4">
              {chart && (
                <BarChartCard title="Comparación de características" description="Velocidad relativa máx. de los 6 primeros · km/s"
                  data={chart} color={CHART.series1} valueLabel="km/s" valueDigits={1} height={210} />
              )}
              <Card className="flex gap-3 p-4">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-300" />
                <div className="text-[11px]">
                  <p className="font-semibold">Escenario de evaluación</p>
                  <p className="mt-0.5 text-muted-foreground">Una velocidad mayor no determina por sí sola mayor prioridad: el índice combina proximidad (45 %), tamaño (35 %) y velocidad (20 %).</p>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}

      <p className="eyebrow mb-3 mt-8">Metodología y ranking completo</p>
      <PrioritizationView />
      <PageFooter />
    </>
  );
}

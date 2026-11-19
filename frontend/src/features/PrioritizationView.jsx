import { Link } from "react-router-dom";

import { ErrorState, LoadingBlock, Pagination, Panel, SectionLabel } from "@/components/common";
import { TierBadge } from "@/components/labels";
import { NativeSelect, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/primitives";
import { usePrioritization } from "@/hooks/queries";
import useUrlParams from "@/hooks/useUrlParams";
import { formatDiameter, formatInt, formatNumber } from "@/utils/format";

const COMPONENT_LABEL = { proximity: "Proximidad", size: "Tamaño", speed: "Velocidad" };

/** Barra de un componente (0–1). El valor numérico siempre acompaña a la barra. */
function ComponentBar({ value, label }) {
  return (
    <div className="flex items-center gap-1.5" title={`${label}: percentil ${formatNumber(value * 100, 0)}`}>
      <div className="h-1 w-12 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-[#3987e5]" style={{ width: `${value * 100}%` }} />
      </div>
      <span className="tabular w-6 text-[10.5px] text-muted-foreground">{formatNumber(value * 100, 0)}</span>
    </div>
  );
}

function Row({ n }) {
  return (
    <TableRow>
      <TableCell className="tabular pl-5 text-muted-foreground">{n.rank}</TableCell>
      <TableCell>
        <Link to={`/neos?id=${n.neo_id}`} className="font-medium hover:text-blue-300">{n.name}</Link>
        <div className="max-w-72 truncate text-[10.5px] text-muted-foreground" title={n.reasons.join(" · ")}>
          {n.reasons.length ? n.reasons.join(" · ") : "Sin reglas activadas"}
        </div>
      </TableCell>
      <TableCell><TierBadge tier={n.tier} short /></TableCell>
      <TableCell className="tabular text-right font-medium">{formatNumber(n.review_score, 1)}</TableCell>
      <TableCell><ComponentBar value={n.proximity_component} label="Proximidad" /></TableCell>
      <TableCell><ComponentBar value={n.size_component} label="Tamaño" /></TableCell>
      <TableCell><ComponentBar value={n.speed_component} label="Velocidad" /></TableCell>
      <TableCell className="tabular text-right">{formatNumber(n.min_miss_distance_ld, 2)}</TableCell>
      <TableCell className="tabular text-right">{formatDiameter(n.est_diameter_max_km)}</TableCell>
    </TableRow>
  );
}

export default function PrioritizationView() {
  const { get, set } = useUrlParams();
  const tier = get("tier");
  const page = Number(get("page") || 1);
  const query = usePrioritization({ tier: tier || undefined, page, page_size: 20 });

  if (query.isPending) return <LoadingBlock className="h-96" />;
  if (query.error || !query.data) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  const { methodology: m, tier_counts: tierCounts } = query.data;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,2.4fr)]">
      <Panel title="Metodología" description={`Versión ${m.version}. ${m.summary}`}>
        <div className="flex flex-col gap-5 text-[12px]">
          <div>
            <SectionLabel>1 · Niveles por reglas</SectionLabel>
            <ul className="space-y-2.5">
              {m.tiers.map((t) => (
                <li key={t.tier} className="flex flex-col gap-1">
                  <span className="flex items-center gap-2"><TierBadge tier={t.tier} />
                    <span className="tabular text-[10.5px] text-muted-foreground">{formatInt(tierCounts[t.tier])} objetos</span></span>
                  <span className="text-[11px] text-muted-foreground">{t.rule}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SectionLabel>2 · Puntuación dentro de cada nivel</SectionLabel>
            <ul className="space-y-1.5 text-[11px]">
              {m.score.components.map((c) => (
                <li key={c.name} className="flex justify-between gap-2">
                  <span>{COMPONENT_LABEL[c.name] ?? c.name} <span className="text-muted-foreground">({c.variable}, {c.transform})</span></span>
                  <span className="tabular font-semibold">{formatNumber(c.weight * 100, 0)} %</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SectionLabel>Limitaciones</SectionLabel>
            <ul className="list-disc space-y-1 pl-4 text-[11px] text-muted-foreground">
              {m.limitations.map((l) => <li key={l}>{l}</li>)}
            </ul>
          </div>
        </div>
      </Panel>

      <Panel
        title="Ranking descriptivo de revisión"
        description="Ordenado por nivel y luego por puntuación. Los componentes son percentiles dentro de este dataset."
        contentClassName="px-0 pb-0"
        actions={
          <NativeSelect aria-label="Filtrar por nivel" value={tier} onChange={(e) => set({ tier: e.target.value })} className="h-8 text-[11px]">
            <option value="">Todos los niveles</option>
            <option value="A">Nivel A · Alta</option>
            <option value="B">Nivel B · Media</option>
            <option value="C">Nivel C · Baja</option>
          </NativeSelect>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-5">#</TableHead>
              <TableHead>Objeto y reglas activadas</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead className="text-right">Puntuación</TableHead>
              <TableHead>Proximidad</TableHead>
              <TableHead>Tamaño</TableHead>
              <TableHead>Velocidad</TableHead>
              <TableHead className="text-right">Dist. mín. (LD)</TableHead>
              <TableHead className="text-right">Ø máx.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{query.data.items.map((n) => <Row key={n.neo_id} n={n} />)}</TableBody>
        </Table>
        <Pagination page={page} pages={query.data.pages} total={query.data.total}
          fetching={query.isFetching} onPage={(p) => set({ page: p })} />
      </Panel>
    </div>
  );
}

/**
 * Buscador y lista de objetos del mapa 3D: categorías (NEO, satélites, cohetes, basura espacial,
 * sin clasificar), búsqueda, filtros, paginación y selección individual o múltiple.
 * Todas las listas salen de la API real (/satcat, /neo, /analytics/neo-prioritization, /search).
 */
import { Check, ChevronLeft, ChevronRight, Loader2, Plus, Search, Star } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { ErrorState } from "@/components/common";
import { CATEGORY, categoryOf, FEATURED_OBJECTS } from "@/components/labels";
import { Badge, NativeSelect } from "@/components/ui/primitives";
import { useNeoList, usePrioritization, useSatcatList, useSearch } from "@/hooks/queries";
import useDebounce from "@/hooks/useDebounce";
import { cn } from "@/utils/cn";
import { formatInt, formatNumber } from "@/utils/format";
import { ATTENTION } from "./mapModel";
import { keyOf } from "./useMapSelection";

const PAGE_SIZE = 20;

const TABS = [
  { id: "featured", label: "Destacados", icon: Star, color: "#93c5fd" },
  { id: "neo", ...CATEGORY.neo },
  { id: "PAY", ...CATEGORY.PAY },
  { id: "R/B", ...CATEGORY["R/B"] },
  { id: "DEB", ...CATEGORY.DEB },
  { id: "UNK", ...CATEGORY.UNK },
];

const NEO_FILTERS = [
  { id: "", label: "Todos · más cercanos primero" },
  { id: "A", label: "Atención alta (nivel A)" },
  { id: "B", label: "Atención media (nivel B)" },
  { id: "pha", label: "Potencialmente peligrosos (PHA)" },
];

const SAT_SORTS = [
  { id: "launch_date:desc", label: "Lanzados más recientemente" },
  { id: "norad_cat_id:asc", label: "Número NORAD (más antiguos)" },
  { id: "perigee_km:asc", label: "Más cerca de la Tierra" },
  { id: "apogee_km:desc", label: "Más lejos de la Tierra" },
];

/** Fila seleccionable de la lista: botón con estado presionado (añadido al mapa). */
function ObjectRow({ kind, id, objectType, name, subtitle, attention, selected, onToggle }) {
  const category = categoryOf(kind, objectType);
  const Icon = category.icon;
  return (
    <li>
      <button
        type="button"
        aria-pressed={selected}
        onClick={() => onToggle(kind, id)}
        className={cn(
          "group flex w-full items-center gap-2.5 rounded-md border border-transparent px-2.5 py-2 text-left transition-colors hover:bg-secondary/70",
          selected && "border-primary/50 bg-primary/10",
        )}
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-md border" style={{ borderColor: `${category.color}66`, background: `${category.color}1f`, color: category.color }}>
          <Icon className="size-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.8125rem] font-medium">{name}</span>
          <span className="block truncate text-[0.75rem] text-muted-foreground">{subtitle}</span>
        </span>
        {attention && attention !== "C" && (
          <Badge variant={ATTENTION[attention].variant} dot className="hidden sm:inline-flex">
            {ATTENTION[attention].level}
          </Badge>
        )}
        <span
          aria-hidden
          className={cn(
            "grid size-6 shrink-0 place-items-center rounded-full border text-muted-foreground transition-colors group-hover:border-primary group-hover:text-foreground",
            selected && "border-primary bg-primary text-white group-hover:text-white",
          )}
        >
          {selected ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
        </span>
        <span className="sr-only">{selected ? "En el mapa. Pulsa para quitarlo." : "Pulsa para añadirlo al mapa."}</span>
      </button>
    </li>
  );
}

function ListState({ query, empty, children }) {
  if (query.error) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  if (query.isPending) {
    return (
      <div className="flex items-center gap-2 px-2 py-6 text-[0.8125rem] text-muted-foreground" role="status">
        <Loader2 className="size-4 animate-spin" aria-hidden /> Cargando objetos…
      </div>
    );
  }
  if (!query.data || (Array.isArray(query.data) ? query.data.length === 0 : query.data.items?.length === 0)) {
    return <p className="px-2 py-6 text-center text-[0.8125rem] text-muted-foreground">{empty}</p>;
  }
  return children;
}

function Pager({ data, page, onPage, fetching }) {
  if (!data || data.pages <= 1) return null;
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, data.total);
  return (
    <div className="mt-2 flex items-center justify-between gap-2 border-t pt-2 text-[0.75rem] text-muted-foreground">
      <span className="tabular flex items-center gap-1.5">
        {formatInt(from)}–{formatInt(to)} de {formatInt(data.total)}
        {fetching && <Loader2 className="size-3 animate-spin" aria-label="Actualizando" />}
      </span>
      <span className="flex gap-1">
        <button type="button" className="grid size-8 place-items-center rounded-md border hover:bg-secondary disabled:opacity-40"
          aria-label="Página anterior" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          <ChevronLeft className="size-4" />
        </button>
        <button type="button" className="grid size-8 place-items-center rounded-md border hover:bg-secondary disabled:opacity-40"
          aria-label="Página siguiente" disabled={page >= data.pages} onClick={() => onPage(page + 1)}>
          <ChevronRight className="size-4" />
        </button>
      </span>
    </div>
  );
}

const neoSubtitle = (n) => `NEO ${n.neo_id} · ${formatNumber(n.min_miss_distance_ld, 2)} LD · Ø máx. ${n.est_diameter_max_km != null ? `${formatInt(n.est_diameter_max_km * 1000)} m` : "—"}`;
const satSubtitle = (o) => [
  `NORAD ${o.norad_cat_id}`,
  o.orbit_class,
  o.perigee_km != null ? `${formatInt(o.perigee_km)}–${formatInt(o.apogee_km)} km` : "sin parámetros orbitales",
].filter(Boolean).join(" · ");

function FeaturedList({ isSelected, onToggle }) {
  const attention = usePrioritization({ tier: "A", page: 1, page_size: 5 });
  const closest = useNeoList({ sort: "min_miss_distance_km", order: "asc", page: 1, page_size: 4 });
  return (
    <div className="flex flex-col gap-4">
      <section aria-labelledby="featured-attention">
        <h4 id="featured-attention" className="eyebrow mb-1 px-2">NEO que requieren atención (nivel A)</h4>
        <ListState query={attention} empty="No hay objetos de nivel A.">
          <ul className="flex flex-col gap-0.5">
            {attention.data?.items.map((n) => (
              <ObjectRow key={n.neo_id} kind="neo" id={n.neo_id} name={n.name} attention={n.tier}
                subtitle={`#${n.rank} del ranking · ${formatNumber(n.min_miss_distance_ld, 2)} LD`}
                selected={isSelected(keyOf("neo", n.neo_id))} onToggle={onToggle} />
            ))}
          </ul>
        </ListState>
      </section>
      <section aria-labelledby="featured-closest">
        <h4 id="featured-closest" className="eyebrow mb-1 px-2">Aproximaciones más cercanas registradas</h4>
        <ListState query={closest} empty="Sin datos de NEO.">
          <ul className="flex flex-col gap-0.5">
            {closest.data?.items.map((n) => (
              <ObjectRow key={n.neo_id} kind="neo" id={n.neo_id} name={n.name} attention={n.tier} subtitle={neoSubtitle(n)}
                selected={isSelected(keyOf("neo", n.neo_id))} onToggle={onToggle} />
            ))}
          </ul>
        </ListState>
      </section>
      <section aria-labelledby="featured-sats">
        <h4 id="featured-sats" className="eyebrow mb-1 px-2">Objetos artificiales de referencia</h4>
        <ul className="flex flex-col gap-0.5">
          {FEATURED_OBJECTS.map((f) => (
            <ObjectRow key={f.id} kind="satcat" id={f.id} objectType={f.type} name={f.name} subtitle={`NORAD ${f.id} · ${f.note}`}
              selected={isSelected(keyOf("satcat", f.id))} onToggle={onToggle} />
          ))}
        </ul>
      </section>
    </div>
  );
}

function SearchResults({ q, isSelected, onToggle }) {
  const query = useSearch(q);
  return (
    <ListState query={query} empty={`Sin resultados para “${q}”.`}>
      <ul className="flex flex-col gap-0.5">
        {query.data?.map((hit) => (
          <ObjectRow key={`${hit.kind}-${hit.id}`} kind={hit.kind === "neo" ? "neo" : "satcat"} id={hit.id}
            objectType={hit.kind === "satcat" ? hit.subtitle.split(" · ")[1] : undefined}
            name={hit.name} subtitle={hit.subtitle} selected={isSelected(keyOf(hit.kind === "neo" ? "neo" : "satcat", hit.id))} onToggle={onToggle} />
        ))}
      </ul>
    </ListState>
  );
}

function NeoList({ q, isSelected, onToggle }) {
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [q, filter]);
  const params = useMemo(() => ({
    q: q || undefined,
    tier: filter === "A" || filter === "B" ? filter : undefined,
    hazardous: filter === "pha" ? true : undefined,
    sort: "min_miss_distance_km", order: "asc", page, page_size: PAGE_SIZE,
  }), [q, filter, page]);
  const query = useNeoList(params);
  return (
    <>
      <label className="mb-2 block px-2 text-[0.75rem] font-medium text-muted-foreground">
        Mostrar
        <NativeSelect className="mt-1 w-full" value={filter} onChange={(e) => setFilter(e.target.value)}>
          {NEO_FILTERS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
        </NativeSelect>
      </label>
      <ListState query={query} empty="Ningún NEO coincide con la búsqueda o el filtro.">
        <ul className="flex flex-col gap-0.5">
          {query.data?.items.map((n) => (
            <ObjectRow key={n.neo_id} kind="neo" id={n.neo_id} name={n.name} attention={n.tier} subtitle={neoSubtitle(n)}
              selected={isSelected(keyOf("neo", n.neo_id))} onToggle={onToggle} />
          ))}
        </ul>
        <Pager data={query.data} page={page} onPage={setPage} fetching={query.isFetching} />
      </ListState>
    </>
  );
}

function SatcatList({ type, q, isSelected, onToggle }) {
  const [sort, setSort] = useState(SAT_SORTS[0].id);
  const [regime, setRegime] = useState("");
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [q, sort, regime, type]);
  const params = useMemo(() => {
    const [field, order] = sort.split(":");
    return {
      q: q || undefined, object_type: [type], state: "in_orbit", orbit_class: regime || undefined,
      sort: field, order, page, page_size: PAGE_SIZE,
    };
  }, [q, type, sort, regime, page]);
  const query = useSatcatList(params);
  return (
    <>
      <div className="mb-2 grid grid-cols-2 gap-2 px-2">
        <label className="text-[0.75rem] font-medium text-muted-foreground">
          Órbita
          <NativeSelect className="mt-1 w-full" value={regime} onChange={(e) => setRegime(e.target.value)}>
            <option value="">Todas</option>
            <option value="LEO">Baja (LEO)</option>
            <option value="MEO">Media (MEO)</option>
            <option value="GEO">Geoestacionaria (GEO)</option>
            <option value="HEO">Alta / elíptica (HEO)</option>
          </NativeSelect>
        </label>
        <label className="text-[0.75rem] font-medium text-muted-foreground">
          Orden
          <NativeSelect className="mt-1 w-full" value={sort} onChange={(e) => setSort(e.target.value)}>
            {SAT_SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </NativeSelect>
        </label>
      </div>
      <p className="mb-1 px-2 text-[0.75rem] text-muted-foreground">Solo objetos que siguen en órbita.</p>
      <ListState query={query} empty="Ningún objeto coincide con la búsqueda o el filtro.">
        <ul className="flex flex-col gap-0.5">
          {query.data?.items.map((o) => (
            <ObjectRow key={o.norad_cat_id} kind="satcat" id={o.norad_cat_id} objectType={o.object_type} name={o.object_name ?? `NORAD ${o.norad_cat_id}`}
              subtitle={satSubtitle(o)} selected={isSelected(keyOf("satcat", o.norad_cat_id))} onToggle={onToggle} />
          ))}
        </ul>
        <Pager data={query.data} page={page} onPage={setPage} fetching={query.isFetching} />
      </ListState>
    </>
  );
}

export default function ObjectBrowser({ isSelected, onToggle }) {
  const [tab, setTab] = useState("featured");
  const [text, setText] = useState("");
  const q = useDebounce(text.trim(), 300);
  const tabRefs = useRef([]);
  const current = TABS.find((t) => t.id === tab);

  const onTabKey = (event, index) => {
    const delta = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!delta) return;
    event.preventDefault();
    const next = (index + delta + TABS.length) % TABS.length;
    setTab(TABS[next].id);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative px-2">
        <Search className="pointer-events-none absolute left-5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={tab === "featured" ? "Nombre, NORAD o id de NEO…" : `Buscar en ${current.label.toLowerCase()}…`}
          aria-label="Buscar objetos espaciales"
          className="min-h-10 w-full rounded-md border border-input bg-background/60 pl-9 pr-3 text-[0.875rem] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div role="tablist" aria-label="Categoría de objetos" className="mt-3 flex flex-wrap gap-1.5 px-2">
        {TABS.map((t, i) => {
          const selected = t.id === tab;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              ref={(el) => { tabRefs.current[i] = el; }}
              type="button"
              role="tab"
              id={`map-tab-${i}`}
              aria-selected={selected}
              aria-controls="map-object-list"
              tabIndex={selected ? 0 : -1}
              title={t.description}
              onClick={() => setTab(t.id)}
              onKeyDown={(e) => onTabKey(e, i)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.75rem] font-medium text-secondary-foreground transition-colors hover:bg-secondary",
                selected && "border-primary bg-primary/15 text-foreground",
              )}
            >
              <Icon className="size-3.5" style={{ color: t.color }} aria-hidden />
              {t.label}
            </button>
          );
        })}
      </div>
      {current.description && <p className="mt-2 px-2 text-[0.75rem] text-muted-foreground">{current.description}</p>}

      <div id="map-object-list" role="tabpanel" aria-labelledby={`map-tab-${TABS.indexOf(current)}`}
        className="mt-3 min-h-0 flex-1 overflow-y-auto pb-2 scrollbar-dark">
        {tab === "featured" && (q.length >= 2
          ? <SearchResults q={q} isSelected={isSelected} onToggle={onToggle} />
          : <FeaturedList isSelected={isSelected} onToggle={onToggle} />)}
        {tab === "neo" && <NeoList q={q} isSelected={isSelected} onToggle={onToggle} />}
        {["PAY", "R/B", "DEB", "UNK"].includes(tab) && <SatcatList type={tab} q={q} isSelected={isSelected} onToggle={onToggle} />}
      </div>
    </div>
  );
}

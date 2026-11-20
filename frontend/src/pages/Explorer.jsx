/**
 * Mapa 3D: elemento visual principal de la plataforma.
 * · Vista inicial limpia: la Tierra sola, sin capas ni trayectorias.
 * · Panel izquierdo: buscador, categorías (NEO, satélites, cohetes, basura, sin clasificar),
 *   filtros y selección individual o múltiple; lista de objetos seleccionados.
 * · Al seleccionar: la cámara encuadra el objeto, se resalta y los demás pierden protagonismo;
 *   aparece su ficha resumida y la ficha técnica completa se abre sin salir del mapa.
 * · Debajo, en pestañas: análisis por capas de altitud, qué se puede visualizar y cómo leer el mapa.
 */
import { BookOpen, CheckCircle2, Info, Layers3, ListChecks, Trash2, X, XCircle } from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";

import { ErrorState, LoadingBlock, PageFooter, PageHeader, Panel } from "@/components/common";
import { DEFAULT_LAYERS, drawnObjects, showsMoon } from "@/components/globe/layers";
import { CATEGORY, categoryOf, GLOSSARY, OBJECT_TYPE_COLOR, OBJECT_TYPE_LABEL } from "@/components/labels";
import { Badge, Button, Card, InfoTip, Skeleton, TabPanel, Tabs } from "@/components/ui/primitives";
import NeoDetailPanel from "@/features/NeoDetailPanel";
import SatelliteDetailPanel from "@/features/SatelliteDetailPanel";
import MapObjectCard from "@/features/map/MapObjectCard";
import { globeObjectFor } from "@/features/map/mapModel";
import ObjectBrowser from "@/features/map/ObjectBrowser";
import { MAX_SELECTED, useMapObjects, useMapSelection } from "@/features/map/useMapSelection";
import { useCapabilities, useShells } from "@/hooks/queries";
import { useElementWidth, useRemPx } from "@/hooks/useElementSize";
import { cn } from "@/utils/cn";
import { formatInt } from "@/utils/format";

// Se conserva la exportación para quien la importaba desde esta página.
export { orbitFor } from "@/features/map/mapModel";

const GlobeView = lazy(() => import("@/components/globe/GlobeView"));
const TYPES = ["PAY", "R/B", "DEB", "UNK"];

/** Lista compacta de los objetos en el mapa: enfocar, quitar, limpiar y mostrar/ocultar trayectorias. */
function SelectionList({ items, activeKey, onFocus, onRemove, onClear, layers, onLayers }) {
  return (
    <section aria-labelledby="map-selection-title" className="border-b px-4 pb-3 pt-4">
      <div className="flex items-center justify-between gap-2">
        <h2 id="map-selection-title" className="flex items-center gap-2 text-[0.875rem] font-semibold">
          <ListChecks className="size-4 text-accent" aria-hidden /> En el mapa
          <span className="tabular text-[0.75rem] font-normal text-muted-foreground">{items.length}/{MAX_SELECTED}</span>
        </h2>
        <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={onClear} disabled={!items.length}>
          <Trash2 /> Limpiar
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="mt-1 text-[0.8125rem] text-muted-foreground">Ningún objeto seleccionado. Elige uno o varios de la lista para verlos en el globo.</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-1">
          {items.map((item) => {
            const category = categoryOf(item.kind, item.data?.object_type);
            const name = item.data ? (item.kind === "neo" ? item.data.name : item.data.object_name ?? `NORAD ${item.id}`) : `${item.kind === "neo" ? "NEO" : "NORAD"} ${item.id}`;
            const active = item.key === activeKey;
            return (
              <li key={item.key} className={cn("flex items-center gap-1 rounded-md border", active ? "border-primary/60 bg-primary/10" : "border-transparent bg-secondary/40")}>
                <button type="button" onClick={() => onFocus(item.key)} aria-current={active ? "true" : undefined}
                  className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2.5 py-1.5 text-left hover:bg-secondary">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: category.color }} aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-[0.8125rem]">{name}</span>
                  {item.data?.tier === "A" && <Badge variant="critical">Alta</Badge>}
                  {item.error && <Badge variant="muted">Error</Badge>}
                  <span className="sr-only">{active ? "(objeto activo)" : "Enfocar"}</span>
                </button>
                <button type="button" aria-label={`Quitar ${name} del mapa`} title="Quitar del mapa" onClick={() => onRemove(item.key)}
                  className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground">
                  <XCircle className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-md border bg-background/40 px-3 py-2">
        <span>
          <span className="block text-[0.8125rem] font-medium">Mostrar órbitas y distancias</span>
          <span className="block text-[0.75rem] text-muted-foreground">Trayectoria esquemática o distancia mínima de cada objeto</span>
        </span>
        <input type="checkbox" role="switch" className="size-5 shrink-0 accent-blue-500" checked={layers.trajectories}
          onChange={(e) => onLayers({ ...layers, trajectories: e.target.checked })} />
      </label>
    </section>
  );
}

/** Leyenda: solo lo que está dibujado en pantalla; plegable para no tapar el mapa en pantallas angostas. */
function MapLegend({ objects: all, layers, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  useEffect(() => setOpen(defaultOpen), [defaultOpen]);
  const objects = drawnObjects(all);
  const categories = [...new Map(objects.map((o) => {
    const c = o.kind === "neo" ? CATEGORY.neo : Object.values(CATEGORY).find((x) => x.color === o.color) ?? CATEGORY.UNK;
    return [c.id, c];
  })).values()];
  const hasNeo = objects.some((o) => o.approachKm);
  const hasSat = objects.some((o) => o.orbit);
  const attention = new Set(objects.map((o) => o.attention).filter(Boolean));
  const moon = showsMoon(all, layers);
  if (!objects.length && !layers.references && !layers.shells) return null;
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} aria-expanded={false}
        className="pointer-events-auto flex items-center gap-1.5 rounded-md border bg-card/85 px-3 py-1.5 font-medium text-secondary-foreground backdrop-blur hover:bg-secondary">
        <Info className="size-3.5" aria-hidden /> Leyenda
      </button>
    );
  }
  return (
    <div className="pointer-events-auto flex max-w-full flex-wrap items-center gap-x-4 gap-y-1 rounded-md border bg-card/85 py-1.5 pl-3 pr-1 text-secondary-foreground backdrop-blur">
      {categories.map((c) => (
        <span key={c.id} className="flex items-center gap-1.5"><span className="size-2.5 rounded-full" style={{ background: c.color }} aria-hidden />{c.long}</span>
      ))}
      {hasSat && layers.trajectories && <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-sky-300" aria-hidden /> Órbita esquemática · punto = perigeo</span>}
      {hasNeo && layers.trajectories && <span className="flex items-center gap-1.5"><span className="h-0 w-4 border-t-2 border-dashed border-violet-300" aria-hidden /> Distancia mínima registrada</span>}
      {attention.has("A") && <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full ring-2 ring-red-400" aria-hidden /> Atención alta (marcador y anillo rojos)</span>}
      {attention.has("B") && <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full ring-2 ring-amber-300" aria-hidden /> Atención media (ámbar)</span>}
      {moon && <span className="flex items-center gap-1.5"><span className="h-0 w-4 border-t border-dashed border-slate-300" aria-hidden /> Órbita de la Luna</span>}
      {layers.references && <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-sky-400/70" aria-hidden /> Referencia GEO</span>}
      {layers.shells && <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-primary/50" aria-hidden /> Densidad por altitud (SATCAT)</span>}
      <button type="button" onClick={() => setOpen(false)} aria-expanded aria-label="Ocultar leyenda" title="Ocultar leyenda"
        className="grid size-7 place-items-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground">
        <X className="size-3.5" />
      </button>
    </div>
  );
}

function ShellsPanel({ shells, layers, onLayers, selectedBand, setSelectedBand, hidden, toggleBand }) {
  const bands = shells.data?.bands ?? [];
  return (
    <Panel title="Ocupación por altitud" help="Cada capa agrupa los objetos de SATCAT que siguen en órbita según su altitud media (apogeo + perigeo) / 2. No son posiciones reales."
      description="Cuántos objetos artificiales hay en cada franja de altura. Actívalas para verlas en el mapa."
      actions={
        <Button size="sm" variant={layers.shells ? "default" : "outline"} aria-pressed={layers.shells} onClick={() => onLayers({ ...layers, shells: !layers.shells })}>
          <Layers3 /> {layers.shells ? "Capas visibles" : "Ver capas en el mapa"}
        </Button>
      }>
      {shells.error ? <ErrorState error={shells.error} onRetry={() => shells.refetch()} /> : shells.isPending ? <LoadingBlock className="h-40" /> : (
        <ul className="grid gap-1 sm:grid-cols-2">
          {bands.map((b) => (
            <li key={b.id} className={cn("rounded-md border px-2.5 py-2", selectedBand === b.id ? "border-primary/50 bg-primary/5" : "border-transparent")}>
              <div className="flex items-center gap-2">
                <input type="checkbox" className="size-4 accent-blue-500" checked={!hidden.has(b.id)} onChange={() => toggleBand(b.id)} aria-label={`Mostrar ${b.label}`} />
                <button type="button" aria-expanded={selectedBand === b.id} className="flex flex-1 items-center justify-between gap-2 rounded text-left text-[0.8125rem]"
                  onClick={() => { setSelectedBand(selectedBand === b.id ? null : b.id); if (!layers.shells) onLayers({ ...layers, shells: true }); }}>
                  <span>{b.label}</span>
                  <span className="tabular text-[0.75rem] text-muted-foreground">{formatInt(b.count)}</span>
                </button>
              </div>
              {selectedBand === b.id && (
                <dl className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-0.5 pl-6 text-[0.75rem]">
                  {TYPES.map((t) => (
                    <div key={t} className="flex justify-between gap-2">
                      <dt className="flex items-center gap-1 text-muted-foreground">
                        <span className="size-1.5 rounded-full" style={{ background: OBJECT_TYPE_COLOR[t] }} />{OBJECT_TYPE_LABEL[t]}
                      </dt>
                      <dd className="tabular">{formatInt(b.by_type[t] ?? 0)}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function CapabilitiesPanel() {
  const caps = useCapabilities();
  if (caps.error) return <ErrorState error={caps.error} onRetry={() => caps.refetch()} />;
  if (!caps.data) return <LoadingBlock className="h-32" />;
  const rows = [
    [caps.data.aggregated_shells, "Distribución de objetos artificiales por altitud", "Capas de densidad (SATCAT)."],
    [true, "Órbita esquemática de cada satélite", "Tamaño, forma e inclinación reales; orientación ilustrativa."],
    [true, "Distancia mínima de aproximación de cada NEO", "Real y a escala respecto a la Tierra y la Luna."],
    [true, "Nivel de atención de los NEO", "Reglas transparentes del sistema (A/B/C), no probabilidad de impacto."],
    [caps.data.real_time_positions, "Posiciones en tiempo real", "Requiere TLE/OMM."],
    [caps.data.trajectories, "Trayectorias y trazas sobre la Tierra", "Requiere elementos orbitales completos y época."],
    [false, "Fechas de aproximación de los NEO", "El CSV de NASA NeoWs no las incluye."],
    [false, "Probabilidad de impacto o de colisión", "Requiere órbitas con incertidumbre o análisis de conjunciones."],
  ];
  return (
    <Panel title="¿Qué se puede ver con los datos actuales?" description="Lo que el mapa muestra y lo que necesitaría más información.">
      <ul className="grid gap-2 md:grid-cols-2">
        {rows.map(([ok, label, note]) => (
          <li key={label} className="flex items-start gap-2.5 rounded-md border px-3 py-2">
            {ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-status-good" /> : <XCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />}
            <span>
              <span className="block text-[0.8125rem] font-medium">{label}<span className="sr-only">{ok ? ": disponible" : ": no disponible"}</span></span>
              <span className="block text-[0.75rem] text-muted-foreground">{note}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[0.75rem] text-muted-foreground">{caps.data.reason}</p>
    </Panel>
  );
}

function GuidePanel() {
  const terms = ["NEO", "PHA", "LD", "NORAD", "LEO", "MEO", "GEO", "HEO", "apogeo", "perigeo", "inclinación", "TLE"];
  return (
    <Panel title="Cómo leer el mapa" description="Pasos básicos y significado de los términos que aparecen en las fichas.">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <ol className="flex list-decimal flex-col gap-2 pl-5 text-[0.8125rem] text-secondary-foreground">
          <li>Busca un objeto o elige una categoría en el panel izquierdo.</li>
          <li>Pulsa un objeto para añadirlo al mapa (hasta {MAX_SELECTED}). La cámara lo encuadra y se abre su ficha.</li>
          <li>En “En el mapa”, pulsa un nombre para enfocarlo; los demás se atenúan.</li>
          <li>“Datos técnicos” abre la ficha completa sin salir del mapa.</li>
          <li>Con el mapa enfocado: flechas para girar, + y − para acercar o alejar, 0 para encuadrar.</li>
          <li>Un NEO cerca de la Tierra no implica riesgo de impacto: el nivel de atención es una prioridad de revisión.</li>
        </ol>
        <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {terms.map((t) => (
            <div key={t}>
              <dt className="text-[0.8125rem] font-semibold">{t}</dt>
              <dd className="text-[0.75rem] text-muted-foreground">{GLOSSARY[t]}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Panel>
  );
}

const DETAIL_TABS = [
  { id: "guide", label: "Cómo leer el mapa", icon: BookOpen },
  { id: "shells", label: "Ocupación por altitud", icon: Layers3 },
  { id: "capabilities", label: "Alcance de los datos", icon: CheckCircle2 },
];

export default function Explorer() {
  const shells = useShells();
  const { selection, activeKey, isSelected, toggle, focus, remove, clear } = useMapSelection();
  const items = useMapObjects(selection);
  const [layers, setLayers] = useState(DEFAULT_LAYERS);
  const [focusNonce, setFocusNonce] = useState(0);
  const [details, setDetails] = useState(null);
  const [tab, setTab] = useState("guide");
  const [selectedBand, setSelectedBand] = useState(null);
  const [hidden, setHidden] = useState(() => new Set());

  const bands = useMemo(() => shells.data?.bands ?? [], [shells.data]);
  const visible = useMemo(() => new Set(bands.filter((b) => !hidden.has(b.id)).map((b) => b.id)), [bands, hidden]);
  const toggleBand = (bandId) => setHidden((prev) => {
    const next = new Set(prev);
    if (next.has(bandId)) next.delete(bandId);
    else next.add(bandId);
    return next;
  });

  const globeObjects = useMemo(() => items.map((i) => globeObjectFor(i, activeKey)).filter(Boolean), [items, activeKey]);
  const activeItem = items.find((i) => i.key === activeKey) ?? null;
  const focusOn = (key) => { focus(key); setFocusNonce((n) => n + 1); };
  const onToggle = (kind, id) => {
    toggle(kind, id);
    setFocusNonce((n) => n + 1);
  };

  // Distribución adaptable al ancho real (y al tamaño de texto elegido en Accesibilidad):
  // · ancho: panel de objetos a la izquierda y mapa a la derecha; si no, mapa arriba y panel debajo.
  // · la ficha va sobre el mapa si cabe; con poco espacio empieza contraída y en móviles va debajo.
  const outerRef = useRef(null);
  const mapRef = useRef(null);
  const rem = useRemPx();
  const outerWidth = useElementWidth(outerRef);
  const mapWidth = useElementWidth(mapRef);
  const wide = outerWidth >= 60 * rem;
  const cardOnMap = mapWidth >= 30 * rem;
  const roomy = mapWidth >= 46 * rem;
  const [cardExpanded, setCardExpanded] = useState(true);
  useEffect(() => { setCardExpanded(roomy || !cardOnMap); }, [activeKey, roomy, cardOnMap]);
  const cardWidth = Math.round(Math.min(20 * rem, mapWidth * 0.48));
  const overlayInset = activeItem && cardOnMap ? cardWidth + 12 : 0;

  const card = activeItem && (
    <MapObjectCard key={activeItem.key} item={activeItem} onFocus={() => focusOn(activeItem.key)} onRemove={() => remove(activeItem.key)}
      onDetails={() => setDetails({ kind: activeItem.kind, id: activeItem.id })}
      expanded={cardExpanded} onExpandedChange={setCardExpanded}
      className={cardOnMap ? "pointer-events-auto max-h-full" : ""} />
  );

  return (
    <>
      <PageHeader eyebrow="Workspace  /  Mapa 3D" title="Mapa 3D"
        description="Elige qué objetos ver alrededor de la Tierra: satélites, restos de cohetes, basura espacial y asteroides cercanos."
        actions={
          <span className="flex items-center gap-1.5 text-[0.75rem] text-muted-foreground">
            Visualización conceptual con datos reales
            <InfoTip align="end">
              Las órbitas de SATCAT respetan su tamaño, forma e inclinación, pero no su orientación ni la posición actual (el catálogo no incluye TLE/OMM).
              Los NEO se muestran a su distancia mínima registrada; el dataset no trae sus trayectorias ni fechas.
            </InfoTip>
          </span>
        } />

      <div ref={outerRef}>
        <Card className={cn("grid overflow-hidden", wide ? "h-[calc(100vh-16rem)] min-h-[32rem] grid-cols-[minmax(16rem,21rem)_minmax(0,1fr)]" : "grid-cols-[minmax(0,1fr)]")}>
          {/* Panel de selección */}
          <aside aria-label="Selección de objetos"
            className={cn("flex min-h-0 flex-col", wide ? "order-1 border-r" : "order-2 max-h-[42rem] border-t")}>
            <SelectionList items={items} activeKey={activeKey} onFocus={focusOn} onRemove={remove} onClear={clear} layers={layers} onLayers={setLayers} />
            <div className="flex min-h-0 flex-1 flex-col px-2 pt-3">
              <h2 className="mb-2 px-2 text-[0.875rem] font-semibold">Añadir objetos</h2>
              <ObjectBrowser isSelected={isSelected} onToggle={onToggle} />
            </div>
          </aside>

          {/* Mapa */}
          <div className={cn("flex min-h-0 flex-col", wide ? "order-2" : "order-1")}>
            <div ref={mapRef} className={cn("relative", wide ? "h-full" : "h-[min(34rem,70vh)] min-h-[22rem]")}>
              <Suspense fallback={<Skeleton className="h-full w-full rounded-none" />}>
                <GlobeView
                  bands={bands} visibleIds={visible} selectedBandId={selectedBand}
                  objects={globeObjects} focusKey={activeKey} focusNonce={focusNonce}
                  layers={layers} onLayersChange={setLayers} onObjectClick={focusOn}
                  title={activeItem?.data ? (activeItem.kind === "neo" ? activeItem.data.name : activeItem.data.object_name ?? `NORAD ${activeItem.id}`) : "Vista general"}
                  emptyHint="Selecciona objetos en el panel para verlos aquí. Empieza por “Destacados”."
                  overlayInset={overlayInset}
                  overlay={card && cardOnMap && (
                    <div className="pointer-events-none absolute bottom-16 right-3 top-14 flex flex-col justify-start" style={{ width: cardWidth }}>
                      {card}
                    </div>
                  )}
                  footer={<MapLegend objects={globeObjects} layers={layers} defaultOpen={roomy} />}
                />
              </Suspense>
            </div>
            {/* Sin espacio sobre el mapa (móviles), la ficha va debajo para no taparlo. */}
            {card && !cardOnMap && <div className="border-t p-3">{card}</div>}
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <Tabs tabs={DETAIL_TABS} value={tab} onChange={setTab} label="Análisis y detalles del mapa" idPrefix="map-detail" />
        <TabPanel id={tab} idPrefix="map-detail" className="pt-4">
          {tab === "guide" && <GuidePanel />}
          {tab === "shells" && (
            <ShellsPanel shells={shells} layers={layers} onLayers={setLayers} selectedBand={selectedBand} setSelectedBand={setSelectedBand}
              hidden={hidden} toggleBand={toggleBand} />
          )}
          {tab === "capabilities" && <CapabilitiesPanel />}
        </TabPanel>
      </div>

      <PageFooter note="El mapa no calcula trayectorias reales, ventanas de lanzamiento ni predicciones de colisión o impacto." />
      {details?.kind === "satcat" && <SatelliteDetailPanel id={details.id} onClose={() => setDetails(null)} />}
      {details?.kind === "neo" && <NeoDetailPanel id={details.id} onClose={() => setDetails(null)} />}
    </>
  );
}

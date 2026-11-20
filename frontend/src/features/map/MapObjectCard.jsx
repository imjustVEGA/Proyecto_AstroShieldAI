/**
 * Panel de información del objeto activo en el mapa 3D: datos esenciales en lenguaje sencillo
 * y acceso a la ficha técnica completa (se abre como panel lateral, sin salir del mapa).
 * Distingue siempre entre proximidad y riesgo: no hay probabilidad de impacto en los datos.
 */
import { ChevronDown, ChevronUp, Crosshair, FileText, Loader2, X } from "lucide-react";
import { useState } from "react";

import { ErrorState } from "@/components/common";
import { categoryOf, GLOSSARY, HazardBadge, ORBIT_CLASS_LABEL } from "@/components/labels";
import { Badge, Button, InfoTip } from "@/components/ui/primitives";
import { cn } from "@/utils/cn";
import { formatDate, formatDiameterRange, formatInt, formatNumber } from "@/utils/format";
import {
  ATTENTION, describeNeo, describeSatellite, orbitFor, satelliteSpeed, satelliteStatus, typeLabel,
} from "./mapModel";

/** Fila dato–valor con ayuda opcional; `muted` indica que el dato no está disponible. */
function Fact({ label, help, children, muted }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/70 py-2 last:border-0">
      <dt className="flex items-center gap-1 text-[0.8125rem] text-muted-foreground">
        {label}
        {help && <InfoTip align="start">{help}</InfoTip>}
      </dt>
      <dd className={cn("tabular text-right text-[0.8125rem] font-medium", muted && "font-normal text-muted-foreground")}>{children}</dd>
    </div>
  );
}

function SatelliteFacts({ d }) {
  const dyn = satelliteSpeed(d);
  const hasOrbit = Boolean(orbitFor(d));
  return (
    <dl>
      <Fact label="Altura sobre la Tierra" help={`Entre el ${GLOSSARY.perigeo.toLowerCase()} y el ${GLOSSARY.apogeo.toLowerCase()}`}>
        {d.perigee_km != null && d.apogee_km != null ? `${formatInt(d.perigee_km)} – ${formatInt(d.apogee_km)} km` : "Sin dato"}
      </Fact>
      <Fact label="Velocidad orbital" help="Calculada con la ecuación vis-viva a partir del apogeo y el perigeo del catálogo (no es una medición).">
        {dyn ? (Math.abs(dyn.vPerigee - dyn.vApogee) < 0.05
          ? `${formatNumber(dyn.vPerigee, 2)} km/s`
          : `${formatNumber(dyn.vApogee, 2)} – ${formatNumber(dyn.vPerigee, 2)} km/s`) : "No calculable"}
      </Fact>
      <Fact label="Una vuelta cada">{d.period_min != null ? `${formatNumber(d.period_min, 1)} min` : "Sin dato"}</Fact>
      <Fact label="Inclinación" help={GLOSSARY["inclinación"]}>{d.inclination_deg != null ? `${formatNumber(d.inclination_deg, 1)}°` : "Sin dato"}</Fact>
      <Fact label="Clasificación orbital" help={d.orbit_class ? GLOSSARY[d.orbit_class] : undefined}>
        {d.orbit_class ? ORBIT_CLASS_LABEL[d.orbit_class] : "Sin clase"}
      </Fact>
      <Fact label="Trayectoria" help="SATCAT da tamaño, forma e inclinación de la órbita, pero no su orientación (RAAN, argumento del perigeo) ni la época. Por eso la órbita es esquemática y el marcador señala el perigeo.">
        {hasOrbit ? "Órbita esquemática" : "No dibujable"}
      </Fact>
      <Fact label="Posición actual" help={GLOSSARY.TLE} muted>No disponible</Fact>
      <Fact label="Estado de monitoreo">{`Catalogado · ${satelliteStatus(d)}`}</Fact>
      <Fact label="Nivel de riesgo" muted
        help="Calcular un riesgo de colisión requiere posiciones precisas (TLE/OMM) y análisis de conjunciones, que este dataset no incluye.">
        No calculable con estos datos
      </Fact>
    </dl>
  );
}

function NeoFacts({ d }) {
  const tier = ATTENTION[d.tier];
  return (
    <dl>
      <Fact label="Distancia mínima registrada" help={`${GLOSSARY.LD} Distancia de su paso más cercano entre las aproximaciones del dataset.`}>
        {formatNumber(d.min_miss_distance_ld, 2)} LD
        <span className="block text-[0.75rem] font-normal text-muted-foreground">{formatInt(d.min_miss_distance_km)} km</span>
      </Fact>
      <Fact label="Velocidad relativa máx." help="Velocidad respecto a la Tierra en su aproximación más rápida. La fuente no documenta la unidad; se interpreta como km/h.">
        {formatNumber(d.max_relative_velocity_kms, 1)} km/s
        <span className="block text-[0.75rem] font-normal text-muted-foreground">{formatInt(d.max_relative_velocity_kms * 3600)} km/h</span>
      </Fact>
      <Fact label="Diámetro estimado" help="Rango calculado a partir de su brillo (magnitud H) suponiendo distintos albedos.">
        {formatDiameterRange(d.est_diameter_min_km, d.est_diameter_max_km)}
      </Fact>
      <Fact label="Fecha de aproximación" help="El CSV de NASA NeoWs usado no incluye las fechas de las aproximaciones." muted>No disponible</Fact>
      <Fact label="Trayectoria" help="El dataset no contiene elementos orbitales del asteroide. El mapa muestra la distancia real de su paso más cercano; la dirección del marcador es ilustrativa." muted>
        No disponible
      </Fact>
      <Fact label="Nivel de atención" help={`Prioridad de revisión del sistema (reglas transparentes, no probabilidad). ${d.reasons?.length ? `Reglas activadas: ${d.reasons.join(" · ")}.` : ""}`}>
        {tier ? <Badge variant={tier.variant} dot>{tier.level} · {tier.label}</Badge> : "—"}
      </Fact>
      <Fact label="Probabilidad de impacto" muted
        help="No se calcula: requiere la órbita completa y su incertidumbre (como hace NASA Sentry). Estar cerca no significa que vaya a impactar.">
        No calculada
      </Fact>
    </dl>
  );
}

export default function MapObjectCard({ item, onFocus, onRemove, onDetails, className, style, expanded: expandedProp, onExpandedChange }) {
  const [innerExpanded, setInnerExpanded] = useState(true);
  const expanded = expandedProp ?? innerExpanded;
  const setExpanded = (fn) => {
    const next = typeof fn === "function" ? fn(expanded) : fn;
    if (onExpandedChange) onExpandedChange(next);
    else setInnerExpanded(next);
  };
  if (!item) return null;
  const { kind, id, data, error, loading } = item;
  const category = categoryOf(kind, data?.object_type);
  const Icon = category.icon;
  const name = data ? (kind === "neo" ? data.name : data.object_name ?? `NORAD ${id}`) : kind === "neo" ? `NEO ${id}` : `NORAD ${id}`;

  return (
    <section aria-label={`Información de ${name}`}
      className={cn("flex max-h-full flex-col overflow-hidden rounded-lg border bg-popover/95 shadow-2xl backdrop-blur", className)}
      style={{ borderTopColor: category.color, borderTopWidth: 3, ...style }}>
      <header className="flex items-start gap-3 p-4 pb-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-md border" style={{ borderColor: `${category.color}66`, background: `${category.color}1f`, color: category.color }}>
          <Icon className="size-[1.1rem]" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[1rem] font-semibold leading-tight" title={name}>{name}</h2>
          <p className="mt-0.5 text-[0.75rem] text-muted-foreground">
            {kind === "neo" ? `${category.long} · id ${id}` : `${data ? typeLabel(data) : "Objeto"} · NORAD ${id}`}
          </p>
        </div>
        <button type="button" onClick={() => setExpanded((e) => !e)} aria-expanded={expanded}
          aria-label={expanded ? "Mostrar menos datos" : "Mostrar más datos"}
          className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground">
          {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-3 scrollbar-dark">
        {loading && <p className="flex items-center gap-2 py-4 text-[0.8125rem] text-muted-foreground" role="status"><Loader2 className="size-4 animate-spin" /> Cargando ficha…</p>}
        {error && <ErrorState error={error} />}
        {data && (
          <>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {kind === "neo" ? (
                <>
                  <HazardBadge hazardous={data.is_hazardous} />
                  {ATTENTION[data.tier] && <Badge variant={ATTENTION[data.tier].variant} dot>Atención {ATTENTION[data.tier].level.toLowerCase()}</Badge>}
                  {data.is_hazardous && <InfoTip align="start" label="¿Qué es PHA?">{GLOSSARY.PHA}</InfoTip>}
                </>
              ) : (
                <>
                  {data.orbit_class && <Badge variant="accent">{data.orbit_class}</Badge>}
                  <Badge variant={data.is_decayed ? "muted" : data.is_active ? "good" : "muted"} dot>{satelliteStatus(data)}</Badge>
                </>
              )}
            </div>
            <p className="mb-2 text-[0.8125rem] leading-relaxed text-secondary-foreground">
              {kind === "neo" ? describeNeo(data) : describeSatellite(data)}
            </p>
            {kind === "satcat" && data.is_decayed && (
              <p className="mb-2 rounded-md border border-status-warning/40 bg-status-warning/10 px-2.5 py-1.5 text-[0.75rem] text-amber-100">
                Reingresó el {formatDate(data.decay_date)}: la órbita mostrada es la última registrada.
              </p>
            )}
            {expanded && (kind === "neo" ? <NeoFacts d={data} /> : <SatelliteFacts d={data} />)}
            {!expanded && (
              <button type="button" onClick={() => setExpanded(true)} className="text-[0.8125rem] font-medium text-blue-300 hover:text-blue-200">
                Ver distancia, velocidad y más datos
              </button>
            )}
          </>
        )}
      </div>

      <footer className="flex flex-wrap gap-2 border-t p-3">
        <Button size="sm" onClick={onDetails} disabled={!data}><FileText /> Datos técnicos</Button>
        <Button size="sm" variant="outline" onClick={onFocus}><Crosshair /> Enfocar</Button>
        <Button size="sm" variant="ghost" className="ml-auto text-muted-foreground" onClick={onRemove}><X /> Quitar</Button>
      </footer>
    </section>
  );
}

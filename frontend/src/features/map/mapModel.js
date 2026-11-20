/**
 * Convierte las fichas reales (SATCAT / NEO) en lo que dibuja el mapa 3D y en textos breves
 * para personas sin formación en astronomía. Nada se inventa: si un dato no está, se dice.
 */
import { categoryOf, OBJECT_TYPE_LABEL, OPS_STATUS_LABEL } from "@/components/labels";
import { formatInt, formatNumber, LUNAR_DISTANCE_KM } from "@/utils/format";
import { orbitDynamics } from "@/utils/orbit";

/** Solo se dibuja la órbita si hay datos suficientes y el objeto orbita la Tierra. */
export function orbitFor(o) {
  if (!o || o.orbit_center !== "EA" || o.apogee_km == null || o.perigee_km == null || o.inclination_deg == null) return null;
  return {
    apogeeKm: o.apogee_km, perigeeKm: o.perigee_km, inclinationDeg: o.inclination_deg,
    label: o.object_name ?? `NORAD ${o.norad_cat_id}`, sublabel: `NORAD ${o.norad_cat_id} · ${o.orbit_class ?? "órbita"}`,
  };
}

/** Dirección ilustrativa (estable por objeto) para colocar el marcador de un NEO sobre su anillo de distancia. */
const neoAngle = (id) => ((id * 137.508) % 360) - 180;

export function globeObjectFor(item, activeKey) {
  const { key, kind, id, data } = item;
  if (!data) return null;
  const category = categoryOf(kind, data.object_type);
  const active = key === activeKey;
  const dimmed = Boolean(activeKey) && !active;
  if (kind === "neo") {
    return {
      key, kind, label: data.name, color: category.color, active, dimmed,
      approachKm: data.min_miss_distance_km, angleDeg: neoAngle(id),
      attention: data.tier === "A" || data.tier === "B" ? data.tier : null,
      sublabel: `${formatNumber(data.min_miss_distance_ld, 2)} LD · atención ${{ A: "alta", B: "media", C: "baja" }[data.tier] ?? "—"}`,
    };
  }
  const orbit = orbitFor(data);
  return {
    key, kind, label: data.object_name ?? `NORAD ${id}`, color: category.color, active, dimmed, orbit,
    sublabel: orbit ? `${data.orbit_class ?? ""} · ${formatInt(data.perigee_km)}–${formatInt(data.apogee_km)} km` : "sin órbita dibujable",
  };
}

const REGIME_TEXT = {
  LEO: "en órbita baja (LEO)",
  MEO: "en órbita media (MEO)",
  GEO: "en órbita geoestacionaria (GEO)",
  HEO: "en una órbita alta o muy elíptica (HEO)",
};

const TYPE_TEXT = {
  PAY: "Satélite o carga útil",
  "R/B": "Etapa de cohete",
  DEB: "Fragmento de basura espacial",
  UNK: "Objeto sin clasificar",
};

/** Resumen en lenguaje sencillo de un objeto SATCAT. */
export function describeSatellite(d) {
  const parts = [];
  const status = d.is_decayed ? "que ya reingresó a la atmósfera" : d.is_active ? "activo" : d.object_type === "PAY" ? "sin operación confirmada" : null;
  parts.push(`${TYPE_TEXT[d.object_type] ?? "Objeto"}${status ? ` ${status}` : ""}`);
  if (d.orbit_class && d.apogee_km != null && d.perigee_km != null) {
    parts[0] += ` ${REGIME_TEXT[d.orbit_class] ?? ""}, entre ${formatInt(d.perigee_km)} y ${formatInt(d.apogee_km)} km de altura.`;
  } else {
    parts[0] += ". El catálogo no tiene sus parámetros orbitales completos.";
  }
  if (d.period_min != null && !d.is_decayed) {
    parts.push(d.period_min < 180
      ? `Da una vuelta a la Tierra cada ${formatInt(d.period_min)} minutos.`
      : `Da una vuelta a la Tierra cada ${formatNumber(d.period_min / 60, 1)} horas.`);
  }
  return parts.join(" ");
}

/** Velocidad orbital calculada con la ecuación vis-viva a partir de apogeo y perigeo reales. */
export function satelliteSpeed(d) {
  if (d.apogee_km == null || d.perigee_km == null || d.orbit_center !== "EA") return null;
  const dyn = orbitDynamics({ apogeeKm: Math.max(d.apogee_km, d.perigee_km), perigeeKm: Math.min(d.apogee_km, d.perigee_km) });
  return dyn;
}

export function satelliteStatus(d) {
  if (d.is_decayed) return "Reingresado";
  if (d.ops_status_code) return OPS_STATUS_LABEL[d.ops_status_code] ?? d.ops_status_code;
  return "Sin dato de operación";
}

export const typeLabel = (d) => OBJECT_TYPE_LABEL[d.object_type] ?? d.object_type;

/** Resumen en lenguaje sencillo de un NEO. */
export function describeNeo(d) {
  const size = d.est_diameter_max_km != null
    ? d.est_diameter_max_km < 1
      ? `de unos ${formatInt(d.est_diameter_min_km * 1000)} a ${formatInt(d.est_diameter_max_km * 1000)} m`
      : `de unos ${formatNumber(d.est_diameter_min_km, 1)} a ${formatNumber(d.est_diameter_max_km, 1)} km`
    : "de tamaño desconocido";
  const ld = d.min_miss_distance_km / LUNAR_DISTANCE_KM;
  const where = ld < 1
    ? `más cerca que la Luna (${formatNumber(ld, 2)} veces su distancia)`
    : `a ${formatNumber(ld, 1)} veces la distancia de la Luna`;
  return `Asteroide ${size}. Su paso más cercano registrado fue ${where}, unos ${formatNumber(d.min_miss_distance_km / 1e6, 2)} millones de km. `
    + `Tiene ${formatInt(d.observation_count)} ${d.observation_count === 1 ? "aproximación registrada" : "aproximaciones registradas"} en el dataset.`;
}

export const ATTENTION = {
  A: { level: "Alta", label: "Revisión prioritaria", variant: "critical" },
  B: { level: "Media", label: "Seguimiento", variant: "warning" },
  C: { level: "Baja", label: "Rutina", variant: "good" },
};

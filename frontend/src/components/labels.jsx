// Etiquetas y badges con significado consistente en toda la aplicación.
import { Badge } from "@/components/ui/primitives";

export const OBJECT_TYPE_LABEL = {
  PAY: "Carga útil",
  "R/B": "Cuerpo de cohete",
  DEB: "Fragmento",
  UNK: "Desconocido",
};

// Colores categóricos validados (dataviz, modo oscuro). Orden fijo por tipo; nunca se reasignan.
export const OBJECT_TYPE_COLOR = {
  PAY: "#3987e5",
  "R/B": "#d95926",
  DEB: "#199e70",
  UNK: "#c98500",
};

export const OPS_STATUS_LABEL = {
  "+": "Operativo",
  "-": "No operativo",
  P: "Parcial",
  B: "Respaldo",
  S: "Reserva",
  X: "Misión extendida",
  D: "Reingresado",
  "?": "Desconocido",
};

export const QUALITY_FLAG_LABEL = {
  missing_orbital_params: "Parámetros orbitales incompletos",
  missing_rcs: "Sin RCS",
  no_orbital_elements: "Sin elementos orbitales (fuente)",
  apogee_below_perigee: "Apogeo < perigeo",
  period_inconsistent: "Periodo incoherente con apogeo/perigeo",
  decay_status_mismatch: "Estado y reingreso incoherentes",
  hazardous_h_above_threshold: "Peligroso con H > 22",
  diameter_h_mismatch: "Diámetro ≠ derivado de H",
  inconsistent_object_attributes: "Atributos distintos entre registros",
  diameter_min_gt_max: "Diámetro mín. > máx.",
  identical_record: "Registro idéntico a otro",
  nonpositive_value: "Valor no positivo",
};

export function ObjectTypeLabel({ type, owner }) {
  return (
    <span className="leading-tight">
      <span className="flex items-center gap-1.5">
        <span className="size-1.5 rounded-full" style={{ background: OBJECT_TYPE_COLOR[type] }} aria-hidden />
        {OBJECT_TYPE_LABEL[type] ?? type}
      </span>
      {owner !== undefined && <span className="block pl-3 text-[10.5px] text-muted-foreground">{owner ?? "—"}</span>}
    </span>
  );
}

export function HazardBadge({ hazardous }) {
  return hazardous
    ? <Badge variant="warning" dot>Potencialmente peligroso</Badge>
    : <Badge variant="good" dot>No peligroso</Badge>;
}

const TIER = {
  A: { variant: "critical", level: "Alta", label: "Revisión prioritaria" },
  B: { variant: "warning", level: "Media", label: "Seguimiento" },
  C: { variant: "good", level: "Baja", label: "Rutina" },
};

export const tierInfo = (tier) => TIER[tier];

export function TierBadge({ tier, short = false }) {
  const t = TIER[tier];
  if (!t) return null;
  return <Badge variant={t.variant} dot>{short ? t.level : `${t.level} · ${t.label}`}</Badge>;
}

export function StateBadge({ decayed, active, status }) {
  if (decayed) return <Badge variant="muted" dot>Reingresado</Badge>;
  if (active) return <Badge variant="accent" dot>{OPS_STATUS_LABEL[status ?? ""] ?? "Activo"}</Badge>;
  return <Badge variant="muted" dot>{status ? (OPS_STATUS_LABEL[status] ?? status) : "Sin dato"}</Badge>;
}

// Objetos reales del catálogo usados como ejemplos en el explorador (verificados en SATCAT).
export const FEATURED_OBJECTS = [
  { id: 25544, name: "ISS (ZARYA)", note: "Estación espacial · LEO" },
  { id: 48274, name: "CSS (TIANHE)", note: "Estación espacial · LEO" },
  { id: 20580, name: "HST", note: "Telescopio Hubble · LEO" },
  { id: 27424, name: "AQUA", note: "Observación terrestre · heliosíncrona" },
  { id: 16182, name: "SL-16 R/B", note: "Cuerpo de cohete · LEO" },
  { id: 29733, name: "FENGYUN 1C DEB", note: "Fragmento de 2007 · LEO" },
  { id: 24876, name: "NAVSTAR 43 (USA 132)", note: "GPS · MEO" },
  { id: 36516, name: "SES-1", note: "Comunicaciones · GEO" },
  { id: 25847, name: "MOLNIYA 3-50", note: "Órbita Molniya · HEO" },
];

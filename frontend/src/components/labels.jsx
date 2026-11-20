// Etiquetas y badges con significado consistente en toda la aplicación.
import { HelpCircle, Rocket, Satellite, Sparkles } from "lucide-react";
import { Telescope } from "@/components/icons";
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
      {owner !== undefined && <span className="block pl-3 text-[0.75rem] text-muted-foreground">{owner ?? "—"}</span>}
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
  { id: 25544, type: "PAY", name: "ISS (ZARYA)", note: "Estación espacial · LEO" },
  { id: 48274, type: "PAY", name: "CSS (TIANHE)", note: "Estación espacial · LEO" },
  { id: 20580, type: "PAY", name: "HST", note: "Telescopio Hubble · LEO" },
  { id: 27424, type: "PAY", name: "AQUA", note: "Observación terrestre · heliosíncrona" },
  { id: 16182, type: "R/B", name: "SL-16 R/B", note: "Cuerpo de cohete · LEO" },
  { id: 29733, type: "DEB", name: "FENGYUN 1C DEB", note: "Fragmento de 2007 · LEO" },
  { id: 24876, type: "PAY", name: "NAVSTAR 43 (USA 132)", note: "GPS · MEO" },
  { id: 36516, type: "PAY", name: "SES-1", note: "Comunicaciones · GEO" },
  { id: 25847, type: "PAY", name: "MOLNIYA 3-50", note: "Órbita Molniya · HEO" },
];

/**
 * Categorías del mapa 3D y del buscador de objetos: mismo nombre, color e icono en la lista,
 * la leyenda, el globo y las fichas. Los colores de SATCAT son los de OBJECT_TYPE_COLOR
 * (validados para las gráficas); el NEO usa un violeta que no se confunde con ellos.
 */
export const CATEGORY = {
  neo: {
    id: "neo", label: "NEO", long: "Asteroides cercanos (NEO)", color: "#c084fc", icon: Telescope, natural: true,
    description: "Asteroides cuya órbita alrededor del Sol los acerca a la Tierra. Datos de NASA NeoWs.",
  },
  PAY: {
    id: "PAY", label: "Satélites", long: "Satélites y cargas útiles", color: OBJECT_TYPE_COLOR.PAY, icon: Satellite,
    description: "Objetos lanzados con una misión: satélites, estaciones, telescopios. SATCAT los llama “carga útil” (PAY).",
  },
  "R/B": {
    id: "R/B", label: "Cohetes", long: "Cuerpos de cohete", color: OBJECT_TYPE_COLOR["R/B"], icon: Rocket,
    description: "Etapas de cohete que quedaron en órbita después de un lanzamiento (R/B).",
  },
  DEB: {
    id: "DEB", label: "Basura espacial", long: "Basura espacial (fragmentos)", color: OBJECT_TYPE_COLOR.DEB, icon: Sparkles,
    description: "Fragmentos de explosiones, colisiones o piezas desprendidas (DEB).",
  },
  UNK: {
    id: "UNK", label: "Sin clasificar", long: "Objetos sin clasificar", color: OBJECT_TYPE_COLOR.UNK, icon: HelpCircle,
    description: "Objetos catalogados cuyo tipo no se conoce (UNK).",
  },
};

export const categoryOf = (kind, objectType) => (kind === "neo" ? CATEGORY.neo : CATEGORY[objectType] ?? CATEGORY.UNK);

/** Explicaciones breves de abreviaturas y términos (tooltips en todo el sistema). */
export const GLOSSARY = {
  NEO: "Near-Earth Object: asteroide o cometa cuya órbita lo acerca a menos de 1,3 UA del Sol, cerca de la órbita terrestre.",
  PHA: "Potentially Hazardous Asteroid: clasificación de NASA para asteroides grandes (H ≤ 22) cuya órbita pasa a ≤ 0,05 UA de la terrestre. No significa que vaya a impactar.",
  LD: "Distancia lunar: distancia media de la Tierra a la Luna, 384.399 km.",
  UA: "Unidad astronómica: distancia media de la Tierra al Sol, 149,6 millones de km. 0,05 UA ≈ 19,5 LD.",
  NORAD: "Número de catálogo que identifica a cada objeto artificial rastreado (NORAD_CAT_ID).",
  SATCAT: "Catálogo de satélites de CelesTrak con todos los objetos artificiales lanzados desde 1957.",
  LEO: "Órbita baja: hasta 2.000 km de altura. Aquí están la ISS y la mayoría de los satélites.",
  MEO: "Órbita media: entre 2.000 km y la órbita geoestacionaria. Aquí está el GPS.",
  GEO: "Órbita geoestacionaria: ~35.786 km de altura; el objeto parece fijo sobre un punto del ecuador.",
  HEO: "Órbita alta o muy elíptica: se aleja más allá de GEO o combina perigeo bajo con apogeo muy alto.",
  apogeo: "Punto de la órbita más alejado de la Tierra.",
  perigeo: "Punto de la órbita más cercano a la Tierra.",
  inclinación: "Ángulo entre el plano de la órbita y el ecuador. 0° = ecuatorial; 90° = polar.",
  H: "Magnitud absoluta: brillo intrínseco del asteroide. Menor H = objeto más grande.",
  RCS: "Sección radar equivalente: qué tan grande “se ve” el objeto en el radar (m²).",
  TLE: "Elementos orbitales de dos líneas (TLE/OMM): permiten calcular la posición real de un satélite. Este dataset no los incluye.",
};

/** Clase orbital con su explicación accesible. */
export const ORBIT_CLASS_LABEL = {
  LEO: "Órbita baja (LEO)",
  MEO: "Órbita media (MEO)",
  GEO: "Geoestacionaria (GEO)",
  HEO: "Órbita alta o elíptica (HEO)",
};

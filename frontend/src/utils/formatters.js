/** Formateadores de unidades y cantidades del dominio espacial. */
const numberFormatter = new Intl.NumberFormat("es-MX");

/** Formatea un número con separadores locales. */
export function formatNumber(value) {
  /** Convierte valores inválidos en un marcador estable para la UI. */
  if (!Number.isFinite(Number(value))) return "—";
  return numberFormatter.format(Number(value));
}

/** Formatea una distancia en kilómetros. */
export function formatKm(value) {
  /** Añade la unidad de distancia al número formateado. */
  return `${formatNumber(value)} km`;
}

/** Formatea una velocidad en kilómetros por hora. */
export function formatKmh(value) {
  /** Añade la unidad de velocidad al número formateado. */
  return `${formatNumber(value)} km/h`;
}

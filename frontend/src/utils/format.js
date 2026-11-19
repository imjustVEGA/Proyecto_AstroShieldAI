/** Formato numérico y de fechas en español (México), igual que en Astroshield AI. */
const LOCALE = "es-MX";

export const LUNAR_DISTANCE_KM = 384_399;
export const AU_KM = 149_597_870.7;

export function formatInt(value) {
  return value == null || Number.isNaN(value) ? "—" : new Intl.NumberFormat(LOCALE).format(Math.round(value));
}

export function formatNumber(value, digits = 1) {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat(LOCALE, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
}

export function formatPercent(share, digits = 1) {
  return share == null ? "—" : `${formatNumber(share * 100, digits)} %`;
}

export function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  return new Intl.DateTimeFormat(LOCALE, { dateStyle: "medium" }).format(date);
}

export function formatDateTime(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(LOCALE, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

/** Diámetro en km → texto en m o km según magnitud. */
export function formatDiameter(km) {
  if (km == null) return "—";
  return km < 1 ? `${formatInt(km * 1000)} m` : `${formatNumber(km, 2)} km`;
}

export function formatDiameterRange(minKm, maxKm) {
  if (minKm == null || maxKm == null) return "—";
  return maxKm < 1
    ? `${formatInt(minKm * 1000)}–${formatInt(maxKm * 1000)} m`
    : `${formatNumber(minKm, 2)}–${formatNumber(maxKm, 2)} km`;
}

/** Etiqueta de un intervalo de histograma; null = extremo abierto. */
export function formatBin(start, end, unit = "", digits = 0) {
  const f = (v) => (Math.abs(v) < 1 && v !== 0 ? formatNumber(v, 3) : formatNumber(v, digits));
  if (start == null && end != null) return `< ${f(end)}${unit}`;
  if (end == null && start != null) return `≥ ${f(start)}${unit}`;
  return `${f(start ?? 0)}–${f(end ?? 0)}${unit}`;
}

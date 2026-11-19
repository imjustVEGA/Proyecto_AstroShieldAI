// Geometría de órbitas ESQUEMÁTICAS a partir de los parámetros de SATCAT (portado de Astroshield AI).
//
// SATCAT da apogeo, perigeo e inclinación, pero no RAAN, argumento del perigeo ni época.
// Con eso se puede dibujar el tamaño, la forma y la inclinación reales de la órbita,
// pero NO su orientación ni la posición del objeto: se fijan RAAN = 0 y ω = 0.

export const EARTH_RADIUS_KM = 6378.137;
export const EARTH_MU_KM3_S2 = 398600.4418;
export const GEO_ALTITUDE_KM = 35_786;

export function orbitElements({ apogeeKm, perigeeKm }) {
  const ra = EARTH_RADIUS_KM + Math.max(apogeeKm, perigeeKm);
  const rp = EARTH_RADIUS_KM + Math.min(apogeeKm, perigeeKm);
  const a = (ra + rp) / 2;
  const e = (ra - rp) / (ra + rp);
  return { ra, rp, a, e };
}

/** Puntos de la elipse en km (marco fijo terrestre, RAAN = ω = 0). */
export function schematicOrbitPoints(spec, segments = 240) {
  const { a, e } = orbitElements(spec);
  const p = a * (1 - e * e);
  const inc = (spec.inclinationDeg * Math.PI) / 180;
  const at = (nu) => {
    const r = p / (1 + e * Math.cos(nu));
    const x = r * Math.cos(nu);
    const y = r * Math.sin(nu);
    return [x, y * Math.cos(inc), y * Math.sin(inc)];
  };
  const points = [];
  for (let i = 0; i <= segments; i++) points.push(at((2 * Math.PI * i) / segments));
  return { points, perigee: at(0), apogee: at(Math.PI) };
}

/** Convierte un punto cartesiano (km, eje z = norte) en latitud, longitud y altitud en radios terrestres. */
export function toGeo([x, y, z]) {
  const r = Math.hypot(x, y, z);
  return {
    lat: (Math.asin(z / r) * 180) / Math.PI,
    lng: (Math.atan2(y, x) * 180) / Math.PI,
    alt: r / EARTH_RADIUS_KM - 1,
  };
}

/** Clasificación orbital con los mismos umbrales del backend. */
export function orbitClass(apogeeKm, perigeeKm) {
  const high = Math.max(apogeeKm, perigeeKm);
  const low = Math.min(apogeeKm, perigeeKm);
  if (high <= 2000) return "LEO";
  if (low >= GEO_ALTITUDE_KM - 200 && high <= GEO_ALTITUDE_KM + 200) return "GEO";
  if (low > 2000 && high < GEO_ALTITUDE_KM - 200) return "MEO";
  return "HEO";
}

/** Periodo (min) y velocidades por vis-viva (km/s) de una órbita kepleriana. */
export function orbitDynamics(spec) {
  const { ra, rp, a, e } = orbitElements(spec);
  const periodMin = (2 * Math.PI * Math.sqrt(a ** 3 / EARTH_MU_KM3_S2)) / 60;
  const visViva = (r) => Math.sqrt(EARTH_MU_KM3_S2 * (2 / r - 1 / a));
  return { a, e, periodMin, vPerigee: visViva(rp), vApogee: visViva(ra), revsPerDay: 1440 / periodMin };
}

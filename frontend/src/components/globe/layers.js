/**
 * Capas del mapa 3D y reglas de visibilidad compartidas por el globo y su leyenda
 * (módulo aparte para no cargar three.js en el paquete principal).
 */
import { orbitElements } from "@/utils/orbit";

export const DEFAULT_LAYERS = { trajectories: true, references: false, shells: false };

export const EARTH_RADIUS_KM = 6371; // radio que usa three-globe para convertir altitudes
export const MOON_DISTANCE_KM = 384_399;

/** Radio exterior (km desde el centro de la Tierra) que debe caber en la vista para un objeto. */
export function objectExtentKm(o) {
  if (o.orbit) return orbitElements(o.orbit).ra;
  if (o.approachKm) return o.approachKm;
  return EARTH_RADIUS_KM;
}

/**
 * Objetos que se dibujan con el objeto activo enfocado. La cámara queda a ~2,8 veces el tamaño
 * del objeto activo: una órbita o un anillo más grande rodearía a la cámara y solo se vería como
 * líneas sueltas en el horizonte, así que se omite hasta enfocarlo (sigue en la lista "En el mapa").
 */
export function drawnObjects(objects) {
  const active = objects.find((o) => o.active);
  if (!active) return objects;
  const limit = objectExtentKm(active) * 2.5;
  return objects.filter((o) => o.active || objectExtentKm(o) <= limit);
}

/** ¿Se dibuja la órbita de la Luna como referencia? */
export function showsMoon(objects, layers) {
  const active = objects.find((o) => o.active);
  return layers.references || (layers.trajectories && (active ? Boolean(active.approachKm) : objects.some((o) => o.approachKm)));
}

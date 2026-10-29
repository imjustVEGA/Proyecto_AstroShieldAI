/** Constantes visuales y de navegación compartidas por el frontend. */
export const RISK_COLORS = {
  ALTA: "#EF4444",
  MEDIA: "#F97316",
  BAJA: "#22D3EE",
};

export const NAV_ITEMS = [
  { label: "Dashboard", path: "/", icon: "dashboard" },
  { label: "Explorador espacial", path: "/explorer", icon: "explorer" },
  { label: "Objetos NEO", path: "/neos", icon: "neos" },
  { label: "Catálogo SATCAT", path: "/satcat", icon: "satcat" },
  { label: "Análisis de riesgos", path: "/risks", icon: "risks" },
  { label: "Simulación orbital", path: "#", icon: "simulation", disabled: true },
  { label: "Reportes", path: "#", icon: "reports", disabled: true },
  { label: "Configuración", path: "#", icon: "settings", disabled: true },
];

export const AI_TRANSPARENCY_NOTE =
  "Estás interactuando con un sistema automatizado. Los resultados los generan modelos de IA (Random Forest e Isolation Forest) y pueden contener errores. Repórtalos con el botón 'Reportar error'.";

export const GLOBE_PALETTE = {
  background: "#0B1020",
  globe: "#141B2E",
  orbit: "#22D3EE",
  atmosphere: "#3B82F6",
  hazardous: "#EF4444",
  safe: "#22D3EE",
};

const REAL_GLOBE_OBJECTS = [
  { id: "ISS", name: "ISS (ZARYA)", lat: 51.6, lng: -0.1, altitude: 0.18, hazardous: false, type: "SATCAT" },
  { id: "99942", name: "Apophis", lat: 12.4, lng: 42.8, altitude: 0.42, hazardous: true, type: "NEO" },
  { id: "101955", name: "Bennu", lat: -8.3, lng: 128.1, altitude: 0.36, hazardous: true, type: "NEO" },
  { id: "1566", name: "Icarus", lat: 34.2, lng: -112.7, altitude: 0.49, hazardous: true, type: "NEO" },
];

const GENERATED_GLOBE_OBJECTS = Array.from({ length: 1200 }, (_, index) => {
  const isNeo = index % 5 === 0;
  const hazardous = isNeo && index % 3 === 0;
  return {
    id: `${100000 + index}`,
    name: isNeo ? `NEO-${String(index + 1).padStart(4, "0")}` : `SATCAT-${String(index + 1).padStart(4, "0")}`,
    lat: Math.sin(index * 2.17) * 78,
    lng: ((index * 137.5 + 21) % 360) - 180,
    altitude: 0.1 + ((index * 17) % 51) / 100,
    hazardous,
    type: isNeo ? "NEO" : "SATCAT",
  };
});

export const MOCK_GLOBE_OBJECTS = [...REAL_GLOBE_OBJECTS, ...GENERATED_GLOBE_OBJECTS];

const createOrbit = (radius, tilt, phase = 0) => {
  const startAngle = phase;
  const endAngle = phase + Math.PI;
  return {
    startLat: Math.sin(startAngle) * tilt,
    startLng: Math.cos(startAngle) * radius,
    endLat: Math.sin(endAngle) * tilt,
    endLng: Math.cos(endAngle) * radius,
  };
};

export const ORBIT_LINES = [
  { name: "LEO", ...createOrbit(55, 25) },
  { name: "MEO", ...createOrbit(70, 45, 0.4) },
  { name: "GEO", ...createOrbit(180, 0, 0.8) },
  { name: "HEO", ...createOrbit(145, 62, 1.2) },
  { name: "Polar", ...createOrbit(90, 82, 1.8) },
  { name: "NEO", ...createOrbit(135, 35, 2.4) },
];

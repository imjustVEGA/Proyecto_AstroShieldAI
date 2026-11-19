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
  { label: "Simulación orbital", path: "/simulacion", icon: "simulation" },
  { label: "Reportes", path: "/reportes", icon: "reports" },
  { label: "Configuración", path: "/configuracion", icon: "settings" },
  { label: "Usuarios", path: "/usuarios", icon: "users", adminOnly: true },
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

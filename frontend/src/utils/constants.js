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

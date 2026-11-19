/** Constantes de navegación y textos compartidos por el frontend. */

// `section` agrupa el menú como en Astroshield AI (Workspace / Laboratorio / Sistema).
export const NAV_ITEMS = [
  { label: "Dashboard", path: "/", icon: "dashboard", section: "Workspace" },
  { label: "Explorador espacial", path: "/explorer", icon: "explorer", section: "Workspace" },
  { label: "Objetos NEO", path: "/neos", icon: "neos", section: "Workspace" },
  { label: "Catálogo SATCAT", path: "/satcat", icon: "satcat", section: "Workspace" },
  { label: "Análisis de riesgos", path: "/risks", icon: "risks", section: "Workspace" },
  { label: "Estadísticas", path: "/estadisticas", icon: "statistics", section: "Workspace" },
  { label: "Simulación orbital", path: "/simulacion", icon: "simulation", section: "Laboratorio" },
  { label: "Reportes", path: "/reportes", icon: "reports", section: "Laboratorio" },
  { label: "Fuentes de datos", path: "/datos", icon: "data", section: "Sistema" },
  { label: "Configuración", path: "/configuracion", icon: "settings", section: "Sistema" },
  { label: "Usuarios", path: "/usuarios", icon: "users", section: "Sistema", adminOnly: true },
];

export const AI_TRANSPARENCY_NOTE =
  "Estás interactuando con un sistema automatizado. Los indicadores de catálogo son descriptivos; el clasificador de la " +
  "Simulación usa modelos de IA (Random Forest e Isolation Forest) y puede equivocarse. Ningún resultado es una " +
  "predicción de colisión o de impacto.";

/** Ruta de la textura de la Tierra generada con scripts/generar_textura_tierra.py. */
export const EARTH_TEXTURE_URL = "/textures/tierra-astroshield.jpg";

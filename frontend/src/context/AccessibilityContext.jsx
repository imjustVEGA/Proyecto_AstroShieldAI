/**
 * Preferencias de accesibilidad de toda la aplicación (se guardan en este navegador).
 *
 * - Tamaño del texto: normal (100 %), grande (112,5 %) o muy grande (125 %). Se aplica al
 *   font-size de <html>; como la tipografía y los espaciados usan rem, todo escala a la vez.
 * - Alto contraste: clase `hc` en <html> (redefine las variables de color de index.css).
 * - Movimiento: "system" respeta prefers-reduced-motion; "reduce" o "full" lo fuerzan.
 */
import { MotionConfig } from "framer-motion";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "astroshield_a11y";

export const TEXT_SIZES = [
  { id: "normal", label: "Normal", short: "A", scale: "100%" },
  { id: "large", label: "Grande", short: "A+", scale: "112.5%" },
  { id: "xlarge", label: "Muy grande", short: "A++", scale: "125%" },
];

export const MOTION_OPTIONS = [
  { id: "system", label: "Según el sistema" },
  { id: "reduce", label: "Reducido" },
  { id: "full", label: "Completo" },
];

const DEFAULTS = { textSize: "normal", highContrast: false, motion: "system" };

function readStored() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return { ...DEFAULTS, ...(stored && typeof stored === "object" ? stored : {}) };
  } catch {
    return DEFAULTS;
  }
}

function useSystemReducedMotion() {
  const query = "(prefers-reduced-motion: reduce)";
  const [reduced, setReduced] = useState(() => typeof window !== "undefined" && window.matchMedia?.(query).matches);
  useEffect(() => {
    const media = window.matchMedia?.(query);
    if (!media) return undefined;
    const onChange = () => setReduced(media.matches);
    media.addEventListener?.("change", onChange);
    return () => media.removeEventListener?.("change", onChange);
  }, []);
  return Boolean(reduced);
}

const AccessibilityContext = createContext(null);

export function AccessibilityProvider({ children }) {
  const [prefs, setPrefs] = useState(readStored);
  const systemReduced = useSystemReducedMotion();
  const reducedMotion = prefs.motion === "reduce" || (prefs.motion === "system" && systemReduced);

  useEffect(() => {
    const root = document.documentElement;
    const size = TEXT_SIZES.find((s) => s.id === prefs.textSize) ?? TEXT_SIZES[0];
    root.style.fontSize = size.scale;
    root.dataset.textSize = size.id;
    root.classList.toggle("hc", prefs.highContrast);
    if (prefs.motion === "system") delete root.dataset.motion;
    else root.dataset.motion = prefs.motion;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      /* almacenamiento no disponible: la preferencia dura solo esta sesión */
    }
  }, [prefs]);

  const update = useCallback((changes) => setPrefs((p) => ({ ...p, ...changes })), []);
  const stepText = useCallback((delta) => setPrefs((p) => {
    const index = TEXT_SIZES.findIndex((s) => s.id === p.textSize);
    const next = Math.min(TEXT_SIZES.length - 1, Math.max(0, (index < 0 ? 0 : index) + delta));
    return { ...p, textSize: TEXT_SIZES[next].id };
  }), []);
  const reset = useCallback(() => setPrefs(DEFAULTS), []);

  const value = useMemo(
    () => ({ ...prefs, reducedMotion, update, stepText, reset, isDefault: JSON.stringify(prefs) === JSON.stringify(DEFAULTS) }),
    [prefs, reducedMotion, update, stepText, reset],
  );

  return (
    <AccessibilityContext.Provider value={value}>
      <MotionConfig reducedMotion={prefs.motion === "full" ? "never" : reducedMotion ? "always" : "user"}>
        {children}
      </MotionConfig>
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) throw new Error("useAccessibility debe usarse dentro de AccessibilityProvider");
  return context;
}

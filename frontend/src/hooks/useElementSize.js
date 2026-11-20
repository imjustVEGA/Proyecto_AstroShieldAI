import { useEffect, useState } from "react";

import { useAccessibility } from "@/context/AccessibilityContext";

/** Ancho en px de un elemento (se actualiza al redimensionar). */
export function useElementWidth(ref) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const update = () => setWidth(Math.round(el.getBoundingClientRect().width));
    const observer = new ResizeObserver(update);
    observer.observe(el);
    update();
    return () => observer.disconnect();
  }, [ref]);
  return width;
}

/** Tamaño de 1 rem en px (cambia con el tamaño de texto elegido en Accesibilidad). */
export function useRemPx() {
  const { textSize } = useAccessibility();
  const [rem, setRem] = useState(16);
  useEffect(() => {
    // Se lee en el siguiente cuadro: el proveedor de accesibilidad aplica el tamaño después de este efecto.
    const id = requestAnimationFrame(() => setRem(parseFloat(getComputedStyle(document.documentElement).fontSize) || 16));
    return () => cancelAnimationFrame(id);
  }, [textSize]);
  return rem;
}

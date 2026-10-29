/** Estado de carga reutilizable para pantallas y paneles. */
export default function LoadingSpinner({ label = "Cargando datos..." }) {
  /** Renderiza indicador animado con texto accesible. */
  return (
    <div aria-live="polite" className="flex min-h-32 flex-col items-center justify-center gap-3 text-sm text-astro-muted">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-astro-card border-t-astro-cyan" />
      <span>{label}</span>
    </div>
  );
}

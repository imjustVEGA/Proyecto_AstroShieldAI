/** Mensaje de error recuperable para llamadas al backend. */
export default function ErrorBanner({ onRetry }) {
  /** Ejecuta el reintento solicitado por el usuario. */
  const handleRetry = () => {
    if (onRetry) onRetry();
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-astro-red/50 bg-astro-red/10 p-4 text-sm text-astro-text sm:flex-row sm:items-center sm:justify-between">
      <p>No se pudo conectar con el servicio. Reintenta en unos segundos</p>
      <button
        className="rounded-md border border-astro-red px-3 py-2 font-semibold text-astro-red hover:bg-astro-red/10"
        onClick={handleRetry}
        type="button"
      >
        Reintentar
      </button>
    </div>
  );
}

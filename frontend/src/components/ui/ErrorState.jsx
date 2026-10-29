import { AlertTriangle } from "lucide-react";

/** Estado visual reutilizable para fallos de comunicación con el backend. */
export default function ErrorState({ onRetry }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-xl border border-astro-red/40 bg-astro-card p-6 text-center">
      <AlertTriangle className="text-astro-red" size={30} />
      <p className="text-sm text-astro-muted">
        No se pudo conectar con el servicio. Reintenta en unos segundos.
      </p>
      <button
        className="rounded-lg bg-astro-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-astro-cyan hover:text-astro-bg"
        onClick={onRetry}
        type="button"
      >
        Reintentar
      </button>
    </div>
  );
}

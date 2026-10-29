import { Minus, Plus } from "lucide-react";

/** Controles flotantes para acercar o alejar el globo. */
export default function ZoomControls({ onZoomIn, onZoomOut }) {
  return (
    <div className="absolute left-4 top-4 z-10 flex flex-col overflow-hidden rounded-lg border border-astro-cyan bg-astro-card/80 shadow-lg">
      <button
        aria-label="Acercar globo"
        className="p-2 text-astro-cyan transition hover:bg-astro-blue hover:text-white"
        onClick={onZoomIn}
        type="button"
      >
        <Plus size={19} />
      </button>
      <button
        aria-label="Alejar globo"
        className="border-t border-astro-cyan p-2 text-astro-cyan transition hover:bg-astro-blue hover:text-white"
        onClick={onZoomOut}
        type="button"
      >
        <Minus size={19} />
      </button>
    </div>
  );
}

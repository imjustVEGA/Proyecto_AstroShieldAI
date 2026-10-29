import RiskBadge from "@/components/ui/RiskBadge";

/** Muestra la ficha resumida del objeto seleccionado. */
export default function ObjectDetailsPanel({ object }) {
  if (!object) {
    return (
      <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-astro-card bg-astro-card p-6 text-center text-sm text-astro-muted">
        Selecciona un objeto en el globo para ver su ficha
      </div>
    );
  }

  const orbit = object.type === "NEO" ? "HEO" : object.id === "25544" ? "LEO" : "GEO";
  const inclination = `${(Math.abs(object.lat) * 0.72 + 2.4).toFixed(1)}°`;
  const apogee = `${Math.round(420 + object.altitude * 42000).toLocaleString("es-ES")} km`;
  const perigee = `${Math.round(360 + object.altitude * 18000).toLocaleString("es-ES")} km`;

  return (
    <article className="rounded-xl border border-astro-card bg-astro-card p-5 shadow-lg">
      <p className="text-xs font-semibold uppercase tracking-widest text-astro-cyan">
        Tipo: {object.type}
      </p>
      <h2 className="mt-2 text-xl font-semibold text-astro-text">{object.name}</h2>
      {object.hazardous && (
        <div className="mt-3">
          <RiskBadge level="ALTA" />
        </div>
      )}
      <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
        <div><dt className="text-astro-muted">NORAD ID</dt><dd className="mt-1 text-astro-text">{object.id}</dd></div>
        <div><dt className="text-astro-muted">Órbita</dt><dd className="mt-1 text-astro-text">{orbit}</dd></div>
        <div><dt className="text-astro-muted">Inclinación</dt><dd className="mt-1 text-astro-text">{inclination}</dd></div>
        <div><dt className="text-astro-muted">Apogeo</dt><dd className="mt-1 text-astro-text">{apogee}</dd></div>
        <div><dt className="text-astro-muted">Perigeo</dt><dd className="mt-1 text-astro-text">{perigee}</dd></div>
      </dl>
      <button className="mt-6 w-full rounded-lg bg-astro-blue px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-astro-cyan hover:text-astro-bg" type="button">
        Ver ficha completa
      </button>
    </article>
  );
}

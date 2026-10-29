/** Placeholder funcional del explorador espacial del Sprint 2. */
export default function Explorer() {
  /** Renderiza el estado inicial del explorador. */
  return <Placeholder title="Explorador espacial" sprint="Sprint 2" />;
}

function Placeholder({ title, sprint }) {
  /** Muestra un mensaje de construcción sin romper la navegación. */
  return (
    <section className="mx-auto max-w-4xl rounded-xl border border-astro-card bg-astro-card p-8">
      <p className="text-sm font-semibold uppercase tracking-widest text-astro-cyan">{sprint}</p>
      <h1 className="mt-3 text-3xl font-semibold text-astro-text">{title}</h1>
      <p className="mt-3 text-sm text-astro-muted">En construcción — {sprint}.</p>
    </section>
  );
}

/** Tarjeta reutilizable para KPIs del dashboard. */
import { Activity } from "lucide-react";

const accentClasses = {
  blue: "border-astro-blue/40 text-astro-blue",
  cyan: "border-astro-cyan/40 text-astro-cyan",
  orange: "border-astro-orange/40 text-astro-orange",
  red: "border-astro-red/40 text-astro-red",
};

/** Renderiza un indicador numérico con icono y contexto. */
export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon = Activity,
  accent = "blue",
}) {
  /** Selecciona colores permitidos por la guía visual. */
  const accentClass = accentClasses[accent] || accentClasses.blue;

  return (
    <article className={`rounded-xl border bg-astro-card p-5 ${accentClass}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-astro-muted">{title}</p>
        <span className={`rounded-lg border p-2 ${accentClass}`}>
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-4 text-2xl font-semibold text-astro-text">{value}</p>
      <p className="mt-1 text-xs text-astro-muted">{subtitle}</p>
    </article>
  );
}

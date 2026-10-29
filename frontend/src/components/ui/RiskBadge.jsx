/** Badge accesible para niveles de riesgo. */
const riskClasses = {
  ALTA: "border-astro-red/50 bg-astro-red/10 text-astro-red",
  MEDIA: "border-astro-orange/50 bg-astro-orange/10 text-astro-orange",
  BAJA: "border-astro-cyan/50 bg-astro-cyan/10 text-astro-cyan",
};

/** Muestra el nivel de riesgo como texto y color redundante. */
export default function RiskBadge({ level = "BAJA" }) {
  /** Normaliza el nivel recibido a los valores oficiales. */
  const normalizedLevel = String(level).toUpperCase();
  const className = riskClasses[normalizedLevel] || riskClasses.BAJA;

  return (
    <span
      aria-label={`Riesgo ${normalizedLevel}`}
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      {normalizedLevel}
    </span>
  );
}

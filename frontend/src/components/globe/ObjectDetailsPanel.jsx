import { X } from "lucide-react";
import RiskBadge from "@/components/ui/RiskBadge";

const formatValue = (value, suffix = "") => {
  if (value === null || value === undefined || value === "") return "No disponible";
  const number = Number(value);
  return Number.isFinite(number)
    ? `${number.toLocaleString("es-ES", { maximumFractionDigits: 2 })}${suffix}`
    : `${value}${suffix}`;
};

function Detail({ label, value }) {
  return (
    <div className="min-w-0 rounded-lg border border-astro-bg bg-astro-bg/60 p-3">
      <dt className="text-[11px] uppercase tracking-wide text-astro-muted">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium text-astro-text">{value}</dd>
    </div>
  );
}

export default function ObjectDetailsPanel({ object, onClose }) {
  if (!object) return null;
  const isNeo = object.type === "NEO";
  const details = isNeo
    ? [
      { label: "ID del catálogo", value: object.id },
      { label: "Diámetro estimado", value: formatValue(object.diameter, " km") },
      { label: "Velocidad relativa", value: formatValue(object.velocity, " km/h") },
      { label: "Distancia de aproximación", value: formatValue(object.missDistance, " km") },
    ]
    : [
      { label: "ID NORAD", value: object.norad ?? object.id },
      { label: "Tipo de objeto", value: object.catalogType || object.type },
      { label: "Órbita", value: object.orbit },
      { label: "Estado", value: object.status },
      { label: "Apogeo", value: formatValue(object.apogee, " km") },
      { label: "Perigeo", value: formatValue(object.perigee, " km") },
    ];

  return (
    <section
      aria-label={`Información de ${object.name || object.id}`}
      className="rounded-xl border border-astro-card bg-astro-card/95 p-4 shadow-xl backdrop-blur-md sm:p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-astro-cyan">
            {isNeo ? "Objeto cercano a la Tierra" : "Catálogo SATCAT"}
          </p>
          <h2 className="mt-1 break-words text-lg font-semibold text-astro-text">
            {object.name || object.id}
          </h2>
        </div>
        <button
          aria-label="Cerrar información del objeto"
          className="shrink-0 rounded-lg p-2 text-astro-muted transition hover:bg-astro-bg hover:text-astro-text"
          onClick={onClose}
          type="button"
        >
          <X size={18} />
        </button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-astro-blue/40 px-2.5 py-1 text-xs text-astro-cyan">
          {object.type}
        </span>
        {isNeo && (
          <RiskBadge level={object.hazardous ? "ALTA" : "BAJA"} />
        )}
      </div>
      <dl className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {details.map(({ label, value }) => (
          <Detail key={label} label={label} value={value ?? "No disponible"} />
        ))}
        {isNeo && (
          <Detail
            key="Hazardous"
            label="Potencialmente peligroso"
            value={object.hazardous ? "Sí" : "No"}
          />
        )}
      </dl>
      <p className="mt-3 text-[11px] text-astro-muted">
        Las coordenadas del marcador son aproximadas y solo sirven para visualizar el registro.
      </p>
    </section>
  );
}

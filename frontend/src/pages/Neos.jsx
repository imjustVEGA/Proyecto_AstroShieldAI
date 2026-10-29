import { AlertTriangle, Gauge, Radar, Ruler } from "lucide-react";
import ClassificationDonut from "@/components/charts/ClassificationDonut";
import DistanceScatter from "@/components/charts/DistanceScatter";
import SimpleBarChart from "@/components/charts/SimpleBarChart";
import DataTable from "@/components/ui/DataTable";
import ErrorState from "@/components/ui/ErrorState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import RiskBadge from "@/components/ui/RiskBadge";
import StatCard from "@/components/ui/StatCard";
import useNeos from "@/hooks/useNeos";

/** Determina la etiqueta visual de riesgo a partir de la probabilidad. */
function getRiskLevel(neo) {
  if (neo.isHazardous || neo.probability >= 70) return "ALTA";
  if (neo.probability >= 35) return "MEDIA";
  return "BAJA";
}

/** Presenta el catálogo de objetos cercanos a la Tierra. */
export default function Neos() {
  const { data, loading, error, refetch } = useNeos();
  const neos = data?.items || [];
  const hazardousCount = neos.filter((neo) => neo.isHazardous).length;
  const minimumDiameter = neos.length ? Math.min(...neos.map((neo) => neo.diameter)) : 0;
  const averageVelocity = neos.length
    ? Math.round(neos.reduce((sum, neo) => sum + neo.velocity, 0) / neos.length)
    : 0;
  const chartData = {
    classification: [
      { name: "Peligrosos", value: hazardousCount },
      { name: "No peligrosos", value: neos.length - hazardousCount },
    ],
    diameters: [...neos].sort((a, b) => b.diameter - a.diameter).slice(0, 5).map((neo) => ({ name: neo.name, value: neo.diameter })),
    velocities: [...neos].sort((a, b) => b.velocity - a.velocity).slice(0, 5).map((neo) => ({ name: neo.name, value: Math.round(neo.velocity / 1000) })),
    scatter: neos.map((neo, index) => ({ distance: 0.18 + ((index * 19) % 740) / 100, diameter: neo.diameter, name: neo.name })),
  };

  return (
    <section className="mx-auto max-w-[1800px] space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-widest text-astro-cyan">Catálogo espacial</p>
        <h1 className="mt-2 text-3xl font-semibold text-astro-text">Objetos NEO</h1>
        <p className="mt-2 text-sm text-astro-muted">Seguimiento de objetos cercanos a la Tierra y evaluación de riesgo.</p>
      </header>
      {loading && <LoadingSpinner label="Cargando objetos NEO..." />}
      {error && !loading && <ErrorState onRetry={refetch} />}
      {data && !loading && !error && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total objetos" value={data.total ?? neos.length} subtitle="Catálogo NEO activo" icon={Radar} accent="blue" />
        <StatCard title="PHA" value={hazardousCount} subtitle="Potencialmente peligrosos" icon={AlertTriangle} accent="red" />
        <StatCard title="Velocidad media" value={`${averageVelocity.toLocaleString("es-ES")} km/h`} subtitle="Promedio observado" icon={Gauge} accent="orange" />
        <StatCard title="Diámetro mínimo" value={`${minimumDiameter} km`} subtitle="Objeto más pequeño" icon={Ruler} accent="cyan" />
      </div>}
      {data && !loading && !error && <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Clasificación de riesgo"><ClassificationDonut data={chartData.classification} total={neos.length} /></ChartCard>
        <ChartCard title="Top 5 diámetros"><SimpleBarChart data={chartData.diameters} dataKeyY="value" barColor="#3B82F6" /></ChartCard>
        <ChartCard title="Top 5 velocidades (miles km/h)"><SimpleBarChart data={chartData.velocities} dataKeyY="value" barColor="#F97316" /></ChartCard>
        <ChartCard title="Distancia vs diámetro"><DistanceScatter data={chartData.scatter} /></ChartCard>
      </div>}
      {data && !loading && !error && <DataTable
        columns={["Objeto", "Diámetro", "Velocidad", "Aproximación", "Clasificación"]}
        data={neos}
        renderRow={(neo) => (
          <>
            <td className="whitespace-nowrap px-4 py-3 font-medium text-astro-text">{neo.name}<span className="ml-2 text-xs text-astro-muted">{neo.id}</span></td>
            <td className="whitespace-nowrap px-4 py-3 text-astro-muted">{neo.diameter} km</td>
            <td className="whitespace-nowrap px-4 py-3 text-astro-muted">{neo.velocity.toLocaleString("es-ES")} km/h</td>
            <td className="whitespace-nowrap px-4 py-3 text-astro-muted">{neo.approachDate}</td>
            <td className="px-4 py-3"><RiskBadge level={getRiskLevel(neo)} /></td>
          </>
        )}
      />}
    </section>
  );
}

function ChartCard({ title, children }) {
  return (
    <article className="rounded-xl border border-astro-card bg-astro-card p-5">
      <h2 className="font-semibold text-astro-text">{title}</h2>
      <div className="mt-3">{children}</div>
    </article>
  );
}

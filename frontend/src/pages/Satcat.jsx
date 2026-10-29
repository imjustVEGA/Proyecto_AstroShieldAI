import { Activity, Database, Orbit, Satellite } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import SimpleBarChart from "@/components/charts/SimpleBarChart";
import StatCard from "@/components/ui/StatCard";
import { MOCK_CHART_DATA, MOCK_SATCAT } from "@/utils/mockData";

/** Presenta el catálogo simulado de satélites y objetos orbitales. */
export default function Satcat() {
  const activeObjects = MOCK_SATCAT.filter((satellite) => satellite.status === "Activo").length;
  const averageApogee = Math.round(MOCK_SATCAT.reduce((sum, satellite) => sum + satellite.apogee, 0) / MOCK_SATCAT.length);

  return (
    <section className="mx-auto max-w-[1800px] space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-widest text-astro-cyan">Catálogo orbital</p>
        <h1 className="mt-2 text-3xl font-semibold text-astro-text">Catálogo SATCAT</h1>
        <p className="mt-2 text-sm text-astro-muted">Inventario de satélites, estaciones y objetos en órbita terrestre.</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Objetos" value={MOCK_SATCAT.length} subtitle="Registros catalogados" icon={Database} accent="blue" />
        <StatCard title="Tipos" value={new Set(MOCK_SATCAT.map((satellite) => satellite.type)).size} subtitle="Clasificaciones activas" icon={Satellite} accent="cyan" />
        <StatCard title="En órbita" value={activeObjects} subtitle="Estado activo" icon={Orbit} accent="blue" />
        <StatCard title="Centro orbital" value={`${averageApogee.toLocaleString("es-ES")} km`} subtitle="Apogeo medio" icon={Activity} accent="orange" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Tipos de objeto"><SimpleBarChart data={MOCK_CHART_DATA.satcatTypes} barColor="#22D3EE" /></ChartCard>
        <ChartCard title="Lanzamientos por año"><SimpleBarChart data={MOCK_CHART_DATA.launchesByYear} barColor="#3B82F6" /></ChartCard>
        <ChartCard title="Apogeo vs perigeo"><SimpleBarChart data={MOCK_CHART_DATA.orbitComparison} dataKeyY={["apogee", "perigee"]} barColor="#F97316" /></ChartCard>
        <ChartCard title="Inclinación orbital"><SimpleBarChart data={MOCK_CHART_DATA.inclination} barColor="#EF4444" /></ChartCard>
      </div>
      <DataTable
        columns={["Objeto / NORAD", "Tipo", "Órbita / Inclinación", "Apogeo / Perigeo", "Estado"]}
        data={MOCK_SATCAT}
        renderRow={(satellite) => (
          <>
            <td className="whitespace-nowrap px-4 py-3 font-medium text-astro-text">{satellite.name}<span className="ml-2 text-xs text-astro-muted">NORAD {satellite.norad}</span></td>
            <td className="whitespace-nowrap px-4 py-3 text-astro-muted">{satellite.type}</td>
            <td className="whitespace-nowrap px-4 py-3 text-astro-muted">{satellite.orbit} / {satellite.inclination}°</td>
            <td className="whitespace-nowrap px-4 py-3 text-astro-muted">{satellite.apogee.toLocaleString("es-ES")} / {satellite.perigee.toLocaleString("es-ES")} km</td>
            <td className="whitespace-nowrap px-4 py-3 text-astro-text">{satellite.status}</td>
          </>
        )}
      />
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

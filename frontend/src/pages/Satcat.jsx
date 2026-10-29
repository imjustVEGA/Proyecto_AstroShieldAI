import { Activity, Database, Orbit, Satellite } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import ErrorState from "@/components/ui/ErrorState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import SimpleBarChart from "@/components/charts/SimpleBarChart";
import StatCard from "@/components/ui/StatCard";
import useFetch from "@/hooks/useFetch";
import { useCallback } from "react";
import { getSatcat } from "@/services/satcatService";

/** Presenta el catálogo simulado de satélites y objetos orbitales. */
export default function Satcat() {
  const fetchSatcat = useCallback(() => getSatcat(1, 50), []);
  const { data, loading, error, refetch } = useFetch(fetchSatcat, []);
  const satellites = data?.items || [];
  const activeObjects = satellites.filter((satellite) => satellite.status === "Activo").length;
  const averageApogee = satellites.length
    ? Math.round(satellites.reduce((sum, satellite) => sum + satellite.apogee, 0) / satellites.length)
    : 0;
  const chartData = {
    types: [...new Set(satellites.map((satellite) => satellite.type))].map((type) => ({ name: type.replace("Satélite de ", ""), value: satellites.filter((satellite) => satellite.type === type).length })),
    orbits: ["LEO", "MEO", "GEO", "HEO"].map((orbit) => {
      const entries = satellites.filter((satellite) => satellite.orbit === orbit);
      return {
        name: orbit,
        apogee: entries.length ? Math.round(entries.reduce((sum, satellite) => sum + satellite.apogee, 0) / entries.length) : 0,
        perigee: entries.length ? Math.round(entries.reduce((sum, satellite) => sum + satellite.perigee, 0) / entries.length) : 0,
      };
    }),
    inclination: ["LEO", "MEO", "GEO", "HEO"].map((orbit) => {
      const entries = satellites.filter((satellite) => satellite.orbit === orbit);
      return { name: orbit, value: entries.length ? Number((entries.reduce((sum, satellite) => sum + satellite.inclination, 0) / entries.length).toFixed(1)) : 0 };
    }),
  };

  return (
    <section className="mx-auto max-w-[1800px] space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-widest text-astro-cyan">Catálogo orbital</p>
        <h1 className="mt-2 text-3xl font-semibold text-astro-text">Catálogo SATCAT</h1>
        <p className="mt-2 text-sm text-astro-muted">Inventario de satélites, estaciones y objetos en órbita terrestre.</p>
      </header>
      {loading && <LoadingSpinner label="Cargando catálogo SATCAT..." />}
      {error && !loading && <ErrorState onRetry={refetch} />}
      {data && !loading && !error && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Objetos" value={data.total ?? satellites.length} subtitle="Registros catalogados" icon={Database} accent="blue" />
        <StatCard title="Tipos" value={new Set(satellites.map((satellite) => satellite.type)).size} subtitle="Clasificaciones activas" icon={Satellite} accent="cyan" />
        <StatCard title="En órbita" value={activeObjects} subtitle="Estado activo" icon={Orbit} accent="blue" />
        <StatCard title="Centro orbital" value={`${averageApogee.toLocaleString("es-ES")} km`} subtitle="Apogeo medio" icon={Activity} accent="orange" />
      </div>}
      {data && !loading && !error && <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Tipos de objeto"><SimpleBarChart data={chartData.types} barColor="#22D3EE" /></ChartCard>
        <ChartCard title="Lanzamientos por año"><SimpleBarChart data={["2022", "2023", "2024", "2025", "2026"].map((year, index) => ({ name: year, value: 8 + index * 5 }))} barColor="#3B82F6" /></ChartCard>
        <ChartCard title="Apogeo vs perigeo"><SimpleBarChart data={chartData.orbits} dataKeyY={["apogee", "perigee"]} barColor="#F97316" /></ChartCard>
        <ChartCard title="Inclinación orbital"><SimpleBarChart data={chartData.inclination} barColor="#EF4444" /></ChartCard>
      </div>}
      {data && !loading && !error && <DataTable
        columns={["Objeto / NORAD", "Tipo", "Órbita / Inclinación", "Apogeo / Perigeo", "Estado"]}
        data={satellites}
        renderRow={(satellite) => (
          <>
            <td className="whitespace-nowrap px-4 py-3 font-medium text-astro-text">{satellite.name}<span className="ml-2 text-xs text-astro-muted">NORAD {satellite.norad}</span></td>
            <td className="whitespace-nowrap px-4 py-3 text-astro-muted">{satellite.type}</td>
            <td className="whitespace-nowrap px-4 py-3 text-astro-muted">{satellite.orbit} / {satellite.inclination}°</td>
            <td className="whitespace-nowrap px-4 py-3 text-astro-muted">{satellite.apogee.toLocaleString("es-ES")} / {satellite.perigee.toLocaleString("es-ES")} km</td>
            <td className="whitespace-nowrap px-4 py-3 text-astro-text">{satellite.status}</td>
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

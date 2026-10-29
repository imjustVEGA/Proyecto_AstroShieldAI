/** Dashboard inicial con KPIs, radar y accesos rápidos. */
import {
  AlertTriangle,
  Database,
  Globe,
  Orbit,
  Radar,
  ShieldAlert,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import useStats from "@/hooks/useStats";
import ErrorState from "@/components/ui/ErrorState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import StatCard from "@/components/ui/StatCard";
import RiskBadge from "@/components/ui/RiskBadge";
import GlobeView from "@/components/globe/GlobeView";

const radarObjects = [
  { name: "ISS", id: "NORAD 25544", type: "Estación espacial", risk: "BAJA" },
  { name: "STARLINK-1007", id: "NORAD 44713", type: "Satélite", risk: "BAJA" },
  { name: "Apophis", id: "NEO 99942", type: "Asteroide cercano", risk: "MEDIA" },
];

/** Renderiza la vista principal con datos mock del wireframe. */
export default function Dashboard() {
  const navigate = useNavigate();
  const { data: stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useStats();
  const statCards = stats ? [
    { title: "Objetos monitoreados", value: stats.total_neos, subtitle: "Catálogo NEO activo", icon: Radar, accent: "blue" },
    { title: "NEO peligrosos", value: stats.hazardous_count, subtitle: "Requieren atención", icon: AlertTriangle, accent: "red" },
    { title: "Diámetro medio", value: `${Number(stats.avg_diameter_km).toFixed(2)} km`, subtitle: "Promedio de objetos", icon: Database, accent: "cyan" },
    { title: "Velocidad media", value: `${Math.round(stats.avg_velocity_kmh).toLocaleString("es-ES")} km/h`, subtitle: `Más cercano: ${Math.round(stats.closest_approach_km).toLocaleString("es-ES")} km`, icon: ShieldAlert, accent: "orange" },
  ] : [];

  /** Renderiza los accesos rápidos definidos por el diseño aprobado. */
  const quickLinks = [
    { label: "Explorar SATCAT", path: "/satcat", icon: Database },
    { label: "Ver objetos NEO", path: "/neos", icon: Orbit },
    { label: "Analizar riesgos", path: "/risks", icon: ShieldAlert },
  ];

  return (
    <div className="mx-auto max-w-[1440px] space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-astro-cyan">Mission control</p>
        <h1 className="mt-2 text-3xl font-semibold text-astro-text sm:text-4xl">Resumen orbital</h1>
        <p className="mt-2 text-sm text-astro-muted">Monitoreo inteligente de objetos cercanos a la Tierra.</p>
      </div>
      {statsLoading && <LoadingSpinner label="Cargando indicadores..." />}
      {statsError && !statsLoading && <ErrorState onRetry={refetchStats} />}
      {stats && !statsLoading && !statsError && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => <StatCard key={stat.title} {...stat} />)}
      </div>}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
        <section className="overflow-hidden rounded-xl border border-astro-card bg-astro-card">
          <div className="flex items-center justify-between border-b border-astro-bg px-5 py-4">
            <div>
              <h2 className="font-semibold text-astro-text">Mapa orbital</h2>
              <p className="mt-1 text-xs text-astro-muted">Visualización en tiempo real</p>
            </div>
            <Globe className="text-astro-cyan" size={21} />
          </div>
          <GlobeView onObjectSelect={(object) => navigate(`/explorer?object=${object.id}`)} />
        </section>
        <section className="rounded-xl border border-astro-card bg-astro-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-astro-text">En el radar</h2>
              <p className="mt-1 text-xs text-astro-muted">Objetos destacados</p>
            </div>
            <Radar className="text-astro-cyan" size={21} />
          </div>
          <div className="mt-5 space-y-3">
            {radarObjects.map((object) => (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-astro-bg p-3" key={object.id}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-astro-text">{object.name}</p>
                  <p className="mt-1 text-xs text-astro-muted">{object.id} · {object.type}</p>
                </div>
                <RiskBadge level={object.risk} />
              </div>
            ))}
          </div>
        </section>
      </div>
      <section>
        <h2 className="text-lg font-semibold text-astro-text">Accesos rápidos</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {quickLinks.map(({ label, path, icon: Icon }) => (
            <Link className="flex items-center gap-3 rounded-xl border border-astro-card bg-astro-card p-4 text-sm font-medium text-astro-text transition hover:border-astro-blue hover:text-astro-cyan" key={path} to={path}>
              <Icon className="text-astro-cyan" size={20} />
              {label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

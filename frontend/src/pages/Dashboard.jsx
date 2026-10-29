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
import StatCard from "@/components/ui/StatCard";
import RiskBadge from "@/components/ui/RiskBadge";

const stats = [
  { title: "Objetos monitoreados", value: "73,718", subtitle: "Catálogo activo", icon: Radar, accent: "blue" },
  { title: "NEO peligrosos", value: "2,465", subtitle: "Requieren atención", icon: AlertTriangle, accent: "red" },
  { title: "Objetos SATCAT", value: "36,876", subtitle: "En órbita terrestre", icon: Database, accent: "cyan" },
  { title: "Para revisión", value: "04", subtitle: "Alertas pendientes", icon: ShieldAlert, accent: "orange" },
];

const radarObjects = [
  { name: "ISS", id: "NORAD 25544", type: "Estación espacial", risk: "BAJA" },
  { name: "STARLINK-1007", id: "NORAD 44713", type: "Satélite", risk: "BAJA" },
  { name: "Apophis", id: "NEO 99942", type: "Asteroide cercano", risk: "MEDIA" },
];

/** Renderiza la vista principal con datos mock del wireframe. */
export default function Dashboard() {
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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => <StatCard key={stat.title} {...stat} />)}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
        <section className="overflow-hidden rounded-xl border border-astro-card bg-astro-card">
          <div className="flex items-center justify-between border-b border-astro-bg px-5 py-4">
            <div>
              <h2 className="font-semibold text-astro-text">Mapa orbital</h2>
              <p className="mt-1 text-xs text-astro-muted">Visualización en tiempo real</p>
            </div>
            <Globe className="text-astro-cyan" size={21} />
          </div>
          <div className="grid min-h-[310px] place-items-center bg-[radial-gradient(circle_at_center,_#141B2E_0%,_#0B1020_70%)] p-8">
            <div className="text-center">
              <Globe className="mx-auto text-astro-blue" size={74} strokeWidth={1} />
              <p className="mt-4 text-sm font-medium text-astro-text">Cargando globo 3D...</p>
              <p className="mt-1 text-xs text-astro-muted">La visualización orbital estará disponible en el Sprint 2.</p>
            </div>
          </div>
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

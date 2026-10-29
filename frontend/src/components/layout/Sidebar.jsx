/** Sidebar con navegación principal y estados disabled. */
import {
  Activity,
  AlertTriangle,
  Globe,
  LayoutDashboard,
  Orbit,
  Radar,
  Settings,
  X,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "@/utils/constants";

const icons = {
  dashboard: LayoutDashboard,
  explorer: Globe,
  neos: Orbit,
  satcat: Radar,
  risks: AlertTriangle,
  simulation: Activity,
  reports: Radar,
  settings: Settings,
};

/** Renderiza la navegación lateral responsive. */
export default function Sidebar({ isOpen, onClose }) {
  /** Cierra el menú después de navegar en pantallas pequeñas. */
  const handleNavigation = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {isOpen && (
        <button
          aria-label="Cerrar navegación"
          className="fixed inset-0 z-30 bg-astro-bg/80 lg:hidden"
          onClick={onClose}
          type="button"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-astro-card bg-astro-bg px-4 py-5 transition-transform lg:static lg:z-auto lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-3">
          <NavLink className="flex items-center gap-3" onClick={handleNavigation} to="/">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-astro-blue text-astro-text">
              <Orbit size={23} />
            </span>
            <span>
              <span className="block text-sm font-bold tracking-widest text-astro-text">
                ASTROSHIELD
              </span>
              <span className="block text-xs font-semibold tracking-widest text-astro-cyan">
                AI MONITORING
              </span>
            </span>
          </NavLink>
          <button
            aria-label="Cerrar menú"
            className="text-astro-muted lg:hidden"
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        </div>
        <p className="mb-3 mt-10 px-3 text-xs font-semibold uppercase tracking-widest text-astro-muted">
          Mission control
        </p>
        <nav aria-label="Navegación principal" className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = icons[item.icon];
            if (item.disabled) {
              return (
                <span
                  className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-3 text-sm text-astro-muted/50"
                  key={item.label}
                >
                  <Icon size={18} />
                  {item.label}
                  <span className="ml-auto text-[10px] uppercase">Pronto</span>
                </span>
              );
            }
            return (
              <NavLink
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition ${
                    isActive
                      ? "bg-astro-blue/15 font-semibold text-astro-cyan"
                      : "text-astro-muted hover:bg-astro-card hover:text-astro-text"
                  }`
                }
                end={item.path === "/"}
                key={item.label}
                onClick={handleNavigation}
                to={item.path}
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="mt-auto rounded-lg border border-astro-card bg-astro-card/60 p-4">
          <p className="text-xs font-semibold text-astro-text">Estado del sistema</p>
          <p className="mt-2 flex items-center gap-2 text-xs text-astro-muted">
            <span className="h-2 w-2 rounded-full bg-astro-cyan" />
            Servicios operativos
          </p>
        </div>
      </aside>
    </>
  );
}

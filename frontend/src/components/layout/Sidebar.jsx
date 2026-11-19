/** Navegación lateral con secciones (Workspace / Laboratorio / Sistema). */
import {
  Activity,
  BarChart3,
  Database,
  FileText,
  Globe2,
  LayoutGrid,
  Satellite,
  Settings,
  Shield,
  ShieldAlert,
  Users,
  X,
} from "lucide-react";
import { Telescope } from "@/components/icons";
import { Link, NavLink } from "react-router-dom";
import { NAV_ITEMS } from "@/utils/constants";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/utils/cn";

const icons = {
  dashboard: LayoutGrid,
  explorer: Globe2,
  neos: Telescope,
  satcat: Satellite,
  risks: ShieldAlert,
  statistics: BarChart3,
  simulation: Activity,
  reports: FileText,
  data: Database,
  settings: Settings,
  users: Users,
};

function Brand({ onNavigate }) {
  return (
    <Link to="/" onClick={onNavigate} className="flex items-center gap-2.5 px-5 pb-6 pt-5">
      <span className="relative grid size-9 place-items-center rounded-full border border-primary/40 bg-primary/10">
        <Shield className="size-[18px] text-blue-300" strokeWidth={1.8} />
      </span>
      <span className="leading-tight">
        <span className="block text-[17px] font-bold tracking-tight">
          AstroShield<sup className="ml-0.5 text-[9px] font-semibold text-primary">AI</sup>
        </span>
        <span className="block text-[7.5px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">Space intelligence platform</span>
      </span>
    </Link>
  );
}

function SidebarContent({ onNavigate }) {
  const { user } = useAuth();
  const items = NAV_ITEMS.filter((item) => !item.adminOnly || user?.role === "admin");
  const sections = [...new Set(items.map((i) => i.section))];
  const initials = (user?.username || "AS").slice(0, 2).toUpperCase();

  return (
    <div className="flex h-full flex-col">
      <Brand onNavigate={onNavigate} />
      <div className="flex-1 overflow-y-auto scrollbar-dark">
        {sections.map((section) => (
          <div key={section} className="mb-3">
            <p className="eyebrow px-6 pb-2">{section}</p>
            <nav aria-label={section} className="flex flex-col gap-1 px-3">
              {items.filter((i) => i.section === section).map(({ path, label, icon }) => {
                const Icon = icons[icon];
                return (
                  <NavLink key={path} to={path} end={path === "/"} onClick={onNavigate}
                    className={({ isActive }) => cn(
                      "flex items-center gap-3 rounded-md px-3 py-2.5 text-[12.5px] text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground",
                      isActive && "bg-secondary text-foreground",
                    )}>
                    {({ isActive }) => (
                      <>
                        <Icon className={cn("size-4", isActive && "text-blue-300")} strokeWidth={1.7} />
                        <span className="flex-1">{label}</span>
                        {isActive && <span className="size-1.5 rounded-full bg-primary" aria-hidden />}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
      <div className="px-6 pb-3 text-[10px] text-muted-foreground">
        <span className="mr-1.5 inline-block size-1.5 rounded-full bg-primary align-middle" /> Prototipo académico
      </div>
      <div className="m-3 mt-0 flex items-center gap-3 rounded-lg border bg-card/60 p-3">
        <span className="grid size-8 place-items-center rounded-full border border-primary/40 bg-primary/10 text-[10px] font-semibold text-blue-200">{initials}</span>
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-[12px] font-semibold">{user?.username ?? "AstroShield AI"}</span>
          <span className="block truncate text-[10px] text-muted-foreground">
            {user?.role === "admin" ? "Administrador" : "Usuario"} · v2.0
          </span>
        </span>
      </div>
    </div>
  );
}

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      <aside className="hidden w-60 shrink-0 border-r bg-sidebar lg:block">
        <SidebarContent onNavigate={() => undefined} />
      </aside>
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 lg:hidden" onClick={onClose}>
          <aside className="relative h-full w-64 border-r bg-sidebar" onClick={(e) => e.stopPropagation()}>
            <button type="button" aria-label="Cerrar menú" onClick={onClose} className="absolute right-3 top-5 text-muted-foreground">
              <X className="size-5" />
            </button>
            <SidebarContent onNavigate={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}

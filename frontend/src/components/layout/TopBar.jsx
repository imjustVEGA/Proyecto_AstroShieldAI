/** Barra superior: ruta actual, búsqueda global, estado de los datos y sesión. */
import { ChevronRight, Globe2, LogOut, Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import GlobalSearch from "./GlobalSearch";
import { AccessibilityMenu } from "@/components/AccessibilityControls";
import { Button } from "@/components/ui/primitives";
import { useAuth } from "@/context/AuthContext";
import { useDatasets } from "@/hooks/queries";
import { cn } from "@/utils/cn";
import { NAV_ITEMS } from "@/utils/constants";

const TITLES = Object.fromEntries(NAV_ITEMS.map((n) => [n.path, n]));

function DataStatusChip() {
  const { data, error } = useDatasets();
  const ready = (data ?? []).filter((d) => d.latest_import?.status === "completed").length;
  const label = error ? "Backend sin conexión" : !data ? "Conectando…" : ready === 2 ? "Datos cargados" : `${ready}/2 fuentes cargadas`;
  const color = error ? "bg-status-critical" : ready === 2 ? "bg-status-good" : "bg-status-warning";
  return (
    <Link to="/datos" className={cn("items-center gap-1.5 whitespace-nowrap text-[0.75rem] text-muted-foreground hover:text-foreground", error ? "flex text-red-200" : "hidden xl:flex")}>
      <span className={cn("size-1.5 rounded-full", color)} aria-hidden /> {label}
    </Link>
  );
}

export default function TopBar({ onMenuClick }) {
  const { logout } = useAuth();
  const { pathname } = useLocation();
  const current = TITLES[pathname];

  return (
    <header className="flex min-h-14 shrink-0 items-center gap-3 border-b bg-background/80 px-3 py-2 backdrop-blur sm:px-4 lg:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir navegación" onClick={onMenuClick}>
        <Menu />
      </Button>
      <nav aria-label="Ruta" className="hidden min-w-0 items-center gap-2 whitespace-nowrap text-[0.75rem] text-muted-foreground md:flex">
        <Globe2 className="size-4" strokeWidth={1.6} />
        <span className="hidden xl:inline">{current?.section ?? "Workspace"}</span>
        <ChevronRight className="hidden size-3 xl:inline" />
        <span className="truncate text-foreground">{current?.label ?? "Página"}</span>
      </nav>
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <GlobalSearch />
        <DataStatusChip />
        <AccessibilityMenu />
        <Button variant="ghost" size="sm" onClick={logout} title="Cerrar sesión" className="text-muted-foreground">
          <LogOut /> <span className="hidden xl:inline">Salir</span>
        </Button>
      </div>
    </header>
  );
}

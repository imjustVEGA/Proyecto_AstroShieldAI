// Barra de herramientas de tabla (búsqueda + filtro principal + filtros avanzados).
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { cn } from "@/utils/cn";
import { formatInt } from "@/utils/format";

export default function TableToolbar({
  search, onSearch, placeholder, select, filtersOpen, onToggleFilters, activeFilters = 0, total, actions, children,
}) {
  return (
    <div className="border-b px-5 pb-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => onSearch(e.target.value)} placeholder={placeholder} aria-label={placeholder}
            className="h-9 w-full rounded-md border border-input bg-background/50 pl-8 pr-3 text-[12.5px] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60" />
        </div>
        {select}
        {children && (
          <Button variant="outline" size="sm" className={cn("h-9", filtersOpen && "bg-secondary")} aria-expanded={filtersOpen} onClick={onToggleFilters}>
            <SlidersHorizontal /> Filtros
            {activeFilters > 0 && <span className="rounded-full bg-primary px-1.5 text-[9px] text-white">{activeFilters}</span>}
          </Button>
        )}
        {actions}
        {total != null && <span className="tabular ml-auto text-[11px] text-muted-foreground">{formatInt(total)} registros</span>}
      </div>
      {filtersOpen && children && <div className="mt-3 grid gap-3 rounded-md border bg-background/40 p-3 sm:grid-cols-2 lg:grid-cols-4">{children}</div>}
    </div>
  );
}

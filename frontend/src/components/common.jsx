// Piezas de interfaz reutilizadas por todas las páginas (estilo de los wireframes de Astroshield AI).
import {
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Database,
  Loader2,
  ShieldCheck,
  X,
} from "lucide-react";
import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import { Button, Card, InfoTip, Skeleton } from "@/components/ui/primitives";
import { useDatasets } from "@/hooks/queries";
import { cn } from "@/utils/cn";
import { formatInt } from "@/utils/format";

/** Fecha de la última carga de datos y acceso a las fuentes. */
export function DataStamp() {
  const { data } = useDatasets();
  const latest = useMemo(() => {
    const dates = (data ?? []).map((s) => s.latest_import?.finished_at).filter(Boolean);
    return dates.sort().at(-1) ?? null;
  }, [data]);
  const ready = (data ?? []).some((s) => s.latest_import?.status === "completed");
  return (
    <div className="flex flex-col items-end gap-2">
      {latest && (
        <span className="flex items-center gap-1.5 text-[0.75rem] text-muted-foreground">
          <CalendarDays className="size-3.5" />
          Cargado {new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(new Date(latest))}
        </span>
      )}
      <Link
        to="/datos"
        className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-1.5 text-[0.8125rem] text-blue-100 hover:bg-primary/20"
      >
        <Database className="size-3.5" />
        {ready ? "Datos reales · SATCAT + NEO" : "Datos sin cargar"}
      </Link>
    </div>
  );
}

export function PageHeader({ eyebrow = "Centro de control espacial", title, description, actions }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="eyebrow mb-2 whitespace-pre">{eyebrow}</p>
        <h1 className="text-[1.75rem] font-medium leading-tight tracking-tight lg:text-[2rem]">
          {title}
          <span className="text-primary">.</span>
        </h1>
        {description && <p className="mt-1.5 max-w-3xl text-[0.875rem] text-muted-foreground">{description}</p>}
      </div>
      {actions ?? <DataStamp />}
    </motion.div>
  );
}

/** Franja informativa: deja claro qué es real y qué es conceptual. */
export function Notice({ label, children, tag }) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border bg-card/70 px-4 py-2.5 text-[0.8125rem]">
      <span className="flex items-center gap-1.5 font-semibold text-blue-200">
        <ShieldCheck className="size-3.5 text-primary" /> {label}
      </span>
      <span className="hidden h-3 w-px bg-border sm:block" aria-hidden />
      <span className="min-w-[12rem] flex-1 text-muted-foreground">{children}</span>
      {tag && <span className="rounded-[4px] border px-2 py-0.5 text-[0.6875rem] uppercase tracking-[0.14em] text-muted-foreground">{tag}</span>}
    </div>
  );
}

const TONE = {
  blue: "text-blue-300 border-primary/30 bg-primary/10",
  amber: "text-amber-300 border-status-warning/30 bg-status-warning/10",
  teal: "text-teal-300 border-teal-400/30 bg-teal-400/10",
  violet: "text-violet-300 border-violet-400/30 bg-violet-400/10",
  red: "text-red-300 border-status-critical/30 bg-status-critical/10",
  green: "text-emerald-300 border-status-good/30 bg-status-good/10",
};

export function IconTile({ icon: Icon, tone = "blue", className }) {
  return (
    <span className={cn("grid size-8 shrink-0 place-items-center rounded-md border", TONE[tone], className)}>
      <Icon className="size-4" aria-hidden />
    </span>
  );
}

/** Línea de tendencia mínima en SVG (sin ejes); el valor principal siempre está en texto. */
export function Sparkline({ values, color = "#3987e5", className }) {
  if (!values || values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 100},${28 - ((v - min) / (max - min || 1)) * 24}`).join(" ");
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className={cn("h-8 w-24", className)} aria-hidden>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

export function StatCard({ label, value, caption, icon, tone = "blue", spark, sparkColor, help }) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[0.8125rem] text-secondary-foreground">
          {label}
          {help && <InfoTip>{help}</InfoTip>}
        </span>
        {icon && <IconTile icon={icon} tone={tone} />}
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="tabular text-[1.875rem] font-medium leading-none tracking-tight">
          {typeof value === "number" ? formatInt(value) : (value ?? "—")}
        </span>
        {spark && <Sparkline values={spark} color={sparkColor} />}
      </div>
      {caption && <span className="text-[0.6875rem] text-muted-foreground">{caption}</span>}
    </Card>
  );
}

export function Panel({ title, description, help, actions, children, className, contentClassName }) {
  return (
    <Card className={cn("flex min-w-0 flex-col", className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3 px-4 pb-2 pt-4">
          <div>
            {title && (
              <h3 className="flex flex-wrap items-center gap-1.5 text-[0.875rem] font-semibold">
                {title}
                {help && <InfoTip>{help}</InfoTip>}
              </h3>
            )}
            {description && <p className="mt-0.5 text-[0.75rem] text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className={cn("min-w-0 flex-1 px-4 pb-4", !title && !actions && "pt-4", contentClassName)}>{children}</div>
    </Card>
  );
}

export function LoadingBlock({ className }) {
  return (
    <div className={cn("flex flex-col gap-2", className)} aria-busy="true" aria-label="Cargando">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-full min-h-24 w-full" />
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  const unavailable = error?.code === "data_unavailable" || error?.response?.status === 503;
  const Icon = unavailable ? Database : AlertTriangle;
  return (
    <div role="alert" className="flex flex-col items-start gap-2 rounded-md border border-dashed p-4 text-[0.875rem]">
      <div className="flex items-center gap-2 font-medium">
        <Icon className={cn("size-4", unavailable ? "text-accent" : "text-status-serious")} />
        {unavailable ? "Datos aún no disponibles" : "No se pudo cargar la información"}
      </div>
      <p className="text-muted-foreground">{error?.userMessage ?? error?.message ?? "Error desconocido"}</p>
      {unavailable && (
        <code className="rounded bg-muted px-2 py-1 text-xs">backend/data/satcat_celestrak.csv · backend/data/neo_nasa.csv</code>
      )}
      {onRetry && <Button size="sm" variant="outline" onClick={onRetry}>Reintentar</Button>}
    </div>
  );
}

/** Renderiza carga, error o contenido según el estado de una consulta. */
export function QueryBoundary({ query, children, loading }) {
  if (query.isPending) return <>{loading ?? <LoadingBlock />}</>;
  if (query.error || query.data === undefined) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  return <>{children(query.data)}</>;
}

export function Pagination({ page, pages, total, onPage, fetching }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t px-4 py-2.5 text-[0.75rem] text-muted-foreground">
      <span className="tabular flex items-center gap-2">
        {formatInt(total)} registros
        {fetching && <Loader2 className="size-3 animate-spin" aria-label="Actualizando" />}
      </span>
      <div className="flex items-center gap-1">
        <Button size="icon" variant="ghost" aria-label="Página anterior" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          <ChevronLeft />
        </Button>
        <span className="tabular px-1">{formatInt(page)} / {formatInt(Math.max(pages, 1))}</span>
        <Button size="icon" variant="ghost" aria-label="Página siguiente" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}

/** Panel lateral de detalles (se cierra con Escape). */
export function DetailPanel({ title, subtitle, onClose, children }) {
  useEffect(() => {
    const handler = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);
  return (
    <motion.aside
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      role="dialog"
      aria-modal="false"
      aria-label="Ficha del objeto"
      className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l bg-popover/95 shadow-2xl backdrop-blur"
    >
      <div className="flex items-start justify-between gap-3 border-b p-5">
        <div className="min-w-0">
          <p className="eyebrow mb-1">Ficha del objeto</p>
          <h2 className="truncate text-lg font-medium">{title}</h2>
          {subtitle && <div className="mt-0.5 text-[0.75rem] text-muted-foreground">{subtitle}</div>}
        </div>
        <Button size="icon" variant="ghost" aria-label="Cerrar" onClick={onClose}><X /></Button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 scrollbar-dark">{children}</div>
    </motion.aside>
  );
}

export function FieldGrid({ items }) {
  return (
    <dl className="divide-y divide-border/70 text-[0.8125rem]">
      {items.map(([k, v], i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-2">
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="tabular min-w-0 text-right font-medium [overflow-wrap:anywhere]">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function SectionLabel({ children }) {
  return <h4 className="eyebrow mb-2">{children}</h4>;
}

export function PageFooter({ note }) {
  return (
    <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-[0.6875rem] text-muted-foreground">
      <span className="flex items-center gap-2"><ShieldCheck className="size-3" /> AstroShield AI · Prototipo académico</span>
      <span>{note ?? "Indicadores descriptivos · sin predicción de colisiones ni impactos · v2.0"}</span>
    </footer>
  );
}

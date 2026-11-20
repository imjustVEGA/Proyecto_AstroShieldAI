// Componentes base con el estilo de Astroshield AI (equivalentes JSX de sus componentes shadcn/ui).
import { Info } from "lucide-react";
import { forwardRef, useId, useRef } from "react";
import { cn } from "@/utils/cn";

export function Card({ className, ...props }) {
  return <div className={cn("rounded-lg border bg-card text-foreground", className)} {...props} />;
}

const BADGE = {
  default: "border-primary/35 bg-primary/10 text-blue-200",
  accent: "border-accent/35 bg-accent/10 text-sky-200",
  muted: "border-border bg-secondary/60 text-muted-foreground",
  outline: "border-border bg-transparent text-muted-foreground tracking-[0.12em] uppercase",
  warning: "border-status-warning/40 bg-status-warning/10 text-amber-200",
  critical: "border-status-critical/45 bg-status-critical/10 text-red-200",
  good: "border-status-good/40 bg-status-good/10 text-emerald-200",
  violet: "border-violet-400/40 bg-violet-400/10 text-violet-200",
};
const DOT = {
  default: "bg-primary",
  accent: "bg-accent",
  muted: "bg-muted-foreground",
  outline: "bg-muted-foreground",
  warning: "bg-status-warning",
  critical: "bg-status-critical",
  good: "bg-status-good",
  violet: "bg-violet-400",
};

export function Badge({ className, variant = "default", dot = false, children, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-[4px] border px-1.5 py-[0.1875rem] text-[0.6875rem] font-medium leading-none",
        BADGE[variant],
        className,
      )}
      {...props}
    >
      {dot && <span className={cn("size-1.5 rounded-full", DOT[variant])} aria-hidden />}
      {children}
    </span>
  );
}

const BUTTON = {
  default: "bg-primary text-white hover:bg-primary/90",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  outline: "border border-input bg-transparent hover:bg-secondary",
  ghost: "hover:bg-secondary hover:text-foreground",
};
const BUTTON_SIZE = {
  default: "min-h-9 px-4 py-2",
  sm: "min-h-8 px-3 text-[0.8125rem]",
  icon: "size-9",
};

export const Button = forwardRef(function Button({ className, variant = "default", size = "default", type = "button", ...props }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:saturate-50 aria-pressed:bg-primary/15 aria-pressed:text-foreground [&_svg]:size-4 [&_svg]:shrink-0",
        BUTTON[variant],
        BUTTON_SIZE[size],
        className,
      )}
      {...props}
    />
  );
});

const FIELD =
  "min-h-9 rounded-md border border-input bg-background/50 px-3 text-[0.875rem] text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export function Input({ className, ...props }) {
  return <input className={cn(FIELD, "w-full", className)} {...props} />;
}

/** Select nativo con el estilo de los campos (accesible y sin dependencias). */
export function NativeSelect({ className, children, ...props }) {
  return (
    <select className={cn(FIELD, "min-w-0 max-w-full cursor-pointer pr-8", className)} {...props}>
      {children}
    </select>
  );
}

export function Label({ className, ...props }) {
  return <label className={cn("flex min-w-0 flex-col gap-1.5 text-[0.75rem] font-medium text-muted-foreground", className)} {...props} />;
}

export function Skeleton({ className }) {
  return <div className={cn("animate-pulse rounded-md bg-secondary/70", className)} />;
}

/** Ayuda contextual: icono con texto emergente al pasar el cursor o enfocar con teclado. */
export function InfoTip({ children, label = "Más información", align = "center" }) {
  const id = useId();
  const position = {
    center: "left-1/2 -translate-x-1/2",
    start: "left-0",
    end: "right-0",
  }[align];
  return (
    <span className="group relative inline-flex">
      <button type="button" aria-label={label} aria-describedby={id}
        className="inline-flex rounded-full text-muted-foreground hover:text-accent focus-visible:text-accent">
        <Info className="size-[0.9rem]" />
      </button>
      <span
        id={id}
        role="tooltip"
        className={cn(
          // Oculto con display:none (no solo invisible) para que no ensanche la página en pantallas angostas.
          "pointer-events-none absolute bottom-full z-50 mb-2 hidden w-[min(17rem,80vw)] rounded-md border bg-popover px-3 py-2 text-[0.75rem] font-normal normal-case leading-relaxed tracking-normal text-secondary-foreground shadow-xl group-focus-within:block group-hover:block",
          position,
        )}
      >
        {children}
      </span>
    </span>
  );
}

/** Término técnico con explicación breve (abreviaturas como LD, PHA, NORAD, LEO…). */
export function Term({ children, title }) {
  return (
    <abbr title={title} className="cursor-help underline decoration-dotted decoration-muted-foreground underline-offset-2">
      {children}
    </abbr>
  );
}

// --- Tabla -------------------------------------------------------------------

export function Table({ className, ...props }) {
  return (
    <div className="w-full overflow-x-auto scrollbar-dark">
      <table className={cn("w-full caption-bottom text-[0.8125rem]", className)} {...props} />
    </div>
  );
}
export const TableHeader = (props) => <thead className="[&_tr]:border-b" {...props} />;
export const TableBody = ({ className, ...props }) => <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
export function TableRow({ className, ...props }) {
  return (
    <tr
      className={cn("border-b border-border/70 transition-colors hover:bg-secondary/40 data-[selected=true]:bg-primary/15 data-[selected=true]:shadow-[inset_3px_0_0_rgb(var(--primary))]", className)}
      {...props}
    />
  );
}
export function TableHead({ className, ...props }) {
  return (
    <th
      className={cn("h-9 whitespace-nowrap px-3 text-left align-middle text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground", className)}
      {...props}
    />
  );
}
export function TableCell({ className, ...props }) {
  return <td className={cn("whitespace-nowrap px-3 py-2.5 align-middle", className)} {...props} />;
}

// --- Pestañas ------------------------------------------------------------------

/**
 * Pestañas accesibles (role="tablist"; flechas, Inicio y Fin cambian de pestaña).
 * tabs: [{ id, label, icon?, hint? }]. El contenido lo pinta la página con <TabPanel>.
 */
export function Tabs({ tabs, value, onChange, label, idPrefix = "tab", className }) {
  const refs = useRef([]);
  const onKeyDown = (event, index) => {
    const last = tabs.length - 1;
    const next = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: last }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const target = (next + tabs.length) % tabs.length;
    onChange(tabs[target].id);
    refs.current[target]?.focus();
  };
  return (
    <div role="tablist" aria-label={label} className={cn("flex flex-wrap gap-1 border-b", className)}>
      {tabs.map((tab, i) => {
        const selected = tab.id === value;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            ref={(el) => { refs.current[i] = el; }}
            id={`${idPrefix}-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={`${idPrefix}-panel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "-mb-px flex items-center gap-2 border-b-2 border-transparent px-3.5 py-2.5 text-[0.875rem] font-medium text-muted-foreground transition-colors hover:text-foreground",
              selected && "border-primary text-foreground",
            )}
          >
            {Icon && <Icon className={cn("size-4", selected ? "text-blue-300" : "")} aria-hidden />}
            {tab.label}
            {tab.hint && <span className="hidden text-[0.75rem] font-normal text-muted-foreground lg:inline">· {tab.hint}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({ id, idPrefix = "tab", children, className }) {
  return (
    <div role="tabpanel" id={`${idPrefix}-panel-${id}`} aria-labelledby={`${idPrefix}-${id}`} tabIndex={0}
      className={cn("focus-visible:outline-none", className)}>
      {children}
    </div>
  );
}

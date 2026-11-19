// Componentes base con el estilo de Astroshield AI (equivalentes JSX de sus componentes shadcn/ui).
import { Info } from "lucide-react";
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
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-[4px] border px-1.5 py-[3px] text-[10px] font-medium leading-none",
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
  default: "h-9 px-4 py-2",
  sm: "h-8 px-3 text-xs",
  icon: "size-9",
};

export function Button({ className, variant = "default", size = "default", type = "button", ...props }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0",
        BUTTON[variant],
        BUTTON_SIZE[size],
        className,
      )}
      {...props}
    />
  );
}

const FIELD =
  "h-9 rounded-md border border-input bg-background/50 px-3 text-[13px] text-foreground placeholder:text-muted-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:opacity-50";

export function Input({ className, ...props }) {
  return <input className={cn(FIELD, "w-full", className)} {...props} />;
}

/** Select nativo con el estilo de los campos (accesible y sin dependencias). */
export function NativeSelect({ className, children, ...props }) {
  return (
    <select className={cn(FIELD, "cursor-pointer pr-8", className)} {...props}>
      {children}
    </select>
  );
}

export function Label({ className, ...props }) {
  return <label className={cn("flex flex-col gap-1.5 text-[11px] font-medium text-muted-foreground", className)} {...props} />;
}

export function Skeleton({ className }) {
  return <div className={cn("animate-pulse rounded-md bg-secondary/70", className)} />;
}

/** Ayuda contextual: icono con texto emergente al pasar el cursor o enfocar. */
export function InfoTip({ children, label = "Más información" }) {
  return (
    <span className="group relative inline-flex">
      <button type="button" aria-label={label} className="inline-flex text-muted-foreground/70 hover:text-accent focus:text-accent focus:outline-none">
        <Info className="size-3.5" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none invisible absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-md border bg-popover px-3 py-2 text-[11px] font-normal normal-case leading-relaxed tracking-normal text-secondary-foreground opacity-0 shadow-xl transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
      >
        {children}
      </span>
    </span>
  );
}

// --- Tabla -------------------------------------------------------------------

export function Table({ className, ...props }) {
  return (
    <div className="w-full overflow-x-auto scrollbar-dark">
      <table className={cn("w-full caption-bottom text-[12.5px]", className)} {...props} />
    </div>
  );
}
export const TableHeader = (props) => <thead className="[&_tr]:border-b" {...props} />;
export const TableBody = ({ className, ...props }) => <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
export function TableRow({ className, ...props }) {
  return (
    <tr
      className={cn("border-b border-border/70 transition-colors hover:bg-secondary/40 data-[selected=true]:bg-primary/10", className)}
      {...props}
    />
  );
}
export function TableHead({ className, ...props }) {
  return (
    <th
      className={cn("h-9 whitespace-nowrap px-3 text-left align-middle text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground", className)}
      {...props}
    />
  );
}
export function TableCell({ className, ...props }) {
  return <td className={cn("whitespace-nowrap px-3 py-2.5 align-middle", className)} {...props} />;
}

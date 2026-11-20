/**
 * Controles de accesibilidad: tamaño del texto, alto contraste y movimiento.
 * `AccessibilityMenu` los muestra en un panel desplegable de la barra superior
 * (visible en todas las pantallas); `AccessibilityControls` se reutiliza en Configuración.
 */
import { Accessibility, Contrast, Minus, Move, Plus, RotateCcw, Type } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { MOTION_OPTIONS, TEXT_SIZES, useAccessibility } from "@/context/AccessibilityContext";
import { Button } from "@/components/ui/primitives";
import { cn } from "@/utils/cn";

/** Grupo de opciones excluyentes con aspecto de botones segmentados (role="radiogroup"). */
function Segmented({ label, options, value, onChange }) {
  const refs = useRef([]);
  const onKeyDown = (event, index) => {
    const delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!delta) return;
    event.preventDefault();
    const next = (index + delta + options.length) % options.length;
    onChange(options[next].id);
    refs.current[next]?.focus();
  };
  return (
    <div role="radiogroup" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-1 rounded-md border bg-background/60 p-1">
      {options.map((option, i) => {
        const checked = option.id === value;
        return (
          <button
            key={option.id}
            ref={(el) => { refs.current[i] = el; }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            onClick={() => onChange(option.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "flex min-h-9 flex-col items-center justify-center rounded px-2 py-1 text-[0.75rem] font-medium text-secondary-foreground transition-colors hover:bg-secondary",
              checked && "bg-primary text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.25)] hover:bg-primary",
            )}
          >
            {option.preview}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function Switch({ checked, onChange, label, description, icon: Icon }) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="flex items-start gap-2.5">
        <Icon className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
        <span>
          <label htmlFor={id} className="block text-[0.8125rem] font-semibold">{label}</label>
          <span className="block text-[0.75rem] text-muted-foreground">{description}</span>
        </span>
      </span>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors",
          checked ? "border-primary bg-primary" : "border-input bg-secondary",
        )}
      >
        <span className={cn("inline-block size-4 rounded-full bg-white shadow transition-transform", checked ? "translate-x-6" : "translate-x-1")} />
        <span className="sr-only">{checked ? "Activado" : "Desactivado"}</span>
      </button>
    </div>
  );
}

export function AccessibilityControls({ className }) {
  const a11y = useAccessibility();
  const sizeIndex = TEXT_SIZES.findIndex((s) => s.id === a11y.textSize);
  const textOptions = TEXT_SIZES.map((s, i) => ({
    ...s,
    preview: <span aria-hidden className="font-semibold leading-none" style={{ fontSize: `${0.8125 + i * 0.1875}rem` }}>A</span>,
  }));

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <section aria-labelledby="a11y-text-title">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 id="a11y-text-title" className="flex items-center gap-2 text-[0.8125rem] font-semibold">
            <Type className="size-4 text-accent" aria-hidden /> Tamaño del texto
          </h3>
          <span className="flex gap-1">
            <Button size="icon" variant="outline" className="size-8" aria-label="Reducir el tamaño del texto"
              disabled={sizeIndex <= 0} onClick={() => a11y.stepText(-1)}>
              <Minus />
            </Button>
            <Button size="icon" variant="outline" className="size-8" aria-label="Aumentar el tamaño del texto"
              disabled={sizeIndex >= TEXT_SIZES.length - 1} onClick={() => a11y.stepText(1)}>
              <Plus />
            </Button>
          </span>
        </div>
        <Segmented label="Tamaño del texto" options={textOptions} value={a11y.textSize} onChange={(id) => a11y.update({ textSize: id })} />
      </section>

      <Switch icon={Contrast} label="Alto contraste" checked={a11y.highContrast} onChange={(v) => a11y.update({ highContrast: v })}
        description="Textos más claros, bordes visibles y foco amarillo." />

      <section aria-labelledby="a11y-motion-title">
        <h3 id="a11y-motion-title" className="mb-1 flex items-center gap-2 text-[0.8125rem] font-semibold">
          <Move className="size-4 text-accent" aria-hidden /> Animaciones
        </h3>
        <p className="mb-2 text-[0.75rem] text-muted-foreground">
          Con “Reducido” el globo no gira solo y las transiciones son instantáneas.
        </p>
        <Segmented label="Animaciones" options={MOTION_OPTIONS} value={a11y.motion} onChange={(id) => a11y.update({ motion: id })} />
      </section>

      <Button variant="ghost" size="sm" className="self-start text-muted-foreground" onClick={a11y.reset} disabled={a11y.isDefault}>
        <RotateCcw /> Restablecer valores
      </Button>
    </div>
  );
}

/** Botón de la barra superior que abre el panel de accesibilidad (Escape lo cierra). */
export function AccessibilityMenu() {
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  const trigger = useRef(null);
  const panelId = useId();
  const { isDefault } = useAccessibility();

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => !box.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={box} className="relative">
      <Button ref={trigger} variant="outline" size="sm" aria-expanded={open} aria-controls={panelId}
        onClick={() => setOpen((o) => !o)} className={cn("relative h-9 gap-1.5", open && "bg-secondary")}>
        <Accessibility />
        <span className="hidden md:inline">Accesibilidad</span>
        {!isDefault && <span className="absolute -right-1 -top-1 size-2.5 rounded-full border-2 border-background bg-accent" aria-label="Preferencias activas" />}
      </Button>
      {open && (
        <div id={panelId} role="dialog" aria-label="Opciones de accesibilidad"
          className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-lg border bg-popover p-4 shadow-2xl">
          <p className="mb-4 text-[0.75rem] text-muted-foreground">Se aplica a toda la aplicación y se recuerda en este navegador.</p>
          <AccessibilityControls />
        </div>
      )}
    </div>
  );
}

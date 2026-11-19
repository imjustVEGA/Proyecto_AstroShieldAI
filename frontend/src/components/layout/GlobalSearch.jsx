/** Búsqueda global en SATCAT y NEO. Atajo: Ctrl/⌘ + K. */
import { Loader2, Satellite, Search } from "lucide-react";
import { Telescope } from "@/components/icons";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import useDebounce from "@/hooks/useDebounce";
import { useSearch } from "@/hooks/queries";

export default function GlobalSearch() {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const q = useDebounce(text, 250);
  const { data, isFetching, error } = useSearch(q);
  const navigate = useNavigate();
  const box = useRef(null);
  const input = useRef(null);
  const hits = data ?? [];

  useEffect(() => {
    const close = (e) => !box.current?.contains(e.target) && setOpen(false);
    const shortcut = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        input.current?.focus();
      }
    };
    document.addEventListener("mousedown", close);
    window.addEventListener("keydown", shortcut);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("keydown", shortcut);
    };
  }, []);
  useEffect(() => setActive(0), [q]);

  const go = (hit) => {
    navigate(hit.kind === "satcat" ? `/satcat?id=${hit.id}` : `/neos?id=${hit.id}`);
    setOpen(false);
    setText("");
  };

  return (
    <div ref={box} className="relative w-56 sm:w-72">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={input}
        value={text}
        onChange={(e) => { setText(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") setActive((i) => Math.min(i + 1, hits.length - 1));
          if (e.key === "ArrowUp") setActive((i) => Math.max(i - 1, 0));
          if (e.key === "Enter" && hits[active]) go(hits[active]);
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="Buscar objeto, NORAD, NEO…"
        aria-label="Búsqueda global"
        role="combobox"
        aria-expanded={open && hits.length > 0}
        className="h-8 w-full rounded-md border border-input bg-card/60 pl-8 pr-14 text-[12px] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      />
      {isFetching && q.trim().length >= 2 ? (
        <Loader2 className="absolute right-3 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
      ) : (
        <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border bg-secondary px-1.5 py-0.5 text-[9px] text-muted-foreground">Ctrl K</kbd>
      )}
      {open && q.trim().length >= 2 && (
        <div role="listbox" className="absolute right-0 z-50 mt-1 max-h-96 w-80 overflow-y-auto rounded-lg border bg-popover p-1 shadow-2xl scrollbar-dark">
          {error && <p className="p-3 text-xs text-muted-foreground">No se pudo buscar: {error.userMessage ?? error.message}</p>}
          {!error && !isFetching && hits.length === 0 && <p className="p-3 text-xs text-muted-foreground">Sin resultados para “{q}”.</p>}
          {hits.map((hit, i) => (
            <button key={`${hit.kind}-${hit.id}`} type="button" role="option" aria-selected={i === active}
              onMouseEnter={() => setActive(i)} onClick={() => go(hit)}
              className="flex w-full items-start gap-2.5 rounded-md px-2 py-2 text-left text-[12.5px] aria-selected:bg-secondary">
              {hit.kind === "satcat"
                ? <Satellite className="mt-0.5 size-4 text-blue-300" />
                : <Telescope className="mt-0.5 size-4 text-amber-200" />}
              <span className="min-w-0">
                <span className="block truncate">{hit.name}</span>
                <span className="block truncate text-[10.5px] text-muted-foreground">{hit.subtitle}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

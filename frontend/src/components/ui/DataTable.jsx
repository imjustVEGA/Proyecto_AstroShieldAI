import { useMemo, useState } from "react";

/** Tabla reutilizable con búsqueda opcional y desplazamiento horizontal. */
export default function DataTable({ columns, data, renderRow, searchable = true }) {
  const [query, setQuery] = useState("");
  const filteredData = useMemo(() => {
    if (!query.trim()) return data;
    const normalizedQuery = query.toLowerCase();
    return data.filter((item) => Object.values(item).some((value) => String(value).toLowerCase().includes(normalizedQuery)));
  }, [data, query]);

  return (
    <div className="overflow-hidden rounded-xl border border-astro-card bg-astro-card">
      {searchable && (
        <div className="border-b border-astro-bg p-4">
          <input
            aria-label="Buscar en la tabla"
            className="w-full max-w-sm rounded-lg border border-astro-bg bg-astro-bg px-3 py-2 text-sm text-astro-text outline-none focus:border-astro-blue"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar..."
            type="search"
            value={query}
          />
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-astro-bg text-xs uppercase tracking-wide text-astro-muted">
            <tr>{columns.map((column) => <th className="whitespace-nowrap px-4 py-3" key={column}>{column}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-astro-bg">
            {filteredData.map((item, index) => (
              <tr className="transition hover:bg-astro-bg/60" key={item.id || index}>{renderRow(item, index)}</tr>
            ))}
          </tbody>
        </table>
      </div>
      {!filteredData.length && <p className="p-6 text-center text-sm text-astro-muted">No se encontraron resultados.</p>}
    </div>
  );
}

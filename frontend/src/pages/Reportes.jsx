import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Download, FileText, Search } from "lucide-react";
import { toast } from "sonner";
import useFetch from "@/hooks/useFetch";
import { getSatcat } from "@/services/satcatService";

export default function Reportes() {
  const { data, loading } = useFetch(() => getSatcat(1, 100), []);
  const [filter, setFilter] = useState("");

  const reports = useMemo(() => (data?.items || []).map((item, index) => ({
    id: `AST-${String(index + 1).padStart(4, "0")}`,
    objeto: item.name,
    norad: item.norad,
    orbita: item.orbit,
    estado: item.status,
    fecha: `${item.launch_year || 2026}-11-18`,
  })), [data]);

  const visible = reports.filter((report) =>
    `${report.objeto} ${report.norad} ${report.orbita}`.toLowerCase().includes(filter.toLowerCase()),
  );

  const exportCsv = () => {
    if (!visible.length) return toast.error("No hay registros para exportar");
    const columns = ["id", "objeto", "norad", "orbita", "estado", "fecha"];
    const escape = (value) => `"${String(value).replaceAll('"', '""')}"`;
    const csv = [columns.join(","), ...visible.map((row) => columns.map((column) => escape(row[column])).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "astroshield_reportes.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Reporte exportado");
  };

  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-[1800px] space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-widest text-astro-cyan">Documentación</p><h1 className="mt-2 text-3xl font-semibold">Reportes</h1></div><button onClick={exportCsv} className="flex items-center gap-2 rounded-lg bg-astro-blue px-4 py-2.5 font-semibold" type="button"><Download size={18} /> Exportar CSV</button></header>
      <div className="flex items-center gap-3 rounded-xl border border-astro-card bg-astro-card px-4 py-3"><Search size={18} className="text-astro-muted" /><input value={filter} onChange={(event) => setFilter(event.target.value)} className="w-full bg-transparent outline-none" placeholder="Filtrar por objeto, NORAD u órbita" /></div>
      <article className="overflow-hidden rounded-xl border border-astro-card bg-astro-card">
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-astro-card text-xs uppercase tracking-wider text-astro-muted"><tr>{["Reporte", "Objeto", "NORAD", "Órbita", "Estado", "Fecha"].map((column) => <th className="px-5 py-4" key={column}>{column}</th>)}</tr></thead><tbody>
          {loading ? <tr><td className="px-5 py-8 text-astro-muted" colSpan="6">Cargando reportes...</td></tr> : visible.map((report) => <tr className="border-b border-astro-card/60 last:border-0" key={report.id}><td className="px-5 py-4"><span className="flex items-center gap-2 font-medium"><FileText size={16} className="text-astro-cyan" />{report.id}</span></td><td className="px-5 py-4">{report.objeto}</td><td className="px-5 py-4 text-astro-muted">{report.norad}</td><td className="px-5 py-4 text-astro-muted">{report.orbita}</td><td className="px-5 py-4"><span className="rounded-full bg-astro-cyan/10 px-2 py-1 text-xs text-astro-cyan">{report.estado}</span></td><td className="px-5 py-4 text-astro-muted">{report.fecha}</td></tr>)}
          {!loading && !visible.length && <tr><td className="px-5 py-8 text-center text-astro-muted" colSpan="6">No se encontraron reportes.</td></tr>}
        </tbody></table></div>
      </article>
    </motion.section>
  );
}

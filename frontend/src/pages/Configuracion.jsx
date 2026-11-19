import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Monitor, Save, TableProperties } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common";

export default function Configuracion() {
  const [preferences, setPreferences] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("astroshield_preferences")) || { theme: "dark", rows: 25 };
    } catch {
      return { theme: "dark", rows: 25 };
    }
  });

  useEffect(() => {
    document.documentElement.dataset.theme = preferences.theme;
  }, [preferences.theme]);

  const save = () => {
    localStorage.setItem("astroshield_preferences", JSON.stringify(preferences));
    toast.success("Preferencias guardadas");
  };

  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl space-y-6">
      <PageHeader eyebrow="Sistema  /  Preferencias" title="Configuración" description="Preferencias locales de esta computadora." actions={<span />} />
      <div className="grid gap-6 md:grid-cols-2">
        <article className="rounded-lg border bg-card p-6"><Monitor className="text-astro-cyan" /><h2 className="mt-4 font-semibold">Tema de interfaz</h2><p className="mt-1 text-sm text-astro-muted">Selecciona la apariencia global.</p><select value={preferences.theme} onChange={(event) => setPreferences((current) => ({ ...current, theme: event.target.value }))} className="mt-5 w-full rounded-md border border-input bg-background px-4 py-2.5 text-sm"><option value="dark">Oscuro (nativo)</option><option value="light" disabled>Claro (próximamente)</option></select></article>
        <article className="rounded-lg border bg-card p-6"><TableProperties className="text-astro-cyan" /><h2 className="mt-4 font-semibold">Filas por tabla</h2><p className="mt-1 text-sm text-astro-muted">Define el tamaño de página preferido.</p><select value={preferences.rows} onChange={(event) => setPreferences((current) => ({ ...current, rows: Number(event.target.value) }))} className="mt-5 w-full rounded-md border border-input bg-background px-4 py-2.5 text-sm"><option value="10">10 filas</option><option value="25">25 filas</option><option value="50">50 filas</option><option value="100">100 filas</option></select></article>
      </div>
      <button onClick={save} className="flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90" type="button"><Save size={18} /> Guardar configuración</button>
    </motion.section>
  );
}

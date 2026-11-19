import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Gauge, Orbit, Ruler } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function Simulacion() {
  const [params, setParams] = useState({ masa: 1200, velocidad: 7.66, altitud: 420 });
  const [running, setRunning] = useState(false);

  const trajectory = useMemo(() => {
    const data = [];
    for (let t = 0; t <= 120; t += 6) {
      const angle = (t / 120) * Math.PI * 2;
      data.push({
        tiempo: t,
        altitud: Math.max(120, params.altitud + Math.sin(angle) * params.velocidad * 3),
        velocidad: params.velocidad - Math.cos(angle) * 0.08,
      });
    }
    return data;
  }, [params]);

  const update = (field) => (event) =>
    setParams((current) => ({ ...current, [field]: Number(event.target.value) }));

  const run = () => {
    setRunning(true);
    window.setTimeout(() => setRunning(false), 800);
  };

  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-[1800px] space-y-6">
      <header><p className="text-sm font-semibold uppercase tracking-widest text-astro-cyan">Laboratorio orbital</p><h1 className="mt-2 text-3xl font-semibold">Simulación orbital</h1></header>
      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <aside className="space-y-4 rounded-xl border border-astro-card bg-astro-card p-5">
          <h2 className="flex items-center gap-2 font-semibold"><Activity size={18} className="text-astro-cyan" /> Variables de misión</h2>
          {[
            ["masa", "Masa", "kg", 100, 10000, params.masa],
            ["velocidad", "Velocidad", "km/s", 1, 12, params.velocidad],
            ["altitud", "Altitud", "km", 150, 36000, params.altitud],
          ].map(([field, label, unit, min, max, value]) => (
            <label className="block" key={field}>
              <span className="flex justify-between text-sm text-astro-muted"><span>{label}</span><span>{value} {unit}</span></span>
              <input className="mt-2 w-full accent-astro-cyan" type="range" min={min} max={max} step={field === "velocidad" ? 0.01 : 1} value={value} onChange={update(field)} />
            </label>
          ))}
          <button onClick={run} disabled={running} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-astro-blue px-4 py-3 font-semibold disabled:opacity-60" type="button">
            {running ? "Calculando..." : "Ejecutar simulación"}
          </button>
        </aside>
        <article className="min-h-[460px] rounded-xl border border-astro-card bg-astro-card p-5">
          <div className="flex items-center justify-between"><h2 className="font-semibold">Trayectoria proyectada</h2><span className="rounded-full border border-astro-cyan/30 px-3 py-1 text-xs text-astro-cyan">LIVE MODEL</span></div>
          <div className="mt-5 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trajectory}>
                <XAxis dataKey="tiempo" stroke="#7F8BA3" unit=" min" />
                <YAxis stroke="#7F8BA3" />
                <Tooltip contentStyle={{ background: "#141B2E", border: "1px solid #1E293B" }} />
                <Line type="monotone" dataKey="altitud" stroke="#22D3EE" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[["Periodo estimado", `${Math.round(84 + params.altitud / 80)} min`, Orbit], ["Velocidad modelo", `${params.velocidad.toFixed(2)} km/s`, Gauge], ["Inclinación nominal", "51.64°", Ruler]].map(([label, value, Icon]) => (
          <div className="rounded-xl border border-astro-card bg-astro-card p-4" key={label}><Icon className="mb-3 text-astro-cyan" size={19} /><p className="text-xs text-astro-muted">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p></div>
        ))}
      </div>
    </motion.section>
  );
}

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#EF4444", "#22D3EE"];

/** Presenta la proporción de objetos NEO peligrosos y seguros. */
export default function ClassificationDonut({ data, total }) {
  return (
    <div className="relative h-64 w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={65} outerRadius={92} paddingAngle={3}>
            {data.map((entry, index) => <Cell fill={COLORS[index % COLORS.length]} key={entry.name} />)}
          </Pie>
          <Tooltip contentStyle={{ backgroundColor: "#141B2E", borderColor: "#3B82F6", color: "#E5E7EB" }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold text-astro-text">{total}</span>
        <span className="text-xs text-astro-muted">Objetos</span>
      </div>
    </div>
  );
}

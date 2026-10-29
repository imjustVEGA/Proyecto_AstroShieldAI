import { ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";

/** Relaciona la distancia de aproximación con el diámetro del NEO. */
export default function DistanceScatter({ data }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <ScatterChart margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <XAxis dataKey="distance" name="Distancia" unit=" UA" tick={{ fill: "#9CA3AF", fontSize: 10 }} />
          <YAxis dataKey="diameter" name="Diámetro" unit=" km" tick={{ fill: "#9CA3AF", fontSize: 10 }} />
          <ZAxis dataKey="diameter" range={[40, 180]} />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ backgroundColor: "#141B2E", borderColor: "#3B82F6", color: "#E5E7EB" }} />
          <Scatter data={data} fill="#F97316" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

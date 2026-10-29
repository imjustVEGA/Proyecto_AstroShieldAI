import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

/** Gráfica de barras adaptable para distintas métricas del catálogo. */
export default function SimpleBarChart({ data, dataKeyX = "name", dataKeyY = "value", barColor = "#22D3EE" }) {
  const keys = Array.isArray(dataKeyY) ? dataKeyY : [dataKeyY];
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="#26304a" strokeDasharray="3 3" />
          <XAxis dataKey={dataKeyX} tick={{ fill: "#9CA3AF", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#9CA3AF", fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ backgroundColor: "#141B2E", borderColor: "#3B82F6", color: "#E5E7EB" }} />
          {keys.map((key, index) => (
            <Bar dataKey={key} fill={index === 0 ? barColor : "#22D3EE"} key={key} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

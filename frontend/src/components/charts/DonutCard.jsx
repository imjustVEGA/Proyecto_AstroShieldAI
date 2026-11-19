// Dona con leyenda numérica (el número siempre acompaña al color).
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { Panel } from "@/components/common";
import { formatInt, formatPercent } from "@/utils/format";
import { tooltipProps } from "./theme";

export function DonutCard({ title, description, help, slices, centerLabel, height = 190 }) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const first = slices[0];
  return (
    <Panel title={title} description={description} help={help}>
      <div className="relative" style={{ height: height - 60 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={slices} dataKey="value" nameKey="label" innerRadius="62%" outerRadius="88%" paddingAngle={1.5}
              stroke="#0b1120" strokeWidth={2} isAnimationActive={false}>
              {slices.map((s) => <Cell key={s.label} fill={s.color} />)}
            </Pie>
            <Tooltip {...tooltipProps} formatter={(v, name) => [formatInt(v), name]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <span>
            <span className="tabular block text-[20px] font-medium leading-none">{total ? formatPercent(first.value / total, 1) : "—"}</span>
            <span className="eyebrow">{centerLabel}</span>
          </span>
        </div>
      </div>
      <ul className="mt-3 space-y-1 text-[11px]">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-secondary-foreground">
              <span className="size-2 rounded-full" style={{ background: s.color }} aria-hidden /> {s.label}
            </span>
            <span className="tabular text-muted-foreground">{formatInt(s.value)}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

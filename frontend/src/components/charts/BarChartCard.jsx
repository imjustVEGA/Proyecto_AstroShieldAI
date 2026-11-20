// Gráfica de barras en un panel, con alternativa en tabla (la identidad nunca depende solo del color).
import { BarChart3, TableIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useRemPx } from "@/hooks/useElementSize";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Panel } from "@/components/common";
import { Button } from "@/components/ui/primitives";
import { formatInt, formatNumber } from "@/utils/format";
import { CHART, axisProps, tooltipProps } from "./theme";

/**
 * data:   [{ label, value, color? }]  (una serie)
 * series: { categories: string[], items: [{ name, color, values }] }  (varias series agrupadas)
 */
export function BarChartCard({
  title, description, help, data, series, color = CHART.series1, horizontal = false, logScale = false, height = 190,
  valueLabel = "Objetos", valueDigits = 0, axisName, markLineAt, className,
}) {
  const [asTable, setAsTable] = useState(false);
  // Los textos de los ejes escalan con Accesibilidad (CSS en rem): los anchos reservados también.
  const k = useRemPx() / 16;

  const { rows, allSeries, fmt, labelWidth } = useMemo(() => {
    const fmt = (v) => (valueDigits ? formatNumber(v, valueDigits) : formatInt(v));
    const categories = series ? series.categories : (data ?? []).map((d) => d.label);
    const allSeries = series ? series.items : [{ name: valueLabel, color, values: (data ?? []).map((d) => d.value) }];
    const rows = categories.map((label, i) => {
      const row = { label, _color: !series ? data?.[i]?.color : undefined };
      allSeries.forEach((s, k) => { row[`s${k}`] = s.values[i]; });
      return row;
    });
    const longest = Math.max(0, ...categories.map((c) => String(c).length));
    return { rows, allSeries, fmt, labelWidth: Math.min(170, Math.max(40, longest * 6.6)) };
  }, [series, data, valueLabel, valueDigits, color]);

  const valueAxis = {
    ...axisProps,
    type: "number",
    scale: logScale ? "log" : "auto",
    domain: logScale ? [1, "auto"] : [0, "auto"],
    allowDataOverflow: logScale,
    tickFormatter: (v) => formatInt(v),
    width: horizontal ? undefined : Math.round(52 * k),
  };
  const categoryAxis = {
    ...axisProps,
    type: "category",
    dataKey: "label",
    interval: horizontal ? 0 : "preserveStartEnd",
    minTickGap: 4,
    width: horizontal ? Math.round(labelWidth * k) : undefined,
    label: axisName && !horizontal ? { value: axisName, position: "insideBottom", offset: -2, fill: CHART.muted, fontSize: 10 } : undefined,
  };

  return (
    <Panel
      title={title}
      description={description}
      help={help}
      className={className}
      actions={
        <Button size="icon" variant="ghost" className="size-7 text-muted-foreground" aria-label={asTable ? "Ver gráfica" : "Ver como tabla"}
          title={asTable ? "Ver gráfica" : "Ver como tabla"} onClick={() => setAsTable((v) => !v)}>
          {asTable ? <BarChart3 /> : <TableIcon />}
        </Button>
      }
    >
      {asTable ? (
        <div className="overflow-auto scrollbar-dark" style={{ maxHeight: height }}>
          <table className="w-full text-[0.75rem]">
            <thead>
              <tr className="text-muted-foreground">
                <th className="py-1 text-left font-medium">{axisName ?? "Categoría"}</th>
                {allSeries.map((s) => <th key={s.name} className="py-1 text-right font-medium">{s.name}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-t border-border/60">
                  <td className="py-1">{r.label}</td>
                  {allSeries.map((s, k) => <td key={s.name} className="tabular py-1 text-right">{fmt(r[`s${k}`])}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ height }} role="img" aria-label={`${title}. Disponible también como tabla.`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} layout={horizontal ? "vertical" : "horizontal"}
              margin={{ top: allSeries.length > 1 ? 4 : 8, right: 12, left: 0, bottom: axisName && !horizontal ? 12 : 0 }}
              barCategoryGap={horizontal ? "30%" : "18%"} barGap={2}>
              <CartesianGrid stroke={CHART.grid} vertical={horizontal} horizontal={!horizontal} />
              {horizontal ? <XAxis {...valueAxis} /> : <XAxis {...categoryAxis} />}
              {horizontal ? <YAxis {...categoryAxis} /> : <YAxis {...valueAxis} />}
              <Tooltip {...tooltipProps} formatter={(v, name) => [fmt(v), name]} />
              {allSeries.length > 1 && (
                <Legend verticalAlign="top" align="right" iconType="circle" iconSize={8} height={22}
                  wrapperStyle={{ fontSize: 10, color: CHART.textSecondary }} />
              )}
              {markLineAt && (
                <ReferenceLine {...(horizontal ? { y: markLineAt.category } : { x: markLineAt.category })}
                  stroke={CHART.textSecondary} strokeDasharray="4 3"
                  label={{ value: markLineAt.label, fill: CHART.textSecondary, fontSize: 10, position: "top" }} />
              )}
              {allSeries.map((s, k) => (
                <Bar key={s.name} dataKey={`s${k}`} name={s.name} fill={s.color} maxBarSize={horizontal ? 12 : 26}
                  radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]} isAnimationActive={false}>
                  {!series && rows.map((r) => <Cell key={r.label} fill={r._color ?? s.color} />)}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
}

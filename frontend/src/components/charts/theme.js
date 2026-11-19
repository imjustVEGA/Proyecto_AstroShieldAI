// Tokens de gráficos. Paletas validadas (dataviz) sobre la superficie #0b1120 en modo oscuro.
export const CHART = {
  surface: "#0b1120",
  series1: "#3987e5", // azul: serie principal
  series2: "#0f9a8f", // verde azulado: segunda serie comparable
  series3: "#9085e9", // violeta: serie única alternativa (p. ej. inclinación)
  hazardous: "#c98500", // "potencialmente peligroso" (siempre con etiqueta)
  textPrimary: "#e8eef9",
  textSecondary: "#c3cad8",
  muted: "#6f7e98",
  grid: "#162038",
  tooltipBg: "#0d1526",
};

export const axisProps = {
  stroke: CHART.grid,
  tick: { fill: CHART.muted, fontSize: 10 },
  tickLine: false,
  axisLine: { stroke: CHART.grid },
};

export const tooltipProps = {
  cursor: { fill: "rgba(59,130,246,0.07)" },
  contentStyle: {
    background: CHART.tooltipBg,
    border: `1px solid ${CHART.grid}`,
    borderRadius: 6,
    color: CHART.textPrimary,
    fontSize: 12,
  },
  labelStyle: { color: CHART.textSecondary, marginBottom: 2 },
  itemStyle: { color: CHART.textPrimary, padding: 0 },
};

// Dispersión en canvas con ejes logarítmicos: dibuja ~27 mil puntos sin bloquear la interfaz.
import { useEffect, useRef, useState } from "react";

import { Panel } from "@/components/common";
import { formatNumber } from "@/utils/format";
import { CHART } from "./theme";

const PAD = { left: 44, right: 18, top: 14, bottom: 22 };

function logRange(points) {
  let min = Infinity;
  let max = -Infinity;
  points.forEach((v) => { if (v > 0) { min = Math.min(min, v); max = Math.max(max, v); } });
  if (!Number.isFinite(min)) return [0, 1];
  return [Math.floor(Math.log10(min)), Math.ceil(Math.log10(max))];
}

export function ScatterCard({ title, description, help, series, xName, yName, height = 190 }) {
  const canvas = useRef(null);
  const box = useRef(null);
  const [width, setWidth] = useState(300);

  useEffect(() => {
    const el = box.current;
    if (!el) return undefined;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(120, Math.floor(entry.contentRect.width))));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const ratio = window.devicePixelRatio || 1;
    const h = height - 20;
    el.width = width * ratio;
    el.height = h * ratio;
    const ctx = el.getContext("2d");
    ctx.scale(ratio, ratio);
    ctx.clearRect(0, 0, width, h);

    const all = series.flatMap((s) => s.points);
    const [x0, x1] = logRange(all.map((p) => p[0]));
    const [y0, y1] = logRange(all.map((p) => p[1]));
    const sx = (v) => PAD.left + ((Math.log10(v) - x0) / (x1 - x0 || 1)) * (width - PAD.left - PAD.right);
    const sy = (v) => h - PAD.bottom - ((Math.log10(v) - y0) / (y1 - y0 || 1)) * (h - PAD.top - PAD.bottom);

    ctx.strokeStyle = CHART.grid;
    ctx.fillStyle = CHART.muted;
    ctx.font = "10px Manrope, sans-serif";
    ctx.lineWidth = 1;
    for (let e = x0; e <= x1; e++) {
      const x = sx(10 ** e);
      ctx.beginPath(); ctx.moveTo(x, PAD.top); ctx.lineTo(x, h - PAD.bottom); ctx.stroke();
      ctx.textAlign = "center"; ctx.fillText(formatNumber(10 ** e, e < 0 ? -e : 0), x, h - 6);
    }
    for (let e = y0; e <= y1; e++) {
      const y = sy(10 ** e);
      ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(width - PAD.right, y); ctx.stroke();
      ctx.textAlign = "right"; ctx.fillText(formatNumber(10 ** e, e < 0 ? -e : 0), PAD.left - 4, y + 3);
    }
    ctx.textAlign = "left";
    ctx.fillText(yName, PAD.left + 4, PAD.top - 4);
    ctx.textAlign = "right";
    ctx.fillText(xName, width - PAD.right, h - PAD.bottom - 4);

    series.forEach((s) => {
      ctx.fillStyle = s.color;
      ctx.globalAlpha = s.points.length > 5000 ? 0.35 : 0.7;
      s.points.forEach(([x, y]) => {
        if (x > 0 && y > 0) ctx.fillRect(sx(x) - 1, sy(y) - 1, 2, 2);
      });
    });
    ctx.globalAlpha = 1;
  }, [series, width, height, xName, yName]);

  return (
    <Panel title={title} description={description} help={help}>
      <div ref={box} style={{ height }}>
        <canvas ref={canvas} style={{ width: "100%", height: height - 20 }} role="img"
          aria-label={`${title}: ${series.map((s) => `${s.points.length} ${s.name}`).join(", ")}`} />
        <div className="mt-1 flex flex-wrap gap-3 text-[10px] text-secondary-foreground">
          {series.map((s) => (
            <span key={s.name} className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: s.color }} aria-hidden /> {s.name}
            </span>
          ))}
        </div>
      </div>
    </Panel>
  );
}

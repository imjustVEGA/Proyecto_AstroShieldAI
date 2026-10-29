/** Dashboard de métricas agregadas. */
import { useEffect, useState } from "react";
import { api } from "../services/api";

export function Dashboard() {
  /** Carga las métricas del backend. */
  const [stats, setStats] = useState(null);
  useEffect(() => { api.get("/stats").then(({ data }) => setStats(data)); }, []);
  return <section><h1>Mission dashboard</h1>{stats ? <div className="cards">
    <article><small>NEOs monitoreados</small><b>{stats.total_neos}</b></article>
    <article><small>Potencialmente peligrosos</small><b>{stats.hazardous_neos}</b></article>
    <article><small>Tasa de riesgo</small><b>{(stats.hazardous_rate * 100).toFixed(2)}%</b></article>
    <article><small>Velocidad media</small><b>{stats.average_velocity.toFixed(1)} km/h</b></article>
  </div> : <p>Cargando métricas...</p>}</section>;
}

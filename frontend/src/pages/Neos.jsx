/** Tabla paginada de asteroides. */
import { useEffect, useState } from "react";
import { api } from "../services/api";

export function Neos() {
  /** Obtiene la primera página del catálogo. */
  const [items, setItems] = useState([]);
  useEffect(() => { api.get("/neos").then(({ data }) => setItems(data.items)); }, []);
  return <section><h1>NEO catalog</h1><table><thead><tr><th>Name</th><th>Velocity</th><th>Miss distance</th><th>Hazardous</th></tr></thead>
    <tbody>{items.map((neo) => <tr key={neo.id}><td>{neo.name}</td><td>{neo.relative_velocity}</td><td>{neo.miss_distance}</td><td>{neo.is_hazardous ? "YES" : "NO"}</td></tr>)}</tbody>
  </table></section>;
}

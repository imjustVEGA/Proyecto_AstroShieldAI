import { useCallback } from "react";
import useFetch from "./useFetch";
import { getStats } from "@/services/neoService";

/** Carga los indicadores agregados del dashboard. */
export default function useStats() {
  const fetchStats = useCallback(() => getStats(), []);
  return useFetch(fetchStats, []);
}

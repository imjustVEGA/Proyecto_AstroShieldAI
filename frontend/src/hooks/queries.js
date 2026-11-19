/** Consultas de la API reutilizadas por varias pantallas. */
import useQuery from "./useQuery";
import * as astro from "@/services/astroService";

export const useDashboard = () => useQuery(["dashboard"], astro.getDashboard);
export const useShells = () => useQuery(["shells"], astro.getShells);
export const useCapabilities = () => useQuery(["capabilities"], astro.getCapabilities);
export const useDatasets = () => useQuery(["datasets"], astro.getDatasets);

export const useSatcatList = (params) => useQuery(["satcat", params], () => astro.getSatcatList(params), { keepPrevious: true });
export const useSatcatStats = () => useQuery(["satcat-stats"], astro.getSatcatStats);
export const useSatcatDetail = (id) => useQuery(["satcat", id], () => astro.getSatcatDetail(id), { enabled: id != null });

export const useNeoList = (params) => useQuery(["neo", params], () => astro.getNeoList(params), { keepPrevious: true });
export const useNeoStats = () => useQuery(["neo-stats"], astro.getNeoStats);
export const useNeoDetail = (id) => useQuery(["neo", id], () => astro.getNeoDetail(id), { enabled: id != null });
export const useNeoDistanceDiameter = () => useQuery(["neo-dd"], astro.getNeoDistanceDiameter);

export const useOrbitalDistribution = (types) =>
  useQuery(["orbital-distribution", types], () => astro.getOrbitalDistribution(types));
export const useClassification = () => useQuery(["classification"], astro.getClassification);
export const usePrioritization = (params) => useQuery(["prioritization", params], () => astro.getPrioritization(params), { keepPrevious: true });
export const useSearch = (q) =>
  useQuery(["search", q], () => astro.search(q), { enabled: q.trim().length >= 2, keepPrevious: true });

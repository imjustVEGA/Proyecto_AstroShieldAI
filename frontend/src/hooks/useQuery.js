import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Consulta con caché en memoria por clave (versión ligera de TanStack Query,
 * que usaba Astroshield AI). Al volver a una pantalla se muestra el dato en caché
 * al instante; los datos con más de 5 minutos se vuelven a pedir.
 *
 * `keepPrevious`: mientras llega la página nueva de una tabla, conserva la anterior.
 */
const cache = new Map();
const STALE_MS = 5 * 60 * 1000;

export function clearQueryCache() {
  cache.clear();
}

/**
 * Pide un dato usando la misma caché que useQuery (por ejemplo, la ficha de cada objeto
 * seleccionado en el mapa 3D): si ya está en caché y es reciente, no vuelve a pedirlo.
 */
export async function fetchCached(key, fetcher) {
  const cacheKey = JSON.stringify(key);
  const entry = cache.get(cacheKey);
  if (entry && Date.now() - entry.time < STALE_MS) return entry.data;
  const data = await fetcher();
  cache.set(cacheKey, { data, time: Date.now() });
  return data;
}

export default function useQuery(key, fetcher, { enabled = true, keepPrevious = false } = {}) {
  const cacheKey = JSON.stringify(key);
  const [state, setState] = useState({ key: null, data: undefined, error: null, fetching: false });
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const requestId = useRef(0);

  const run = useCallback(async (force = false) => {
    const entry = cache.get(cacheKey);
    if (!force && entry && Date.now() - entry.time < STALE_MS) {
      setState({ key: cacheKey, data: entry.data, error: null, fetching: false });
      return entry.data;
    }
    const id = ++requestId.current;
    setState((s) => ({ ...s, error: null, fetching: true }));
    try {
      const data = await fetcherRef.current();
      cache.set(cacheKey, { data, time: Date.now() });
      if (id === requestId.current) setState({ key: cacheKey, data, error: null, fetching: false });
      return data;
    } catch (error) {
      if (id === requestId.current) setState({ key: cacheKey, data: entry?.data, error, fetching: false });
      return undefined;
    }
  }, [cacheKey]);

  useEffect(() => {
    if (!enabled) return undefined;
    run();
    return () => { requestId.current += 1; };
  }, [run, enabled]);

  const refetch = useCallback(() => run(true), [run]);

  if (!enabled) return { data: undefined, error: null, isPending: false, isFetching: false, refetch };
  const current = state.key === cacheKey;
  const cached = cache.get(cacheKey)?.data;
  const data = current ? state.data : (cached ?? (keepPrevious ? state.data : undefined));
  return {
    data,
    error: current ? state.error : null,
    isPending: data === undefined && !(current && state.error),
    isFetching: state.fetching || !current,
    refetch,
  };
}

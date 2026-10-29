import { useCallback, useEffect, useRef, useState } from "react";

/** Ejecuta una petición asíncrona y expone estados de carga, error y datos. */
export default function useFetch(fetcher, dependencies = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const requestId = useRef(0);

  const refetch = useCallback(async () => {
    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      if (requestId.current === currentRequest) setData(result);
      return result;
    } catch (requestError) {
      if (requestId.current === currentRequest) setError(requestError);
      return null;
    } finally {
      if (requestId.current === currentRequest) setLoading(false);
    }
  }, [fetcher, ...dependencies]);

  useEffect(() => {
    refetch();
    return () => {
      requestId.current += 1;
    };
  }, [refetch]);

  return { data, loading, error, refetch };
}

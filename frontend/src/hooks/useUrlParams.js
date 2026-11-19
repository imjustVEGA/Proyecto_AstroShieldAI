import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

/** Lee y escribe parámetros de la URL (filtros compartibles). Cambiar un filtro reinicia la página. */
export default function useUrlParams() {
  const [params, setParams] = useSearchParams();
  const get = useCallback((key) => params.get(key) ?? "", [params]);
  const set = useCallback((updates) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") next.delete(key);
        else next.set(key, String(value));
      });
      if (!("page" in updates) && !("id" in updates)) next.delete("page");
      return next;
    }, { replace: true });
  }, [setParams]);
  return { get, set };
}

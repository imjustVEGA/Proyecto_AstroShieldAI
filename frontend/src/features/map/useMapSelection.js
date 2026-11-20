/**
 * Selección de objetos del mapa 3D guardada en la URL (se puede compartir o recargar):
 *   ?sel=s25544,n3542519&active=s25544
 * "s" = objeto SATCAT (NORAD), "n" = NEO (id de la fuente). `?id=25544` (enlaces anteriores
 * al explorador) se sigue aceptando como un objeto SATCAT seleccionado.
 *
 * useMapObjects pide la ficha de cada objeto seleccionado con la misma caché que el resto de
 * la app (al añadir uno nuevo no se vuelven a pedir los demás).
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { fetchCached } from "@/hooks/useQuery";
import useUrlParams from "@/hooks/useUrlParams";
import { getNeoDetail, getSatcatDetail } from "@/services/astroService";

export const MAX_SELECTED = 8;

export const keyOf = (kind, id) => `${kind === "neo" ? "n" : "s"}${id}`;

export function parseKey(key) {
  const match = /^([sn])(\d+)$/.exec(key ?? "");
  return match ? { kind: match[1] === "n" ? "neo" : "satcat", id: Number(match[2]), key } : null;
}

export function useMapSelection() {
  const { get, set } = useUrlParams();
  const legacyId = get("id");
  const selection = useMemo(() => {
    const keys = get("sel").split(",").filter(Boolean);
    if (!keys.length && legacyId) keys.push(`s${legacyId}`);
    return [...new Set(keys)].map(parseKey).filter(Boolean).slice(0, MAX_SELECTED);
  }, [get, legacyId]);
  const keys = selection.map((s) => s.key);
  const activeParam = get("active") || (legacyId ? `s${legacyId}` : "");
  const activeKey = keys.includes(activeParam) ? activeParam : (keys.at(-1) ?? null);

  const write = useCallback((nextKeys, nextActive) => {
    set({ sel: nextKeys.join(","), active: nextActive ?? null, id: null });
  }, [set]);

  const isSelected = useCallback((key) => keys.includes(key), [keys]);

  /** Añade (y enfoca) o quita un objeto de la selección. */
  const toggle = useCallback((kind, id) => {
    const key = keyOf(kind, id);
    if (keys.includes(key)) {
      const rest = keys.filter((k) => k !== key);
      write(rest, activeKey === key ? rest.at(-1) : activeKey);
      return false;
    }
    if (keys.length >= MAX_SELECTED) {
      toast.info(`Puedes comparar hasta ${MAX_SELECTED} objetos a la vez. Quita alguno para añadir otro.`);
      return false;
    }
    write([...keys, key], key);
    return true;
  }, [keys, activeKey, write]);

  const focus = useCallback((key) => write(keys, key), [keys, write]);
  const remove = useCallback((key) => {
    const rest = keys.filter((k) => k !== key);
    write(rest, activeKey === key ? rest.at(-1) : activeKey);
  }, [keys, activeKey, write]);
  const clear = useCallback(() => write([], null), [write]);

  return { selection, keys, activeKey, isSelected, toggle, focus, remove, clear };
}

/** Fichas de los objetos seleccionados: [{ key, kind, id, data?, error?, loading }]. */
export function useMapObjects(selection) {
  const [details, setDetails] = useState({});
  const signature = selection.map((s) => s.key).join(",");

  useEffect(() => {
    let cancelled = false;
    selection.forEach(({ key, kind, id }) => {
      setDetails((prev) => (prev[key]?.data || prev[key]?.loading ? prev : { ...prev, [key]: { loading: true } }));
      const request = kind === "neo"
        ? fetchCached(["neo", id], () => getNeoDetail(id))
        : fetchCached(["satcat", id], () => getSatcatDetail(id));
      request
        .then((data) => !cancelled && setDetails((prev) => ({ ...prev, [key]: { data } })))
        .catch((error) => !cancelled && setDetails((prev) => ({ ...prev, [key]: { error } })));
    });
    return () => { cancelled = true; };
  }, [signature]); // eslint-disable-line react-hooks/exhaustive-deps

  return useMemo(
    () => selection.map((s) => ({ ...s, ...(details[s.key] ?? { loading: true }) })),
    [selection, details],
  );
}

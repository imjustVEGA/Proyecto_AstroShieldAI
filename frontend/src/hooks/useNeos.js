import { useCallback } from "react";
import useFetch from "./useFetch";
import { getNeos } from "@/services/neoService";

/** Carga la página principal de objetos NEO. */
export default function useNeos(page = 1, limit = 50, hazardousOnly = false) {
  const fetchNeos = useCallback(
    () => getNeos(page, limit, hazardousOnly),
    [page, limit, hazardousOnly],
  );
  return useFetch(fetchNeos, [page, limit, hazardousOnly]);
}

import api from "./api";

/** Obtiene una página del catálogo SATCAT. */
export async function getSatcat(page = 1, limit = 50) {
  const { data } = await api.get("/satcat", { params: { page, limit } });
  return data;
}

import api from "./api";

/** Obtiene los indicadores generales de objetos NEO. */
export async function getStats() {
  const { data } = await api.get("/stats");
  return data;
}

/** Obtiene una página de objetos cercanos a la Tierra. */
export async function getNeos(page = 1, limit = 50, hazardousOnly = false) {
  const { data } = await api.get("/neos", {
    params: { page, limit, hazardous_only: hazardousOnly },
  });
  return data;
}

/** Envía las características de un NEO al modelo predictivo. */
export async function predictNeo(features) {
  const { data } = await api.post("/predict", features);
  return data;
}

/** Endpoints de datos reales (SATCAT, NEO, analítica, visualización y fuentes). */
import api from "./api";

const get = async (url, params) => (await api.get(url, { params })).data;

export const getDashboard = () => get("/dashboard/summary");
export const search = (q, limit = 8) => get("/search", { q, limit });

export const getSatcatList = (params) => get("/satcat", params);
export const getSatcatStats = () => get("/satcat/statistics");
export const getSatcatDetail = (id) => get(`/satcat/${id}`);

export const getNeoList = (params) => get("/neo", params);
export const getNeoStats = () => get("/neo/statistics");
export const getNeoDetail = (id) => get(`/neo/${id}`);
export const getNeoDistanceDiameter = () => get("/neo/distance-diameter");

export const getOrbitalDistribution = (objectTypes) =>
  get("/analytics/orbital-distribution", objectTypes?.length ? { object_type: objectTypes } : undefined);
export const getClassification = () => get("/analytics/object-classification");
export const getPrioritization = (params) => get("/analytics/neo-prioritization", params);

export const getShells = () => get("/visualization/orbital-shells");
export const getCapabilities = () => get("/visualization/capabilities");
export const getDatasets = () => get("/datasets");

/** Envía las características de un NEO al modelo Random Forest + Isolation Forest. */
export const predictNeo = async (features) => (await api.post("/predict", features)).data;

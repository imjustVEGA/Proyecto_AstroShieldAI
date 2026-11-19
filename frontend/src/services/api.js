/** Cliente HTTP centralizado para AstroShieldAI. */
import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  // FastAPI recibe listas como ?object_type=PAY&object_type=DEB (sin corchetes).
  paramsSerializer: { indexes: null },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("astroshield_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Normaliza los errores para que las pantallas muestren un mensaje útil. */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("astroshield_token");
      localStorage.removeItem("astroshield_user");
      window.dispatchEvent(new CustomEvent("astroshield:logout"));
    }
    const detail = error.response?.data?.detail || error.response?.data?.message;
    error.code = error.response?.data?.code || error.code;
    error.userMessage = (typeof detail === "string" && detail)
      || (Array.isArray(detail) && detail.map((item) => item.msg).filter(Boolean).join(". "))
      || (error.code === "ECONNABORTED"
        ? "La solicitud tardó demasiado."
        : `No se pudo conectar con FastAPI. Verifica que Uvicorn esté activo en ${API_BASE_URL} y que VITE_API_URL apunte a esa dirección.`);
    return Promise.reject(error);
  },
);

export default api;

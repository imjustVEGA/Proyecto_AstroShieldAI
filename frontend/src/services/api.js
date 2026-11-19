/** Cliente HTTP centralizado para AstroShieldAI. */
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("astroshield_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Registra errores de red sin ocultarlos a las pantallas consumidoras. */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem("astroshield_token");
      sessionStorage.removeItem("astroshield_user");
      window.dispatchEvent(new CustomEvent("astroshield:logout"));
    }
    error.userMessage = error.response?.data?.detail
      || error.response?.data?.message
      || (error.code === "ECONNABORTED"
        ? "La solicitud tardó demasiado."
        : "No se pudo conectar con el servicio.");
    return Promise.reject(error);
  },
);

export default api;

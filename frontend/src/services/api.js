/** Cliente HTTP centralizado para AstroShieldAI. */
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  timeout: 10000,
});

/** Registra errores de red sin ocultarlos a las pantallas consumidoras. */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    error.userMessage = error.response?.data?.detail
      || error.response?.data?.message
      || (error.code === "ECONNABORTED"
        ? "La solicitud tardó demasiado."
        : "No se pudo conectar con el servicio.");
    return Promise.reject(error);
  },
);

export default api;

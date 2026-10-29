/** Cliente HTTP centralizado para AstroShieldAI. */
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
});

/** Registra errores de red sin ocultarlos a las pantallas consumidoras. */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("AstroShield API error", error);
    return Promise.reject(error);
  },
);

import { z } from "zod";

export const authSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Ingresa al menos 3 caracteres")
    .max(64, "Máximo 64 caracteres"),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .max(128, "Máximo 128 caracteres"),
});

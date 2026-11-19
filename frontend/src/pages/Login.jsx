import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Loader2, LockKeyhole, Orbit } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { authSchema } from "@/schemas/auth.schema";

export default function Login() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(authSchema),
    mode: "onBlur",
    defaultValues: { username: "", password: "" },
  });

  if (isAuthenticated) return <Navigate replace to="/" />;

  const onSubmit = async ({ username, password }) => {
    setSubmitting(true);
    try {
      const body = new URLSearchParams({ username: username.trim(), password });
      const { data } = await api.post("/token", body, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      login(data.access_token, data.user);
      toast.success("Bienvenido");
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (error) {
      toast.error(error.userMessage || "Credenciales incorrectas");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative hidden overflow-hidden border-r border-astro-card bg-[#08101f] lg:flex lg:flex-col lg:justify-between lg:p-12"
      >
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 25% 30%, #2563EB 0, transparent 20%), radial-gradient(circle at 75% 70%, #22D3EE 0, transparent 18%)" }} />
        <div className="relative flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-astro-blue shadow-[0_0_30px_rgba(59,130,246,.35)]"><Orbit /></span>
          <div><p className="font-bold tracking-widest">ASTROSHIELD</p><p className="text-xs text-astro-cyan">AI MONITORING</p></div>
        </div>
        <div className="relative max-w-xl">
          <p className="text-sm uppercase tracking-[0.35em] text-astro-cyan">Mission control</p>
          <h1 className="mt-5 text-5xl font-semibold leading-tight">Protegiendo el entorno orbital.</h1>
          <p className="mt-5 text-lg leading-8 text-astro-muted">Monitoreo, simulación y análisis de objetos cercanos a la Tierra desde una sola plataforma.</p>
        </div>
        <p className="relative text-xs text-astro-muted">ASTROSHIELD AI / SECURE ACCESS</p>
      </motion.section>

      <motion.section
        initial={{ x: 24, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="flex items-center justify-center px-6 py-12"
      >
        <div className="w-full max-w-md rounded-2xl border border-astro-card bg-astro-card/80 p-8 shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="mb-8"><LockKeyhole className="mb-5 text-astro-cyan" /><h2 className="text-2xl font-semibold">Acceso al centro de control</h2><p className="mt-2 text-sm text-astro-muted">Identifícate para continuar</p></div>
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div>
              <label className="text-sm font-medium" htmlFor="username">Usuario</label>
              <input id="username" autoComplete="username" className="mt-2 w-full rounded-lg border border-astro-card bg-astro-bg px-4 py-3 outline-none transition focus:border-astro-cyan" placeholder="admin@astroshield.com" {...register("username")} />
              {errors.username && <p className="mt-2 text-xs text-astro-orange">{errors.username.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="password">Contraseña</label>
              <input id="password" type="password" autoComplete="current-password" className="mt-2 w-full rounded-lg border border-astro-card bg-astro-bg px-4 py-3 outline-none transition focus:border-astro-cyan" placeholder="••••••••" {...register("password")} />
              {errors.password && <p className="mt-2 text-xs text-astro-orange">{errors.password.message}</p>}
            </div>
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-lg bg-astro-blue px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60" type="submit">
              {submitting && <Loader2 className="animate-spin" size={18} />} {submitting ? "Verificando..." : "Iniciar sesión"}
            </motion.button>
          </form>
        </div>
      </motion.section>
    </main>
  );
}

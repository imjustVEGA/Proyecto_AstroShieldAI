import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Loader2, LockKeyhole, Shield } from "lucide-react";
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
        className="relative hidden overflow-hidden border-r bg-sidebar lg:flex lg:flex-col lg:justify-between lg:p-12"
      >
        <div className="starfield absolute inset-0" />
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 25% 30%, #2563EB 0, transparent 22%), radial-gradient(circle at 80% 75%, #38bdf8 0, transparent 16%)" }} />
        <div className="relative flex items-center gap-2.5">
          <span className="grid size-11 place-items-center rounded-full border border-primary/40 bg-primary/10">
            <Shield className="text-blue-300" size={20} strokeWidth={1.8} />
          </span>
          <div className="leading-tight">
            <p className="text-[19px] font-bold tracking-tight">AstroShield<sup className="ml-0.5 text-[10px] font-semibold text-primary">AI</sup></p>
            <p className="text-[8px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">Space intelligence platform</p>
          </div>
        </div>
        <div className="relative flex items-center gap-10">
          <div className="max-w-md">
            <p className="eyebrow text-accent">Observatorio espacial</p>
            <h1 className="mt-5 text-5xl font-medium leading-tight tracking-tight">El espacio, en perspectiva<span className="text-primary">.</span></h1>
            <p className="mt-5 text-[15px] leading-7 text-muted-foreground">
              70 587 objetos del catálogo SATCAT y 27 423 asteroides cercanos de NASA, analizados con reglas transparentes y un modelo de IA.
            </p>
          </div>
          <div className="astro-planet hidden shrink-0 xl:block" style={{ "--planet": "260px" }} role="img" aria-label="Planeta Tierra girando (textura AstroShield)" />
        </div>
        <p className="relative text-[10px] uppercase tracking-[0.22em] text-muted-foreground">AstroShield AI · acceso seguro</p>
      </motion.section>

      <motion.section
        initial={{ x: 24, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="flex items-center justify-center px-6 py-12"
      >
        <div className="w-full max-w-md rounded-2xl border bg-card/80 p-8 shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="mb-8"><LockKeyhole className="mb-5 text-astro-cyan" /><h2 className="text-2xl font-semibold">Acceso al centro de control</h2><p className="mt-2 text-sm text-astro-muted">Identifícate para continuar</p></div>
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div>
              <label className="text-sm font-medium" htmlFor="username">Usuario</label>
              <input id="username" autoComplete="username" className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 outline-none transition focus:border-astro-cyan" placeholder="admin@astroshield.com" {...register("username")} />
              {errors.username && <p className="mt-2 text-xs text-astro-orange">{errors.username.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="password">Contraseña</label>
              <input id="password" type="password" autoComplete="current-password" className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 outline-none transition focus:border-astro-cyan" placeholder="••••••••" {...register("password")} />
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

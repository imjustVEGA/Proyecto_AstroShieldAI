/** Define la navegación principal del frontend. */
import { Link, Navigate, Route, Routes } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import Dashboard from "@/pages/Dashboard";
import Explorer from "@/pages/Explorer";
import Neos from "@/pages/Neos";
import Risks from "@/pages/Risks";
import Satcat from "@/pages/Satcat";
import Login from "@/pages/Login";
import Simulacion from "@/pages/Simulacion";
import Reportes from "@/pages/Reportes";
import Configuracion from "@/pages/Configuracion";

function NotFound() {
  /** Renderiza la vista para rutas desconocidas. */
  return (
    <section className="mx-auto max-w-3xl rounded-xl border border-astro-card bg-astro-card p-8">
      <p className="text-sm font-semibold uppercase tracking-widest text-astro-cyan">
        404
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-astro-text">
        Ruta no encontrada
      </h1>
      <Link className="mt-6 inline-block text-astro-cyan underline" to="/">
        Volver al dashboard
      </Link>
    </section>
  );
}

/** Renderiza las cinco pantallas oficiales dentro del layout compartido. */
export default function App() {
  /** Declara las rutas públicas de la aplicación. */
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="explorer" element={<Explorer />} />
          <Route path="neos" element={<Neos />} />
          <Route path="satcat" element={<Satcat />} />
          <Route path="risks" element={<Risks />} />
          <Route path="simulacion" element={<Simulacion />} />
          <Route path="reportes" element={<Reportes />} />
          <Route path="configuracion" element={<Configuracion />} />
          <Route path="404" element={<NotFound />} />
          <Route path="*" element={<Navigate replace to="/404" />} />
        </Route>
      </Route>
    </Routes>
  );
}

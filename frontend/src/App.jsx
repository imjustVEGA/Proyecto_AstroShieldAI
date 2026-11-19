/** Define la navegación principal del frontend. */
import { Link, Navigate, Route, Routes } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import Dashboard from "@/pages/Dashboard";
import Explorer from "@/pages/Explorer";
import Neos from "@/pages/Neos";
import Risks from "@/pages/Risks";
import Satcat from "@/pages/Satcat";
import Estadisticas from "@/pages/Estadisticas";
import Fuentes from "@/pages/Fuentes";
import Login from "@/pages/Login";
import Simulacion from "@/pages/Simulacion";
import Reportes from "@/pages/Reportes";
import Configuracion from "@/pages/Configuracion";
import Usuarios from "@/pages/Usuarios";

function NotFound() {
  /** Renderiza la vista para rutas desconocidas. */
  return (
    <section className="mx-auto max-w-3xl rounded-lg border bg-card p-8">
      <p className="eyebrow text-accent">404</p>
      <h1 className="mt-2 text-2xl font-medium">Ruta no encontrada<span className="text-primary">.</span></h1>
      <Link className="mt-6 inline-block text-blue-300 underline" to="/">Volver al dashboard</Link>
    </section>
  );
}

/** Pantallas de Astroshield AI integradas en el layout y la sesión de FER. */
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="explorer" element={<Explorer />} />
          <Route path="neos" element={<Neos />} />
          <Route path="neo" element={<Navigate replace to="/neos" />} />
          <Route path="satcat" element={<Satcat />} />
          <Route path="risks" element={<Risks />} />
          <Route path="estadisticas" element={<Estadisticas />} />
          <Route path="simulacion" element={<Simulacion />} />
          <Route path="reportes" element={<Reportes />} />
          <Route path="datos" element={<Fuentes />} />
          <Route path="configuracion" element={<Configuracion />} />
          <Route element={<AdminRoute />}>
            <Route path="usuarios" element={<Usuarios />} />
          </Route>
          <Route path="404" element={<NotFound />} />
          <Route path="*" element={<Navigate replace to="/404" />} />
        </Route>
      </Route>
    </Routes>
  );
}

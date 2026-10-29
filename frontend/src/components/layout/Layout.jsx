/** Layout global con sidebar, barra superior y transparencia IA. */
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { AI_TRANSPARENCY_NOTE } from "@/utils/constants";

/** Compone la estructura persistente de todas las pantallas. */
export default function Layout() {
  /** Controla la visibilidad del sidebar en móvil. */
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /** Abre el menú lateral móvil. */
  const openSidebar = () => setSidebarOpen(true);

  /** Cierra el menú lateral móvil. */
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex min-h-screen bg-astro-bg text-astro-text">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenuClick={openSidebar} />
        <main className="flex-1 px-4 py-6 sm:px-8 lg:px-10">
          <Outlet />
        </main>
        <footer className="border-t border-astro-card px-4 py-5 text-xs leading-5 text-astro-muted sm:px-8 lg:px-10">
          {AI_TRANSPARENCY_NOTE}
        </footer>
      </div>
    </div>
  );
}

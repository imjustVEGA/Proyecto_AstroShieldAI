/** Layout global con sidebar, barra superior y nota de transparencia (estilo Astroshield AI). */
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { AI_TRANSPARENCY_NOTE } from "@/utils/constants";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-full">
      <a href="#contenido"
        className="sr-only z-[60] rounded-md bg-primary px-4 py-2 text-[0.875rem] font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-3">
        Saltar al contenido principal
      </a>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main id="contenido" tabIndex={-1} className="flex-1 overflow-y-auto scrollbar-dark focus:outline-none">
          <div className="mx-auto w-full max-w-[1320px] px-4 py-6 lg:px-8 lg:py-8">
            <Outlet />
          </div>
          <p className="mx-auto max-w-[1320px] px-4 pb-6 text-[0.75rem] leading-5 text-muted-foreground lg:px-8">
            {AI_TRANSPARENCY_NOTE}
          </p>
        </main>
      </div>
    </div>
  );
}

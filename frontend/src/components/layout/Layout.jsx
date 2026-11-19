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
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto scrollbar-dark">
          <div className="mx-auto w-full max-w-[1320px] px-4 py-6 lg:px-8 lg:py-8">
            <Outlet />
          </div>
          <p className="mx-auto max-w-[1320px] px-4 pb-6 text-[10px] leading-5 text-muted-foreground/80 lg:px-8">
            {AI_TRANSPARENCY_NOTE}
          </p>
        </main>
      </div>
    </div>
  );
}

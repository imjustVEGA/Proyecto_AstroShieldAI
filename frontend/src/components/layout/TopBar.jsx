/** Barra superior con búsqueda, alertas y perfil. */
import { Bell, Menu, Search, UserCircle } from "lucide-react";

/** Renderiza los controles globales del encabezado. */
export default function TopBar({ onMenuClick }) {
  /** Evita el envío accidental del formulario de búsqueda. */
  const handleSubmit = (event) => event.preventDefault();

  return (
    <header className="flex min-h-20 items-center gap-4 border-b border-astro-card bg-astro-bg px-4 py-4 sm:px-8">
      <button
        aria-label="Abrir navegación"
        className="text-astro-muted lg:hidden"
        onClick={onMenuClick}
        type="button"
      >
        <Menu size={22} />
      </button>
      <form className="flex min-w-0 flex-1" onSubmit={handleSubmit} role="search">
        <label className="flex w-full max-w-2xl items-center gap-3 rounded-lg border border-astro-card bg-astro-card px-4 py-2.5 text-astro-muted">
          <Search size={18} />
          <input
            aria-label="Buscar objetos"
            className="min-w-0 flex-1 bg-transparent text-sm text-astro-text outline-none placeholder:text-astro-muted"
            placeholder="Buscar objetos, NORAD, misión..."
            type="search"
          />
        </label>
      </form>
      <button
        aria-label="Ver alertas"
        className="relative rounded-lg border border-astro-card bg-astro-card p-2.5 text-astro-muted hover:text-astro-cyan"
        type="button"
      >
        <Bell size={19} />
        <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-astro-orange" />
      </button>
      <div className="hidden items-center gap-2 text-sm sm:flex">
        <UserCircle className="text-astro-cyan" size={30} />
        <span className="text-astro-text">Mission admin</span>
      </div>
    </header>
  );
}

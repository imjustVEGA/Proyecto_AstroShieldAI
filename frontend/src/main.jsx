/** Punto de entrada de la aplicación React. */
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { Dashboard } from "./pages/Dashboard";
import { Neos } from "./pages/Neos";
import "./styles.css";

function App() {
  /** Renderiza la navegación y la ruta activa. */
  return (
    <BrowserRouter>
      <header><strong>ASTROSHIELD<span>AI</span></strong>
        <nav><Link to="/">Dashboard</Link><Link to="/neos">NEOs</Link><Link to="/about">About</Link></nav>
      </header>
      <main><Routes><Route path="/" element={<Dashboard />} /><Route path="/neos" element={<Neos />} /><Route path="/about" element={<section><h1>AstroShieldAI</h1><p>Monitoreo de riesgo de objetos cercanos a la Tierra con datos NASA CNEOS.</p></section>} /></Routes></main>
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")).render(<React.StrictMode><App /></React.StrictMode>);

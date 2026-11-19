/** Monta la aplicación React en el documento. */
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster theme="dark" position="top-right" richColors closeButton />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);

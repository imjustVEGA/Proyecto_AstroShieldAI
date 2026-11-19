/**
 * Tema visual de AstroShield AI.
 *
 * Paleta tomada de la carpeta Astroshield AI (wireframes): base casi negra azulada,
 * paneles azul profundo, azul eléctrico como acento principal y cian para detalles.
 * Los nombres `astro-*` se conservan para que las pantallas existentes de FER
 * (login, usuarios, configuración) adopten la misma identidad sin reescribirlas.
 */
const palette = {
  background: "#060a13",
  foreground: "#e8eef9",
  sidebar: "#070c17",
  card: "#0b1120",
  popover: "#0d1526",
  primary: "#3b82f6",
  secondary: "#111a2e",
  "secondary-foreground": "#c9d4e6",
  muted: "#0f1729",
  "muted-foreground": "#6f7e98",
  accent: "#38bdf8",
  border: "#162038",
  input: "#1a2540",
  ring: "#3b82f6",
};

export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ...palette,
        "status-good": "#2bb673",
        "status-warning": "#f0b232",
        "status-serious": "#ec835a",
        "status-critical": "#e05252",
        // Alias heredados de la versión FER.
        "astro-bg": palette.background,
        "astro-card": palette.card,
        "astro-blue": palette.primary,
        "astro-cyan": palette.accent,
        "astro-orange": "#ec835a",
        "astro-red": "#e05252",
        "astro-text": palette.foreground,
        "astro-muted": palette["muted-foreground"],
      },
      borderColor: { DEFAULT: palette.border },
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      borderRadius: { lg: "0.75rem", md: "0.5rem", sm: "0.375rem" },
    },
  },
  plugins: [],
};

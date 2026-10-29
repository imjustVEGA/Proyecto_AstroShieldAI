/** Configuración del tema visual oficial de AstroShield AI. */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        "astro-bg": "#0B1020",
        "astro-card": "#141B2E",
        "astro-blue": "#3B82F6",
        "astro-cyan": "#22D3EE",
        "astro-orange": "#F97316",
        "astro-red": "#EF4444",
        "astro-text": "#E5E7EB",
        "astro-muted": "#9CA3AF",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

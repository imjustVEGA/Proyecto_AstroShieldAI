/**
 * Tema visual de AstroShield AI.
 *
 * Paleta tomada de la carpeta Astroshield AI (wireframes): base casi negra azulada,
 * paneles azul profundo, azul eléctrico como acento principal y cian para detalles.
 *
 * Los colores se leen de variables CSS (canales RGB definidos en `src/index.css`) para que
 * el modo de alto contraste de Accesibilidad cambie toda la interfaz a la vez.
 * Los nombres `astro-*` se conservan para que las pantallas de FER (login, usuarios,
 * configuración) adopten la misma identidad sin reescribirlas.
 */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

const palette = {
  background: v("background"),
  foreground: v("foreground"),
  sidebar: v("sidebar"),
  card: v("card"),
  popover: v("popover"),
  primary: v("primary"),
  secondary: v("secondary"),
  "secondary-foreground": v("secondary-foreground"),
  muted: v("muted"),
  "muted-foreground": v("muted-foreground"),
  accent: v("accent"),
  border: v("border"),
  input: v("input"),
  ring: v("ring"),
};

export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ...palette,
        "status-good": v("status-good"),
        "status-warning": v("status-warning"),
        "status-serious": v("status-serious"),
        "status-critical": v("status-critical"),
        // Categorías del mapa 3D (mismo color en lista, leyenda, globo y fichas).
        "cat-neo": v("cat-neo"),
        "cat-pay": v("cat-pay"),
        "cat-rb": v("cat-rb"),
        "cat-deb": v("cat-deb"),
        "cat-unk": v("cat-unk"),
        // Alias heredados de la versión FER.
        "astro-bg": palette.background,
        "astro-card": palette.card,
        "astro-blue": palette.primary,
        "astro-cyan": palette.accent,
        "astro-orange": v("status-serious"),
        "astro-red": v("status-critical"),
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

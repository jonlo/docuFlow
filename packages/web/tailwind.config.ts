import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          base:    "#0f0f10",
          raised:  "#18181b",
          overlay: "#222226",
          border:  "#2e2e33",
        },
        accent: {
          primary:   "#6366f1",
          secondary: "#a78bfa",
          muted:     "#312e81",
        },
      },
      fontFamily: {
        sans:    ["'DM Sans'", "sans-serif"],
        display: ["'Syne'", "sans-serif"],
        mono:    ["'JetBrains Mono'", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;

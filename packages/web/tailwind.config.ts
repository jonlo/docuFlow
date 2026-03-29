import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          base:    "#EEEEF8",   // lavender-gray page background
          raised:  "#FFFFFF",   // white cards — sidebar, panels
          overlay: "#F5F5FC",   // slightly lifted surfaces
          border:  "#E2E2EE",   // subtle borders and dividers
        },
        accent: {
          primary:   "#6B5ECD", // purple — today badge, active states, buttons
          secondary: "#9B8EED", // lighter purple — hover states
          muted:     "#EAE8F8", // very light purple — today column bg
        },
        text: {
          base:   "#1A1A2E",    // near-black — primary text
          muted:  "#6B6B8A",    // gray-purple — secondary text, time labels
          subtle: "#A0A0BE",    // lightest — placeholders, disabled
        },
        event: {
          lavender: { bg: "#E8E4FF", border: "#C4BAFF" },
          sky:      { bg: "#DFF0FF", border: "#93C5FD" },
          mint:     { bg: "#DFFAF0", border: "#6EE7B7" },
          peach:    { bg: "#FFF0E8", border: "#FDBA74" },
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

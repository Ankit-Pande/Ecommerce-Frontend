import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        chrome: "rgb(var(--color-chrome) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        "accent-dark": "rgb(var(--color-accent-dark) / <alpha-value>)",
        gold: "rgb(var(--color-gold) / <alpha-value>)",
        deal: "#F05A28",
        ivory: "rgb(var(--color-ivory) / <alpha-value>)",
        night: "rgb(var(--color-night) / <alpha-value>)",
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        mist: "rgb(var(--color-mist) / <alpha-value>)",
        sand: "rgb(var(--color-sand) / <alpha-value>)",
        leaf: "#16A34A",
      },
      fontFamily: {
        display: ["var(--font-body)", "Roboto", "Arial", "sans-serif"],
        body: ["var(--font-body)", "Roboto", "Arial", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 8px rgb(0 0 0 / .12)",
        card: "0 1px 4px rgb(0 0 0 / .12)",
        button: "0 1px 2px rgb(0 0 0 / .2)",
      },
      borderRadius: { xl: "0.5rem", "2xl": "0.5rem", "3xl": "0.75rem" },
    },
  },
  plugins: [],
};

export default config;

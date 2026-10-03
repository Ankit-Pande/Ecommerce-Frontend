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
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
      boxShadow: {
        soft: "0 12px 36px rgb(var(--color-chrome) / .10)",
        card: "0 1px 2px rgb(var(--color-chrome) / .05), 0 10px 30px rgb(var(--color-chrome) / .06)",
        button: "0 8px 18px rgb(var(--color-accent) / .20)",
      },
      borderRadius: { "2xl": "1rem", "3xl": "1.5rem" },
    },
  },
  plugins: [],
};

export default config;

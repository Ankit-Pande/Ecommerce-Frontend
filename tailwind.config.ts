import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ground: "#DFF5EC",
        soft: "#F1FBF6",
        ink: "#0F2A2E",
        muted: "#4B6468",
        line: "#CDE8DD",
        field: "#9CCBB8",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        discount: "#C7421F",
        danger: "#A3131F",
        sunny: "#FFC94D",
        grey: "#E5E7EB",
        "grey-strong": "#D1D5DB",
        "grey-ink": "#1F2937",
        mint: "#7CF0D0",
      },
      fontFamily: {
        display: ["var(--font-body)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        card: "0 6px 20px rgba(15,42,46,.08)",
        bar: "0 2px 12px rgba(15,42,46,.08)",
        pop: "0 12px 40px rgba(15,42,46,.14)",
      },
      maxWidth: { page: "1720px" },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

/**
 * Design tokens live here once (no magic numbers in components).
 * Theme-dependent colors are CSS vars (see globals.css); the fixed brand
 * ramp and roll colors are literal because they do not change per theme.
 */
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-hanken)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        // Theme-dependent semantics (RGB triplets in CSS vars -> alpha support)
        canvas: "rgb(var(--canvas) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        faint: "rgb(var(--faint) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        hairline: "rgb(var(--hairline) / <alpha-value>)",
        // Fixed brand ramp (muted pine green)
        green: {
          50: "#EEF6F2",
          100: "#D6E9E1",
          200: "#AED4C6",
          300: "#7DB9A6",
          400: "#4F9A85",
          500: "#3C8070",
          600: "#2E6657",
          700: "#245044",
          800: "#1C3E36",
          900: "#15302A",
          950: "#0C1F1B",
        },
        butter: { DEFAULT: "#F2E6A8", deep: "#E9D77E", warn: "#D9B53C" },
        danger: "#E8636F",
        // Synthesia roll (fixed)
        roll: { bg: "#0B1210", left: "#46C7D6", right: "#5FC97D" },
      },
      borderRadius: {
        sm: "12px",
        md: "16px",
        lg: "20px",
        xl: "28px",
      },
      boxShadow: {
        soft: "0 8px 30px -12px rgba(12,38,32,0.18)",
        "soft-hover": "0 16px 50px -16px rgba(12,38,32,0.28)",
      },
      backdropBlur: { glass: "20px" },
      maxWidth: { content: "1200px", reading: "960px" },
      transitionTimingFunction: { silk: "cubic-bezier(.22,1,.36,1)" },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "scale-in": {
          from: { opacity: "0", transform: "scale(.98)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in .25s cubic-bezier(.22,1,.36,1)",
        "scale-in": "scale-in .18s cubic-bezier(.22,1,.36,1)",
        "fade-up": "fade-up .3s cubic-bezier(.22,1,.36,1) both",
      },
    },
  },
  plugins: [],
};

export default config;

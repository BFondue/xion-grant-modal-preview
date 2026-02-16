import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cta: "#2563EB",
        text: {
          primary: "#111827",
          secondary: "#6B7280",
          muted: "#9CA3AF",
        },
        accent: {
          DEFAULT: "#6366F1",
          trust: "#0D9488",
          error: "#EF4444",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          page: "#F3F4F6",
          border: "#E5E7EB",
        },
      },
      spacing: {
        "phi-2xs": "2px",
        "phi-xs": "4px",
        "phi-sm": "6px",
        "phi-md": "10px",
        "phi-lg": "16px",
        "phi-xl": "26px",
        "phi-2xl": "42px",
        "phi-3xl": "68px",
        "phi-4xl": "110px",
      },
      borderRadius: {
        card: "16px",
        button: "10px",
      },
      fontSize: {
        "title-lg": [
          "22px",
          { lineHeight: "1.272", fontWeight: "600" },
        ],
        title: ["18px", { lineHeight: "1.272", fontWeight: "500" }],
        "body-lg": ["16px", { lineHeight: "1.618", fontWeight: "400" }],
        body: ["14px", { lineHeight: "1.618", fontWeight: "400" }],
        caption: ["12px", { lineHeight: "1.618", fontWeight: "400" }],
        label: [
          "11px",
          { lineHeight: "1.2", fontWeight: "600", letterSpacing: "0.06em" },
        ],
      },
      transitionDuration: {
        fast: "150ms",
        normal: "250ms",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        spin: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "fade-in": "fadeIn 250ms ease-out",
        "scale-in": "scaleIn 200ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;

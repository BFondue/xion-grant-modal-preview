import type { Config } from "tailwindcss";

const config: Config = {
  prefix: "ui-",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      backgroundImage: {
        "glow-conic":
          "conic-gradient(from 180deg at 50% 50%, #2a8af6 0deg, #a853ba 180deg, #e92a67 360deg)",
        "overview-bg":
          "url('/apps/abstraxion-dashboard/public/overviewBackground.png')",
      },
      colors: {
        primary: "#000",
        mainnet: "#CAF033",
        "mainnet-bg": "rgba(4, 199, 0, 0.2)",
        testnet: "#FFAA4A",
        "testnet-bg": "rgba(255, 170, 74, 0.2)",
        inactive: "#BDBDBD",
      },
      flexGrow: {
        "2": "2",
      },
      fontFamily: {
        akkuratLL: ["var(--font-akkuratLL)"],
      },
      typography: {
        navigation: {
          css: {
            fontFamily: "akkuratLL",
            fontSize: "1.2rem",
            fontWeight: "400",
            lineHeight: "1.4rem",
            letterSpacing: "0.1rem",
            textTransform: "uppercase",
          },
        },
      },
    },
  },
  plugins: [],
};
export default config;

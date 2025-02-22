import fs from "node:fs";
import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

// Convert image to base64
const imageToBase64 = (path: string): string => {
  const bitmap = fs.readFileSync(path);
  return `data:image/png;base64,${Buffer.from(bitmap).toString("base64")}`;
};

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
        "modal-overlay": `url('${imageToBase64(
          "./src/assets/xion-bg-blur.png",
        )}')`,
        "modal-static": `url('${imageToBase64("./src/assets/static.png")}')`,
        "modal-static-2": `url('${imageToBase64("./src/assets/static2.png")}')`,
      },
      colors: {
        background: "hsla(var(--background), 1)",
        "primary-text": "var(--primary-text)",
        "secondary-text": "var(--secondary-text)",
        border: "var(--border)",
        "border-focus": "var(--border-focus)",
        destructive: "hsla(var(--destructive), 1)",
        primary: "#000",
        mainnet: "#CAF033",
        "mainnet-bg": "rgba(4, 199, 0, 0.2)",
        testnet: "#FFAA4A",
        "testnet-bg": "rgba(255, 170, 74, 0.2)",
        inactive: "#BDBDBD",
        inputError: "#D74506",
        "disabled-bg": "#949494",
        "disabled-text": "#575454",
        warning: "hsla(var(--warning), 1)",
      },
      flexGrow: {
        "2": "2",
      },
      fontFamily: {
        akkuratLL: ["var(--font-akkuratLL)"],
      },
      padding: {
        safe: "env(safe-area-inset-bottom)",
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
  plugins: [animate],
};
export default config;

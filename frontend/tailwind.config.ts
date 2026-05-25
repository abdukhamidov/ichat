import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "sans-serif"],
        body: ["'Noto Sans'", "sans-serif"],
      },
      colors: {
        surface: { DEFAULT: "#FFFFFF", "2": "#F2F4F7" },
        border: { DEFAULT: "#E5E7EB", hover: "#D1D5DB" },
        accent: { DEFAULT: "#4F46E5", light: "#EEF2FF", hover: "#4338CA" },
        success: { DEFAULT: "#10B981", light: "#D1FAE5" },
        warning: { DEFAULT: "#F59E0B", light: "#FEF3C7" },
        danger: { DEFAULT: "#EF4444", light: "#FEE2E2" },
        muted: "#9CA3AF",
      },
      borderRadius: {
        DEFAULT: "10px",
        sm: "6px",
        lg: "16px",
      },
      boxShadow: {
        sm: "0 1px 3px rgba(0,0,0,0.08)",
        DEFAULT: "0 4px 12px rgba(0,0,0,0.08)",
        lg: "0 8px 24px rgba(0,0,0,0.10)",
      },
    },
  },
  plugins: [],
};
export default config;

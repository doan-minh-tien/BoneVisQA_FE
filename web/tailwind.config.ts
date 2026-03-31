import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F8FAFC",
        surface: "#FFFFFF",
        sidebar: "#FFFFFF",
        primary: "#007BFF",
        "primary-hover": "#0056b3",
        "cyan-accent": "#00E5FF",
        "text-main": "#0F172A",
        "text-muted": "#64748B",
        "border-color": "#E2E8F0",
        danger: "#EF4444",
        warning: "#F59E0B",
        success: "#10B981",
      },
      boxShadow: {
        panel: "0 18px 40px rgba(0, 0, 0, 0.28)",
      },
      borderRadius: {
        xl: "0.875rem",
      },
    },
  },
};

export default config;

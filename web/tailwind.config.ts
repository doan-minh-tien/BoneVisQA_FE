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
        background: "#EEF4FA",
        surface: "#FFFFFF",
        sidebar: "#0F1F35",
        primary: "#007BFF",
        "primary-hover": "#0056b3",
        "cyan-accent": "#00E5FF",
        "text-main": "#10233B",
        "text-muted": "#5F7690",
        "border-color": "#D9E5F2",
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

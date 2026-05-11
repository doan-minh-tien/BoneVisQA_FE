/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#14b8a6",
        border: "#e5e7eb",
        card: "#ffffff",
        "card-foreground": "#111827",
        "muted-foreground": "#6b7280",
        ring: "#d1d5db",
        success: "#22c55e",
        warning: "#eab308",
        destructive: "#ef4444",
      }
    },
  },
  plugins: [],
}

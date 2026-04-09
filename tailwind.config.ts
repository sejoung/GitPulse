import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        gp: {
          bg: {
            primary: "#0B1220",
            secondary: "#111827",
            tertiary: "#1F2937",
          },
          brand: {
            blue: "#3B82F6",
            cyan: "#22D3EE",
          },
          risk: {
            healthy: "#22C55E",
            watch: "#EAB308",
            risky: "#F97316",
            critical: "#EF4444",
          },
          text: {
            primary: "#F9FAFB",
            secondary: "#9CA3AF",
            muted: "#6B7280",
          },
          border: {
            DEFAULT: "#1F2937",
            divider: "#374151",
          },
        },
      },
      backgroundImage: {
        "gp-signal": "linear-gradient(135deg, #3B82F6 0%, #22D3EE 100%)",
      },
    },
  },
  plugins: [],
} satisfies Config;

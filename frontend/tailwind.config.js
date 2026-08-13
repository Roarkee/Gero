/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#e6f8ff",
          100: "#b3ebff",
          200: "#80deff",
          300: "#4dd1ff",
          400: "#1ac4ff",
          500: "#00F0FF", // Neon cyan
          600: "#00c0cc",
          700: "#009099",
          800: "#006066",
          900: "#003033",
          950: "#00181a",
        },
        secondary: {
          50: "#f5ebff",
          100: "#dcb3ff",
          200: "#c37aff",
          300: "#a942ff",
          400: "#9009ff",
          500: "#7B2FFF", // Electric purple
          600: "#6226cc",
          700: "#4a1c99",
          800: "#311366",
          900: "#190933",
          950: "#0c051a",
        },
        accent: {
          500: "#FF2E97", // Magenta pink
        },
        gray: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0A1128", // Deep electric blue / dark navy base
          950: "#050814",
        },
        dark: {
          bg: "#0A1128",
          card: "rgba(255, 255, 255, 0.03)",
          border: "rgba(255, 255, 255, 0.1)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        heading: ["Space Grotesk", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 8px rgba(0, 0, 0, 0.08)",
        medium: "0 4px 12px rgba(0, 0, 0, 0.12)",
        large: "0 8px 24px rgba(0, 0, 0, 0.16)",
        neon: "0 0 10px rgba(0, 240, 255, 0.5), 0 0 20px rgba(0, 240, 255, 0.3)",
        "neon-purple": "0 0 10px rgba(123, 47, 255, 0.5), 0 0 20px rgba(123, 47, 255, 0.3)",
        "neon-pink": "0 0 10px rgba(255, 46, 151, 0.5), 0 0 20px rgba(255, 46, 151, 0.3)",
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "mesh-dark": "radial-gradient(at 40% 20%, hsla(280,100%,74%,0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189,100%,56%,0.15) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(340,100%,76%,0.15) 0px, transparent 50%)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "pulse-glow": "pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 3s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "1", boxShadow: "0 0 10px rgba(0, 240, 255, 0.5)" },
          "50%": { opacity: ".7", boxShadow: "0 0 20px rgba(0, 240, 255, 0.8)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        }
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};

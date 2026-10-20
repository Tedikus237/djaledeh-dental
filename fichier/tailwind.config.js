/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter Variable"', "system-ui", "sans-serif"],
      },
      colors: {
        stage: "#0F0F0F",
        panel: "#1A1A1A",
        panelHover: "#222222",
        line: "#262626",
        ink: "#FFFFFF",
        mute: "#E0E0E0",
        faint: "#8A8A8A",
        accent: "#5B8DEF",
        accentDark: "#3F6FD8",
        night: "#1A2530",
        cream: "#F5F0E8",
        danger: "#E5484D",
        success: "#4ADE80",
        warning: "#F5A524",
      },
      borderRadius: {
        lg: "0.625rem",
        xl: "0.875rem",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
      },
      animation: {
        rise: "rise 0.35s ease-out both",
        float: "float 6s ease-in-out infinite",
        pulseSoft: "pulseSoft 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
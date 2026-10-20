/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B1220",
        canvas: "#F6F8FB",
        line: "#E6EAF0",
        mute: "#5B6575",
        faint: "#8A94A6",
        brand: { DEFAULT: "#0EA5E9", deep: "#0284C7", soft: "#EAF6FD" },
        stage: "#070B14",
        danger: "#EF4444"
      },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
      borderRadius: { xl: "14px", "2xl": "20px" },
      keyframes: {
        rise: { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "none" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-10px)" } }
      },
      animation: { rise: "rise .35s ease-out both", float: "float 6s ease-in-out infinite" }
    }
  },
  plugins: []
};
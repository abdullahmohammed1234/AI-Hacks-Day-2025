/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./views/**/*.ejs", "./public/**/*.js", "./views/**/*.html"],
  theme: {
    extend: {
      colors: {
        // Track2Give Brand Colors
        primary: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#10b981", // Main green
          600: "#764ba2", // Dark purple
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
        green: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981", // Main green
          600: "#059669", // Dark green
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
        // SDG Colors
        sdg: {
          12: "#bf8b2e", // Responsible Consumption
          13: "#3f7e44", // Climate Action
          2: "#dda63a", // Zero Hunger
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Oxygen",
          "Ubuntu",
          "Cantarell",
          "Helvetica Neue",
          "sans-serif",
        ],
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #10b981 0%, #f59e0b 100%)",
        "gradient-green": "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      },
      boxShadow: {
        custom: "0 4px 6px rgba(0, 0, 0, 0.1)",
        "custom-lg": "0 10px 15px rgba(0, 0, 0, 0.1)",
        "custom-xl": "0 20px 25px rgba(0, 0, 0, 0.1)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in",
        "slide-up": "slideUp 0.6s ease-out",
        float: "float 20s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-100px)" },
        },
      },
    },
  },
  plugins: [],
};

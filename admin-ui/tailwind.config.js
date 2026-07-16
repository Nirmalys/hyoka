/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  important: true,
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Mulish"', "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        orange: {
          50: "#FEF8EC",
          100: "#FDEFD4",
          200: "#FBE0A9",
          300: "#F9D07D",
          400: "#F59E0B",
          500: "#F59E0B",
          600: "#F59E0B",
          700: "#F59E0B",
          800: "#F59E0B",
          900: "#F59E0B",
        },
      },
      height: {
        lg: "469px",
      },
    },
  },
  plugins: [],
};

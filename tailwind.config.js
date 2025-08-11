// tailwind.config.js
/** @type {import('tailwindcss').Config} */

const config = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "golden-yellow": "#E3B505",
        "navbar-primary": "#f8f9fa",
        "navbar-secondary": "#343a40",
        "navbar-text": "#495057",
        "navbar-hover": "#f8f9fa",
        "navbar-active": "#ced4da",
      },
      fontFamily: {
        digikala: ["digikala", "sans-serif"],
        nastaliq: ["nastaliq", "Arial", "sans-serif"],
        bnazanin: ["bnazanin", "Arial", "sans-serif"],
      },
    },
  },
  plugins: ["@tailwindcss/postcss"],
};

export default config;

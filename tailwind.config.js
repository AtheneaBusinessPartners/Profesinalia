/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff8ff",
          100: "#dbeefe",
          200: "#bfe3fe",
          300: "#93d2fd",
          400: "#60b8fa",
          500: "#3a9cf5",
          600: "#2380e8",
          700: "#1c68d1",
          800: "#1e57a9",
          900: "#1e4a85",
        },
      },
    },
  },
  plugins: [],
};

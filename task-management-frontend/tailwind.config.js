/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ["IBM Plex Mono", "monospace"],
        sans: ["DM Sans", "system-ui", "sans-serif"],
      },
      colors: {
        amber: {
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
        teal: {
          400: "#2dd4bf",
          500: "#14b8a6",
        },
        emerald: {
          400: "#34d399",
          500: "#10b981",
        },
      },
      borderOpacity: {
        8: "0.08",
      },
    },
  },
  plugins: [],
};

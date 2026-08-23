import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#d9e6ff",
          200: "#bcd3ff",
          300: "#8db6ff",
          400: "#578dff",
          500: "#2f66f6",
          600: "#1a49e3",
          700: "#1638bd",
          800: "#183199",
          900: "#192f79",
        },
      },
    },
  },
  plugins: [],
};

export default config;

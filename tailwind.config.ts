import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f2f7ff",
          100: "#d9e6ff",
          500: "#2563eb",
          700: "#1d4ed8",
          900: "#1e3a8a"
        }
      }
    }
  },
  plugins: []
};

export default config;

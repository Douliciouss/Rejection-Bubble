import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bubble: {
          bg: "#0f0f12",
          surface: "#18181c",
          border: "#27272a",
          muted: "#71717a",
          accent: "#a78bfa",
          danger: "#f87171",
          success: "#34d399",
        },
      },
    },
  },
  plugins: [],
};

export default config;

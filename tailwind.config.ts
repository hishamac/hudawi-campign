import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        degular: ['"Degular"', 'sans-serif'], // Add Degular to the font family
        garamond: ['var(--font-eb-garamond)', 'serif'],
        jakarta: ['var(--font-plus-jakarta)', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;

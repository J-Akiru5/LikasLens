/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1B4332",
        secondary: "#5A7D6A",
        accent: "#FFB703",
        background: "#F5F5F0",
        foreground: "#1A1D1A",
      },
      fontFamily: {
        body: ["var(--font-body)", "Geist", "Helvetica Neue", "Arial", "sans-serif"],
        data: ["var(--font-data)", "JetBrains Mono", "monospace"],
      },
      spacing: {
        xs: "0.5rem",
        sm: "1rem",
        md: "1.5rem",
        lg: "2rem",
        xl: "2.5rem",
      },
    },
  },
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1B4332", // Forest Guard
        secondary: "#2DE1C2", // Tech Cyan
        accent: "#FFB703", // Ghost Amber
        background: "#F8F9FA", // Concrete
        foreground: "#081C15", // Night Shadow
      },
      fontFamily: {
        heading: ["var(--font-heading)", "Montserrat", "Archivo Black", "sans-serif"],
        body: ["var(--font-body)", "Inter", "Helvetica Now", "Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
        data: ["var(--font-data)", "Space Mono", "JetBrains Mono", "Courier New", "monospace"],
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

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../apps/shared/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1B4332",
        secondary: "#5A7D6A",
        accent: "#FFB703",
        background: "#F5F5F0",
        foreground: "#1A1D1A",
        page: "var(--page, #F5F5F0)",
        ink: "var(--ink, #1A1D1A)",
        panel: "var(--panel, #eeeee8)",
        border: "var(--border, rgba(26, 29, 26, 0.08))",
        muted: "var(--muted, rgba(26, 29, 26, 0.5))",
        green: "var(--green, #2d6a4f)",
        red: "var(--red, #b23b3b)",
        amber: "var(--amber, #b8860b)",
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

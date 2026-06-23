/** @type {import('tailwindcss').Config} */
module.exports = {
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
        border: "var(--border)",
        brand: {
          50: "#f0f4ff",
          100: "#dbe4ff",
          200: "#bacaff",
          300: "#93aaff",
          400: "#6684ff",
          505: "#3b58ff",
          500: "#3b58ff",
          600: "#2436fa",
          700: "#1a25e6",
          800: "#171ebb",
          900: "#192095",
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

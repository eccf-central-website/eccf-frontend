import type { Config } from "tailwindcss";

/**
 * Public site Tailwind config — feeds app/globals.css, which every page loads.
 *
 * 3-Font System Architecture:
 * 1. Headings: Belleza (Humanist display) -> font-heading, font-display, font-serif
 * 2. Body: Work Sans (Grotesque body) -> font-sans
 * 3. Styling / Accents: Geist Mono (Pills, badges, code, tags) -> font-mono
 */
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/!(dashboard)/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/*.{js,ts,jsx,tsx,mdx}",
    // [(] [)] match literal parentheses inside the extglob
    "./app/!([(]dashboard[)])/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-work-sans)", "sans-serif"],
        heading: ["var(--font-belleza)", "sans-serif"],
        display: ["var(--font-belleza)", "sans-serif"],
        serif: ["var(--font-belleza)", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;

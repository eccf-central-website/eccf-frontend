import type { Config } from "tailwindcss";

/**
 * Public site Tailwind config — feeds app/globals.css, which every page loads.
 *
 * Content deliberately excludes the Exco Dashboard (app/(dashboard) and
 * components/dashboard): the dashboard compiles its own utilities via
 * tailwind.dashboard.config.ts (see app/(dashboard)/dashboard.css), so its
 * classes add no weight to public pages (SDD §7.5, 3G performance target).
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
        sans: ["var(--font-work-sans)", "var(--font-geist-sans)", "sans-serif"],
        serif: ["var(--font-serif)", "serif"],
        display: ["var(--font-serif)", "serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;

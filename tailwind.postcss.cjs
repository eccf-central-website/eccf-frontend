/**
 * Tailwind PostCSS plugin with per-file config isolation.
 *
 * Tailwind 3's plugin remembers the last `@config` it saw: it does
 * `configOrPath = findAtConfigPath(root, result) ?? configOrPath`, writing
 * into the closure of the single instance Next.js reuses for every CSS file.
 * Once app/(dashboard)/dashboard.css (which has `@config`) is compiled,
 * every later recompile of app/globals.css (no `@config`) silently uses
 * tailwind.dashboard.config.ts — no preflight, dashboard utilities. A
 * production build compiles each file once, globals first, so it is
 * unaffected; `next dev` hits it on the first HMR rebuild.
 *
 * Creating a fresh tailwindcss() per file means a file without `@config`
 * always falls back to tailwind.config.ts. Tailwind's context and config
 * caches are module-level, so this costs nothing extra per rebuild.
 */
// CommonJS on purpose: Next.js loads PostCSS plugins with require().
// eslint-disable-next-line @typescript-eslint/no-require-imports
const tailwindcss = require("tailwindcss");

module.exports = () => ({
  postcssPlugin: "tailwindcss-isolated",
  async Once(root, { result }) {
    for (const plugin of tailwindcss().plugins) {
      await plugin(root, result);
    }
  },
});
module.exports.postcss = true;

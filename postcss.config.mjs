/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    // Wraps tailwindcss so dashboard.css's @config can't leak into
    // globals.css during dev rebuilds — see tailwind.postcss.cjs.
    "./tailwind.postcss.cjs": {},
  },
};

export default config;

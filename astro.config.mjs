// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // D-08: user site served from the domain root.
  site: 'https://juanpecheverria.github.io',
  base: '/',
  // D-03: bilingual routing — Spanish at /, English at /en/.
  i18n: {
    locales: ['es', 'en'],
    defaultLocale: 'es',
    routing: {
      prefixDefaultLocale: false,
    },
  },
  // D-02: Tailwind CSS v4 via the official Vite plugin (no @astrojs/tailwind, no tailwind.config.js).
  vite: {
    plugins: [tailwindcss()],
  },
});

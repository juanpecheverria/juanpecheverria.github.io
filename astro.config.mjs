// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
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
  // D-04: self-hosted Inter + JetBrains Mono via Astro's built-in Fonts API
  // (fontsource provider — downloaded/subset at build, no third-party runtime request).
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Inter',
      cssVariable: '--font-inter',
      weights: ['400', '600'],
      styles: ['normal'],
      subsets: ['latin'],
      display: 'swap',
    },
    {
      provider: fontProviders.fontsource(),
      name: 'JetBrains Mono',
      cssVariable: '--font-jetbrains-mono',
      weights: ['400'],
      styles: ['normal'],
      subsets: ['latin'],
      display: 'swap',
    },
  ],
  // D-02: Tailwind CSS v4 via the official Vite plugin (no @astrojs/tailwind, no tailwind.config.js).
  vite: {
    plugins: [tailwindcss()],
  },
});

import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],

  vite: {
    plugins: [
      nodePolyfills({
        include: ['buffer'],
        globals: {
          Buffer: true,
          global: true,
          process: true,
        },
      }),
      tailwindcss()
    ]
  }
});
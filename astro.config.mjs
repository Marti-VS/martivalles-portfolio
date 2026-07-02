import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build
export default defineConfig({
  site: 'https://martivalles.dev',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      // three.js es solo de cliente; evitamos que intente renderizarse en SSR
      noExternal: ['three', '@react-three/fiber', '@react-three/drei'],
    },
  },
});

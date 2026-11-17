import { defineConfig } from 'vite';

export default defineConfig({
  // Required for GitHub Pages project site: https://peppoz06.github.io/Quote_Spawn/
  base: '/Quote_Spawn/',
  root: '.',
  publicDir: 'public',
  server: {
    open: true,
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
});

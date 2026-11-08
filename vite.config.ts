import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages project site: https://<user>.github.io/<repository>/
  // Vite rewrites the entry script and all built assets using this base path.
  base: '/khaosattruocvasaungungan/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});

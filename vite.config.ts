import {defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  build: {
    outDir: 'dist',
    rollupOptions: {      input: {
        background: 'src/background.ts',
        popup: 'popup.html',
        'content-script': 'src/content/content-script.ts',
        'high-contrast': 'src/content/high-contrast.css',
        'dyslexic': 'src/content/dyslexic.css',
        'reading-line': 'src/content/reading-line.css',
        'deuteranopia': 'src/content/deuteranopia.css',
        'protanopia': 'src/content/protanopia.css',
        'tritanopia': 'src/content/tritanopia.css',
        'reduced-motion': 'src/content/reduced-motion.css',
        'keyboard-nav': 'src/content/keyboard-nav.css',
        'large-targets': 'src/content/large-targets.css',
        'custom-cursor': 'src/content/custom-cursor.css',
        'auto-scroll': 'src/content/auto-scroll.css',
        'hover-controls': 'src/content/hover-controls.css',
        'focus-mode': 'src/content/focus-mode.css',
        "highlight-links": "src/content/highlight-links.css",
        "reading-progress": "src/content/reading-progress.css",
        "image-descriptions": "src/content/image-descriptions.css",
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return '[name][extname]';
          }
          return '[name].[ext]';
        }
      }
    }
  }
});

import {defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
<<<<<<< Updated upstream
    tailwindcss(), // This is not needed as we are using the tailwindcss plugin in the postcss.config.js file
=======
    tailwindcss(),
>>>>>>> Stashed changes
  ],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        background: 'src/background.ts',
<<<<<<< Updated upstream
        popup: 'popup.html'
=======
        popup: 'popup.html',
        'content-script': 'src/content/content-script.ts',
        'high-contrast': 'src/content/high-contrast.css',
>>>>>>> Stashed changes
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
<<<<<<< Updated upstream
        assetFileNames: '[name].[ext]'
=======
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return '[name][extname]';
          }
          return '[name].[ext]';
        }
>>>>>>> Stashed changes
      }
    }
  }
});

import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { fileURLToPath, URL } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.ts',
    reporters: ['default', 'html'],
    outputFile: {
      html: './test-results.html'
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});
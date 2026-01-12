import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Vite config for building Chrome Extension
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        // Main side panel app
        main: resolve(__dirname, 'index.html'),
        // Service worker
        'service-worker': resolve(__dirname, 'public/service-worker.js'),
        // Content script
        'content-script': resolve(__dirname, 'public/content-script.js'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Keep service worker and content script at root level
          if (chunkInfo.name === 'service-worker' || chunkInfo.name === 'content-script') {
            return '[name].js';
          }
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          // Keep CSS at root for content script
          if (assetInfo.name === 'content-script.css') {
            return '[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
    // Ensure source maps for debugging
    sourcemap: true,
  },
  // Define chrome global to avoid build errors
  define: {
    'chrome': 'chrome',
  },
});

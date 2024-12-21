import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/hooks/index.ts'), // Path to your hook
      name: 'index', // Name of the global variable (for UMD build)
      fileName: (format) => `index.${format}.js`, // Format filenames as `use-boolean.es.js` and `use-boolean.umd.js`
      formats: ['es', 'umd'], // Generate both ES and UMD formats
    },
    rollupOptions: {
      external: ['react'], // React stays external
      output: {
        globals: {
          react: 'React', // Define React as a global for UMD builds
        },
      },
    },
  }
});
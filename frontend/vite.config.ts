import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Manual chunks for better code splitting
        // Separates large dependencies to reduce initial bundle size
        manualChunks: {
          // PDF viewer is ~500KB - load only when needed
          'pdf-viewer': ['react-pdf', 'pdfjs-dist'],
          // Markdown rendering with syntax highlighting
          'markdown': ['react-markdown', 'react-syntax-highlighter', 'remark-gfm'],
          // Core React libraries
          'react-vendor': ['react', 'react-dom'],
          // State management
          'state': ['zustand', '@tanstack/react-query'],
          // Virtualized tree component
          'tree': ['react-arborist'],
        },
      },
    },
    // Use esbuild for faster minification
    minify: 'esbuild',
    // Target modern browsers for smaller output
    target: 'es2020',
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});

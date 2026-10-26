import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';

  return {
    plugins: [react()],
    esbuild: {
      drop: isProd ? ['console', 'debugger'] : [],
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-motion': ['framer-motion'],
            'vendor-icons': ['lucide-react'],
            'vendor-network': ['axios'],
          },
        },
      },
    },
    server: {
      port: 5173,
      host: true,
      watch: {
        ignored: ['**/dist/**', '**/*.zip', '**/*.tar.gz', '**/.git/**'],
      },
      proxy: {
        '/api': {
          target: process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
        '/media': {
          target: process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
      },
    },
  };
});

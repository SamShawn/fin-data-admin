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
        manualChunks: {
          // 将 React 相关核心库单独打包
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // 将 Ant Design 及图标单独打包
          'vendor-antd': ['antd', '@ant-design/icons'],
          // 将表格相关的重型库单独打包
          'vendor-table': ['@tanstack/react-table', '@tanstack/react-virtual'],
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});

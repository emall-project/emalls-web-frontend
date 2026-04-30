import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    allowedHosts: ['e-mall.store'],
    proxy: {
      '/accounts': {
        target: 'http://localhost',
        changeOrigin: true,
        secure: false,
      },
      '/catalog': {
        target: 'http://localhost',
        changeOrigin: true,
        secure: false,
      },
      '/campaigns': {
        target: 'http://localhost',
        changeOrigin: true,
        secure: false,
      },
      '/order-hub': {
        target: 'http://localhost',
        changeOrigin: true,
        secure: false,
      },
      '/media-manager': {
        target: 'http://localhost',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
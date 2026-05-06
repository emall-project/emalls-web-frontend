import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    allowedHosts: ['e-mall.store', 'e-mall.site'],
    proxy: {
      '/accounts': {
        target: 'https://api.e-mall.store',
        changeOrigin: true,
        secure: false,
      },
      '/catalog': {
        target: 'https://api.e-mall.store',
        changeOrigin: true,
        secure: false,
      },
      '/campaigns': {
        target: 'https://api.e-mall.store',
        changeOrigin: true,
        secure: false,
      },
      '/order-hub': {
        target: 'https://api.e-mall.store',
        changeOrigin: true,
        secure: false,
      },
      '/media-manager': {
        target: 'https://api.e-mall.store',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    svgr()
  ],
  server: {
    host: true,
    port: 5173,
    proxy: {
      "/api": {
        target: "http://backend:3011",
        changeOrigin: true,
      },
    },
  },
});

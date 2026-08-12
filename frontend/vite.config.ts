import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://127.0.0.1:5000',
        ws: true,
        configure: (proxy) => {
          const ignore = (err: any) => {
            const IGNORED = ['ECONNRESET', 'ECONNABORTED', 'EPIPE', 'ENOTFOUND', 'ETIMEDOUT'];
            if (err && IGNORED.includes(err.code)) return;
            // Only log truly unexpected errors
            console.error('[socket.io proxy] unexpected error:', err?.message);
          };
          proxy.on('error', ignore);
          proxy.on('proxyReqWs', (_proxyReq: any, _req: any, socket: any) => {
            socket.on('error', ignore);
          });
        }
      }
    }
  }
})

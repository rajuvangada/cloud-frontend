import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/prod': {
        target: 'https://q2rl2hl6y3.execute-api.us-east-1.amazonaws.com',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})


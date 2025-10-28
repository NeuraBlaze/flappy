import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/flappy/', // GitHub Pages path
  server: {
    port: 3000,
    host: '0.0.0.0', // Ez teszi elérhetővé a helyi hálózatról
    strictPort: false
  }
})
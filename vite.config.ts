import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // the shader package must share the app's single copy of React
  resolve: { dedupe: ['react', 'react-dom'] },
  optimizeDeps: { include: ['@paper-design/shaders-react', 'thinking-orbs'] },
})

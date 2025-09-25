import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // This bridges the gap between Vite's `import.meta.env` and the app's use of `process.env`
    'process.env.API_KEY': JSON.stringify(process.env.VITE_API_KEY)
  }
})

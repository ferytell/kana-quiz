import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Change 'kana-quiz' to your actual GitHub repository name
export default defineConfig({
  plugins: [react()],
  base: '/kana-quiz/',
})

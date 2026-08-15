import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Relative base so the built site works whether it's hosted at the
  // domain root or under a GitHub Pages project path like /repo-name/.
  base: './',
  plugins: [react()],
})

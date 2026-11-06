import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import { parseEnvironment } from './src/shared/config/env.ts'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'validate-public-environment',
      configResolved(config) {
        if (config.command === 'build')
          parseEnvironment({
            ...loadEnv(config.mode, config.envDir),
            ...process.env,
          })
      },
    },
  ],
  // Deploy under a subpath with VITE_BASE_PATH=/repo-name/ (GitHub Pages).
  base: process.env.VITE_BASE_PATH || '/',
  build: { manifest: true },
  // Scan every module, including lazy routes, so the dev server pre-bundles all
  // dependencies at startup instead of re-optimizing and reloading the page the
  // first time a lazy chunk (charts, grids, exports) needs a new package.
  optimizeDeps: {
    entries: ['index.html', 'src/**/*.{ts,tsx}', '!src/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})

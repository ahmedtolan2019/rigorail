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
  build: { manifest: true },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})

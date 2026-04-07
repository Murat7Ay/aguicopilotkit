import { defineConfig } from 'vite'

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
  server: {
    port: 3000,
    proxy: {
      '/copilotkit': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
      },
      '/agui': {
        target: 'http://localhost:5041',
        changeOrigin: true,
      },
      '/tools': {
        target: 'http://localhost:5041',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
  },
})

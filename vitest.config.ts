import { defineConfig } from 'vitest/config'
import alias from './scripts/test/alias'

export default defineConfig({
  define: {
    __DEV__: true,
    __TEST__: true,
    __VERSION__: '"test"',
  },
  resolve: { alias },
  test: {
    globals: true,
    threads: !process.env.GITHUB_ACTIONS,
    environment: 'node',
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'html'],
      exclude: [],
    },
  },
})

import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '.next/',
        'coverage/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/stories/**',
        'src/examples/**',
        '**storybook**',
        '**/*.stories.*',
        '**/*.constants.*',
        '**/types.ts',
        '**/index.ts',
        '**/__mocks__/**',
        'src/app/layout.tsx',
        '**/di/**'
      ]
    }
  },
  esbuild: {
    jsxInject: `import React from 'react'`,
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment'
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
}) 
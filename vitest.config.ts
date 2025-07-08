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
        '**/*.types.*',
        '**/types.ts',
        '**types.ts',
        '**/index.ts',
        '**/__mocks__/**',
        'src/app/layout.tsx',
        '**/di/**',
        'src/services/config.ts',
        'src/ports/output/repositories/INotionRepository.ts',
        'src/ports/output/services/IHttpClient.ts',
        'src/adapters/output/infrastructure/supabase/SupabaseMarkdownRepository/SupabaseMarkdownRepository.ts',
        /** Paginas y posiblemente, serán eliminadas de aqui */
        'src/app/test/page.tsx',
        'src/app/visualizer/page.tsx',
        'src/app/page.tsx'
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
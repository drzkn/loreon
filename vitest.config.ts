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
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      },
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
        'src/app/api/helpers/ConnectionPageRepository.ts',
        'src/lib/**',
        '**/*styles*',
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
  },
  css: {
    postcss: {
      plugins: []
    }
  }
}) 
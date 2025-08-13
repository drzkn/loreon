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
        '**/types/**',
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
        '**/scripts',
        '**/TempDebug.tsx',
        'src/components/Icon/GoogleIcon.tsx',
        'src/components/Icon/NotionIcon.tsx',
        'src/adapters/output/infrastructure/supabase/NotionNativeRepository/NotionNativeRepository.ts',
        'src/adapters/output/infrastructure/supabase/NotionStorageRepository/NotionStorageRepository.ts',
        'src/adapters/output/infrastructure/supabase/SupabaseRepository/SupabaseRepository.ts',
        'src/app/visualizer/hooks/useSystemDataLoader.ts',
        'src/app/settings/hooks/useSyncToSupabase.ts',
        'middleware.ts',
        'src/utils/renderLogger/renderLogger.ts',
        /** Paginas y posiblemente, serán eliminadas de aqui */
        'src/app/test/page.tsx',
        'src/app/settings/connect/page.tsx',
        'src/app/settings/components/ConnectionContent.tsx',
        'src/app/page.tsx',
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
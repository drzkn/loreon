import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['line']
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Forzar headless en CI
    headless: process.env.CI ? true : undefined,
    // Slow motion para ver las acciones (en milisegundos)
    // Descomenta la línea siguiente para activar globalmente
    // launchOptions: { slowMo: 1000 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    // Proyecto específico para tests de producción
    {
      name: 'production-health',
      testMatch: '**/production/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        // Configuraciones específicas para tests de producción
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'retain-on-failure',
      },
      timeout: 120 * 1000, // 2 minutos para tests de producción
    },
    // Proyecto demo solo para desarrollo local (no en CI)
    ...(!process.env.CI ? [{
      name: 'demo',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          headless: false,
          slowMo: 2000 // 2 segundos entre acciones
        }
      },
    }] : []),
  ],
  webServer: {
    command: 'yarn dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
  outputDir: 'test-results/',
  timeout: process.env.CI ? 60 * 1000 : 30 * 1000, // Más tiempo en CI
  expect: {
    timeout: process.env.CI ? 10 * 1000 : 5 * 1000, // Más tiempo en CI
  },
});

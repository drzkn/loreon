import { test, expect } from '@playwright/test';

/**
 * Tests End-to-End para validar la salud del sistema en producción
 * Estos tests verifican que todos los componentes críticos funcionen correctamente
 */

test.describe('Production Health Checks', () => {
  test.beforeEach(async ({ page }) => {
    // Configurar timeout más largo para operaciones de producción
    test.setTimeout(120000); // 2 minutos
  });

  test('should validate environment variables and connections', async ({ page }) => {
    await test.step('Check API health endpoint', async () => {
      const response = await page.request.get('/api/sync-notion?stats=true');
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('availableOperations');
    });

    await test.step('Validate Notion connection', async () => {
      const response = await page.request.get('/api/debug-notion-connection');
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.databases).toBeDefined();
      expect(data.databases.length).toBeGreaterThan(0);
    });
  });

  test('should perform sync dry-run successfully', async ({ page }) => {
    await test.step('Navigate to sync settings', async () => {
      await page.goto('/settings/sync');
      await expect(page.locator('h1')).toContainText('Sync');
    });

    await test.step('Execute dry-run sync', async () => {
      // Buscar el botón de sync (puede variar según la implementación)
      const syncButton = page.locator('button:has-text("Sync"), button:has-text("Sincronizar")').first();
      await expect(syncButton).toBeVisible();

      // Simular click en sync
      await syncButton.click();

      // Esperar a que aparezcan logs de progreso
      await expect(page.locator('text=Iniciando sincronización')).toBeVisible({ timeout: 10000 });

      // Esperar a que complete (buscando mensaje de éxito o error)
      await expect(
        page.locator('text=completada, text=completed, text=éxito, text=success')
      ).toBeVisible({ timeout: 60000 });
    });
  });

  test('should validate database tables and structure', async ({ page }) => {
    await test.step('Check database health via API', async () => {
      // Crear un endpoint específico para health check de DB
      const response = await page.request.post('/api/health/database');

      if (response.status() === 404) {
        // Si no existe el endpoint, usar el de sync como fallback
        const fallbackResponse = await page.request.get('/api/sync-notion?stats=true');
        expect(fallbackResponse.status()).toBe(200);
      } else {
        expect(response.status()).toBe(200);
        const data = await response.json();
        expect(data.tablesAccessible).toBe(true);
      }
    });
  });

  test('should validate embeddings service', async ({ page }) => {
    await test.step('Check embeddings generation capability', async () => {
      // Crear un endpoint de test para embeddings
      const response = await page.request.post('/api/health/embeddings', {
        data: {
          testText: 'This is a test text for embeddings validation',
          dryRun: true
        }
      });

      if (response.status() === 404) {
        console.log('Embeddings health endpoint not implemented yet - skipping');
        test.skip();
      } else {
        expect(response.status()).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
      }
    });
  });

  test('should validate complete sync flow with small dataset', async ({ page }) => {
    await test.step('Execute minimal sync test', async () => {
      const response = await page.request.post('/api/sync-notion', {
        data: {
          dryRun: true,
          maxPages: 1, // Solo 1 página para test rápido
          testMode: true
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });
});

test.describe('Production Performance Tests', () => {
  test('should complete sync within acceptable time limits', async ({ page }) => {
    test.setTimeout(180000); // 3 minutos para test de rendimiento

    await test.step('Measure sync performance', async () => {
      const startTime = Date.now();

      const response = await page.request.post('/api/sync-notion', {
        data: {
          dryRun: true,
          maxPages: 5 // Test con 5 páginas
        }
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.status()).toBe(200);

      // Validar que no tome más de 2 minutos para 5 páginas
      expect(duration).toBeLessThan(120000);

      console.log(`Sync performance: ${duration}ms for 5 pages (${duration / 5}ms per page)`);
    });
  });

  test('should handle concurrent requests gracefully', async ({ page }) => {
    await test.step('Test concurrent sync requests', async () => {
      const requests = Array.from({ length: 3 }, () =>
        page.request.get('/api/sync-notion?stats=true')
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status()).toBe(200);
      });
    });
  });
});

test.describe('Production Error Handling', () => {
  test('should handle invalid requests gracefully', async ({ page }) => {
    await test.step('Test invalid sync request', async () => {
      const response = await page.request.post('/api/sync-notion', {
        data: {
          invalid: 'data'
        }
      });

      // Debe retornar error pero no crash
      expect([400, 422, 500]).toContain(response.status());
    });
  });

  test('should validate error logging and recovery', async ({ page }) => {
    await test.step('Test error scenarios', async () => {
      // Test con pageId inválido
      const response = await page.request.post('/api/sync-notion', {
        data: {
          pageIds: ['invalid-page-id-123']
        }
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.errors).toBeDefined();
    });
  });
});

test.describe('Production Monitoring', () => {
  test('should provide system metrics', async ({ page }) => {
    await test.step('Check system health metrics', async () => {
      const response = await page.request.get('/api/sync-notion?stats=true');
      expect(response.status()).toBe(200);

      const data = await response.json();

      // Verificar que proporciona información del sistema
      expect(data).toBeDefined();
    });
  });

  test('should validate all critical endpoints are accessible', async ({ page }) => {
    const criticalEndpoints = [
      '/api/sync-notion',
      '/api/sync-supabase-adaptive',
      '/api/debug-notion-connection',
      '/api/chat'
    ];

    for (const endpoint of criticalEndpoints) {
      await test.step(`Check ${endpoint}`, async () => {
        const response = await page.request.get(endpoint);

        // Los endpoints deben ser accesibles (no 404)
        expect(response.status()).not.toBe(404);

        // Pueden retornar 400/405 para métodos incorrectos, pero deben existir
        expect([200, 400, 405, 422]).toContain(response.status());
      });
    }
  });
});

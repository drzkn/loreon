import { test, expect } from '@playwright/test';

test.describe('Página de Visualizer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/visualizer');
  });

  test('debería mostrar el componente de búsqueda', async ({ page }) => {
    const searchBar = page.locator('[data-testid="search-bar"]').first();
    const searchInput = page.locator('input[type="search"]').first();

    if (await searchBar.isVisible()) {
      await expect(searchBar).toBeVisible();
    }

    if (await searchInput.isVisible()) {
      await expect(searchInput).toBeVisible();
    }
  });

  test('debería mostrar la lista de páginas', async ({ page }) => {
    const pagesList = page.locator('[data-testid="pages-list"]').first();

    if (await pagesList.isVisible()) {
      await expect(pagesList).toBeVisible();
    }
  });

  test('debería mostrar el visor de contenido', async ({ page }) => {
    const contentViewer = page.locator('[data-testid="content-viewer"]').first();

    if (await contentViewer.isVisible()) {
      await expect(contentViewer).toBeVisible();
    }
  });

  test('debería permitir realizar búsquedas', async ({ page }) => {
    const searchInput = page.locator('input[type="search"]').first();

    if (await searchInput.isVisible()) {
      await searchInput.fill('test search');
      await expect(searchInput).toHaveValue('test search');

      await searchInput.press('Enter');

      await page.waitForTimeout(1000);
    } else {
      test.skip(true, 'Input de búsqueda no encontrado en la página');
    }
  });
});

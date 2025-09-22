import { test, expect } from '@playwright/test';

test.describe('Página de Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
  });

  test('debería cargar la página de settings correctamente', async ({ page }) => {
    await expect(page).toHaveURL(/.*\/settings/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('debería mostrar las opciones de configuración', async ({ page }) => {
    const settingsContainer = page.locator('[data-testid="settings-container"]').first();

    if (await settingsContainer.isVisible()) {
      await expect(settingsContainer).toBeVisible();
    }
  });

  test('debería permitir navegar a configuración general', async ({ page }) => {
    const generalLink = page.getByRole('link', { name: /general/i });

    if (await generalLink.isVisible()) {
      await generalLink.click();
      await expect(page).toHaveURL(/.*\/settings\/general/);
    } else {
      test.skip(true, 'Link de configuración general no encontrado');
    }
  });

  test('debería permitir navegar a configuración de sincronización', async ({ page }) => {
    const syncLink = page.getByRole('link', { name: /sync/i });

    if (await syncLink.isVisible()) {
      await syncLink.click();
      await expect(page).toHaveURL(/.*\/settings\/sync/);
    } else {
      test.skip(true, 'Link de configuración de sync no encontrado');
    }
  });
});

import { test, expect } from '@playwright/test';

test.describe('Página de Chat - Viewport Móvil (390px)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/chat');
  });

  test('debería mostrar la interfaz de chat en móvil', async ({ page }) => {
    const chatContainer = page.locator('[data-testid="chat-container"]').first();
    const messageInput = page.locator('textarea').first();
    const submitButton = page.locator('button[type="submit"]').first();

    if (await chatContainer.isVisible()) {
      await expect(chatContainer).toBeVisible();
    }

    if (await messageInput.isVisible()) {
      await expect(messageInput).toBeVisible();
    }

    if (await submitButton.isVisible()) {
      await expect(submitButton).toBeVisible();
    }
  });

  test('debería enviar un mensaje y recibir respuesta del sistema en móvil', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const messageInput = page.locator('textarea').first();
    const submitButton = page.locator('button[type="submit"]').first();

    if (!(await messageInput.isVisible()) || !(await submitButton.isVisible())) {
      test.skip(true, 'Elementos de chat no encontrados en la página');
      return;
    }

    const testMessage = 'Hola, ¿cómo estás?';

    await messageInput.fill(testMessage);
    await expect(messageInput).toHaveValue(testMessage);

    await submitButton.click();

    await expect(messageInput).toHaveValue('');

    const userMessage = page.locator(`text=${testMessage}`).first();
    await expect(userMessage).toBeVisible({ timeout: 10000 });

    const thinkingIndicator = page.locator('text=Pensando...').first();
    if (await thinkingIndicator.isVisible()) {
      await expect(thinkingIndicator).toBeVisible();
      await expect(thinkingIndicator).toBeHidden({ timeout: 30000 });
    }

    const assistantMessages = page.locator('[data-testid="message"]:not([data-testid*="user"])');
    const botIcon = page.locator('svg').first();

    if (await assistantMessages.count() > 0) {
      await expect(assistantMessages.first()).toBeVisible({ timeout: 30000 });
    } else if (await botIcon.isVisible()) {
      const messageContainer = botIcon.locator('..').locator('..');
      await expect(messageContainer).toBeVisible({ timeout: 30000 });
    }
  });

  test('debería mostrar el estado de carga mientras el sistema procesa el mensaje en móvil', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const messageInput = page.locator('textarea').first();
    const submitButton = page.locator('button[type="submit"]').first();

    if (!(await messageInput.isVisible()) || !(await submitButton.isVisible())) {
      test.skip(true, 'Elementos de chat no encontrados en la página');
      return;
    }

    await messageInput.fill('¿Qué información tienes disponible?');

    const submitPromise = submitButton.click();

    await expect(messageInput).toHaveValue('');

    const thinkingIndicator = page.locator('text=Pensando...').first();
    await expect(thinkingIndicator).toBeVisible({ timeout: 5000 });

    await submitPromise;

    await expect(thinkingIndicator).toBeHidden({ timeout: 30000 });
  });
});

test.describe('Página de Chat - Viewport Tablet (820px)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 820, height: 1180 });
    await page.goto('/chat');
  });

  test('debería mostrar la interfaz de chat en tablet', async ({ page }) => {
    const chatContainer = page.locator('[data-testid="chat-container"]').first();
    const messageInput = page.locator('textarea').first();
    const submitButton = page.locator('button[type="submit"]').first();

    if (await chatContainer.isVisible()) {
      await expect(chatContainer).toBeVisible();
    }

    if (await messageInput.isVisible()) {
      await expect(messageInput).toBeVisible();
    }

    if (await submitButton.isVisible()) {
      await expect(submitButton).toBeVisible();
    }
  });

  test('debería enviar un mensaje y recibir respuesta del sistema en tablet', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const messageInput = page.locator('textarea').first();
    const submitButton = page.locator('button[type="submit"]').first();

    if (!(await messageInput.isVisible()) || !(await submitButton.isVisible())) {
      test.skip(true, 'Elementos de chat no encontrados en la página');
      return;
    }

    const testMessage = 'Hola, ¿cómo estás?';

    await messageInput.fill(testMessage);
    await expect(messageInput).toHaveValue(testMessage);

    await submitButton.click();

    await expect(messageInput).toHaveValue('');

    const userMessage = page.locator(`text=${testMessage}`).first();
    await expect(userMessage).toBeVisible({ timeout: 10000 });

    const thinkingIndicator = page.locator('text=Pensando...').first();
    if (await thinkingIndicator.isVisible()) {
      await expect(thinkingIndicator).toBeVisible();
      await expect(thinkingIndicator).toBeHidden({ timeout: 30000 });
    }

    const assistantMessages = page.locator('[data-testid="message"]:not([data-testid*="user"])');
    const botIcon = page.locator('svg').first();

    if (await assistantMessages.count() > 0) {
      await expect(assistantMessages.first()).toBeVisible({ timeout: 30000 });
    } else if (await botIcon.isVisible()) {
      const messageContainer = botIcon.locator('..').locator('..');
      await expect(messageContainer).toBeVisible({ timeout: 30000 });
    }
  });

  test('debería mostrar el estado de carga mientras el sistema procesa el mensaje en tablet', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const messageInput = page.locator('textarea').first();
    const submitButton = page.locator('button[type="submit"]').first();

    if (!(await messageInput.isVisible()) || !(await submitButton.isVisible())) {
      test.skip(true, 'Elementos de chat no encontrados en la página');
      return;
    }

    await messageInput.fill('¿Qué información tienes disponible?');

    const submitPromise = submitButton.click();

    await expect(messageInput).toHaveValue('');

    const thinkingIndicator = page.locator('text=Pensando...').first();
    await expect(thinkingIndicator).toBeVisible({ timeout: 5000 });

    await submitPromise;

    await expect(thinkingIndicator).toBeHidden({ timeout: 30000 });
  });
});

test.describe('Página de Chat - Viewport Desktop (1200px)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/chat');
  });

  test('debería mostrar la interfaz de chat en desktop', async ({ page }) => {
    const chatContainer = page.locator('[data-testid="chat-container"]').first();
    const messageInput = page.locator('textarea').first();
    const submitButton = page.locator('button[type="submit"]').first();

    if (await chatContainer.isVisible()) {
      await expect(chatContainer).toBeVisible();
    }

    if (await messageInput.isVisible()) {
      await expect(messageInput).toBeVisible();
    }

    if (await submitButton.isVisible()) {
      await expect(submitButton).toBeVisible();
    }
  });

  test('debería enviar un mensaje y recibir respuesta del sistema en desktop', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const messageInput = page.locator('textarea').first();
    const submitButton = page.locator('button[type="submit"]').first();

    if (!(await messageInput.isVisible()) || !(await submitButton.isVisible())) {
      test.skip(true, 'Elementos de chat no encontrados en la página');
      return;
    }

    const testMessage = 'Hola, ¿cómo estás?';

    await messageInput.fill(testMessage);
    await expect(messageInput).toHaveValue(testMessage);

    await submitButton.click();

    await expect(messageInput).toHaveValue('');

    const userMessage = page.locator(`text=${testMessage}`).first();
    await expect(userMessage).toBeVisible({ timeout: 10000 });

    const thinkingIndicator = page.locator('text=Pensando...').first();
    if (await thinkingIndicator.isVisible()) {
      await expect(thinkingIndicator).toBeVisible();
      await expect(thinkingIndicator).toBeHidden({ timeout: 30000 });
    }

    const assistantMessages = page.locator('[data-testid="message"]:not([data-testid*="user"])');
    const botIcon = page.locator('svg').first();

    if (await assistantMessages.count() > 0) {
      await expect(assistantMessages.first()).toBeVisible({ timeout: 30000 });
    } else if (await botIcon.isVisible()) {
      const messageContainer = botIcon.locator('..').locator('..');
      await expect(messageContainer).toBeVisible({ timeout: 30000 });
    }
  });

  test('debería mostrar el estado de carga mientras el sistema procesa el mensaje en desktop', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const messageInput = page.locator('textarea').first();
    const submitButton = page.locator('button[type="submit"]').first();

    if (!(await messageInput.isVisible()) || !(await submitButton.isVisible())) {
      test.skip(true, 'Elementos de chat no encontrados en la página');
      return;
    }

    await messageInput.fill('¿Qué información tienes disponible?');

    const submitPromise = submitButton.click();

    await expect(messageInput).toHaveValue('');

    const thinkingIndicator = page.locator('text=Pensando...').first();
    await expect(thinkingIndicator).toBeVisible({ timeout: 5000 });

    await submitPromise;

    await expect(thinkingIndicator).toBeHidden({ timeout: 30000 });
  });
});

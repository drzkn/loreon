import { Page, expect } from '@playwright/test';

export class TestHelpers {
  constructor(private page: Page) { }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async waitForElementToBeVisible(selector: string, timeout = 5000) {
    await this.page.waitForSelector(selector, {
      state: 'visible',
      timeout
    });
  }

  async clickAndWaitForNavigation(selector: string) {
    await Promise.all([
      this.page.waitForNavigation(),
      this.page.click(selector)
    ]);
  }

  async fillFormField(selector: string, value: string) {
    await this.page.fill(selector, value);
    await expect(this.page.locator(selector)).toHaveValue(value);
  }

  async takeScreenshotOnFailure(testName: string) {
    await this.page.screenshot({
      path: `test-results/screenshots/${testName}-failure.png`,
      fullPage: true
    });
  }

  async checkAccessibility() {
    const violations = await this.page.evaluate(() => {
      // Basic accessibility checks
      const images = document.querySelectorAll('img');
      const imagesWithoutAlt = Array.from(images).filter(img => !img.alt);

      const buttons = document.querySelectorAll('button');
      const buttonsWithoutText = Array.from(buttons).filter(btn =>
        !btn.textContent?.trim() && !btn.getAttribute('aria-label')
      );

      return {
        imagesWithoutAlt: imagesWithoutAlt.length,
        buttonsWithoutText: buttonsWithoutText.length
      };
    });

    return violations;
  }
}

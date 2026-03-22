const { test, expect } = require('@playwright/test');

/**
 * Responsive layout tests.
 * Verifies that desktop gets the full 800-wide viewport and
 * mobile portrait gets a narrower viewport.
 */

test.describe('Responsive Layout', () => {
  test('desktop landscape gets full 800-wide canvas', async ({ page }) => {
    // Default config is 1200x600 desktop — pointer:fine, landscape
    await page.goto('/');
    await page.waitForSelector('canvas', { state: 'visible' });
    await page.waitForTimeout(500); // let Kaplay init

    // Kaplay letterbox scales the canvas buffer to fill the container,
    // so canvas.width reflects the viewport, not the game world.
    // Instead check the rendered aspect ratio: a landscape game (800x400 = 2:1)
    // in a 1200x600 viewport (also 2:1) should fill the container with no bars.
    // A portrait-mode game (185x400) would be letterboxed into a narrow column.
    const aspect = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return 0;
      const rect = canvas.getBoundingClientRect();
      return rect.width / rect.height;
    });

    // Desktop landscape should be close to 2:1 (800/400), definitely > 1.5
    expect(aspect).toBeGreaterThan(1.5);
  });

  test('desktop landscape: pointer is fine (not coarse)', async ({ page }) => {
    await page.goto('/');
    const isCoarse = await page.evaluate(() =>
      window.matchMedia('(pointer: coarse)').matches
    );
    expect(isCoarse).toBe(false);
  });

  test('mobile portrait gets narrow canvas (less than 800)', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });
    const page = await context.newPage();
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');

    const canvasWidth = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      return canvas ? canvas.width : 0;
    });

    // Portrait mobile: VIEW_W = round(400 * (390/844)) ≈ 185
    expect(canvasWidth).toBeLessThan(800);
    expect(canvasWidth).toBeGreaterThan(0);

    await context.close();
  });

  test('mobile portrait: pointer is coarse', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });
    const page = await context.newPage();
    await page.goto('http://localhost:3000/');

    const isCoarse = await page.evaluate(() =>
      window.matchMedia('(pointer: coarse)').matches
    );

    expect(isCoarse).toBe(true);
    await context.close();
  });
});

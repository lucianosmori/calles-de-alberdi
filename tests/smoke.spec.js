const { test, expect } = require('@playwright/test');

/**
 * Smoke tests for Calles de Alberdi.
 * Verify page loads, canvas renders, and basic structure is intact.
 */

test.describe('Page Load & Canvas', () => {
  test('page title is correct', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Calles de Alberdi');
  });

  test('canvas element exists', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    await page.goto('/');

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    expect(jsErrors).toHaveLength(0);
  });

  test('no JavaScript errors on load', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(jsErrors).toHaveLength(0);
  });

  test('canvas is not blank (has pixel data)', async ({ page }) => {
    await page.goto('/');

    // Poll until Kaplay renders content beyond the background color [18, 18, 28].
    // Kaplay v3001 uses WebGL — sample via readPixels across a grid of points.
    const BG = [18, 18, 28];
    let hasPixelData = false;

    for (let attempt = 0; attempt < 20; attempt++) {
      await page.waitForTimeout(200);

      hasPixelData = await page.evaluate(([bgR, bgG, bgB]) => {
        const canvas = document.querySelector('canvas');
        if (!canvas || canvas.width === 0) return false;

        const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
        if (!gl) return false;

        const pixel = new Uint8Array(4);
        // Sample a grid of points across the canvas to find any non-background pixel
        const steps = [0.25, 0.5, 0.75];
        for (const sx of steps) {
          for (const sy of steps) {
            const x = Math.floor(canvas.width * sx);
            // WebGL Y-axis is bottom-up, so flip
            const y = Math.floor(canvas.height * (1 - sy));
            gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
            if (pixel[0] !== bgR || pixel[1] !== bgG || pixel[2] !== bgB) {
              return true;
            }
          }
        }
        return false;
      }, BG);

      if (hasPixelData) break;
    }

    expect(hasPixelData).toBe(true);
  });
});

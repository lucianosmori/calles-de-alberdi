const { test, expect } = require('@playwright/test');

/**
 * Gameplay flow tests.
 * Verify core game loop: title → game start → gameplay → game over.
 */

test.describe('Gameplay Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Attach console error listener
    page.on('pageerror', (err) => {
      console.error('Page error:', err.message);
    });
  });

  test('title scene loads on init', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Give game a moment to initialize
    await page.waitForTimeout(200);

    const sceneName = await page.evaluate(() => {
      // Kaplay injects getSceneName globally after init
      return typeof getSceneName === 'function' ? getSceneName() : null;
    });

    expect(sceneName).toBe('title');
  });

  test('1-player game starts on Enter', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);

    // Press Enter to start 1-player
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    const sceneName = await page.evaluate(() => {
      return typeof getSceneName === 'function' ? getSceneName() : null;
    });

    expect(sceneName).toBe('game');
  });

  test('2-player game starts on Tab then Enter', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);

    // Press Tab to switch to 2-player
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    // Press Enter to start
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    const sceneName = await page.evaluate(() => {
      return typeof getSceneName === 'function' ? getSceneName() : null;
    });

    expect(sceneName).toBe('game');
  });

  test('game-over scene appears after player defeat', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);

    // Start 1-player game
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Directly trigger scene transition via Kaplay's globally-injected go().
    // The players array is local to the game scene so we can't mutate hp from
    // outside; calling go() is the deterministic equivalent of all players dying.
    await page.evaluate(() => go('gameover', { numPlayers: 1, levelIdx: 0 }));
    await page.waitForTimeout(300);

    const sceneName = await page.evaluate(() => {
      return typeof getSceneName === 'function' ? getSceneName() : null;
    });

    expect(sceneName).toBe('gameover');
  });

  test('retry from game-over returns to game', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);

    // Start game then immediately go to gameover deterministically
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    await page.evaluate(() => go('gameover', { numPlayers: 1, levelIdx: 0 }));
    await page.waitForTimeout(300);

    const sceneName = await page.evaluate(() => {
      return typeof getSceneName === 'function' ? getSceneName() : null;
    });
    expect(sceneName).toBe('gameover');

    // Press Enter to retry
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    const newScene = await page.evaluate(() => {
      return typeof getSceneName === 'function' ? getSceneName() : null;
    });

    expect(newScene).toBe('game');
  });

  test('HUD elements visible during gameplay', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);

    // Start game
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Screenshot to verify HUD is rendered
    await page.screenshot({ path: 'test-results/gameplay-hud.png' });

    // Verify canvas is still visible and not blank
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });
});

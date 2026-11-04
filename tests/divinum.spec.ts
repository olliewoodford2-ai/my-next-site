import { test, expect } from '@playwright/test';

// Increase test timeout to 60 seconds to allow for loading and network delays
test.setTimeout(60000);

const viewports = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'large-desktop', width: 1920, height: 1080 },
  { name: 'ultra-wide', width: 2560, height: 1080 },
];

const SCENES = [
  { id: 'opening', name: 'The Opening' },
  { id: 'hero', name: 'The Hero' },
  { id: 'genesis', name: 'The Genesis' },
  { id: 'oracle', name: 'The Oracle' },
  { id: 'afterimage', name: 'The Afterimage' },
  { id: 'finale', name: 'The Finale' },
];

// Helper to wait for canvas to be ready
async function waitForCanvas(page) {
  // Wait for loading screen to disappear (it hides when isLoading becomes false)
  await expect(page.locator('[class*="loadingScreen"]')).toBeHidden({ timeout: 45000 });
  // Wait for canvas to appear (dynamic import with ssr: false)
  await expect(page.locator('canvas')).toBeVisible({ timeout: 30000 });
  // Additional wait for Three.js scene to initialize
  await page.waitForTimeout(2000);
}

test.describe('DIVINUM - Phase 2 Verification', () => {
  let consoleMessages: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleMessages = [];
    page.on('console', (msg) => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });
    page.on('pageerror', (error) => {
      consoleMessages.push(`[pageerror] ${error.message}`);
    });
  });

  test.afterEach(async ({ page }, testInfo) => {
    // Log all console messages for debugging
    if (consoleMessages.length > 0) {
      console.log('Console messages:', consoleMessages);
      await testInfo.attach('console-messages.txt', {
        body: consoleMessages.join('\n'),
        contentType: 'text/plain',
      });
    }
    // Fail test if there are console errors
    const errors = consoleMessages.filter(m => m.startsWith('[error]') || m.startsWith('[pageerror]'));
    expect(errors, `Console errors detected: ${errors.join('; ')}`).toHaveLength(0);
  });

  for (const viewport of viewports) {
    test.describe(`Viewport: ${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      test.use({ viewport: { width: viewport.width, height: viewport.height } });

      test('loads without errors and shows loading screen', async ({ page }) => {
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
        await waitForCanvas(page);
      });

      test('scroll works and scenes transition', async ({ page }) => {
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
        await waitForCanvas(page);

        // Get initial scroll position
        const initialScroll = await page.evaluate(() => window.scrollY);
        expect(initialScroll).toBe(0);

        // Scroll down to trigger scene transitions
        // Total scroll height is 600vh (6 scenes * 100vh)
        const scrollSteps = 6;

        for (let i = 0; i < scrollSteps; i++) {
          await page.evaluate(() => {
            window.scrollBy(0, window.innerHeight);
          });

          // Wait for scroll animation
          await page.waitForTimeout(800);

          // Verify scroll position changed
          const currentScroll = await page.evaluate(() => window.scrollY);
          expect(currentScroll).toBeGreaterThan(initialScroll);
        }

        // Verify we can scroll back up
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(500);
        const finalScroll = await page.evaluate(() => window.scrollY);
        expect(finalScroll).toBeLessThanOrEqual(100);
      });

      test('scene navigation works', async ({ page }) => {
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
        await waitForCanvas(page);

        // Wait for scene navigation to be visible
        const sceneNav = page.locator('[class*="sceneNav"]');
        await expect(sceneNav).toBeVisible();

        // Click on each scene button and verify navigation
        for (let i = 0; i < SCENES.length; i++) {
          const sceneButton = page.locator(`[class*="sceneButton"] >> nth=${i}`);
          await expect(sceneButton).toBeVisible();

          await sceneButton.click();
          await page.waitForTimeout(1500); // Wait for scroll animation

          // Verify active state
          const activeButton = page.locator(`[class*="sceneButton"][data-active="true"]`);
          await expect(activeButton).toContainText(SCENES[i].name);
        }
      });

      test('sound toggle works', async ({ page }) => {
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
        await waitForCanvas(page);

        const soundToggle = page.locator('[class*="soundToggle"]');
        await expect(soundToggle).toBeVisible();

        // Click to mute
        await soundToggle.click();
        await page.waitForTimeout(200);

        // Check aria-pressed attribute
        await expect(soundToggle).toHaveAttribute('aria-pressed', 'true');

        // Click to unmute
        await soundToggle.click();
        await page.waitForTimeout(200);

        await expect(soundToggle).toHaveAttribute('aria-pressed', 'false');
      });

      test('custom cursor is present', async ({ page }) => {
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
        await waitForCanvas(page);

        // Check for custom cursor element
        const cursor = page.locator('[class*="customCursor"], [class*="cursor-follower"]');
        await expect(cursor.first()).toBeVisible();
      });

      test('takes screenshots at each scene', async ({ page }, testInfo) => {
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
        await waitForCanvas(page);

        const screenshotDir = `./screenshots/${viewport.name}`;

        // Scroll to each scene and take screenshot
        for (let i = 0; i < SCENES.length; i++) {
          const sceneButton = page.locator(`[class*="sceneButton"] >> nth=${i}`);
          await sceneButton.click();
          await page.waitForTimeout(2000); // Wait for transition + render

          const screenshot = await page.screenshot({
            fullPage: false,
            path: `${screenshotDir}/${SCENES[i].id}.png`
          });

          await testInfo.attach(`${viewport.name}-${SCENES[i].id}.png`, {
            body: screenshot,
            contentType: 'image/png',
          });
        }
      });
    });
  }
});
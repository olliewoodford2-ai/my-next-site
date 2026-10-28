const { chromium } = require('playwright');

async function inspectPearNo() {
  const url = 'https://pear.no/';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const errors = [];
  const failedRequests = [];

  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      errors.push({ type: msg.type(), text: msg.text() });
    }
  });

  page.on('pageerror', err => {
    errors.push({ type: 'pageerror', text: err.message });
  });

  page.on('response', response => {
    if (response.status() >= 400) {
      failedRequests.push({ status: response.status(), url: response.url() });
    }
  });

  const result = {
    url,
    timestamp: new Date().toISOString(),
    canvas: null,
    videos: [],
    images: [],
    scrollSteps: [],
    screenshot: null,
    consoleErrors: [],
    failedRequests: [],
  };

  try {
    // 1. Go to pear.no and wait for networkidle (60s timeout)
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

    // 2. Wait for canvas (10s timeout)
    await page.waitForSelector('canvas', { timeout: 10000 }).catch(() => {});

    // 3. Wait 8s for assets
    await page.waitForTimeout(8000);

    // 4. Capture canvas dimensions
    const canvasInfo = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return { found: false };
      const ctx = canvas.getContext('webgl') || canvas.getContext('webgl2');
      return {
        found: true,
        width: canvas.width,
        height: canvas.height,
        clientWidth: canvas.clientWidth,
        clientHeight: canvas.clientHeight,
        webglVersion: ctx instanceof WebGL2RenderingContext ? '2' : '1',
        renderer: ctx?.getParameter(ctx.RENDERER) || 'unknown',
      };
    });
    result.canvas = canvasInfo;

    // 5. Capture all videos
    const videosInfo = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('video')).map(v => ({
        src: v.src,
        videoWidth: v.videoWidth,
        videoHeight: v.videoHeight,
        readyState: v.readyState,
        error: v.error?.message || null,
      }));
    });
    result.videos = videosInfo;

    // 6. Capture all images
    const imagesInfo = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img')).map(img => ({
        src: img.src,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        complete: img.complete,
      }));
    });
    result.images = imagesInfo;

    // 7. Scroll 0 to 15 (500px steps, 500ms wait) - capture canvas at each step
    for (let i = 0; i <= 15; i++) {
      await page.evaluate(y => window.scrollTo(0, y), i * 500);
      await page.waitForTimeout(500);
      const canvasAtScroll = await page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        return canvas ? {
          width: canvas.width,
          height: canvas.height,
          clientWidth: canvas.clientWidth,
          clientHeight: canvas.clientHeight,
        } : null;
      });
      result.scrollSteps.push({
        step: i,
        scrollY: i * 500,
        canvas: canvasAtScroll,
      });
    }

    // 8. Re-check videos after scroll
    const videosAfterScroll = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('video')).map(v => ({
        src: v.src,
        videoWidth: v.videoWidth,
        videoHeight: v.videoHeight,
        readyState: v.readyState,
        error: v.error?.message || null,
      }));
    });
    result.videosAfterScroll = videosAfterScroll;

    // 9. Take screenshot
    const screenshotBuffer = await page.screenshot({ fullPage: false });
    result.screenshot = screenshotBuffer.toString('base64');

  } catch (e) {
    result.error = e.message;
  }

  // 10. Capture console errors and failed requests
  result.consoleErrors = errors;
  result.failedRequests = failedRequests;

  await browser.close();

  // Output as JSON
  console.log(JSON.stringify(result, null, 2));
}

inspectPearNo().catch(console.error);
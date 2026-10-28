const { chromium } = require('playwright');

async function inspectSite(url, name) {
  console.log(`\n=== INSPECTING ${name}: ${url} ===`);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const errors = [];
  const failedRequests = [];

  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      errors.push(`[${msg.type()}] ${msg.text()}`);
    }
  });

  page.on('pageerror', err => {
    errors.push(`[pageerror] ${err.message}`);
  });

  page.on('response', response => {
    if (response.status() >= 400) {
      failedRequests.push(`${response.status()} ${response.url()}`);
    }
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    console.log('Page loaded');

    // Wait for canvas to appear
    await page.waitForSelector('canvas', { timeout: 10000 }).catch(() => console.log('No canvas found'));

    // Check canvas properties
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
        webgl: !!ctx,
        webglVersion: ctx instanceof WebGL2RenderingContext ? '2' : '1',
        renderer: ctx?.getParameter(ctx.RENDERER) || 'unknown',
      };
    });
    console.log('Canvas:', canvasInfo);

    // Check for images/videos in DOM
    const mediaInfo = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img')).map(img => ({
        src: img.src,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        complete: img.complete,
      }));
      const videos = Array.from(document.querySelectorAll('video')).map(v => ({
        src: v.src,
        videoWidth: v.videoWidth,
        videoHeight: v.videoHeight,
        readyState: v.readyState,
        error: v.error?.message,
      }));
      return { images: imgs, videos };
    });
    console.log(`Images (${mediaInfo.images.length}):`, mediaInfo.images.slice(0, 5));
    console.log(`Videos (${mediaInfo.videos.length}):`, mediaInfo.videos);

    // Scroll through scenes
    console.log('Scrolling through scenes...');
    for (let i = 0; i <= 10; i++) {
      await page.evaluate(y => window.scrollTo(0, y), i * 500);
      await page.waitForTimeout(300);
      const sceneInfo = await page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        return canvas ? {
          width: canvas.width,
          height: canvas.height,
        } : null;
      });
      if (i % 3 === 0) console.log(`Scroll ${i}:`, sceneInfo);
    }

    // Take screenshot
    await page.screenshot({ path: `screenshot-${name.replace(/[^a-z]/gi, '-')}.png`, fullPage: false });
    console.log(`Screenshot saved`);

  } catch (e) {
    console.log('Error:', e.message);
  }

  console.log('\nConsole errors:', errors.length ? errors : 'none');
  console.log('Failed requests:', failedRequests.length ? failedRequests : 'none');

  await browser.close();
  return { errors, failedRequests };
}

async function main() {
  await inspectSite('https://pear.no/', 'pear-no');
  await inspectSite('https://my-next-site-eta.vercel.app/', 'my-next-site');
}

main().catch(console.error);
import puppeteer from 'puppeteer-core';

const EXE = '/home/rajeev/.cache/puppeteer/chrome/linux-145.0.7632.46/chrome-linux64/chrome';
const browser = await puppeteer.launch({
  executablePath: EXE, headless: 'new', args: ['--no-sandbox','--disable-setuid-sandbox']
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

try {
  await page.goto('http://localhost:3000/product/royal-red-banarasi-silk-saree', { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise(r => setTimeout(r, 3000));
  const pageText = await page.evaluate(() => document.body.innerText);
  console.log('HAS TAILORING:', /Fall, Pico/.test(pageText));
  console.log('HAS CUSTOMIZE:', /Customize/.test(pageText));
  console.log('SNIPPET:', pageText.slice(0, 500));
  await page.screenshot({ path: '/tmp/opencode/pdp.png', fullPage: false });
  console.log('WROTE pdp.png');
} catch (e) {
  console.error(e);
}
await browser.close();

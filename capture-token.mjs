import { chromium } from 'playwright';

const USERNAME = '';
const PASSWORD = '';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'fr-FR',
    viewport: { width: 1366, height: 768 }
  });
  const page = await context.newPage();

  // Intercept requests to get the reCAPTCHA token
  page.on('request', req => {
    if (req.url().includes('welcome.html') && req.method() === 'POST') {
      const postData = req.postData();
      if (postData && postData.includes('g-recaptcha-response')) {
        const match = postData.match(/g-recaptcha-response=([^&]+)/);
        if (match) {
          const token = decodeURIComponent(match[1]);
          console.log('RECAPTCHA_TOKEN:' + token);
        }
        console.log('FULL_POST_DATA:' + postData);
      }
    }
  });

  await page.goto('https://controlpanel.amen.fr/welcome.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Remove overlays
  await page.evaluate(() => {
    document.querySelectorAll('[id*="iubenda"], [class*="iubenda"]').forEach(el => el.remove());
  });

  await page.fill('input[name="userName"]', USERNAME);
  await page.fill('input[name="password"]', PASSWORD);
  await page.waitForTimeout(500);

  // Submit
  await page.click('button[type="submit"]', { force: true });
  await page.waitForTimeout(3000);
  await browser.close();
}

main().catch(console.error);

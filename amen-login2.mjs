import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import { USERNAME, PASSWORD } from './scripts/amen-credentials.mjs';

async function main() {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox']
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'fr-FR'
  });
  const page = await context.newPage();

  page.on('console', msg => console.log(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => console.log('[PAGE ERROR]', err.message));

  try {
    console.log('Navigating to login page...');
    await page.goto('https://controlpanel.amen.fr/welcome.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Remove overlays
    await page.evaluate(() => {
      document.querySelectorAll('[id*="iubenda"], [class*="iubenda"], [class*="cookie"], [id*="cookie"]').forEach(el => el.remove());
    });
    await page.waitForTimeout(500);

    // Fill login form
    await page.fill('input[name="userName"]', USERNAME);
    await page.fill('input[name="password"]', PASSWORD);
    await page.waitForTimeout(500);

    // Intercept the POST request
    page.on('request', req => {
      if (req.url().includes('welcome.html') && req.method() === 'POST') {
        console.log('POST to welcome.html intercepted!');
        console.log('POST data:', req.postData());
      }
    });

    // Wait for navigation
    const navPromise = page.waitForNavigation({ timeout: 20000 }).catch(() => {});

    // Submit form
    await page.click('button[type="submit"]', { force: true });

    // Wait
    const nav = await navPromise;
    console.log('Navigation complete:', page.url());

    // Check response
    const content = await page.content();
    if (!content.includes('formLogin') && !content.includes('Connexion à')) {
      console.log('SUCCESS - Logged in!');
      
      const cookies = await context.cookies();
      console.log('Cookies:', cookies.map(c => `${c.name}=${c.value.substring(0, 30)}...`));
      
      const lines = ['# Netscape HTTP Cookie File'];
      for (const c of cookies) {
        const secure = c.secure ? 'TRUE' : 'FALSE';
        const httpOnly = c.httpOnly ? '#HttpOnly_' : '';
        const expires = Math.floor((c.expires || 0));
        lines.push(`${httpOnly}${c.domain}\tTRUE\t${c.path}\t${secure}\t${expires}\t${c.name}\t${c.value}`);
      }
      writeFileSync('amen-cookies-netscape.txt', lines.join('\n'), 'utf8');
      console.log('Cookies saved!');
    } else {
      console.log('Still on login page');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
}

main();

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

  // Log console messages
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('recaptcha') || msg.text().includes('reCAPTCHA')) {
      console.log(`[BROWSER ${msg.type()}] ${msg.text()}`);
    }
  });
  page.on('pageerror', err => console.log('[PAGE ERROR]', err.message));

  try {
    console.log('Navigating to login page...');
    await page.goto('https://controlpanel.amen.fr/welcome.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Remove overlays that might intercept clicks
    console.log('Removing overlays...');
    await page.evaluate(() => {
      document.querySelectorAll('div[id*="iubenda"], div[class*="iubenda"], div[class*="cookie"], div[id*="cookie"]').forEach(el => el.remove());
    });
    await page.waitForTimeout(500);

    // Fill login form
    console.log('Filling login form...');
    await page.fill('input[name="userName"]', USERNAME);
    await page.fill('input[name="password"]', PASSWORD);
    await page.waitForTimeout(1000);

    // Set up navigation listener BEFORE clicking
    let navResolve;
    const navPromise = new Promise(resolve => { navResolve = resolve; });
    page.on('framenavigated', frame => {
      if (frame === page.mainFrame()) {
        console.log('Navigation detected to:', frame.url());
        navResolve(frame.url());
      }
    });

    // Check if reCAPTCHA is loaded
    const hasRecaptcha = await page.evaluate(() => typeof grecaptcha !== 'undefined' && typeof grecaptcha.execute === 'function');
    console.log('reCAPTCHA loaded:', hasRecaptcha);

    // Submit via Enter key on password field (triggers form submit)
    console.log('Submitting form via Enter key...');
    await page.press('input[name="password"]', 'Enter');

    // Wait briefly for reCAPTCHA to execute
    console.log('Waiting for reCAPTCHA...');
    await page.waitForTimeout(2000);

    // Now try pressing Enter again (reCAPTCHA callback should submit)
    // Or check if already navigated
    let currentUrl2 = page.url();
    if (currentUrl2.includes('welcome.html')) {
      console.log('Still on login page, trying alternative approach...');
      // Try calling form submit directly with grecaptcha
      await page.evaluate(() => {
        const form = document.getElementById('formLogin');
        if (form && typeof grecaptcha !== 'undefined') {
          grecaptcha.execute();
        }
      });
      await page.waitForTimeout(3000);
    }

    // Wait for either navigation or timeout
    console.log('Waiting for navigation after login...');
    const result = await Promise.race([
      navPromise.then(url => ({ type: 'nav', url })),
      page.waitForTimeout(20000).then(() => ({ type: 'timeout' }))
    ]);
    console.log('Result:', JSON.stringify(result));

    // Check current URL
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    // Check if we got past the login
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
      console.log('Cookies saved to amen-cookies-netscape.txt');

      // Now try to access domains
      console.log('Navigating to domain list...');
      await page.goto('https://www.amen.fr/domains/', { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(3000);
      
      const pageText = await page.evaluate(() => document.body.innerText);
      if (pageText.includes('immeit')) {
        console.log('immeit.com FOUND!');
        // Look for domain management links
        const links = await page.evaluate(() => {
          return [...document.querySelectorAll('a')].map(a => ({ href: a.href, text: a.innerText.substring(0, 50) }));
        });
        const domainLinks = links.filter(l => l.text.toLowerCase().includes('immeit') || l.href.includes('immeit'));
        console.log('Domain links:', JSON.stringify(domainLinks, null, 2));
      } else {
        console.log('immeit not found. Page text (first 500):', pageText.substring(0, 500));
      }
    } else {
      console.log('Still on login page - reCAPTCHA blocked us');
      // Save the page for debugging
      writeFileSync('amen-login-debug.html', content);
      console.log('Debug page saved');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
}

main();

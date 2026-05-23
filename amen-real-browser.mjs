import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const USERNAME = '';
const PASSWORD = '';

async function main() {
  const browser = await chromium.launch({ 
    headless: false  // Use a real visible browser window
  });
  const context = await browser.newContext({
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
    viewport: { width: 1366, height: 768 }
  });
  const page = await context.newPage();

  page.on('console', msg => console.log(`[${msg.type()}] ${msg.text()}`));

  try {
    console.log('Opening login page...');
    await page.goto('https://controlpanel.amen.fr/welcome.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log('Page loaded!');

    // Wait for page to settle (cookie banner, etc.)
    await page.waitForTimeout(2000);

    // Remove overlays
    await page.evaluate(() => {
      const banners = document.querySelectorAll('[id*="iubenda"], [class*="iubenda"]');
      banners.forEach(b => b.remove());
    });

    // Fill the form
    await page.fill('input[name="userName"]', USERNAME);
    await page.fill('input[name="password"]', PASSWORD);
    console.log('Form filled, waiting before submit...');
    await page.waitForTimeout(500);

    // Set up navigation promise
    const navPromise = page.waitForNavigation({ timeout: 30000 }).catch(() => {});

    // Click submit
    await page.click('button[type="submit"]');
    console.log('Submit button clicked, waiting for navigation...');

    // Wait for navigation
    await navPromise;
    const currentUrl = page.url();
    console.log('Final URL:', currentUrl);

    const content = await page.content();

    if (!content.includes('formLogin') && !content.includes('Connexion')) {
      console.log('LOGGED IN!');

      // Save cookies
      const cookies = await context.cookies();
      console.log('Cookies:', cookies.map(c => `${c.name}=${c.value.substring(0, 30)}...`));

      const lines = ['# Netscape HTTP Cookie File'];
      for (const c of cookies) {
        if (c.name === 'dpsid' || c.name === 'cpIsLogged') {
          console.log(`AUTH COOKIE: ${c.name}=${c.value}`);
        }
        const secure = c.secure ? 'TRUE' : 'FALSE';
        const httpOnly = c.httpOnly ? '#HttpOnly_' : '';
        const expires = Math.floor((c.expires || 0));
        lines.push(`${httpOnly}${c.domain}\tTRUE\t${c.path}\t${secure}\t${expires}\t${c.name}\t${c.value}`);
      }
      writeFileSync('amen-cookies-netscape.txt', lines.join('\n'), 'utf8');
      console.log('Cookies saved!');

      // Now find domains
      console.log('\nLooking for domain management...');
      await page.goto('https://www.amen.fr/domains/', { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(3000);

      const pageText = await page.evaluate(() => document.body.innerText);
      console.log('Page text:', pageText.substring(0, 500));

      writeFileSync('amen-domains-after-login.html', await page.content());
      console.log('Domains page saved');
    } else {
      console.log('Still on login page');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await page.waitForTimeout(3000); // Let user see the result
    await browser.close();
  }
}

main();

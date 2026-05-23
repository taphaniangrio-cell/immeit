import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const USERNAME = '';
const PASSWORD = '';

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

  let postCount = 0;

  page.on('console', msg => {
    if (msg.text().includes('error') || msg.text().includes('recaptcha')) 
      console.log(`[${msg.type()}] ${msg.text()}`);
  });

  try {
    console.log('Step 1: Navigate to login page...');
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

    // Intercept network requests to capture session
    const responsePromise = new Promise(resolve => {
      page.on('response', resp => {
        if (resp.url().includes('welcome.html') && resp.status() === 302) {
          console.log('302 response from welcome.html');
          const headers = resp.headers();
          console.log('Response headers:', JSON.stringify(headers));
          resolve(headers);
        }
      });
    });

    // Prevent multiple form submissions
    await page.evaluate(() => {
      window._submitted = false;
      const origSubmit = HTMLFormElement.prototype.submit;
      HTMLFormElement.prototype.submit = function() {
        if (!window._submitted) {
          window._submitted = true;
          return origSubmit.call(this);
        }
        console.log('Blocking duplicate form submit');
      };
    });

    // Click the submit button
    await page.click('button[type="submit"]', { force: true });

    // Wait for response
    const respHeaders = await Promise.race([
      responsePromise,
      page.waitForTimeout(15000).then(() => null)
    ]);

    if (respHeaders) {
      console.log('Login response captured!');
      
      // Check cookies
      const cookies = await context.cookies();
      console.log('Cookies after login:');
      for (const c of cookies) {
        console.log(`  ${c.name}=${c.value.substring(0, 40)}... (domain: ${c.domain}, path: ${c.path})`);
      }

      // Now navigate to the control panel
      console.log('Navigating to control panel...');
      await page.goto('https://controlpanel.amen.fr/', { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(3000);

      const content = await page.content();
      if (!content.includes('formLogin') && !content.includes('Connexion')) {
        console.log('SUCCESS - Logged in to control panel!');

        // Save cookies
        const lines = ['# Netscape HTTP Cookie File'];
        for (const c of cookies) {
          const secure = c.secure ? 'TRUE' : 'FALSE';
          const httpOnly = c.httpOnly ? '#HttpOnly_' : '';
          const expires = Math.floor((c.expires || 0));
          lines.push(`${httpOnly}${c.domain}\tTRUE\t${c.path}\t${secure}\t${expires}\t${c.name}\t${c.value}`);
        }
        writeFileSync('amen-cookies-netscape.txt', lines.join('\n'), 'utf8');
        console.log('Cookies saved to amen-cookies-netscape.txt');
        
        // Try domain list
        console.log('Accessing domain list...');
        await page.goto('https://www.amen.fr/domains/', { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(3000);
        
        const text = await page.evaluate(() => document.body.innerText);
        if (text.includes('immeit')) {
          console.log('immeit.com FOUND in domains!');
        } else {
          console.log('Domains page (first 300 chars):', text.substring(0, 300));
        }
      } else {
        console.log('Still showing login page');
      }
    } else {
      console.log('No 302 response captured');
      
      // Check current URL and page
      console.log('Current URL:', page.url());
      const cookies = await context.cookies();
      console.log('Cookies:', cookies.map(c => `${c.name}=${c.value.substring(0, 30)}...`));
    }

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
}

main();

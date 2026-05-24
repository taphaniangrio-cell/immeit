import { chromium } from 'playwright';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { USERNAME, PASSWORD } from './scripts/amen-credentials.mjs';
const PROFILE_DIR = join('.', 'playwright-profile');

if (!existsSync(PROFILE_DIR)) {
  mkdirSync(PROFILE_DIR, { recursive: true });
}

async function main() {
  const browser = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    args: ['--no-sandbox'],
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
    viewport: { width: 1366, height: 768 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const page = await browser.newPage();

  try {
    // Part 1: Navigate and login
    console.log('=== PART 1: LOGIN ===');
    await page.goto('https://controlpanel.amen.fr/welcome.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Fill form
    await page.fill('input[name="userName"]', USERNAME);
    await page.fill('input[name="password"]', PASSWORD);
    await page.waitForTimeout(500);

    // Submit
    await page.click('button[type="submit"]');
    
    // Wait for either success or failure
    await page.waitForTimeout(3000);

    const content = await page.content();
    const loggedIn = !content.includes('formLogin') && !content.includes('Connexion');

    if (loggedIn) {
      console.log('LOGGED IN SUCCESSFULLY!');
      
      // Save cookies
      const cookies = await browser.cookies();
      const lines = ['# Netscape HTTP Cookie File'];
      for (const c of cookies) {
        const secure = c.secure ? 'TRUE' : 'FALSE';
        const httpOnly = c.httpOnly ? '#HttpOnly_' : '';
        const expires = Math.floor((c.expires || 0));
        lines.push(`${httpOnly}${c.domain}\tTRUE\t${c.path}\t${secure}\t${expires}\t${c.name}\t${c.value}`);
      }
      writeFileSync('amen-cookies-netscape.txt', lines.join('\n'), 'utf8');
      console.log('Cookies saved!');

      // Part 2: Access domains
      console.log('\n=== PART 2: ACCESS DOMAINS ===');
      await page.goto('https://www.amen.fr/domains/', { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(5000);
      
      const text = await page.evaluate(() => document.body.innerText);
      console.log('Page text:', text.substring(0, 1000));
      
      if (text.includes('immeit')) {
        console.log('immeit.com FOUND!');
        
        // Try to click on immeit.com
        const immeitLink = await page.$('a[href*="immeit"], a:has-text("immeit")');
        if (immeitLink) {
          console.log('Clicking immeit.com link');
          await immeitLink.click();
          await page.waitForTimeout(5000);
          console.log('Current URL:', page.url());
          writeFileSync('amen-immeit-page.html', await page.content());
          console.log('immeit page saved');
        }
      } else {
        console.log('immeit not found on page');
        writeFileSync('amen-domains-debug.html', await page.content());
        console.log('Domains debug page saved');
      }
    } else {
      console.log('Login failed - still on login page');
      writeFileSync('amen-login-failed.html', content);
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
}

main();

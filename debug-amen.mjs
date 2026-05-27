import { chromium } from 'playwright';
import { execSync, spawn } from 'child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import http from 'http';
import { USERNAME, PASSWORD } from './scripts/amen-credentials.mjs';

const DEBUG_DIR = 'C:\\temp\\chrome-amen-debug';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function waitForPort(port, t) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      const req = http.get(`http://localhost:${port}/json/version`, res => { res.resume(); res.on('end', resolve); });
      req.on('error', () => Date.now() - start > t ? reject(new Error('Timeout')) : setTimeout(check, 300));
      req.setTimeout(2000, () => { req.destroy(); setTimeout(check, 300); });
    };
    check();
  });
}

if (existsSync(DEBUG_DIR)) rmSync(DEBUG_DIR, { recursive: true, force: true });
mkdirSync(DEBUG_DIR, { recursive: true });

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  ['--remote-debugging-port=9232', `--user-data-dir=${DEBUG_DIR}`, '--no-first-run', '--no-default-browser-check', '--window-size=1200,900'],
  { detached: true, stdio: 'ignore' }
);
chrome.unref();
await waitForPort(9232, 15000);

const browser = await chromium.connectOverCDP('http://localhost:9232');
const page = browser.contexts()[0].pages()[0];

await page.goto('https://controlpanel.amen.fr/welcome.html', { timeout: 20000 });
await sleep(1500);
const ck = await page.$('button.iubenda-cs-accept-btn');
if (ck) await ck.click();
await sleep(500);
await page.fill('input[name="userName"]', USERNAME);
await page.fill('input[name="password"]', PASSWORD);
await page.click('button[type="submit"]:has-text("Login")');
for (let i = 0; i < 40; i++) { await sleep(500); if (!page.url().includes('welcome')) break; }
console.log('URL:', page.url());

// Save dashboard HTML
const html = await page.content();
writeFileSync('amen-dashboard.html', html);
console.log('Dashboard saved (' + html.length + ' bytes)');

// Extract all interactive elements
const info = await page.evaluate(() => ({
  text: document.body.innerText.substring(0, 2000),
  buttons: Array.from(document.querySelectorAll('a, button, [role="button"]')).map(e => ({ t: e.textContent.trim().substring(0, 50), h: e.href || '', id: e.id, cls: e.className.substring(0, 50) })).filter(e => e.t),
  iframes: Array.from(document.querySelectorAll('iframe')).map(f => f.src),
  forms: Array.from(document.querySelectorAll('form')).map(f => ({ a: f.action, id: f.id })),
}));
console.log('\n=== TEXTE ===');
console.log(info.text);
console.log('\n=== BOUTONS/LIENS ===');
console.log(JSON.stringify(info.buttons, null, 2));
console.log('\n=== IFRAMES ===');
console.log(info.iframes);
console.log('\n=== FORMS ===');
console.log(info.forms);

await browser.close();
chrome.kill();

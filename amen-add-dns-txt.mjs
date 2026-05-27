import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { USERNAME, PASSWORD } from './scripts/amen-credentials.mjs';

const GOOGLE_TXT = 'google-site-verification=wQG3KvPlRvdfTSKQ-1G7Qb9YcivfzaesDABj7xxwUjA';
const PROFILE_DIR = join('.', 'playwright-profile');

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function waitFor2FA(page) {
  console.log('[!] Vérification d\'identité requise');
  const emailBtn = await page.$('button:has-text("EMAIL")');
  if (emailBtn) {
    console.log('  Clic sur EMAIL');
    await emailBtn.click();
    await sleep(2000);
  }
  console.log('  ▶ Un code a été envoyé à votre email.');  
  console.log('  ▶ Entrez le code dans la fenêtre Chrome ouverte.');
  console.log('  ⏳ Attente...');

  for (let i = 0; i < 300; i++) {
    await sleep(1000);
    const url = page.url();
    if (!url.includes('verify') && !url.includes('aegis')) {
      console.log(`  ✅ Vérifiée ! URL: ${url}`);
      return true;
    }
    if (i % 60 === 0 && i > 0) console.log(`  En attente... (${i / 60} min)`);
  }
  return false;
}

async function addTxtRecord(page) {
  const addBtn = await page.$('a:has-text("Ajouter"), button:has-text("Ajouter"), a:has-text("Nouvel")');
  if (!addBtn) { console.log('  Bouton Ajouter introuvable'); return false; }
  await addBtn.click();
  await sleep(2000);

  const select = await page.$('select');
  if (select) {
    try { await select.selectOption('TXT'); console.log('  Type TXT'); }
    catch { const o = await page.$('select option:has-text("TXT")'); if (o) await o.click(); }
    await sleep(300);
  }

  const input = await page.$('input[type="text"], textarea');
  if (input) { await input.fill(GOOGLE_TXT); console.log('  ✅ Valeur saisie'); }

  const submit = await page.$('button[type="submit"], a:has-text("Valider"), button:has-text("Confirmer")');
  if (submit) { await submit.click(); await sleep(3000); console.log('\n✅✅✅ ENREGISTREMENT DNS TXT AJOUTÉ !'); return true; }
  console.log('  Bouton Valider introuvable');
  return false;
}

async function main() {
  console.log('=== AJOUT ENREGISTREMENT TXT GOOGLE SEARCH CONSOLE ===\n');

  if (!existsSync(PROFILE_DIR)) mkdirSync(PROFILE_DIR, { recursive: true });

  const browser = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    args: ['--no-sandbox'],
    locale: 'fr-FR',
    viewport: { width: 1400, height: 900 },
  });

  const page = browser.pages()[0] || await browser.newPage();

  try {
    // LOGIN
    console.log('[1] Connexion Amen.fr...');
    await page.goto('https://controlpanel.amen.fr/welcome.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(3000);

    const loginField = await page.$('input[name="userName"]');
    if (loginField) {
      await page.fill('input[name="userName"]', USERNAME);
      await page.fill('input[name="password"]', PASSWORD);
      await page.click('button[type="submit"]');
      console.log('  Connexion...');
      await sleep(5000);
    }
    console.log('  OK');

    // DOMAINS
    console.log('[2] Domaine immeit.com...');
    await page.goto('https://controlpanel.amen.fr/firstLevel/view.html?domain=immeit.com', {
      waitUntil: 'domcontentloaded', timeout: 30000
    }).catch(() => {});
    await sleep(5000);

    // Close modal
    const modalClose = await page.$('.modal .close, button.close');
    if (modalClose) { await modalClose.click(); await sleep(1000); }

    // Find and click the DNS zone link
    // On this page, there's a link with href containing "dns" that opens the DNS zone
    console.log('[3] Recherche zone DNS...');
    
    // List all links for debug
    const allLinks = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a'))
        .map(a => ({ text: a.textContent.trim().substring(0, 60), href: a.href, visible: a.offsetParent !== null }))
        .filter(l => l.text || l.href);
    });
    console.log('  Liens DNS:', allLinks.filter(l => /dns/i.test(l.href) || /dns/i.test(l.text)));

    // Try clicking the direct DNS link
    const dnsLink = await page.$('a[href*="dns"]');
    if (dnsLink) {
      console.log('  Clic lien DNS direct');
      await dnsLink.click();
      await sleep(5000);
    }

    // Handle 2FA
    if (page.url().includes('verify') || page.url().includes('aegis')) {
      const ok = await waitFor2FA(page);
      if (!ok) {
        console.log('  Temps écoulé, fenêtre Chrome reste ouverte');
        await page.screenshot({ path: 'amen-2fa.png' });
        return;
      }
    }

    // Add TXT record
    console.log(`[4] Page: ${page.url()}`);
    await sleep(3000);

    await addTxtRecord(page);
    await page.screenshot({ path: 'amen-dns-final.png' });

  } catch (e) {
    console.error('[✗] Erreur:', e.message);
    await page.screenshot({ path: 'amen-error.png' }).catch(() => {});
  }

  console.log('\n✅ Vérifiez dans Google Search Console :');
  console.log('   https://search.google.com/search-console');
}

main();
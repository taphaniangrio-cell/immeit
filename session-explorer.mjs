import https from 'https';
import { writeFileSync } from 'fs';

const USERNAME = '';
const PASSWORD = '';

// Step 1: Login and get session cookies (before they're deleted)
function login() {
  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams({
      userName: USERNAME,
      password: PASSWORD,
      logged: 'on'
    }).toString();

    const options = {
      hostname: 'controlpanel.amen.fr',
      path: '/welcome.html',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    const req = https.request(options, (res) => {
      const setCookies = res.headers['set-cookie'] || [];
      let lastDpsid = null;
      let cpIsLogged = null;

      for (const c of setCookies) {
        const m = c.match(/^dpsid=(?!deleted)([^;]+)/);
        if (m) lastDpsid = m[1];
        const m2 = c.match(/^cpIsLogged=(?!deleted)([^;]+)/);
        if (m2) cpIsLogged = m2[1];
      }

      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ dpsid: lastDpsid, cpIsLogged, location: res.headers.location }));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Step 2: Make authenticated request to specific URL
function authedRequest(hostname, path, dpsid) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      path,
      method: 'GET',
      headers: {
        'Cookie': `dpsid=${dpsid}; cpIsLogged=1LevelLogged; cpLanguage=fra`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({
        statusCode: res.statusCode,
        contentType: res.headers['content-type'],
        location: res.headers.location,
        bodyLength: body.length,
        body,
        loggedIn: body.length > 100 && !body.includes('formLogin') && !body.includes('Connexion')
      }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  console.log('=== LOGIN ===');
  const { dpsid, cpIsLogged } = await login();
  console.log(`dpsid: ${dpsid ? dpsid.substring(0, 40) + '...' : 'N/A'}`);
  console.log(`cpIsLogged: ${cpIsLogged || 'N/A'}`);

  if (!dpsid) {
    console.error('No session cookie received');
    return;
  }

  // Test various URLs with the session cookie
  const paths = [
    // Dashboard URLs
    { host: 'controlpanel.amen.fr', path: '/' },
    { host: 'controlpanel.amen.fr', path: '/dashboard' },
    { host: 'controlpanel.amen.fr', path: '/account' },
    // Domain management URLs
    { host: 'controlpanel.amen.fr', path: '/domains' },
    { host: 'controlpanel.amen.fr', path: '/domain/list' },
    { host: 'controlpanel.amen.fr', path: '/async/domains.html' },
    { host: 'controlpanel.amen.fr', path: '/async/listDomains.html' },
    // Main site URLs (logged-in sections)
    { host: 'www.amen.fr', path: '/domains/' },
    { host: 'www.amen.fr', path: '/client/account.html' },
    { host: 'www.amen.fr', path: '/client/domains.html' },
  ];

  console.log('\n=== TESTING AUTHENTICATED REQUESTS ===');
  for (const { host, path } of paths) {
    const result = await authedRequest(host, path, dpsid);
    const status = result.loggedIn ? 'LOGGED IN' : result.location ? `REDIRECT (${result.location.substring(0, 60)})` : 'LOGIN PAGE';
    console.log(`${host}${path}: ${result.statusCode} (${result.bodyLength}b) -> ${status}`);
    
    if (result.loggedIn) {
      // Save this page
      const filename = `amen-page-${host.replace(/\./g, '-')}${path.replace(/\//g, '-')}.html`;
      writeFileSync(filename, result.body);
      console.log(`  -> Saved to ${filename}`);
      
      // Check for immeit
      if (result.body.includes('immeit')) {
        console.log('  -> *** immeit.com FOUND! ***');
      }
      
      // Check for domain management links
      const links = [...result.body.matchAll(/href="([^"]*domain[^"]*)"/gi)].map(m => m[1]);
      if (links.length > 0) {
        console.log('  -> Domain links found:', links.slice(0, 5));
      }
    }
  }
}

main().catch(console.error);

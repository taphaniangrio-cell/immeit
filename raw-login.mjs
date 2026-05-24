import https from 'https';
import http from 'http';
import { writeFileSync } from 'fs';
import { USERNAME, PASSWORD } from './scripts/amen-credentials.mjs';

// Step 1: Login with raw HTTPS request
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
      console.log(`Status: ${res.statusCode}`);
      console.log(`Location: ${res.headers.location}`);
      
      // Extract ALL set-cookie headers
      const setCookies = res.headers['set-cookie'] || [];
      console.log('Set-Cookie headers:');
      setCookies.forEach((c, i) => console.log(`  [${i}] ${c.substring(0, 80)}...`));
      
      // Find the valid session cookie (before deletion)
      let validDpsid = null;
      let validCpIsLogged = null;
      let csrfToken = null;
      let csrfName = null;
      
      for (const cookie of setCookies) {
        const match = cookie.match(/^dpsid=(?!deleted)([^;]+)/);
        if (match) {
          validDpsid = match[1];
          console.log('Found valid dpsid:', validDpsid);
        }
        const match2 = cookie.match(/^cpIsLogged=(?!deleted)([^;]+)/);
        if (match2) {
          validCpIsLogged = match2[1];
          console.log('Found valid cpIsLogged:', validCpIsLogged);
        }
        const match3 = cookie.match(/^X-CSRF-TOKEN-(\d+)=([^;]+)/);
        if (match3) {
          csrfToken = match3[2];
          csrfName = `X-CSRF-TOKEN-${match3[1]}`;
          console.log(`Found CSRF: ${csrfName}=${csrfToken}`);
        }
      }
      
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          location: res.headers.location,
          setCookies,
          validDpsid,
          validCpIsLogged,
          csrfToken,
          csrfName,
          headers: res.headers
        });
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  const result = await login();
  
  if (result.validDpsid) {
    console.log('\n=== VALID SESSION FOUND! ===');
    
    // Create cookie file with valid session
    const now = Math.floor(Date.now() / 1000) + 86400;
    const lines = [
      '# Netscape HTTP Cookie File',
      `.amen.fr	TRUE	/	TRUE	${now}	dpsid	${result.validDpsid}`,
      `.amen.fr	TRUE	/	FALSE	${now}	cpIsLogged	${result.validCpIsLogged || '1LevelLogged'}`,
      `.amen.fr	TRUE	/	FALSE	${now}	cpLanguage	fra`
    ];
    writeFileSync('amen-raw-cookies.txt', lines.join('\n'), 'utf8');
    console.log('Cookies saved to amen-raw-cookies.txt');
    
    // Also save for curl
    const curlLines = lines.filter(l => !l.startsWith('#'));
    console.log('Cookie content:');
    curlLines.forEach(l => console.log(`  ${l}`));
    
    // Step 2: Use the cookies to access control panel
    console.log('\n=== ACCESSING CONTROL PANEL ===');
    const cpResult = await accessControlPanel(result.validDpsid);
    
    if (cpResult.loggedIn) {
      console.log('SUCCESS - Logged in!');
      console.log('Page title:', cpResult.title);
      
      if (cpResult.body.includes('immeit')) {
        console.log('immeit.com found in page!');
      } else {
        console.log('Searching pages for domain management...');
        // Try domain list
        await accessDomains(result.validDpsid);
      }
    } else {
      console.log('Login page shown - session invalid');
      console.log('Title:', cpResult.title);
    }
  } else {
    console.log('\nNo valid session found in response');
    console.log('All Set-Cookie:', result.setCookies);
  }
}

function accessControlPanel(dpsid) {
  return new Promise((resolve, reject) => {
    const cookie = `dpsid=${dpsid}; cpIsLogged=1LevelLogged; cpLanguage=fra`;
    
    const options = {
      hostname: 'controlpanel.amen.fr',
      path: '/',
      method: 'GET',
      headers: {
        'Cookie': cookie,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          loggedIn: !body.includes('formLogin') && !body.includes('Connexion'),
          title: body.match(/<title>([^<]+)/)?.[1] || 'unknown',
          body
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

function accessDomains(dpsid) {
  return new Promise((resolve, reject) => {
    const cookie = `dpsid=${dpsid}; cpIsLogged=1LevelLogged; cpLanguage=fra`;
    
    const options = {
      hostname: 'www.amen.fr',
      path: '/domains/',
      method: 'GET',
      headers: {
        'Cookie': cookie,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log('Domains page status:', res.statusCode);
        console.log('Domains page length:', body.length);
        if (body.includes('immeit')) {
          console.log('immeit.com FOUND on domains page!');
        } else {
          console.log('immeit NOT found');
          // Save for debugging
          writeFileSync('amen-domains-raw.html', body);
        }
        resolve();
      });
    });

    req.on('error', reject);
    req.end();
  });
}

main().catch(console.error);

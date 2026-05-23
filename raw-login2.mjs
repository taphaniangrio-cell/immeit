import https from 'https';
import { writeFileSync } from 'fs';

const USERNAME = '';
const PASSWORD = '';

function makeRequest(hostname, path, method, cookie, postData) {
  return new Promise((resolve, reject) => {
    const maxRedirects = 5;
    let redirectCount = 0;

    function doRequest(h, p, m, c, data) {
      const options = {
        hostname: h,
        path: p,
        method: m,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      };

      if (c) options.headers['Cookie'] = c;
      if (data) {
        options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        options.headers['Content-Length'] = Buffer.byteLength(data);
      }

      const req = https.request(options, (res) => {
        const location = res.headers.location;

        if ((res.statusCode === 302 || res.statusCode === 301) && location && redirectCount < maxRedirects) {
          redirectCount++;
          // Parse the redirect URL
          const redirectUrl = new URL(location, `https://${h}`);
          console.log(`  Redirect ${redirectCount}: ${res.statusCode} -> ${redirectUrl.href}`);
          
          // Follow redirect with same cookies
          doRequest(redirectUrl.hostname, redirectUrl.pathname + redirectUrl.search, 'GET', c, null);
          return;
        }

        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          resolve({ statusCode: res.statusCode, headers: res.headers, body, redirects: redirectCount });
        });
      });

      req.on('error', reject);
      
      if (data) {
        // Also get the Set-Cookie headers from the response to the login
        // This request will receive it, but we're reading it in the callback above
      }
      
      if (data) req.write(data);
      req.end();
    }

    doRequest(hostname, path, method, cookie, postData);
  });
}

async function main() {
  console.log('=== STEP 1: LOGIN ===');
  
  // Login POST
  const postData = new URLSearchParams({
    userName: USERNAME,
    password: PASSWORD,
    logged: 'on'
  }).toString();

  const loginResult = await makeRequest('controlpanel.amen.fr', '/welcome.html', 'POST', null, postData);
  console.log(`Login status: ${loginResult.statusCode}, body length: ${loginResult.body.length}`);
  console.log('Final URL determined by following redirects');

  // Check if we're logged in
  if (loginResult.body.includes('formLogin') || loginResult.body.includes('Connexion')) {
    console.log('Still on login page');
    
    // Check the redirect path - maybe the login POST itself has useful headers
    // Let me do it differently: capture the raw response with set-cookie
    console.log('\n=== Trying alternative: capture raw login response ===');
    const rawResult = await rawLogin();
    
    if (rawResult.validSession) {
      console.log('Valid session found:', rawResult.dpsid);
      
      // Immediately use it
      console.log('\n=== STEP 2: ACCESS DASHBOARD ===');
      const cookieStr = `dpsid=${rawResult.dpsid}; cpIsLogged=1LevelLogged; cpLanguage=fra`;
      const dashResult = await makeRequest('controlpanel.amen.fr', '/', 'GET', cookieStr, null);
      console.log(`Dashboard status: ${dashResult.statusCode}, body length: ${dashResult.body.length}`);
      
      const loggedIn = !dashResult.body.includes('formLogin') && !dashResult.body.includes('Connexion');
      console.log('Logged in:', loggedIn);
      
      if (loggedIn && dashResult.body.length > 500) {
        // Find title
        const titleMatch = dashResult.body.match(/<title>([^<]+)/);
        console.log('Page title:', titleMatch ? titleMatch[1] : 'not found');
        
        if (dashResult.body.includes('immeit')) {
          console.log('immeit.com FOUND in dashboard!');
        } else {
          console.log('Looking for domain management...');
          // Try domain management URL
          console.log('\n=== STEP 3: ACCESS DOMAINS ===');
          const domainResult = await makeRequest('www.amen.fr', '/domains/', 'GET', cookieStr, null);
          console.log(`Domains status: ${domainResult.statusCode}, length: ${domainResult.body.length}`);
          if (domainResult.body.includes('immeit')) {
            console.log('immeit.com FOUND in domains!');
          } else {
            const domainTitle = domainResult.body.match(/<title>([^<]+)/);
            console.log('Domains page title:', domainTitle ? domainTitle[1] : 'not found');
            writeFileSync('amen-domains-final.html', domainResult.body);
            console.log('Saved to amen-domains-final.html');
          }
        }
      } else {
        console.log('Dashboard response may not be valid');
        writeFileSync('amen-dash-debug.html', dashResult.body);
      }
    } else {
      console.log('No valid session found');
    }
  }
}

function rawLogin() {
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
      
      // Find the LAST valid (non-deleted) dpsid
      let lastValidDpsid = null;
      
      for (const cookie of setCookies) {
        const match = cookie.match(/^dpsid=(?!deleted)([^;]+)/);
        if (match) {
          lastValidDpsid = match[1];
        }
      }
      
      // Consume response body
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          validSession: !!lastValidDpsid,
          dpsid: lastValidDpsid,
          statusCode: res.statusCode,
          setCookies
        });
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

main().catch(console.error);

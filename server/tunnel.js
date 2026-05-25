const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const tunnelUrlFile = path.join(__dirname, '.tunnel-url');

function findCloudflared() {
  const candidates = [
    'cloudflared',
    'C:\\Users\\Moustapha\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Cloudflare.cloudflared_Microsoft.Winget.Source_8wekyb3d8bbwe\\cloudflared.exe',
  ];
  for (const c of candidates) {
    try { if (fs.existsSync(c)) return c; } catch {}
    try { require('child_process').execSync(`where ${c}`, { stdio: 'ignore' }); return c; } catch {}
  }
  return 'cloudflared';
}

async function startTunnel() {
  const bin = findCloudflared();
  console.log('CLOUDFLARED_BIN=' + bin);

  const proc = spawn(bin, ['tunnel', '--url', 'http://localhost:3001'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true
  });

  let urlFound = false;

  proc.stdout.on('data', (data) => {
    const text = data.toString();
    process.stdout.write(text);
    const match = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
    if (match && !urlFound) {
      urlFound = true;
      const url = match[0];
      console.log('TUNNEL_URL=' + url);
      fs.writeFileSync(tunnelUrlFile, url);
    }
  });

  proc.stderr.on('data', (data) => {
    const text = data.toString();
    process.stderr.write(text);
    const match = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
    if (match && !urlFound) {
      urlFound = true;
      const url = match[0];
      console.log('TUNNEL_URL=' + url);
      fs.writeFileSync(tunnelUrlFile, url);
    }
  });

  proc.on('close', (code) => {
    console.log('Tunnel closed with code: ' + code);
    try { fs.unlinkSync(tunnelUrlFile); } catch {}
    process.exit(code || 0);
  });

  proc.on('error', (err) => {
    console.error('Tunnel error: ' + err.message);
    process.exit(1);
  });

  setTimeout(() => {
    if (!urlFound) {
      console.error('Tunnel URL not detected within 15s, restarting...');
      proc.kill();
    }
  }, 15000);
}

startTunnel();

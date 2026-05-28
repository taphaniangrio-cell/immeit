const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const tunnelUrlFile = path.join(__dirname, '.tunnel-url');
const certFile = path.join(os.homedir(), '.cloudflared', 'cert.pem');
const configFile = path.join(__dirname, 'cloudflared.yml');

function hasCert() {
  try { return fs.existsSync(certFile); } catch { return false; }
}

function hasNamedTunnel() {
  try {
    if (!fs.existsSync(configFile)) return false;
    if (!hasCert()) return false;
    const cfg = fs.readFileSync(configFile, 'utf-8');
    const lines = cfg.split('\n').filter(l => !l.trim().startsWith('#')).join('\n');
    return lines.includes('tunnel:') && lines.includes('credentials-file:');
  } catch { return false; }
}

function readTunnelName() {
  try {
    const cfg = fs.readFileSync(configFile, 'utf-8');
    const m = cfg.match(/tunnel:\s*(\S+)/);
    return m ? m[1] : null;
  } catch { return null; }
}

function extractUrl(data) {
  const text = data.toString();
  const m = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
  return m ? m[0] : null;
}

function writeTunnelUrl(url) {
  try {
    fs.writeFileSync(tunnelUrlFile, url);
    console.log('TUNNEL_URL=' + url);
  } catch (err) {
    console.error('Erreur ecriture .tunnel-url:', err.message);
  }
}

function startQuickTunnel() {
  console.log('Demarrage tunnel cloudflared (mode rapide)...');
  const proc = spawn('cloudflared', ['tunnel', '--url', 'http://localhost:3001', '--no-autoupdate'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true
  });

  proc.stdout.on('data', data => {
    process.stdout.write(data);
    const url = extractUrl(data);
    if (url) writeTunnelUrl(url);
  });

  proc.stderr.on('data', data => {
    process.stderr.write(data);
    const url = extractUrl(data);
    if (url) writeTunnelUrl(url);
  });

  proc.on('close', code => {
    console.log(`cloudflared termine (code ${code})`);
    try { fs.unlinkSync(tunnelUrlFile); } catch {}
    setTimeout(startQuickTunnel, 5000);
  });

  proc.on('error', err => {
    console.error('cloudflared error:', err.message);
    setTimeout(startQuickTunnel, 5000);
  });

  return proc;
}

function startNamedTunnel() {
  const name = readTunnelName();
  console.log(`Demarrage tunnel cloudflared (nomme: ${name})...`);
  const proc = spawn('cloudflared', ['tunnel', 'run', name], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true
  });

  proc.stderr.on('data', data => {
    process.stderr.write(data);
    const url = extractUrl(data);
    if (url) writeTunnelUrl(url);
  });

  proc.on('close', code => {
    console.log(`cloudflared tunnel ${name} termine (code ${code})`);
    setTimeout(startNamedTunnel, 5000);
  });

  proc.on('error', err => {
    console.error('cloudflared error:', err.message);
    setTimeout(startNamedTunnel, 5000);
  });

  return proc;
}

if (hasNamedTunnel()) {
  console.log('Mode: tunnel nomme (URL stable)');
  startNamedTunnel();
} else {
  console.log('Mode: tunnel rapide (URL change a chaque demarrage)');
  startQuickTunnel();
}

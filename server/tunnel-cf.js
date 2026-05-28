const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const tunnelUrlFile = path.join(__dirname, '.tunnel-url');

function startTunnel() {
  const proc = spawn('cloudflared', ['tunnel', '--url', 'http://localhost:3001', '--no-autoupdate'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true
  });

  const rl = readline.createInterface({ input: proc.stdout });

  rl.on('line', line => {
    console.log(line);
    const match = line.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
    if (match) {
      const url = match[0];
      console.log('TUNNEL_URL=' + url);
      fs.writeFileSync(tunnelUrlFile, url);
    }
  });

  proc.stderr.on('data', data => {
    process.stderr.write(data);
    const text = data.toString();
    const match = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
    if (match) {
      const url = match[0];
      console.log('TUNNEL_URL=' + url);
      fs.writeFileSync(tunnelUrlFile, url);
    }
  });

  proc.on('close', code => {
    console.log(`cloudflared exited with code ${code}`);
    try { fs.unlinkSync(tunnelUrlFile); } catch {}
    setTimeout(startTunnel, 5000);
  });

  proc.on('error', err => {
    console.error('cloudflared error:', err.message);
    setTimeout(startTunnel, 5000);
  });
}

startTunnel();

const localtunnel = require('localtunnel');
const fs = require('fs');
const path = require('path');

const tunnelUrlFile = path.join(__dirname, '.tunnel-url');

async function startTunnel() {
  try {
    const tunnel = await localtunnel({
      port: 3001,
      subdomain: 'immeit-' + Math.random().toString(36).slice(2, 8)
    });

    const url = tunnel.url;
    console.log('TUNNEL_URL=' + url);
    fs.writeFileSync(tunnelUrlFile, url);

    tunnel.on('close', () => {
      console.log('Tunnel closed');
      try { fs.unlinkSync(tunnelUrlFile); } catch {}
      process.exit(0);
    });

    tunnel.on('error', (err) => {
      console.error('Tunnel error:', err.message);
    });
  } catch (err) {
    console.error('Tunnel failed:', err.message);
    process.exit(1);
  }
}

startTunnel();

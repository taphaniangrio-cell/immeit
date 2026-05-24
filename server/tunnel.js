const lt = require('localtunnel');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const tunnel = await lt({ port: 3001, subdomain: 'immeit-api' });
    const url = tunnel.url;
    console.log('TUNNEL_URL=' + url);
    fs.writeFileSync(path.join(__dirname, '.tunnel-url'), url);
    tunnel.on('close', () => {
      console.log('Tunnel closed');
      fs.unlinkSync(path.join(__dirname, '.tunnel-url'));
    });
  } catch (err) {
    console.error('Tunnel error:', err.message);
  }
})();

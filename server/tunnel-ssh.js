const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const tunnelUrlFile = path.join(__dirname, '.tunnel-url');
const logFile = path.join(__dirname, 'logs', 'tunnel-ssh.log');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  fs.appendFileSync(logFile, line + '\n');
}

function start() {
  const child = spawn('ssh', [
    '-o', 'StrictHostKeyChecking=no',
    '-o', 'ServerAliveInterval=15',
    '-o', 'ServerAliveCountMax=5',
    '-o', 'ExitOnForwardFailure=yes',
    '-o', 'TCPKeepAlive=yes',
    '-R', '80:localhost:3001',
    'nokey@localhost.run'
  ], { stdio: ['pipe', 'pipe', 'pipe'] });

  let buffer = '';

  child.stdout.on('data', (data) => {
    buffer += data.toString();
    log(data.toString().trim());
    const match = buffer.match(/https:\/\/([a-z0-9]+)\.lhr\.life/);
    if (match) {
      const url = 'https://' + match[1] + '.lhr.life';
      fs.writeFileSync(tunnelUrlFile, url);
      log('TUNNEL_URL=' + url);
    }
  });

  child.stderr.on('data', (data) => {
    log('ERR: ' + data.toString().trim());
  });

  child.on('close', (code) => {
    log('SSH exited with code ' + code);
    setTimeout(start, 3000);
  });

  child.on('error', (err) => {
    log('SSH error: ' + err.message);
    setTimeout(start, 3000);
  });
}

start();

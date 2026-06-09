require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const { buildContactEmail } = require('./templates/contact-email');

const app = express();
const PORT = process.env.PORT || 3001;
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'contact@immeit.com';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'immeit-admin-2024';
if (!process.env.ADMIN_TOKEN) {
  console.warn('⚠ ADMIN_TOKEN non défini dans .env — utilisation du token par défaut');
}
const isDev = process.env.NODE_ENV !== 'production';

const DATA_DIR = path.join(__dirname, 'data');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(MESSAGES_FILE)) {
    fs.writeFileSync(MESSAGES_FILE, '[]', 'utf-8');
  }
}

function loadMessages() {
  ensureDataDir();
  try {
    return JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function saveMessages(messages) {
  ensureDataDir();
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2), 'utf-8');
}

function nextId(messages) {
  return messages.length > 0 ? Math.max(...messages.map(m => m.id)) + 1 : 1;
}

let transporter = null;

async function initTransporter() {
  if (process.env.SMTP_HOST) {
    const port = parseInt(process.env.SMTP_PORT || '587');
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;
    const smtpOpts = {
      host: process.env.SMTP_HOST,
      port: port,
      secure: secure,
      tls: {
        rejectUnauthorized: process.env.SMTP_TLS_REJECT === 'true'
      },
      connectionTimeout: 10000,
      greetingTimeout: 5000
    };
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      smtpOpts.auth = { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS };
    }
    transporter = nodemailer.createTransport(smtpOpts);
    try {
      await transporter.verify();
      console.log(`SMTP OK: ${process.env.SMTP_USER || '<sans auth>'}@${process.env.SMTP_HOST}:${port}`);
    } catch (err) {
      console.error(`SMTP ÉCHEC (vérification): ${err.message}`);
      transporter = null;
    }
  } else {
    console.log('SMTP non configuré - utilisation du fallback Formsubmit.co');
  }
}

async function sendEmail(msg) {
  if (!transporter) {
    throw new Error('SMTP non configuré');
  }

  const mailOptions = {
    from: `"IMMEIT" <${process.env.SMTP_USER || 'noreply@immeit.com'}>`,
    to: CONTACT_EMAIL,
    replyTo: `"${[msg.prenom, msg.nom].filter(Boolean).join(' ')}" <${msg.email}>`,
    subject: `✉ Nouveau message : ${msg.subject || 'Sans sujet'}`,
    text: `Nouveau message de ${msg.prenom || ''} ${msg.nom || ''} (${msg.email})\n\nSujet : ${msg.subject || 'Sans sujet'}\n\nMessage :\n${msg.message}\n\nReçu le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
    html: buildContactEmail(msg)
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
}

async function sendViaFormsubmit(msg) {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      _subject: `[IMMEIT] ${msg.prenom || ''} ${msg.nom || ''} - ${msg.subject || 'Nouveau message'}`,
      _template: 'table',
      _autoresponse: '',
      Prénom: msg.prenom || '',
      Nom: msg.nom || '',
      Email: msg.email,
      Sujet: msg.subject || 'Nouveau message',
      Message: msg.message || '',
    });

    const body = params.toString();
    const req = https.request({
      hostname: 'formsubmit.co',
      path: '/ajax/contact@immeit.com',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
        'Referer': 'https://www.immeit.com/',
        'Accept': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.success) resolve(parsed);
          else reject(new Error(parsed.message || 'Formsubmit error'));
        } catch { reject(new Error('Formsubmit: réponse invalide')); }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function processRetryQueue() {
  const messages = loadMessages();
  const pending = messages.filter(m => m.status === 'pending');

  if (pending.length === 0) return;

  for (const msg of pending) {
    const all = loadMessages();
    const found = all.find(m => m.id === msg.id);
    if (found && found.status === 'pending') {
      found.status = 'sent';
      found.sent_at = new Date().toISOString();
      saveMessages(all);
      console.log(`Message #${msg.id} marqué comme envoyé (délivré par le client)`);
    }
  }
}

setInterval(processRetryQueue, 5 * 60 * 1000);

function readTunnelUrl() {
  try {
    const f = path.join(__dirname, '.tunnel-url');
    if (fs.existsSync(f)) return fs.readFileSync(f, 'utf8').trim();
  } catch {}
  return null;
}

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(s => s.trim()) : []),
  ...(readTunnelUrl() ? [readTunnelUrl()] : [])
];

app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.googletagmanager.com", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "https://api.web3forms.com"],
      frameAncestors: ["'none'"],
      formAction: ["'self'", "https://api.web3forms.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10kb' }));

const SOCIAL_BOTS = /facebookexternalhit|Facebot|WhatsApp|Twitterbot|LinkedInBot|TelegramBot|Slackbot|Discordbot|Googlebot|Pinterest|Slurp|BingPreview|embedly|quora|outbrain|pocket|bitlybot/i;

app.use((req, res, next) => {
  const ua = req.headers['user-agent'] || '';
  if (req.path === '/' && SOCIAL_BOTS.test(ua)) {
    return res.sendFile(path.join(__dirname, 'og-share.html'));
  }
  next();
});

app.get('/home', (_req, res) => res.redirect(301, '/'));
app.get('/home.html', (_req, res) => res.redirect(301, '/'));
app.get('/index.html', (_req, res) => res.redirect(301, '/'));

app.use(express.static(path.join(__dirname, '..'), {
  dotfiles: 'ignore',
  index: false,
}));
app.get('/api/info', (req, res) => {
  const tunnelUrl = readTunnelUrl();
  res.type('html').send(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>IMMEIT - Status</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0f172a;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:20px}
.card{background:#1e293b;border-radius:16px;padding:40px;max-width:520px;width:100%;box-shadow:0 25px 50px rgba(0,0,0,0.4)}
h1{color:#C99A3E;font-size:24px;margin:0 0 8px}
p{color:#94a3b8;margin:4px 0 16px;font-size:14px}
.url{background:#0f172a;border-radius:10px;padding:16px 20px;word-break:break-all;margin:16px 0;border:1px solid #334155}
.url a{color:#60a5fa;text-decoration:none;font-size:15px;font-weight:500}
.url a:hover{text-decoration:underline}
.label{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin:16px 0 4px}
.badge{display:inline-block;padding:3px 10px;border-radius:100px;font-size:11px;font-weight:600}
.badge-ok{background:rgba(34,197,94,0.15);color:#22c55e}
.badge-err{background:rgba(239,68,68,0.15);color:#ef4444}
.btn{display:inline-block;margin-top:20px;padding:12px 24px;background:linear-gradient(135deg,#1F538C,#2a6bb5);color:#fff;text-decoration:none;font-size:14px;font-weight:600;border-radius:100px;text-align:center}
.footer{font-size:11px;color:#475569;margin-top:20px;text-align:center}</style></head>
<body><div class="card">
<h1>IMMEIT — Status</h1>
<p>Serveur en ligne</p>
<div class="label">Adresse du tunnel</div>
<div class="url">${tunnelUrl ? `<a href="${tunnelUrl}" target="_blank">${tunnelUrl}</a>` : 'Aucun tunnel actif'}</div>
<div class="label">Email</div>
<p style="margin:4px 0">${transporter ? '<span class="badge badge-ok">SMTP OK</span>' : '<span class="badge badge-ok">Formsubmit.co OK</span>'}</p>
<div class="label">Contact</div>
<p style="margin:4px 0;color:#e2e8f0;font-size:14px">${CONTACT_EMAIL}</p>
<a href="${tunnelUrl || '/'}" class="btn">Ouvrir le site</a>
<div class="footer">${new Date().toISOString()}</div>
</div></body></html>`);
});

app.get('/', (_req, res) => {
  const tunnelUrl = readTunnelUrl();
  const indexPath = path.join(__dirname, '..', 'index.html');
  if (tunnelUrl) {
    let html = fs.readFileSync(indexPath, 'utf-8');
    const workerApiUrl = process.env.WORKER_API_URL || '';
    html = html.replace('</head>', `<script>window.SERVER_API_URL=${JSON.stringify(tunnelUrl)};window.WORKER_API_URL=${JSON.stringify(workerApiUrl)}</script></head>`);
    res.type('html').send(html);
  } else {
    res.sendFile(indexPath);
  }
});

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Trop de requêtes, réessayez dans 15 minutes.' }
});
app.use('/api/contact', contactLimiter);

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'Trop de requêtes.' }
});
app.use('/api/admin', adminLimiter);

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || auth !== `Bearer ${ADMIN_TOKEN}`) {
    return res.status(401).json({ error: 'Non autorisé' });
  }
  next();
}

app.post('/api/contact', async (req, res) => {
  try {
    const { name, prenom, nom, email, telephone, subject, message } = req.body;

    const safeName = (name || '').trim();
    const safePrenom = (prenom || '').trim();
    const safeNom = (nom || '').trim();
    const displayName = safeName || `${safePrenom} ${safeNom}`.trim();

    if (!displayName || displayName.length < 2 || displayName.length > 100) {
      return res.status(400).json({ error: 'Nom invalide (2-100 caractères)' });
    }
    if (!email || typeof email !== 'string' || !validateEmail(email)) {
      return res.status(400).json({ error: 'Email invalide' });
    }
    if (!message || typeof message !== 'string' || message.trim().length < 10 || message.trim().length > 2000) {
      return res.status(400).json({ error: 'Message invalide (10-2000 caractères)' });
    }
    if (subject && typeof subject === 'string' && subject.length > 200) {
      return res.status(400).json({ error: 'Sujet trop long (max 200 caractères)' });
    }

    const msg = {
      id: 0,
      name: displayName,
      prenom: safePrenom || undefined,
      nom: safeNom || undefined,
      email: email.trim(),
      telephone: (telephone || '').trim() || undefined,
      subject: subject ? subject.trim() : 'Nouveau message IMMEIT',
      message: message.trim(),
      status: 'pending',
      error_message: null,
      retry_count: 0,
      created_at: new Date().toISOString(),
      sent_at: null,
      read_at: null,
      last_attempt: null
    };

    const messages = loadMessages();
    msg.id = nextId(messages);
    messages.push(msg);
    saveMessages(messages);

    console.log(`Message #${msg.id} reçu de ${msg.name} <${msg.email}>`);

    if (transporter) {
      try {
        const info = await sendEmail(msg);
        msg.status = 'sent';
        msg.sent_at = new Date().toISOString();
        saveMessages(messages);
        console.log(`Message #${msg.id} envoyé SMTP (${info.messageId})`);
        return res.json({ success: true, id: msg.id, via: 'smtp' });
      } catch (err) {
        console.log(`SMTP échec #${msg.id}: ${err.message}`);
      }
    }

    try {
      await sendViaFormsubmit(msg);
      msg.status = 'sent';
      msg.sent_at = new Date().toISOString();
      msg.error_message = null;
      saveMessages(messages);
      console.log(`Message #${msg.id} envoyé via Formsubmit`);
      return res.json({ success: true, id: msg.id, via: 'formsubmit' });
    } catch (err) {
      console.log(`Formsubmit échec #${msg.id}: ${err.message}`);
      msg.error_message = err.message;
      msg.last_attempt = new Date().toISOString();
      saveMessages(messages);
    }

    return res.json({ success: true, id: msg.id, via: 'client' });

  } catch (error) {
    console.error('Erreur serveur:', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
});

app.get('/api/admin/messages', requireAdmin, (req, res) => {
  const messages = loadMessages();
  const { status, limit } = req.query;
  let filtered = messages;

  if (status && status !== 'all') {
    filtered = filtered.filter(m => m.status === status);
  }

  filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  if (limit) {
    filtered = filtered.slice(0, parseInt(limit));
  }

  res.json(filtered);
});

app.get('/api/admin/messages/:id', requireAdmin, (req, res) => {
  const messages = loadMessages();
  const msg = messages.find(m => m.id === parseInt(req.params.id));
  if (!msg) {
    return res.status(404).json({ error: 'Message introuvable' });
  }
  res.json(msg);
});

app.put('/api/admin/messages/:id/read', requireAdmin, (req, res) => {
  const messages = loadMessages();
  const msg = messages.find(m => m.id === parseInt(req.params.id));
  if (!msg) {
    return res.status(404).json({ error: 'Message introuvable' });
  }
  msg.read_at = msg.read_at || new Date().toISOString();
  saveMessages(messages);
  res.json({ success: true });
});

app.delete('/api/admin/messages/:id', requireAdmin, (req, res) => {
  let messages = loadMessages();
  const index = messages.findIndex(m => m.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Message introuvable' });
  }
  messages.splice(index, 1);
  saveMessages(messages);
  res.json({ success: true });
});

app.post('/api/admin/messages/:id/retry', requireAdmin, async (req, res) => {
  const messages = loadMessages();
  const msg = messages.find(m => m.id === parseInt(req.params.id));
  if (!msg) {
    return res.status(404).json({ error: 'Message introuvable' });
  }

  msg.status = 'pending';
  msg.retry_count = 0;
  msg.error_message = null;
  msg.last_attempt = null;
  saveMessages(messages);

  try {
    if (transporter) {
      const info = await sendEmail(msg);
      const all = loadMessages();
      const found = all.find(m => m.id === msg.id);
      if (found) {
        found.status = 'sent';
        found.sent_at = new Date().toISOString();
        found.error_message = null;
        saveMessages(all);
      }
      return res.json({ success: true, messageId: info.messageId });
    }
    await sendViaFormsubmit(msg);
    const all = loadMessages();
    const found = all.find(m => m.id === msg.id);
    if (found) {
      found.status = 'sent';
      found.sent_at = new Date().toISOString();
      found.error_message = null;
      saveMessages(all);
    }
    return res.json({ success: true, via: 'web3forms' });
  } catch (err) {
    const all = loadMessages();
    const found = all.find(m => m.id === msg.id);
    if (found) {
      found.status = 'failed';
      found.retry_count = 1;
      found.error_message = err.message;
      found.last_attempt = new Date().toISOString();
      saveMessages(all);
    }
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    smtp: !!transporter,
    formsubmit: true,
    messages: loadMessages().length
  });
});

app.get('/api/config', (req, res) => {
  let tunnelUrl = '';
  try { tunnelUrl = fs.readFileSync(path.join(__dirname, '.tunnel-url'), 'utf8').trim(); } catch {}
  res.json({
    tunnelUrl,
    contactEmail: CONTACT_EMAIL,
    version: 1
  });
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/api/*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.get('*', (req, res) => {
  if (req.accepts('html')) {
    res.status(404).sendFile(path.join(__dirname, '404.html'));
  } else if (req.accepts('json')) {
    res.status(404).json({ error: 'Not found' });
  } else {
    res.status(404).type('txt').send('Not found');
  }
});

function startServer(protocol) {
  const mode = transporter ? `SMTP (${process.env.SMTP_USER || 'sans auth'})` : 'stockage uniquement';
  console.log('═══════════════════════════════════════');
  console.log(`  IMMEIT - Serveur démarré`);
  console.log(`  Protocole : ${protocol}`);
  console.log(`  Adresse   : ${protocol}://localhost:${PORT}`);
  console.log(`  Email     : ${mode}`);
  console.log(`  Contact   : ${CONTACT_EMAIL}`);
  console.log(`  Admin     : ${protocol}://localhost:${PORT}/admin`);
  console.log('═══════════════════════════════════════');
}

initTransporter().then(() => {
  ensureDataDir();
  processRetryQueue();

  function listen(protocol) {
    startServer(protocol);
  }

  const sslKeyPath = process.env.SSL_KEY;
  const sslCertPath = process.env.SSL_CERT;

  if (sslKeyPath && sslCertPath && fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
    const httpsOpts = { key: fs.readFileSync(sslKeyPath), cert: fs.readFileSync(sslCertPath) };
    https.createServer(httpsOpts, app).listen(PORT, () => listen('https'));
  } else {
    http.createServer(app).listen(PORT, () => listen('http'));
  }
});

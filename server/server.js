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

const app = express();
const PORT = process.env.PORT || 3001;
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'demandes-p2m@immeit.com';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
if (!ADMIN_TOKEN) {
  console.error('ERREUR: ADMIN_TOKEN non défini dans .env');
  process.exit(1);
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
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    const port = parseInt(process.env.SMTP_PORT || '587');
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: port,
      secure: secure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: process.env.SMTP_TLS_REJECT === 'true'
      },
      connectionTimeout: 10000,
      greetingTimeout: 5000
    });
    console.log(`SMTP configuré: ${process.env.SMTP_USER}@${process.env.SMTP_HOST}:${port}`);
  } else {
    console.log('SMTP non configuré - les messages seront stockés sans envoi');
  }
}

async function sendEmail(msg) {
  if (!transporter) {
    throw new Error('SMTP non configuré');
  }

  const mailOptions = {
    from: `"IMMEIT Contact" <${CONTACT_EMAIL}>`,
    to: CONTACT_EMAIL,
    replyTo: msg.email,
    subject: msg.subject
      ? `${msg.subject} - Site IMMEIT`
      : 'Nouveau message depuis le site IMMEIT',
    text: `Nom : ${msg.name}\nEmail : ${msg.email}\n\nMessage :\n${msg.message}`,
    html: [
      '<!DOCTYPE html>',
      '<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
      '<style>',
        'body{margin:0;padding:0;background-color:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}',
        '.wrapper{background-color:#f0f2f5;padding:32px 16px}',
        '.container{max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)}',
        '.header{background:#0f172a;padding:24px 32px}',
        '.header-logo{display:flex;align-items:center;gap:10px}',
        '.header-logo span{color:#C99A3E;font-size:18px;font-weight:700;letter-spacing:-0.3px}',
        '.header-badge{background:rgba(201,154,62,0.15);color:#C99A3E;padding:2px 12px;border-radius:12px;font-size:11px;font-weight:600;margin-left:auto}',
        '.subject-bar{background:#f8fafc;padding:16px 32px;border-bottom:1px solid #e8eaed}',
        '.subject-bar h2{margin:0;font-size:16px;font-weight:600;color:#202124}',
        '.meta{padding:20px 32px;border-bottom:1px solid #e8eaed}',
        '.meta-flex{display:flex;align-items:flex-start;gap:14px}',
        '.avatar{width:44px;height:44px;min-width:44px;border-radius:50%;background:linear-gradient(135deg,#C99A3E,#d4a843);display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:700;color:#fff}',
        '.meta-info{flex:1;min-width:0}',
        '.meta-name{font-size:15px;font-weight:600;color:#202124}',
        '.meta-email{font-size:13px;color:#5f6368}',
        '.meta-email a{color:#1a73e8;text-decoration:none}',
        '.meta-email a:hover{text-decoration:underline}',
        '.meta-date{font-size:12px;color:#5f6368;white-space:nowrap;margin-top:2px}',
        '.body{padding:24px 32px 20px}',
        '.body-label{font-size:11px;font-weight:600;color:#5f6368;text-transform:uppercase;letter-spacing:0.8px;margin:0 0 12px}',
        '.body-text{margin:0;font-size:15px;color:#3c4043;line-height:1.7;white-space:pre-wrap}',
        '.footer{background:#f8fafc;padding:16px 32px;text-align:center;border-top:1px solid #e8eaed}',
        '.footer-brand{font-size:13px;font-weight:600;color:#0f172a;margin:0 0 2px}',
        '.footer-brand span{color:#C99A3E}',
        '.footer-text{font-size:11px;color:#5f6368;margin:0}',
        '.footer-text a{color:#C99A3E;text-decoration:none}',
        '.btn-reply{display:inline-block;margin-top:8px;padding:8px 20px;background:#1a73e8;color:#fff !important;text-decoration:none;font-size:13px;font-weight:600;border-radius:6px}',
        '@media(max-width:480px){.wrapper{padding:16px 8px}.header{padding:20px 20px}.subject-bar,.meta,.body,.footer{padding-left:20px;padding-right:20px}}',
      '</style></head><body>',
      '<div class="wrapper">',
        '<div class="container">',
          '<div class="header">',
            '<div class="header-logo">',
              '<span>IMMEIT</span>',
              '<span class="header-badge">NOUVEAU CONTACT</span>',
            '</div>',
          '</div>',
          '<div class="subject-bar"><h2>', escapeHtml(msg.subject), '</h2></div>',
          '<div class="meta">',
            '<div class="meta-flex">',
              '<div class="avatar">', escapeHtml(msg.name.charAt(0).toUpperCase()), '</div>',
              '<div class="meta-info">',
                '<div class="meta-name">', escapeHtml(msg.name), '</div>',
                '<div class="meta-email"><a href="mailto:', escapeHtml(msg.email), '">', escapeHtml(msg.email), '</a></div>',
              '</div>',
              '<div class="meta-date">', new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }), '</div>',
            '</div>',
          '</div>',
          '<div class="body">',
            '<p class="body-label">Message</p>',
            '<p class="body-text">', escapeHtml(msg.message), '</p>',
          '</div>',
          '<div class="footer">',
            '<p class="footer-brand">IMMEIT <span>—</span> Installation, Méthodes &amp; Maintenance</p>',
            '<p class="footer-text">Ce message a été envoyé depuis le formulaire de contact du site <a href="https://immeit.com">immeit.com</a></p>',
            '<a href="mailto:', escapeHtml(msg.email), '?subject=Re%3A%20', encodeURIComponent(msg.subject), '" class="btn-reply">R&eacute;pondre &agrave; ', escapeHtml(msg.name), '</a>',
          '</div>',
        '</div>',
      '</div>',
      '</body></html>'
    ].join('')
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
}

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function processRetryQueue() {
  const messages = loadMessages();
  const pending = messages.filter(m => m.status === 'failed' && m.retry_count < 3);

  if (pending.length === 0) return;

  console.log(`File d'attente: tentative de renvoi de ${pending.length} message(s)...`);

  for (const msg of pending) {
    if (!transporter) continue;

    try {
      await sendEmail(msg);
      const all = loadMessages();
      const found = all.find(m => m.id === msg.id);
      if (found) {
        found.status = 'sent';
        found.sent_at = new Date().toISOString();
        found.error_message = null;
        found.last_attempt = null;
        saveMessages(all);
        console.log(`Message #${msg.id} renvoyé avec succès`);
      }
    } catch (err) {
      const all = loadMessages();
      const found = all.find(m => m.id === msg.id);
      if (found) {
        found.retry_count = (found.retry_count || 0) + 1;
        found.error_message = err.message;
        found.last_attempt = new Date().toISOString();
        if (found.retry_count >= 3) {
          found.status = 'failed_permanent';
          console.log(`Message #${msg.id} abandonné après 3 tentatives`);
        } else {
          console.log(`Échec renvoi #${msg.id} (tentative ${found.retry_count}/3)`);
        }
        saveMessages(all);
      }
    }
  }
}

setInterval(processRetryQueue, 5 * 60 * 1000);

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(s => s.trim()) : [])
];

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.googletagmanager.com", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
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

app.use(express.static(path.join(__dirname, '..'), {
  dotfiles: 'ignore',
  index: false,
}));
app.get('/', (_req, res) => res.sendFile(path.join(__dirname, '..', 'index.html')));

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
    const { name, prenom, nom, email, subject, message } = req.body;

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
        return res.json({ success: true, id: msg.id });
      } catch (err) {
        msg.status = 'failed';
        msg.error_message = err.message;
        msg.last_attempt = new Date().toISOString();
        saveMessages(messages);
        console.log(`Message #${msg.id} échec SMTP: ${err.message}`);
        return res.json({
          success: true,
          stored: true,
          id: msg.id,
          warning: "Message sauvegardé. L'envoi email sera réessayé automatiquement."
        });
      }
    }

    return res.json({
      success: true,
      stored: true,
      id: msg.id,
      warning: 'Message sauvegardé (SMTP non configuré)'
    });

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

  if (!transporter) {
    return res.status(400).json({ error: 'SMTP non configuré' });
  }

  try {
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
    messages: loadMessages().length
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

function startServer(protocol, server) {
  const mode = transporter ? `SMTP (${process.env.SMTP_USER})` : 'Stockage local seulement';
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

  const sslKeyPath = process.env.SSL_KEY;
  const sslCertPath = process.env.SSL_CERT;

  if (sslKeyPath && sslCertPath && fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
    const options = {
      key: fs.readFileSync(sslKeyPath),
      cert: fs.readFileSync(sslCertPath),
    };
    https.createServer(options, app).listen(PORT, () => startServer('https', 'HTTPS'));
  } else {
    http.createServer(app).listen(PORT, () => startServer('http', 'HTTP'));
  }
});

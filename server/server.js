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
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1a365d 100%); padding: 28px 32px; text-align: center;">
          <div style="width: 52px; height: 52px; background: linear-gradient(135deg, #C99A3E, #d4a843); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 8px;">
            <span style="color: white; font-size: 22px; font-weight: 700;">${escapeHtml(msg.name.charAt(0).toUpperCase())}</span>
          </div>
          <h1 style="color: #C99A3E; margin: 0 0 4px; font-size: 20px; font-weight: 700;">Nouveau message</h1>
          <p style="color: rgba(255,255,255,0.6); margin: 0; font-size: 13px;">provenant du site IMMEIT</p>
        </div>
        <div style="padding: 28px 32px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 12px 8px 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; width: 80px; vertical-align: top;">Nom</td>
              <td style="padding: 8px 0; font-size: 15px; color: #1e293b; font-weight: 600;">${escapeHtml(msg.name)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px 8px 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; width: 80px; vertical-align: top;">Email</td>
              <td style="padding: 8px 0; font-size: 14px; color: #1F538C;"><a href="mailto:${escapeHtml(msg.email)}" style="color: #1F538C; text-decoration: none; font-weight: 500;">${escapeHtml(msg.email)}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 12px 8px 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; width: 80px; vertical-align: top;">Sujet</td>
              <td style="padding: 8px 0; font-size: 14px; color: #1e293b;">${escapeHtml(msg.subject)}</td>
            </tr>
          </table>
          <div style="margin-top: 20px; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
            <p style="margin: 0 0 10px; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Message</p>
            <p style="margin: 0; font-size: 14px; color: #334155; line-height: 1.8; white-space: pre-wrap;">${escapeHtml(msg.message)}</p>
          </div>
        </div>
        <div style="background: #f8fafc; padding: 16px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 12px; color: #94a3b8;">IMMEIT — Installation, Méthodes, Maintenance</p>
          <p style="margin: 4px 0 0; font-size: 11px; color: #cbd5e1;">Ce message a été envoyé depuis le formulaire de contact du site <a href="https://immeit.com" style="color: #C99A3E; text-decoration: none;">immeit.com</a></p>
        </div>
      </div>
    `
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
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.googletagmanager.com", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "https://formsubmit.co"],
      frameAncestors: ["'none'"],
      formAction: ["'self'", "https://formsubmit.co"],
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

app.use(express.static(path.join(__dirname, '..'), {
  dotfiles: 'ignore',
  index: false,
}));
app.get('/', (_req, res) => res.sendFile(path.join(__dirname, '..', 'index.html')));

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
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

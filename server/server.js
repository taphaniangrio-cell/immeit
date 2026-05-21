require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3001;

const path = require('path');

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:8080',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

app.use(express.static(path.join(__dirname, '..')));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Trop de requêtes, réessayez dans 15 minutes.' }
});
app.use('/api/contact', limiter);

let transporter;

async function initTransporter() {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    console.log('SMTP configuré avec', process.env.SMTP_USER);
  } else if (process.env.SMTP_HOST && !process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: false,
      ignoreTLS: true
    });
    console.log('SMTP sans auth sur', process.env.SMTP_HOST + ':' + process.env.SMTP_PORT);
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    console.log('🔧 Mode test Ethereal activé');
    console.log('   Les emails sont visibles sur https://ethereal.email');
  }
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || name.trim().length < 2 || name.trim().length > 100) {
      return res.status(400).json({ error: 'Nom invalide (2-100 caractères)' });
    }
    if (!email || !validateEmail(email)) {
      return res.status(400).json({ error: 'Email invalide' });
    }
    if (!message || message.trim().length < 10 || message.trim().length > 2000) {
      return res.status(400).json({ error: 'Message invalide (10-2000 caractères)' });
    }
    if (subject && subject.length > 200) {
      return res.status(400).json({ error: 'Sujet trop long (max 200 caractères)' });
    }

    const mailOptions = {
      from: `"${name}" <${email}>`,
      to: process.env.CONTACT_EMAIL || 'demandes-p2m@immeit.com',
      replyTo: email,
      subject: subject ? `${subject} - Site IMMEIT` : 'Nouveau message depuis le site IMMEIT',
      text: `Nom : ${name}\nEmail : ${email}\n\nMessage :\n${message}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9fafb; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 24px; padding: 16px; background: linear-gradient(135deg, #1F538C, #0A2540); border-radius: 8px;">
            <h1 style="color: #C99A3E; margin: 0; font-size: 20px;">IMMEIT</h1>
            <p style="color: white; margin: 4px 0 0; font-size: 12px; opacity: 0.8;">Nouveau message de contact</p>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px; width: 80px;">Nom</td><td style="padding: 8px 0; font-size: 14px; color: #111827; font-weight: 600;">${name}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Email</td><td style="padding: 8px 0; font-size: 14px; color: #1F538C;"><a href="mailto:${email}" style="color: #1F538C;">${email}</a></td></tr>
            ${subject ? `<tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Sujet</td><td style="padding: 8px 0; font-size: 14px; color: #111827;">${subject}</td></tr>` : ''}
          </table>
          <div style="margin-top: 16px; padding: 16px; background: white; border: 1px solid #e5e7eb; border-radius: 6px;">
            <p style="margin: 0 0 8px; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">Message</p>
            <p style="margin: 0; font-size: 14px; color: #111827; line-height: 1.6; white-space: pre-wrap;">${message}</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);

    const previewUrl = nodemailer.getTestMessageUrl(info);

    if (previewUrl) {
      console.log('Email envoyé — preview:', previewUrl);
    } else {
      console.log('Email envoyé:', info.messageId);
    }

    res.json({ success: true, previewUrl });
  } catch (error) {
    console.error('Erreur d\'envoi:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi du message. Veuillez réessayer.' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

initTransporter().then(() => {
  app.listen(PORT, () => {
    const mode = process.env.SMTP_USER ? 'SMTP (' + process.env.SMTP_USER + ')' :
                 process.env.SMTP_HOST ? 'SMTP direct (' + process.env.SMTP_HOST + ':' + process.env.SMTP_PORT + ')' :
                 'Ethereal (test)';
    console.log(`Serveur IMMEIT démarré sur http://localhost:${PORT}`);
    console.log(` Mode email : ${mode}`);
    console.log(` Recevant : ${process.env.CONTACT_EMAIL || 'demandes-p2m@immeit.com'}`);
  });
});

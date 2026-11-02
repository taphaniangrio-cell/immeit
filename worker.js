/**
 * IMMEIT — Worker du formulaire de contact
 * ------------------------------------------------------------------
 * Expose POST /api/contact et envoie le message par la boîte mail AMEN (SMTP),
 * avec le modèle de mail de l'ancien send_mail.php.
 *
 * Secret (wrangler secret put) : MAILBOX_PASSWORD
 * Variables (wrangler.jsonc)   : SMTP_USER, MAIL_TO, MAIL_FROM_NAME
 * Liaison (wrangler.jsonc)     : LIMITEUR, limite d'envois par adresse IP
 *
 * En cas d'échec l'API répond une erreur : le site bascule alors sur Web3Forms,
 * puis sur son repli mailto:.
 */

import { connect } from 'cloudflare:sockets';
import { LOGO_JPEG_BASE64 } from './logo.js';

const LOGO_CID = 'logo@immeit.com';
const ALLOWED_ORIGINS = ['https://www.immeit.com', 'https://immeit.com'];
const MAX_BODY_BYTES = 20000;
const SMTP_HOST = 'smtp-fr.securemail.pro';
const SMTP_PORT = 465;
const SMTP_TIMEOUT_MS = 10000;

// Exclut aussi les caractères qui casseraient le lien mailto: du mail
const EMAIL_PATTERN = /^[^\s@<>"'(),;:\\[\]?&]+@[^\s@<>"'(),;:\\[\]?&]+\.[^\s@<>"'(),;:\\[\]?&.]+$/;

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

function json(payload, status, origin) {
  const cors = ALLOWED_ORIGINS.includes(origin) ? corsHeaders(origin) : {};
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...cors },
  });
}

/** Échappe les valeurs injectées dans le corps HTML du mail. */
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/** Champ sur une seule ligne : rien ne doit pouvoir s'ajouter à l'objet du mail. */
function singleLine(value, max) {
  return String(value ?? '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, max);
}

/** Valide et normalise la charge utile du formulaire. */
function parseForm(raw) {
  const d = raw || {};
  const prenom    = singleLine(d.prenom, 100);
  const nom       = singleLine(d.nom, 100);
  const email     = singleLine(d.email, 200);
  const telephone = singleLine(d.telephone, 40);
  const sujet     = singleLine(d.sujet, 200) || 'Nouveau message';
  const message   = String(d.message ?? '').trim().slice(0, 5000);

  const errors = [];
  if (!prenom) errors.push('Le prénom est requis.');
  if (!nom) errors.push('Le nom est requis.');
  // Adresse en ASCII : elle part telle quelle dans l'en-tête Reply-To
  if (!EMAIL_PATTERN.test(email) || /[^\x21-\x7e]/.test(email)) errors.push('Adresse e-mail invalide.');
  if (!message) errors.push('Le message est requis.');

  return { errors, data: { prenom, nom, email, telephone, sujet, message } };
}

/** Date au format de l'ancien mail, à l'heure de Dakar. */
function formatDate(date) {
  const parts = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Africa/Dakar',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  const p = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${p.day}/${p.month}/${p.year} à ${p.hour}:${p.minute}`;
}

function buildSubject(d) {
  return `[IMMEIT - Demande] ${d.sujet} — ${d.prenom} ${d.nom}`;
}

function infoRow(label, valueHtml, first) {
  const top = first ? '0' : '8px';
  return `<tr>
                <td class="info-label" width="36%" valign="top" style="padding:${top} 8px 0 0;font-size:11px;font-weight:700;color:#6b7a90;text-transform:uppercase;letter-spacing:0.8px;">${label}</td>
                <td valign="top" style="padding:${top} 0 0 0;font-size:14px;color:#111927;font-weight:600;word-break:break-word;">${valueHtml}</td>
              </tr>`;
}

/**
 * Reprend la mise en page de l'ancien mail, en tableaux et styles en ligne
 * pour qu'elle tienne dans Gmail, Outlook et les messageries web.
 */
function buildHtml(d, date) {
  const link = 'color:#1e3a5f;text-decoration:none;';
  const email = escapeHtml(d.email);
  const prenom = escapeHtml(d.prenom);
  const replyHref = `mailto:${email}?subject=${escapeHtml(encodeURIComponent(`Re: ${d.sujet}`))}`;
  const phoneHref = escapeHtml(d.telephone.replace(/[^\d+]/g, ''));

  const rows = [
    infoRow('Nom', `${prenom} ${escapeHtml(d.nom)}`, true),
    infoRow('Email', `<a href="mailto:${email}" style="${link}">${email}</a>`),
    ...(d.telephone ? [infoRow('Téléphone', `<a href="tel:${phoneHref}" style="${link}">${escapeHtml(d.telephone)}</a>`)] : []),
    infoRow('Sujet', escapeHtml(d.sujet)),
  ].join('\n              ');

  const messageHtml = escapeHtml(d.message).replace(/\r\n?|\n/g, '<br>');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nouveau message – IMMEIT</title>
  <style>
    @media (max-width: 480px) {
      .outer { padding: 16px 8px !important; }
      .pad { padding-left: 20px !important; padding-right: 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0f2f5;">
    <tr>
      <td class="outer" align="center" style="padding:40px 12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:620px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

          <!-- En-tête -->
          <tr>
            <td class="pad" align="center" style="background-color:#111927;background-image:linear-gradient(135deg,#111927 0%,#1e3a5f 100%);padding:36px 40px 28px 40px;">
              <img src="cid:${LOGO_CID}" width="96" height="96" alt="Logo IMMEIT" style="display:block;width:96px;height:96px;margin:0 auto 14px auto;border:0;border-radius:50%;background-color:#ffffff;">
              <div style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:3px;text-transform:uppercase;">IMMEIT</div>
              <div style="font-size:11px;color:#8fa8c8;letter-spacing:1.5px;text-transform:uppercase;margin-top:6px;line-height:1.6;">Installation, Méthodes et Maintenance des Équipements Industriels et Tertiaires</div>
              <div style="display:inline-block;margin-top:16px;background-color:#e8a000;color:#111927;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:5px 14px;border-radius:20px;">📩 Nouveau message reçu</div>
            </td>
          </tr>

          <!-- Corps -->
          <tr>
            <td class="pad" style="padding:36px 40px;">
              <p style="font-size:20px;font-weight:700;color:#111927;margin:0 0 6px 0;">Un visiteur vous a contacté</p>
              <p style="font-size:13px;color:#6b7a90;margin:0 0 28px 0;">Message reçu le ${escapeHtml(formatDate(date))} depuis le formulaire de contact.</p>

              <!-- Infos expéditeur -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
                <tr>
                  <td style="background-color:#f8f9fb;border-left:4px solid #e8a000;border-radius:0 8px 8px 0;padding:16px 20px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              ${rows}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Message -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background-color:#f8f9fb;border-radius:8px;padding:20px 24px;">
                    <div style="font-size:11px;font-weight:700;color:#6b7a90;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:10px;">💬 Message</div>
                    <div style="font-size:14px;color:#2c3e50;line-height:1.75;word-break:break-word;">${messageHtml}</div>
                  </td>
                </tr>
              </table>

              <!-- Répondre -->
              <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 28px auto;">
                <tr>
                  <td align="center" style="background-color:#111927;background-image:linear-gradient(135deg,#111927 0%,#1e3a5f 100%);border-radius:8px;">
                    <a href="${replyHref}" style="display:inline-block;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:0.5px;padding:13px 32px;">Répondre à ${prenom}</a>
                  </td>
                </tr>
              </table>

              <hr style="border:none;border-top:1px solid #e8ecf0;margin:0 0 24px 0;">

              <p style="font-size:12px;color:#9aa5b4;text-align:center;margin:0;">
                Ce message a été envoyé depuis le formulaire de contact de
                <a href="https://www.immeit.com" style="color:#1e3a5f;">www.immeit.com</a>
              </p>
            </td>
          </tr>

          <!-- Pied -->
          <tr>
            <td class="pad" align="center" style="background-color:#111927;padding:24px 40px;">
              <div style="font-size:14px;font-weight:800;color:#ffffff;letter-spacing:2px;">IMMEIT</div>
              <div style="font-size:11px;color:#6b7a90;margin-top:6px;line-height:1.6;">
                Cité Safco Niacoulrab, Villa N°40, Keur Massar — Dakar, Sénégal<br>
                +221 71 033 88 09 &nbsp;|&nbsp; +33 7 54 01 19 45
              </div>
              <div style="font-size:10px;color:#3d4f63;margin-top:12px;">© ${date.getUTCFullYear()} IMMEIT — Tous droits réservés</div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Version texte, pour les messageries qui n'affichent pas le HTML. */
function buildText(d, date) {
  return [
    `Message reçu le ${formatDate(date)} depuis le formulaire de contact de www.immeit.com`,
    '',
    `Nom : ${d.prenom} ${d.nom}`,
    `Email : ${d.email}`,
    ...(d.telephone ? [`Téléphone : ${d.telephone}`] : []),
    `Sujet : ${d.sujet}`,
    '',
    'Message :',
    d.message,
  ].join('\n');
}

function toBase64(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/** En-tête encodé en mots courts, sans jamais couper un caractère accentué. */
function encodeHeader(text) {
  if (/^[\x20-\x7e]*$/.test(text)) return text;
  const encoder = new TextEncoder();
  const words = [];
  let word = [];
  for (const char of text) {
    const bytes = encoder.encode(char);
    if (word.length + bytes.length > 42) {
      words.push(word);
      word = [];
    }
    word.push(...bytes);
  }
  if (word.length) words.push(word);
  return words.map((w) => `=?UTF-8?B?${toBase64(w)}?=`).join('\r\n ');
}

/** Corps en base64 : aucune ligne ne peut commencer par le point de fin de message SMTP. */
function foldBase64(base64) {
  return base64.replace(/(.{76})/g, '$1\r\n').trimEnd();
}

function encodeBody(text) {
  return foldBase64(toBase64(new TextEncoder().encode(text)));
}

function buildMessage(env, d, date) {
  const boundary = `=_immeit_${crypto.randomUUID()}`;
  const relatedBoundary = `=_immeit_${crypto.randomUUID()}`;
  const textPart = (type, content) => [
    `Content-Type: ${type}; charset=UTF-8`,
    'Content-Transfer-Encoding: base64',
    '',
    encodeBody(content),
  ].join('\r\n');

  // Le logo voyage avec le HTML : il s'affiche même si les images externes sont bloquées
  const related = [
    `Content-Type: multipart/related; boundary="${relatedBoundary}"; type="text/html"`,
    '',
    `--${relatedBoundary}`,
    textPart('text/html', buildHtml(d, date)),
    `--${relatedBoundary}`,
    'Content-Type: image/jpeg; name="logo-immeit.jpg"',
    'Content-Transfer-Encoding: base64',
    `Content-ID: <${LOGO_CID}>`,
    'Content-Disposition: inline; filename="logo-immeit.jpg"',
    '',
    foldBase64(LOGO_JPEG_BASE64),
    `--${relatedBoundary}--`,
  ].join('\r\n');

  return [
    `From: ${encodeHeader(env.MAIL_FROM_NAME || 'IMMEIT Contact')} <${env.SMTP_USER}>`,
    `To: <${env.MAIL_TO}>`,
    `Reply-To: <${d.email}>`,
    `Subject: ${encodeHeader(buildSubject(d))}`,
    `Date: ${date.toUTCString().replace('GMT', '+0000')}`,
    `Message-ID: <${crypto.randomUUID()}@immeit.com>`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    textPart('text/plain', buildText(d, date)),
    `--${boundary}`,
    related,
    `--${boundary}--`,
  ].join('\r\n');
}

class SmtpError extends Error {
  constructor(stage, code) {
    super(`${stage} ${code}`);
    this.stage = stage;
    this.code = code;
  }
}

/** Lit une réponse SMTP, éventuellement sur plusieurs lignes, et renvoie son code. */
async function readReply(reader, decoder) {
  let text = '';
  for (;;) {
    const lines = text.split('\r\n').filter(Boolean);
    const last = lines[lines.length - 1];
    if (text.endsWith('\r\n') && last && /^\d{3}( |$)/.test(last)) return Number(last.slice(0, 3));
    const { value, done } = await reader.read();
    if (done) throw new SmtpError('connexion', 'fermée');
    text += decoder.decode(value, { stream: true });
  }
}

async function smtpDialog(socket, env, d) {
  const reader = socket.readable.getReader();
  const writer = socket.writable.getWriter();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  const expect = async (stage, code) => {
    const reply = await readReply(reader, decoder);
    if (reply !== code) throw new SmtpError(stage, reply);
  };
  const step = async (stage, command, code) => {
    await writer.write(encoder.encode(`${command}\r\n`));
    await expect(stage, code);
  };

  await expect('accueil', 220);
  await step('EHLO', 'EHLO immeit-contact.workers.dev', 250);
  const credentials = toBase64(encoder.encode(`\0${env.SMTP_USER}\0${env.MAILBOX_PASSWORD}`));
  await step('AUTH', `AUTH PLAIN ${credentials}`, 235);
  await step('MAIL', `MAIL FROM:<${env.SMTP_USER}>`, 250);
  await step('RCPT', `RCPT TO:<${env.MAIL_TO}>`, 250);
  await step('DATA', 'DATA', 354);
  await step('message', `${buildMessage(env, d, new Date())}\r\n.`, 250);
  // Le message est accepté : un échec de QUIT ne change plus rien
  await writer.write(encoder.encode('QUIT\r\n')).catch(() => {});
}

async function sendViaSmtp(env, d) {
  const socket = connect({ hostname: SMTP_HOST, port: SMTP_PORT }, { secureTransport: 'on', allowHalfOpen: false });
  const expired = new Promise((_, reject) => {
    setTimeout(() => reject(new SmtpError('délai', 'dépassé')), SMTP_TIMEOUT_MS);
  });
  try {
    await Promise.race([smtpDialog(socket, env, d), expired]);
  } finally {
    socket.close().catch(() => {});
  }
}

/** Une panne du limiteur ne doit jamais empêcher un visiteur d'écrire. */
async function overLimit(request, env) {
  if (!env.LIMITEUR) return false;
  try {
    const ip = request.headers.get('CF-Connecting-IP') || 'inconnue';
    const { success } = await env.LIMITEUR.limit({ key: ip });
    return !success;
  } catch (e) {
    console.error('Limiteur indisponible :', e.name);
    return false;
  }
}

async function handleContact(request, env) {
  const origin = request.headers.get('Origin') || '';

  if (!ALLOWED_ORIGINS.includes(origin)) {
    return json({ success: false, message: 'Origine non autorisée.' }, 403, origin);
  }
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  if (request.method !== 'POST') {
    return json({ success: false, message: 'Méthode non autorisée.' }, 405, origin);
  }

  if (await overLimit(request, env)) {
    return json({ success: false, message: 'Trop de messages.' }, 429, origin);
  }

  const body = await request.text();
  if (new TextEncoder().encode(body).length > MAX_BODY_BYTES) {
    return json({ success: false, message: 'Message trop long.' }, 413, origin);
  }

  let raw;
  try {
    raw = JSON.parse(body);
  } catch {
    return json({ success: false, message: 'Données invalides.' }, 400, origin);
  }

  // Champ piège rempli par un robot : réponse normale, mais rien n'est envoyé
  if (raw && raw.botcheck) {
    return json({ success: true, message: 'Votre message a bien été envoyé.' }, 200, origin);
  }

  const { errors, data } = parseForm(raw);
  if (errors.length) {
    return json({ success: false, message: errors.join(' ') }, 422, origin);
  }

  if (!env.MAILBOX_PASSWORD || !env.SMTP_USER || !env.MAIL_TO) {
    return json({ success: false, message: 'Service d’envoi non configuré.' }, 503, origin);
  }

  try {
    await sendViaSmtp(env, data);
  } catch (e) {
    // Seuls l'étape et le code sont journalisés : ni mot de passe ni donnée du visiteur
    console.error('Envoi impossible :', e.stage || e.name, e.code ?? '');
    return json({ success: false, message: 'Erreur lors de l’envoi.' }, 502, origin);
  }

  return json({ success: true, message: 'Votre message a bien été envoyé.' }, 200, origin);
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname !== '/api/contact') return new Response('Not found', { status: 404 });
    return handleContact(request, env);
  },
};

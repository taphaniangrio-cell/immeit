/**
 * IMMEIT — Cloudflare Worker
 * ------------------------------------------------------------------
 * - Sert les assets statiques du site (binding ASSETS -> dossier racine)
 * - Expose POST /api/contact : reception du formulaire de contact
 *
 * Transport d'email, au choix (secret a definir avec `wrangler secret put <NOM>`) :
 *   - RESEND_API_KEY        : API Resend      (https://resend.com)
 *   - WEB3FORMS_ACCESS_KEY : UUID Web3Forms  (https://web3forms.com)
 * Si aucune cle n'est definie, l'API repond une erreur explicite et le site
 * bascule automatiquement sur son repli mailto:.
 */

const DESTINATION = 'contact@immeit.com';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://www.immeit.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS },
  });
}

/** Echappe les valeurs injectees dans le corps HTML du mail. */
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/** Valide et normalise la charge utile du formulaire. */
function parseForm(raw) {
  const d = raw || {};
  const prenom    = String(d.prenom ?? '').trim().slice(0, 100);
  const nom       = String(d.nom ?? '').trim().slice(0, 100);
  const email     = String(d.email ?? '').trim().slice(0, 200);
  const telephone = String(d.telephone ?? '').trim().slice(0, 40);
  const sujet     = String(d.sujet ?? d.subject ?? '').trim().slice(0, 200) || 'Nouveau message';
  const message   = String(d.message ?? '').trim().slice(0, 5000);

  const errors = [];
  if (!prenom) errors.push('Le prénom est requis.');
  if (!nom) errors.push('Le nom est requis.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Adresse e-mail invalide.');
  if (!message) errors.push('Le message est requis.');

  return { errors, data: { prenom, nom, email, telephone, sujet, message } };
}

function buildHtml(d) {
  const rows = [
    ['Nom', `${d.prenom} ${d.nom}`],
    ['Email', d.email],
    ...(d.telephone ? [['Téléphone', d.telephone]] : []),
    ['Sujet', d.sujet],
  ]
    .map(([label, value]) =>
      `<tr><td style="padding:6px 16px 6px 0;color:#6b7a90;font-size:13px;white-space:nowrap;">${escapeHtml(label)}</td>` +
      `<td style="padding:6px 0;color:#111827;font-size:14px;font-weight:600;">${escapeHtml(value)}</td></tr>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><title>Nouveau message – IMMEIT</title></head>
<body style="margin:0;padding:24px;background:#f0f2f5;font-family:Segoe UI,Arial,sans-serif;color:#111827;">
  <div style="max-width:620px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;">
    <div style="background:#111927;padding:24px 32px;color:#fff;">
      <div style="font-size:20px;font-weight:800;letter-spacing:3px;">IMMEIT</div>
      <div style="font-size:12px;color:#8fa8c8;margin-top:4px;">Nouveau message reçu depuis immeit.com</div>
    </div>
    <div style="padding:28px 32px;">
      <table style="width:100%;border-collapse:collapse;background:#f8f9fb;padding:16px;">${rows}</table>
      <div style="margin-top:20px;padding:18px;background:#f8f9fb;border-left:4px solid #e8a000;border-radius:6px;
                  white-space:pre-wrap;line-height:1.7;font-size:14px;">${escapeHtml(d.message)}</div>
      <div style="margin-top:20px;">
        <a href="mailto:${escapeHtml(d.email)}?subject=Re:%20${encodeURIComponent(d.sujet)}"
           style="display:inline-block;background:#1e3a5f;color:#fff;text-decoration:none;padding:12px 26px;
                  border-radius:8px;font-size:13px;font-weight:700;">Répondre à ${escapeHtml(d.prenom)}</a>
      </div>
    </div>
  </div>
</body></html>`;
}

async function sendViaResend(env, d) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.MAIL_FROM || 'IMMEIT <site@immeit.com>',
      to: [DESTINATION],
      reply_to: d.email,
      subject: `[IMMEIT - Demande] ${d.sujet} — ${d.prenom} ${d.nom}`,
      html: buildHtml(d),
    }),
  });
  return { ok: res.ok, detail: await res.text() };
}

async function sendViaWeb3Forms(env, d) {
  const res = await fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      access_key: env.WEB3FORMS_ACCESS_KEY,
      subject: `[IMMEIT - Demande] ${d.sujet} — ${d.prenom} ${d.nom}`,
      from_name: `${d.prenom} ${d.nom}`,
      email: d.email,
      telephone: d.telephone,
      message: d.message,
    }),
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok && body.success === true, detail: JSON.stringify(body) };
}

async function handleContact(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (request.method !== 'POST') {
    return json({ success: false, message: 'Méthode non autorisée.' }, 405);
  }

  let raw;
  try {
    raw = await request.json();
  } catch {
    return json({ success: false, message: 'Données invalides.' }, 400);
  }

  const { errors, data } = parseForm(raw);
  if (errors.length) {
    return json({ success: false, message: errors.join(' ') }, 422);
  }

  let transport;
  if (env.RESEND_API_KEY) {
    transport = 'resend';
  } else if (env.WEB3FORMS_ACCESS_KEY) {
    transport = 'web3forms';
  } else {
    return json({
      success: false,
      message: 'Aucun service d’envoi configuré sur ce Worker.',
    }, 503);
  }

  const result = transport === 'resend'
    ? await sendViaResend(env, data)
    : await sendViaWeb3Forms(env, data);

  if (!result.ok) {
    console.error('envoi failed', transport, result.detail);
    return json({ success: false, message: 'Erreur lors de l’envoi.' }, 502);
  }

  return json({ success: true, message: 'Votre message a bien été envoyé.' });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/contact') {
      return handleContact(request, env);
    }

    // Avec html_handling "none", la racine "/" ne pointe pas automatiquement
    // sur index.html : on le fait explicitement pour que la page d'accueil
    // reste accessible, tout en servant les .html a leur URL exacte
    // (coherent avec les balises canonical du site).
    if ((url.pathname === '/' || url.pathname === '') && request.method === 'GET') {
      return env.ASSETS.fetch(new Request(new URL('/index.html', url).toString(), request));
    }

    return env.ASSETS.fetch(request);
  },
};

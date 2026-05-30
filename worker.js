const TEMPLATE = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #f4f4f6;
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      padding: 40px 10px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 8px 30px rgba(0,0,0,0.08);
    }
    .header {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      padding: 48px 30px 36px;
      text-align: center;
    }
    .header h1 {
      color: #c99a3e;
      font-size: 32px;
      letter-spacing: 3px;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .header p {
      color: #7a8a9a;
      font-size: 13px;
      letter-spacing: 1px;
    }
    .content {
      padding: 36px 30px;
    }
    .content h2 {
      color: #1a1a2e;
      font-size: 22px;
      margin-bottom: 4px;
    }
    .content .date {
      color: #888;
      font-size: 14px;
      margin-bottom: 32px;
    }
    .card {
      margin-bottom: 28px;
    }
    .card-header {
      padding: 10px 16px;
      background: #f8f9fa;
      border-radius: 8px 8px 0 0;
      border-bottom: 2px solid #c99a3e;
    }
    .card-header strong {
      color: #1a1a2e;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.6px;
    }
    .card-body {
      padding: 16px;
      border: 1px solid #e8e8ec;
      border-top: 0;
      border-radius: 0 0 8px 8px;
    }
    .card-body table {
      width: 100%;
    }
    .card-body td {
      padding: 5px 0;
      color: #444;
      font-size: 15px;
    }
    .card-body .label {
      color: #1a1a2e;
      font-weight: 600;
      display: inline-block;
      width: 70px;
    }
    .card-body a {
      color: #c99a3e;
      text-decoration: none;
      font-weight: 500;
    }
    .message-body {
      color: #333;
      font-size: 15px;
      line-height: 1.7;
      margin: 0;
      white-space: pre-wrap;
    }
    .footer {
      background: #1a1a2e;
      padding: 28px 30px;
      text-align: center;
    }
    .footer p {
      color: #7a8a9a;
      font-size: 12px;
      margin-bottom: 6px;
    }
    .footer a {
      color: #c99a3e;
      text-decoration: none;
      font-size: 13px;
    }
    .disclaimer {
      text-align: center;
      color: #aaa;
      font-size: 11px;
      margin-top: 16px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>IMMEIT</h1>
      <p>Installation &middot; M&eacute;thodes &middot; Maintenance</p>
    </div>
    <div class="content">
      <h2>Nouveau message de contact</h2>
      <p class="date">Re&ccedil;u le {{DATE}}</p>

      <div class="card">
        <div class="card-header">
          <strong>Exp&eacute;diteur</strong>
        </div>
        <div class="card-body">
          <table>
            <tr><td><span class="label">Pr&eacute;nom</span> {{PRENOM}}</td></tr>
            <tr><td><span class="label">Nom</span> {{NOM}}</td></tr>
            <tr><td><span class="label">Email</span> <a href="mailto:{{EMAIL}}">{{EMAIL}}</a></td></tr>
            <tr><td><span class="label">Sujet</span> {{SUJET}}</td></tr>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <strong>Message</strong>
        </div>
        <div class="card-body">
          <p class="message-body">{{MESSAGE}}</p>
        </div>
      </div>
    </div>
    <div class="footer">
      <p>IMMEIT &mdash; Installation &middot; M&eacute;thodes &middot; Maintenance</p>
      <a href="https://www.immeit.com">www.immeit.com</a>
    </div>
  </div>
  <p class="disclaimer">Cet email a &eacute;t&eacute; envoy&eacute; depuis le formulaire de contact.</p>
</body>
</html>`;

function replacePlaceholders(html, data) {
  const values = {
    '{{PRENOM}}': data.prenom || '',
    '{{NOM}}': data.nom || '',
    '{{EMAIL}}': data.email || '',
    '{{SUJET}}': data.sujet || 'Nouveau message',
    '{{MESSAGE}}': (data.message || '').replace(/\n/g, '<br>'),
    '{{DATE}}': new Date().toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }),
    '{{SITE_NOM}}': 'IMMEIT',
    '{{SITE_URL}}': 'https://www.immeit.com',
  };
  let result = html;
  for (const [key, val] of Object.entries(values)) {
    result = result.split(key).join(val);
  }
  return result;
}

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const ct = request.headers.get('Content-Type') || '';
    let data;
    if (ct.includes('application/json')) {
      data = await request.json();
    } else {
      const form = await request.formData();
      data = Object.fromEntries(form.entries());
    }

    if (!data.email || !data.message) {
      return new Response(JSON.stringify({ success: false, error: 'Email et message requis' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const html = replacePlaceholders(TEMPLATE, data);

    const mailPayload = {
      personalizations: [{ to: [{ email: 'demandes-p2m@immeit.com' }] }],
      from: { email: 'noreply@immeit.com', name: 'IMMEIT - Formulaire de contact' },
      replyTo: { email: data.email, name: `${data.prenom || ''} ${data.nom || ''}`.trim() },
      subject: `[IMMEIT] ${data.prenom || ''} ${data.nom || ''} - ${data.sujet || 'Nouveau message'}`.replace(/\s+/g, ' '),
      content: [{ type: 'text/html', value: html }],
    };

    const resp = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mailPayload),
    });

    if (resp.ok) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const errText = await resp.text().catch(() => '');
    return new Response(JSON.stringify({ success: false, error: resp.status, detail: errText }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  },
};

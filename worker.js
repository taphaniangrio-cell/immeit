function clean(str = '') {
  return String(str).trim().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildEmailHtml({ prenom, nom, email, telephone, sujet, message, date }) {
  const messageHtml = (message || '').replace(/\n/g, '<br/>');
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Nouveau message</title>
</head>
<body style="margin:0;padding:0;background-color:#e8eaf0;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#e8eaf0;padding:40px 16px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.12);">

        <tr>
          <td style="background-color:#1a1f36;padding:32px 40px 0 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="56" valign="middle">
                  <div style="width:48px;height:48px;background:#e8a020;border-radius:12px;text-align:center;line-height:48px;font-size:22px;">&#9993;</div>
                </td>
                <td valign="middle" style="padding-left:14px;">
                  <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">Nouveau message re&ccedil;u</p>
                  <p style="margin:4px 0 0;color:#8b91b0;font-size:12px;">Formulaire de contact &mdash; Installation, M&eacute;thodes et Maintenance des &Eacute;quipements Industriels et Tertiaires</p>
                </td>
              </tr>
            </table>
            <div style="margin-top:20px;height:1px;background:linear-gradient(90deg,#e8a020 0%,rgba(232,160,32,0) 70%);"></div>
            <div style="height:24px;"></div>
          </td>
        </tr>

        <tr>
          <td style="padding:32px 40px 8px 40px;">

            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f7f8fc;border-radius:12px;border-left:3px solid #e8a020;margin-bottom:24px;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 14px;font-size:10px;text-transform:uppercase;letter-spacing:1.2px;color:#8b91b0;font-weight:700;">Exp&eacute;diteur</p>
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td width="50%" style="padding-bottom:12px;padding-right:10px;">
                        <p style="margin:0 0 3px;font-size:11px;color:#8b91b0;">Pr&eacute;nom</p>
                        <p style="margin:0;font-size:15px;color:#1a1f36;font-weight:700;">${prenom}</p>
                      </td>
                      <td width="50%" style="padding-bottom:12px;padding-left:10px;">
                        <p style="margin:0 0 3px;font-size:11px;color:#8b91b0;">Nom</p>
                        <p style="margin:0;font-size:15px;color:#1a1f36;font-weight:700;">${nom}</p>
                      </td>
                    </tr>
                    <tr>
                      <td colspan="2">
                        <p style="margin:0 0 3px;font-size:11px;color:#8b91b0;">Adresse email</p>
                        <a href="mailto:${email}" style="color:#e8a020;font-size:14px;text-decoration:none;font-weight:500;">${email}</a>
                      </td>
                    </tr>
                    ${telephone ? `<tr>
                      <td colspan="2" style="padding-top:8px;">
                        <p style="margin:0 0 3px;font-size:11px;color:#8b91b0;">T&#233;l&#233;phone</p>
                        <a href="tel:${telephone}" style="color:#e8a020;font-size:14px;text-decoration:none;font-weight:500;">${telephone}</a>
                      </td>
                    </tr>` : ''}
                  </table>
                </td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
              <tr>
                <td>
                  <span style="display:inline-block;background:#1a1f36;color:#ffffff;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:5px 14px;border-radius:20px;">Sujet</span>
                  <span style="display:inline-block;font-size:15px;color:#1a1f36;font-style:italic;margin-left:10px;vertical-align:middle;">${sujet}</span>
                </td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fafafa;border:1px solid #e8eaf0;border-radius:12px;">
              <tr>
                <td style="padding:24px;">
                  <p style="margin:0 0 14px;font-size:10px;text-transform:uppercase;letter-spacing:1.2px;color:#8b91b0;font-weight:700;">Message</p>
                  <p style="margin:0;font-size:15px;color:#2d3250;line-height:1.85;">${messageHtml}</p>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <tr>
          <td style="padding:24px 40px 32px;text-align:right;">
            <a href="mailto:${email}?subject=Re: ${sujet}" style="display:inline-block;background:#e8a020;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 28px;border-radius:8px;letter-spacing:0.2px;">&#8617; R&eacute;pondre &agrave; ${prenom}</a>
          </td>
        </tr>

        <tr>
          <td style="background:#f7f8fc;padding:20px 40px;border-top:1px solid #e8eaf0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="font-size:11px;color:#8b91b0;">Re&ccedil;u le ${date} via <a href="https://www.immeit.com" style="color:#8b91b0;">https://www.immeit.com</a></td>
                <td align="right" style="font-size:11px;color:#8b91b0;">Ne pas r&eacute;pondre directement</td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function buildContactEmail(data) {
  const safe = {
    prenom: clean(data.prenom || ''),
    nom: clean(data.nom || ''),
    email: clean(data.email || ''),
    telephone: clean(data.telephone || ''),
    sujet: clean(data.sujet || data.subject || 'Nouveau message'),
    message: clean(data.message || ''),
    date: new Date().toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }),
  };
  return buildEmailHtml(safe);
}

export default {
  async fetch(request, env) {
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

    const html = buildContactEmail(data);
    const toName = `${data.prenom || ''} ${data.nom || ''}`.trim() || data.email;
    const subject = `[IMMEIT] ${data.prenom || ''} ${data.nom || ''} - ${data.sujet || data.subject || 'Nouveau message'}`.replace(/\s+/g, ' ');

    let ok = false;

    // 1) Mailchannels (nécessite DNS _mailchannels)
    try {
      const mcResp = await fetch('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: 'contact@immeit.com' }] }],
          from: { email: 'noreply@immeit.com', name: 'IMMEIT - Formulaire de contact' },
          replyTo: { email: data.email, name: toName },
          subject,
          content: [{ type: 'text/html', value: html }],
        }),
      });
      if (mcResp.ok) ok = true;
    } catch {}

    // 2) SendGrid (si clé configurée dans wrangler.toml vars)
    if (!ok && env?.SG_B64) {
      try {
        const sgKey = atob(atob(env.SG_B64));
        const sgResp = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sgKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: 'contact@immeit.com' }] }],
            from: { email: 'noreply@immeit.com', name: 'IMMEIT - Formulaire de contact' },
            reply_to: { email: data.email, name: toName },
            subject,
            content: [{ type: 'text/html', value: html }],
          }),
        });
        if (sgResp.ok) { ok = true; }
      } catch {}
    }

    // 3) Fallback vers le client (Web3Forms)
    if (!ok) {
      return new Response(JSON.stringify({ success: false }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  },
};

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

    let data;
    const ct = request.headers.get('Content-Type') || '';
    if (ct.includes('application/json')) {
      data = await request.json();
    } else {
      const form = await request.formData();
      data = Object.fromEntries(form.entries());
    }

    const { prenom, nom: nomRaw, email, sujet, message: msgRaw } = data;
    if (!email || !msgRaw) {
      return new Response(JSON.stringify({ success: false, error: 'Email et message requis' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const esc = (s) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const prenomE = esc(prenom);
    const nomE = esc(nomRaw);
    const emailE = esc(email);
    const sujetE = esc(sujet) || 'Nouveau message';
    const message = esc(msgRaw);

    const date = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f6;font-family:'Segoe UI',system-ui,-apple-system,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f6;padding:40px 10px">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,.08)">
        <tr>
          <td style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:48px 30px 36px;text-align:center">
            <h1 style="color:#c99a3e;margin:0 0 4px;font-size:32px;letter-spacing:3px;text-transform:uppercase">IMMEIT</h1>
            <p style="color:#7a8a9a;margin:0;font-size:13px;letter-spacing:1px">Installation · M\u00e9thodes · Maintenance</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 30px">
            <h2 style="color:#1a1a2e;margin:0 0 4px;font-size:22px">Nouveau message de contact</h2>
            <p style="color:#888;margin:0 0 32px;font-size:14px">Re\u00e7u le ${date}</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
              <tr><td style="padding:10px 16px;background:#f8f9fa;border-radius:8px 8px 0 0;border-bottom:2px solid #c99a3e"><strong style="color:#1a1a2e;font-size:12px;text-transform:uppercase;letter-spacing:.6px">Exp\u00e9diteur</strong></td></tr>
              <tr><td style="padding:16px;border:1px solid #e8e8ec;border-top:0;border-radius:0 0 8px 8px">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr><td style="padding:5px 0;color:#444;font-size:15px"><strong style="color:#1a1a2e;display:inline-block;width:70px">Pr\u00e9nom</strong> ${prenomE}</td></tr>
                  <tr><td style="padding:5px 0;color:#444;font-size:15px"><strong style="color:#1a1a2e;display:inline-block;width:70px">Nom</strong> ${nomE}</td></tr>
                  <tr><td style="padding:5px 0;color:#444;font-size:15px"><strong style="color:#1a1a2e;display:inline-block;width:70px">Email</strong> <a href="mailto:${emailE}" style="color:#c99a3e;text-decoration:none;font-weight:500">${emailE}</a></td></tr>
                  <tr><td style="padding:5px 0;color:#444;font-size:15px"><strong style="color:#1a1a2e;display:inline-block;width:70px">Sujet</strong> ${sujetE}</td></tr>
                </table>
              </td></tr>
            </table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:10px 16px;background:#f8f9fa;border-radius:8px 8px 0 0;border-bottom:2px solid #c99a3e"><strong style="color:#1a1a2e;font-size:12px;text-transform:uppercase;letter-spacing:.6px">Message</strong></td></tr>
              <tr><td style="padding:16px;border:1px solid #e8e8ec;border-top:0;border-radius:0 0 8px 8px">
                <p style="color:#333;font-size:15px;line-height:1.7;margin:0;white-space:pre-wrap">${message}</p>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#1a1a2e;padding:28px 30px;text-align:center">
            <p style="color:#7a8a9a;margin:0 0 6px;font-size:12px">IMMEIT &mdash; Installation &middot; M\u00e9thodes &middot; Maintenance</p>
            <p style="color:#c99a3e;margin:0;font-size:13px"><a href="https://www.immeit.com" style="color:#c99a3e;text-decoration:none">www.immeit.com</a></p>
          </td>
        </tr>
      </table>
      <p style="color:#aaa;font-size:11px;margin-top:16px">Cet email a \u00e9t\u00e9 envoy\u00e9 depuis le formulaire de contact d\u00e9di\u00e9.</p>
    </td></tr>
  </table>
</body></html>`;

    const mailPayload = {
      personalizations: [{ to: [{ email: 'demandes-p2m@immeit.com' }] }],
      from: { email: 'noreply@immeit.com', name: 'IMMEIT - Formulaire de contact' },
      replyTo: { email: emailE, name: `${prenomE} ${nomE}` },
      subject: `[IMMEIT] ${prenomE} ${nomE} - ${sujetE}`,
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

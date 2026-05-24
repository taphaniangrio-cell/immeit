function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildContactEmail(msg) {
  const prenom = escapeHtml(msg.prenom || '');
  const nom = escapeHtml(msg.nom || '');
  const name = escapeHtml(msg.name);
  const email = escapeHtml(msg.email);
  const subject = escapeHtml(msg.subject || 'Nouveau message IMMEIT');
  const message = escapeHtml(msg.message);
  const dateStr = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
  const initials = [prenom ? prenom.charAt(0) : '', nom ? nom.charAt(0) : ''].filter(Boolean).join('').toUpperCase() || name.charAt(0).toUpperCase();

  const rows = [];
  if (prenom) rows.push(`<tr><td style="padding:6px 16px 6px 0;font-size:12px;font-weight:600;color:#6b7280;white-space:nowrap;vertical-align:top">Pr\u00e9nom</td><td style="padding:6px 0;font-size:13px;color:#374151">${prenom}</td></tr>`);
  if (nom) rows.push(`<tr><td style="padding:6px 16px 6px 0;font-size:12px;font-weight:600;color:#6b7280;white-space:nowrap;vertical-align:top">Nom</td><td style="padding:6px 0;font-size:13px;color:#374151">${nom}</td></tr>`);
  rows.push(`<tr><td style="padding:6px 16px 6px 0;font-size:12px;font-weight:600;color:#6b7280;white-space:nowrap;vertical-align:top">Email</td><td style="padding:6px 0;font-size:13px;color:#374151"><a href="mailto:${email}" style="color:#1F538C;text-decoration:none;font-weight:500">${email}</a></td></tr>`);
  if (msg.company) rows.push(`<tr><td style="padding:6px 16px 6px 0;font-size:12px;font-weight:600;color:#6b7280;white-space:nowrap;vertical-align:top">Soci\u00e9t\u00e9</td><td style="padding:6px 0;font-size:13px;color:#374151">${escapeHtml(msg.company)}</td></tr>`);

  return [
    '<!DOCTYPE html>',
    '<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
    '<style>',
      'body{margin:0;padding:0;background-color:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}',
      '.wrapper{background-color:#f4f6f9;padding:32px 16px}',
      '.container{max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.06)}',
      '.header{background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:32px 40px 28px}',
      '.header-brand{display:flex;align-items:center;justify-content:space-between}',
      '.header-logo{font-size:22px;font-weight:800;color:#f8fafc;letter-spacing:-0.5px}',
      '.header-logo span{color:#C99A3E}',
      '.header-tag{background:rgba(201,154,62,0.1);color:#C99A3E;padding:4px 16px;border-radius:100px;font-size:11px;font-weight:600;letter-spacing:0.5px;border:1px solid rgba(201,154,62,0.15)}',
      '.header-divider{height:1px;margin-top:24px;background:linear-gradient(90deg,rgba(201,154,62,0.4),rgba(201,154,62,0.1) 60%,transparent)}',
      '.subject-section{padding:24px 40px 0}',
      '.subject-section h2{margin:0;font-size:18px;font-weight:700;color:#0f172a;line-height:1.3}',
      '.subject-section .meta-date{font-size:13px;color:#94a3b8;margin:6px 0 0}',
      '.divider{height:1px;background:#e2e8f0;margin:0 40px}',
      '.contact-card{padding:24px 40px}',
      '.contact-row{display:flex;align-items:flex-start;gap:16px}',
      '.avatar{width:52px;height:52px;min-width:52px;border-radius:50%;background:linear-gradient(135deg,#1F538C,#2a6bb5);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;color:#fff;box-shadow:0 4px 12px rgba(31,83,140,0.2)}',
      '.contact-details{flex:1;min-width:0}',
      '.contact-name{font-size:17px;font-weight:700;color:#0f172a}',
      '.contact-email{font-size:14px;color:#1F538C;margin:2px 0 0}',
      '.contact-email a{color:#1F538C;text-decoration:none;font-weight:500}',
      '.contact-email a:hover{text-decoration:underline}',
      '.body-section{padding:24px 40px 20px}',
      '.body-label{font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1.2px;margin:0 0 12px}',
      '.body-box{background:#f8fafc;border-radius:12px;padding:24px;border:1px solid #e2e8f0}',
      '.body-text{margin:0;font-size:15px;color:#334155;line-height:1.8;white-space:pre-wrap}',
      '.info-table{width:100%;border-collapse:collapse;margin-top:16px}',
      '.info-table td{padding:5px 16px 5px 0;vertical-align:top}',
      '.info-table td:first-child{font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;white-space:nowrap;width:1px}',
      '.info-table td:last-child{font-size:14px;color:#334155}',
      '.info-table a{color:#1F538C;text-decoration:none;font-weight:500}',
      '.footer-section{background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0}',
      '.footer-brand{font-size:15px;font-weight:700;color:#0f172a;margin:0 0 4px}',
      '.footer-brand span{color:#C99A3E}',
      '.footer-text{font-size:12px;color:#94a3b8;margin:0;line-height:1.6}',
      '.footer-text a{color:#C99A3E;text-decoration:none}',
      '.btn{display:inline-block;margin-top:16px;padding:12px 28px;background:linear-gradient(135deg,#1F538C,#2a6bb5);color:#ffffff!important;text-decoration:none;font-size:14px;font-weight:600;border-radius:100px;box-shadow:0 4px 16px rgba(31,83,140,0.25)}',
      '@media(max-width:480px){.wrapper{padding:16px 8px}.header{padding:24px 24px 20px}.header-logo{font-size:18px}.subject-section,.divider,.contact-card,.body-section,.footer-section{padding-left:24px;padding-right:24px}.body-box{padding:16px}.btn{padding:10px 20px;font-size:13px}}',
    '</style></head><body>',
    '<div class="wrapper">',
      '<div class="container">',
        '<div class="header">',
          '<div class="header-brand">',
            '<div class="header-logo">IMM<span>EIT</span></div>',
            '<span class="header-tag">Nouveau message</span>',
          '</div>',
          '<div class="header-divider"></div>',
        '</div>',
        '<div class="subject-section">',
          '<h2>', subject, '</h2>',
          '<p class="meta-date">Re\u00e7u le ', dateStr, '</p>',
        '</div>',
        '<div class="divider"></div>',
        '<div class="contact-card">',
          '<div class="contact-row">',
            '<div class="avatar">', initials, '</div>',
            '<div class="contact-details">',
              '<div class="contact-name">', name, '</div>',
              '<div class="contact-email"><a href="mailto:', email, '">', email, '</a></div>',
            '</div>',
          '</div>',
        '</div>',
        '<div class="divider"></div>',
        '<div class="body-section">',
          '<p class="body-label">Message</p>',
          '<div class="body-box">',
            '<p class="body-text">', message || 'Aucun message', '</p>',
          '</div>',
          '<table class="info-table" cellpadding="0" cellspacing="0" role="presentation">',
            rows.join(''),
          '</table>',
        '</div>',
        '<div class="footer-section">',
          '<p class="footer-brand">IMM<span>EIT</span> &mdash; Installation, M\u00e9thodes &amp; Maintenance</p>',
          '<p class="footer-text">Ce message a \u00e9t\u00e9 envoy\u00e9 depuis le formulaire de contact du site <a href="https://www.immeit.com">www.immeit.com</a></p>',
          '<a href="mailto:', email, '?subject=Re%3A%20', encodeURIComponent(msg.subject || ''), '" class="btn">R\u00e9pondre \u00e0 ', name, '</a>',
        '</div>',
      '</div>',
    '</div>',
    '</body></html>'
  ].join('');
}

module.exports = { buildContactEmail, escapeHtml };

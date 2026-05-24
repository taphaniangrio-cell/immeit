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
  const firstLetter = name.charAt(0).toUpperCase();
  const dateStr = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
  const initials = [prenom ? prenom.charAt(0) : '', nom ? nom.charAt(0) : ''].filter(Boolean).join('').toUpperCase() || firstLetter;
  const displayPhone = msg.phone ? escapeHtml(msg.phone) : null;

  return [
    '<!DOCTYPE html>',
    '<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
    '<style>',
      'body{margin:0;padding:0;background-color:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}',
      '.wrapper{background-color:#f0f2f5;padding:24px 16px}',
      '.container{max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)}',
      '.header{background:linear-gradient(135deg,#111927,#1a2744);padding:28px 32px}',
      '.header-top{display:flex;align-items:center;justify-content:space-between}',
      '.header-logo{display:flex;align-items:center;gap:12px}',
      '.header-logo-icon{width:36px;height:36px;background:linear-gradient(135deg,#C99A3E,#d4a843);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;color:#111927}',
      '.header-logo span{color:#f1f5f9;font-size:20px;font-weight:700;letter-spacing:-0.3px}',
      '.header-badge{background:rgba(201,154,62,0.12);color:#C99A3E;padding:4px 14px;border-radius:20px;font-size:11px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;border:1px solid rgba(201,154,62,0.2)}',
      '.header-line{height:3px;margin-top:20px;background:linear-gradient(90deg,#C99A3E,transparent);border-radius:2px}',
      '.subject-bar{background:#ffffff;padding:20px 32px 0}',
      '.subject-bar h2{margin:0;font-size:17px;font-weight:700;color:#111927}',
      '.subject-bar-date{font-size:12px;color:#6b7280;margin:4px 0 0}',
      '.meta{padding:20px 32px;border-bottom:1px solid #e8eaed}',
      '.meta-flex{display:flex;align-items:flex-start;gap:14px}',
      '.avatar{width:48px;height:48px;min-width:48px;border-radius:50%;background:linear-gradient(135deg,#1F538C,#2a6bb5);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#fff}',
      '.meta-info{flex:1;min-width:0}',
      '.meta-name{font-size:16px;font-weight:700;color:#111927}',
      '.meta-details{display:flex;flex-wrap:wrap;gap:4px 16px;margin-top:4px}',
      '.meta-detail{font-size:13px;color:#6b7280}',
      '.meta-detail a{color:#1F538C;text-decoration:none;font-weight:500}',
      '.meta-detail a:hover{text-decoration:underline}',
      '.meta-date{font-size:12px;color:#9ca3af;white-space:nowrap;margin-top:2px}',
      '.body{padding:28px 32px 24px}',
      '.body-label{font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px}',
      '.body-card{background:#f9fafb;border-radius:8px;padding:20px;border:1px solid #e8eaed}',
      '.body-text{margin:0;font-size:15px;color:#374151;line-height:1.8;white-space:pre-wrap}',
      '.body-text:empty{display:none}',
      '.info-grid{display:table;width:100%;border-collapse:collapse;margin-top:16px}',
      '.info-row{display:table-row}',
      '.info-label{display:table-cell;padding:6px 12px 6px 0;font-size:12px;font-weight:600;color:#6b7280;white-space:nowrap;width:1%}',
      '.info-value{display:table-cell;padding:6px 0;font-size:13px;color:#374151}',
      '.info-value a{color:#1F538C;text-decoration:none;font-weight:500}',
      '.footer{background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #e8eaed}',
      '.footer-brand{font-size:14px;font-weight:700;color:#111927;margin:0 0 2px}',
      '.footer-brand span{color:#C99A3E}',
      '.footer-text{font-size:11px;color:#9ca3af;margin:0;line-height:1.5}',
      '.footer-text a{color:#C99A3E;text-decoration:none}',
      '.btn-reply{display:inline-block;margin-top:12px;padding:10px 24px;background:linear-gradient(135deg,#1F538C,#2a6bb5);color:#fff !important;text-decoration:none;font-size:13px;font-weight:600;border-radius:8px;box-shadow:0 2px 8px rgba(31,83,140,0.2)}',
      '@media(max-width:480px){.wrapper{padding:12px 8px}.header{padding:20px 20px}.header-badge{font-size:10px;padding:3px 10px}.subject-bar,.meta,.body,.footer{padding-left:20px;padding-right:20px}.body-card{padding:14px}}',
    '</style></head><body>',
    '<div class="wrapper">',
      '<div class="container">',
        '<div class="header">',
          '<div class="header-top">',
            '<div class="header-logo">',
              '<div class="header-logo-icon">IM</div>',
              '<span>IMMEIT</span>',
            '</div>',
            '<span class="header-badge">Nouveau contact</span>',
          '</div>',
          '<div class="header-line"></div>',
        '</div>',
        '<div class="subject-bar">',
          '<h2>', subject, '</h2>',
          '<p class="subject-bar-date">Re&ccedil;u le ', dateStr, '</p>',
        '</div>',
        '<div class="meta">',
          '<div class="meta-flex">',
            '<div class="avatar">', initials, '</div>',
            '<div class="meta-info">',
              '<div class="meta-name">', name, '</div>',
              '<div class="meta-details">',
                '<span class="meta-detail"><a href="mailto:', email, '">', email, '</a></span>',
                displayPhone ? ('<span class="meta-detail">T&eacute;l&nbsp;: <a href="tel:' + displayPhone + '">' + displayPhone + '</a></span>') : '',
              '</div>',
            '</div>',
            '<div class="meta-date">', dateStr.split('à')[0].trim(), '</div>',
          '</div>',
        '</div>',
        '<div class="body">',
          '<p class="body-label">Message</p>',
          '<div class="body-card">',
            '<p class="body-text">', message || 'Aucun message', '</p>',
          '</div>',
          '<table class="info-grid" cellpadding="0" cellspacing="0">',
            prenom ? '<tr class="info-row"><td class="info-label">Pr&eacute;nom</td><td class="info-value">' + prenom + '</td></tr>' : '',
            nom ? '<tr class="info-row"><td class="info-label">Nom</td><td class="info-value">' + nom + '</td></tr>' : '',
            '<tr class="info-row"><td class="info-label">Email</td><td class="info-value"><a href="mailto:' + email + '">' + email + '</a></td></tr>',
            msg.company ? '<tr class="info-row"><td class="info-label">Soci&eacute;t&eacute;</td><td class="info-value">' + escapeHtml(msg.company) + '</td></tr>' : '',
          '</table>',
        '</div>',
        '<div class="footer">',
          '<p class="footer-brand">IMMEIT <span>—</span> Installation, M&eacute;thodes &amp; Maintenance</p>',
          '<p class="footer-text">Ce message a &eacute;t&eacute; envoy&eacute; depuis le formulaire de contact du site <a href="https://www.immeit.com">www.immeit.com</a></p>',
          '<a href="mailto:', email, '?subject=Re%3A%20', encodeURIComponent(msg.subject || ''), '" class="btn-reply">R&eacute;pondre &agrave; ', name, '</a>',
        '</div>',
      '</div>',
    '</div>',
    '</body></html>'
  ].join('');
}

module.exports = { buildContactEmail, escapeHtml };

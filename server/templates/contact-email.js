const fs = require('fs');
const path = require('path');

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

let _template = null;

function loadTemplate() {
  if (_template) return _template;
  const p = path.join(__dirname, 'email-template.html');
  _template = fs.readFileSync(p, 'utf8');
  return _template;
}

function buildContactEmail(msg) {
  const template = loadTemplate();

  const date = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const values = {
    '{{PRENOM}}': escapeHtml(msg.prenom || ''),
    '{{NOM}}': escapeHtml(msg.nom || ''),
    '{{PRENOM_INITIALE}}': escapeHtml((msg.prenom || msg.name || '?').charAt(0).toUpperCase()),
    '{{EMAIL}}': escapeHtml(msg.email),
    '{{SUJET}}': escapeHtml(msg.subject || 'Nouveau message'),
    '{{MESSAGE}}': escapeHtml(msg.message).replace(/\n/g, '<br>'),
    '{{DATE}}': date,
    '{{SITE_NOM}}': 'Installation, Méthodes et Maintenance des Équipements Industriels et Tertiaires',
    '{{SITE_URL}}': 'https://www.immeit.com',
  };

  let html = template;
  for (const [key, val] of Object.entries(values)) {
    html = html.split(key).join(val);
  }
  return html;
}

module.exports = { buildContactEmail, escapeHtml };

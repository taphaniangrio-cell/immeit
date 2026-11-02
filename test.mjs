// Tests du Worker sans aucun envoi : les connexions passent par un faux serveur SMTP.
import { registerHooks } from 'node:module';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const STUB = new URL('./sockets-stub.mjs', import.meta.url).href;
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === 'cloudflare:sockets') return { url: STUB, shortCircuit: true };
    return next(specifier, context);
  },
});
const { state, reset } = await import(STUB);
const { default: worker } = await import('./worker.js');

const URL_API = 'https://immeit-contact.exemple.test/api/contact';
const ORIGIN = 'https://www.immeit.com';
const FAKE_PASSWORD = 'faux-mot-de-passé';
const ENV = { MAILBOX_PASSWORD: FAKE_PASSWORD, SMTP_USER: 'boite@exemple.test', MAIL_TO: 'dest@exemple.test', MAIL_FROM_NAME: 'IMMEIT Contact' };
const OK = { prenom: 'Prénom', nom: 'Exemple', email: 'visiteur@exemple.test', telephone: '+221 00 000 00 00', sujet: 'Demande de devis', message: "Bonjour,\nCeci est un exemple pour montrer la mise en page du mail.\nAucun message n'a été envoyé." };

const logs = [];
console.error = (...args) => logs.push(args.join(' '));

async function call({ method = 'POST', path = '/api/contact', origin = ORIGIN, body = OK, raw, env = ENV } = {}) {
  reset();
  const headers = { 'Content-Type': 'application/json' };
  if (origin) headers.Origin = origin;
  const init = { method, headers };
  if (method === 'POST') init.body = raw ?? JSON.stringify(body);
  return run(new Request(new URL(path, URL_API), init), env);
}

async function run(request, env) {
  const res = await worker.fetch(request, env);
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch { /* réponse sans JSON */ }
  return { status: res.status, headers: res.headers, data, session: state.sessions[0], connexions: state.sessions.length };
}

/** Décode le message reçu par le faux serveur. */
function parseMessage(raw) {
  const [head, ...rest] = raw.split('\r\n\r\n');
  const unfolded = head.replace(/\r\n /g, '');
  const header = (name) => (unfolded.match(new RegExp(`^${name}: (.*)$`, 'mi')) || [])[1];
  const decodeWords = (v) => (v || '').replace(/=\?UTF-8\?B\?([^?]+)\?=/g, (_, b) => `\u0000${b}\u0000`).split('\u0000')
    .map((x, i) => (i % 2 ? Buffer.from(x, 'base64') : Buffer.from(x))).reduce((a, b) => Buffer.concat([a, b]), Buffer.alloc(0)).toString('utf8');
  const boundary = header('Content-Type').match(/boundary="([^"]+)"/)[1];
  const parts = rest.join('\r\n\r\n').split(`--${boundary}`).slice(1, -1).map((p) => {
    const [h, b] = p.replace(/^\r\n/, '').split('\r\n\r\n');
    return { type: h.match(/Content-Type: ([^;]+)/)[1], body: Buffer.from(b.replace(/\s/g, ''), 'base64').toString('utf8'), longest: Math.max(...b.split('\r\n').map((l) => l.length)) };
  });
  return { head, header, subject: decodeWords(header('Subject')), from: header('From'), to: header('To'), replyTo: header('Reply-To'), date: header('Date'), id: header('Message-ID'), parts, text: parts.find((p) => p.type === 'text/plain'), html: parts.find((p) => p.type === 'text/html') };
}

let failures = 0;
function check(name, condition, detail = '') {
  if (!condition) failures++;
  console.log(`${condition ? 'OK    ' : 'ERREUR'} ${name}${condition || !detail ? '' : ' -> ' + detail}`);
}

// Routage et origine
let r = await call({ path: '/', method: 'GET' });
check('autre adresse : 404', r.status === 404, r.status);
r = await call({ origin: 'https://site-pirate.test' });
check('origine étrangère : 403 sans connexion', r.status === 403 && r.connexions === 0, r.status);
check('origine étrangère : pas d’en-tête CORS', !r.headers.get('Access-Control-Allow-Origin'));
r = await call({ origin: '' });
check('sans origine : 403 sans connexion', r.status === 403 && r.connexions === 0, r.status);
r = await call({ method: 'OPTIONS' });
check('pré-vérification : 204 et CORS', r.status === 204 && r.headers.get('Access-Control-Allow-Origin') === ORIGIN, r.status);
r = await call({ method: 'OPTIONS', origin: 'https://immeit.com' });
check('domaine sans www accepté', r.status === 204 && r.headers.get('Access-Control-Allow-Origin') === 'https://immeit.com');
r = await call({ method: 'GET' });
check('GET : 405', r.status === 405, r.status);

// Validation
r = await call({ raw: '{pas du json' });
check('JSON invalide : 400', r.status === 400 && r.connexions === 0, r.status);
r = await call({ raw: JSON.stringify({ ...OK, message: 'x'.repeat(30000) }) });
check('corps trop gros : 413', r.status === 413 && r.connexions === 0, r.status);
for (const [champ, valeur] of [['prenom', ''], ['nom', ' '], ['email', 'pas-une-adresse'], ['email', 'a@b.fr?bcc=x@y.fr'], ['email', 'a"<x>@b.fr'], ['email', 'é@exemple.fr'], ['message', '']]) {
  r = await call({ body: { ...OK, [champ]: valeur } });
  check(`${champ}="${valeur}" : 422`, r.status === 422 && r.connexions === 0, r.status);
}
r = await call({ body: null });
check('corps null : 422', r.status === 422 && r.connexions === 0, r.status);
r = await call({ env: { ...ENV, MAILBOX_PASSWORD: undefined } });
check('mot de passe absent : 503', r.status === 503 && r.connexions === 0, r.status);

// Piège à robots et limite d'envois
r = await call({ body: { ...OK, botcheck: true } });
check('piège coché : succès apparent sans envoi', r.status === 200 && r.data.success === true && r.connexions === 0);
r = await call({ env: { ...ENV, LIMITEUR: { limit: async () => ({ success: false }) } } });
check('limite atteinte : 429 sans connexion', r.status === 429 && r.connexions === 0, r.status);
r = await call({ env: { ...ENV, LIMITEUR: { limit: async () => { throw new Error('panne'); } } } });
check('limiteur en panne : le message part quand même', r.status === 200 && r.session?.message, r.status);
let cleVue = '';
reset();
await run(new Request(URL_API, { method: 'POST', headers: { Origin: ORIGIN, 'CF-Connecting-IP': '203.0.113.9' }, body: JSON.stringify(OK) }), { ...ENV, LIMITEUR: { limit: async ({ key }) => { cleVue = key; return { success: true }; } } });
check('limite comptée par adresse IP', cleVue === '203.0.113.9', cleVue);

// Envoi nominal
r = await call();
const s = r.session;
check('envoi : succès', r.status === 200 && r.data.success === true, r.status);
check('une seule connexion, chiffrée, vers AMEN', r.connexions === 1 && s.address.hostname === 'smtp-fr.securemail.pro' && s.address.port === 465 && s.options.secureTransport === 'on');
const verbs = s.commands.map((c) => c.split(/[ :]/)[0]);
check('dialogue SMTP dans l’ordre', verbs.join(',') === 'EHLO,AUTH,MAIL,RCPT,DATA,QUIT', verbs.join(','));
const auth = Buffer.from(s.commands.find((c) => c.startsWith('AUTH')).split(' ')[2], 'base64').toString('utf8');
check('identifiants transmis et accents conservés', auth === `\0${ENV.SMTP_USER}\0${FAKE_PASSWORD}`);
check('expéditeur et destinataire de l’enveloppe', s.commands.includes(`MAIL FROM:<${ENV.SMTP_USER}>`) && s.commands.includes(`RCPT TO:<${ENV.MAIL_TO}>`));
check('connexion refermée', s.closed);
const m = parseMessage(s.message);
check('expéditeur et destinataire du mail', m.from === `IMMEIT Contact <${ENV.SMTP_USER}>` && m.to === `<${ENV.MAIL_TO}>`, m.from);
check('répondre va au visiteur', m.replyTo === `<${OK.email}>`, m.replyTo);
check('objet identique à l’ancien mail, accents corrects', m.subject === '[IMMEIT - Demande] Demande de devis — Prénom Exemple', m.subject);
check('en-têtes en ASCII', !/[^\x00-\x7f]/.test(m.head));
check('en-têtes de date et d’identifiant', /\+0000$/.test(m.date) && /@immeit\.com>$/.test(m.id), m.date);
check('deux versions : texte et HTML', m.parts.length === 2 && m.text && m.html);
check('lignes de 76 caractères au plus', m.parts.every((p) => p.longest <= 76));
check('version texte complète', m.text.body.includes('Téléphone : +221 00 000 00 00') && m.text.body.includes('Aucun message'));
check('HTML : éléments de l’ancien mail', ['Nouveau message reçu', 'Un visiteur vous a contacté', 'Installation, Méthodes et Maintenance des Équipements Industriels et Tertiaires', 'Répondre à Prénom', 'Villa N°40', '+33 7 54 01 19 45'].every((t) => m.html.body.includes(t)));
check('HTML : date au format attendu', /Message reçu le \d{2}\/\d{2}\/\d{4} à \d{2}:\d{2} depuis/.test(m.html.body));
check('mot de passe absent du message', !s.message.includes(FAKE_PASSWORD));
writeFileSync(fileURLToPath(new URL('./apercu-nouveau-mail.html', import.meta.url)), m.html.body);

r = await call({ body: { ...OK, telephone: '' } });
let mm = parseMessage(r.session.message);
check('sans téléphone : ligne absente', !mm.html.body.includes('Téléphone') && !mm.text.body.includes('Téléphone'));

// Réponse du serveur en plusieurs morceaux et ligne seule contenant un point dans le message
r = await call({ body: { ...OK, message: 'Ligne un\n.\nLigne trois' } });
mm = parseMessage(r.session.message);
check('point seul sur une ligne : message entier', r.status === 200 && mm.text.body.includes('Ligne un\n.\nLigne trois'));

// Contenus hostiles
const hostile = { ...OK, prenom: '<script>alert(1)</script>', nom: '"><img src=x onerror=alert(1)>', sujet: 'x\r\nBcc: pirate@exemple.test', telephone: '"><b>1', message: '<a href="https://pirate.test">clic</a>\n&\'"\r\n.\r\nRCPT TO:<pirate@exemple.test>' };
r = await call({ body: hostile });
mm = parseMessage(r.session.message);
check('balises du visiteur neutralisées', !mm.html.body.includes('<script') && !mm.html.body.includes('<img') && !mm.html.body.includes('<a href="https://pirate.test"') && mm.html.body.includes('&lt;script&gt;'));
check('objet sur une seule ligne, sans en-tête ajouté', !/[\r\n]/.test(mm.subject) && !/^Bcc:/mi.test(mm.head), JSON.stringify(mm.subject));
check('aucun destinataire ajouté par le message', r.session.commands.filter((c) => c.startsWith('RCPT')).length === 1);
check('sauts de ligne du message conservés', mm.html.body.includes('clic&lt;/a&gt;<br>&amp;'));
check('lien téléphone nettoyé', !mm.html.body.includes('tel:"') && !/tel:[^"]*[<>]/.test(mm.html.body));
r = await call({ body: { ...OK, sujet: 'Devis & "urgent" ?' } });
check('objet de la réponse encodé', parseMessage(r.session.message).html.body.includes('subject=Re%3A%20Devis%20%26%20%22urgent%22%20%3F'));
r = await call({ body: { ...OK, prenom: 'é'.repeat(500), message: 'b'.repeat(6000) } });
mm = parseMessage(r.session.message);
check('longueurs limitées et objet long bien encodé', mm.subject.includes('é'.repeat(100)) && !mm.subject.includes('�') && !mm.text.body.includes('b'.repeat(5001)));

// Pannes : le site doit pouvoir basculer sur Web3Forms, sans fuite dans les journaux
logs.length = 0;
for (const [label, replies, etape] of [
  ['serveur indisponible', { accueil: '421 occupe\r\n' }, 'accueil'],
  ['mot de passe refusé', { AUTH: '535 refus\r\n' }, 'AUTH'],
  ['expéditeur refusé', { MAIL: '550 refus\r\n' }, 'MAIL'],
  ['destinataire refusé', { RCPT: '550 refus\r\n' }, 'RCPT'],
  ['DATA refusé', { DATA: '554 refus\r\n' }, 'DATA'],
  ['message refusé', { message: '554 spam\r\n' }, 'message'],
]) {
  reset();
  state.replies = replies;
  r = await run(new Request(URL_API, { method: 'POST', headers: { Origin: ORIGIN }, body: JSON.stringify(OK) }), ENV);
  check(`${label} : 502, connexion refermée`, r.status === 502 && r.data.success === false && r.session.closed, r.status);
  check(`${label} : étape journalisée`, logs[logs.length - 1]?.includes(etape), logs[logs.length - 1]);
}
reset();
state.refuseConnect = true;
r = await run(new Request(URL_API, { method: 'POST', headers: { Origin: ORIGIN }, body: JSON.stringify(OK) }), ENV);
check('connexion impossible : 502', r.status === 502 && r.data.success === false, r.status);
check('réponse d’erreur lisible par le site (CORS)', r.headers.get('Access-Control-Allow-Origin') === ORIGIN);
reset();
state.silent = true;
const debut = Date.now();
r = await run(new Request(URL_API, { method: 'POST', headers: { Origin: ORIGIN }, body: JSON.stringify(OK) }), ENV);
const duree = Date.now() - debut;
check('serveur muet : 502 en moins de 15 s', r.status === 502 && duree < 15000, `${r.status} en ${duree} ms`);
check('journaux sans mot de passe ni donnée du visiteur', !logs.some((l) => l.includes(FAKE_PASSWORD) || l.includes(OK.email) || l.includes(OK.nom)));

console.log(failures ? `\n${failures} erreur(s)` : '\nTous les tests passent');
process.exit(failures ? 1 : 0);

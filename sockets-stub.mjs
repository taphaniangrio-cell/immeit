// Faux serveur SMTP pour les tests : rien ne sort sur le réseau.
export const state = { sessions: [], replies: {}, silent: false, refuseConnect: false };

export function reset() {
  state.sessions.length = 0;
  state.replies = {};
  state.silent = false;
  state.refuseConnect = false;
}

const DEFAULTS = { EHLO: ['250-serveur\r\n', '250-AUTH LOGIN PLAIN\r\n250 8BITMIME\r\n'], AUTH: ['235 ok\r\n'], MAIL: ['250 ok\r\n'], RCPT: ['250 ok\r\n'], DATA: ['354 suite\r\n'], QUIT: ['221 fin\r\n'] };

export function connect(address, options) {
  if (state.refuseConnect) throw new Error('connexion impossible');
  const session = { address, options, commands: [], message: null, closed: false };
  state.sessions.push(session);

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let controller;
  const send = (chunks) => { if (!state.silent) chunks.forEach((c) => controller.enqueue(encoder.encode(c))); };
  const readable = new ReadableStream({ start(c) { controller = c; send([state.replies.accueil ?? '220 serveur pret\r\n']); } });

  let buffer = '';
  let inData = false;
  const writable = new WritableStream({
    write(chunk) {
      buffer += decoder.decode(chunk);
      for (;;) {
        if (inData) {
          const end = buffer.indexOf('\r\n.\r\n');
          if (end < 0) return;
          session.message = buffer.slice(0, end);
          buffer = buffer.slice(end + 5);
          inData = false;
          send([state.replies.message ?? '250 accepte\r\n']);
        } else {
          const end = buffer.indexOf('\r\n');
          if (end < 0) return;
          const command = buffer.slice(0, end);
          buffer = buffer.slice(end + 2);
          session.commands.push(command);
          const verb = command.split(/[ :]/)[0].toUpperCase();
          const reply = state.replies[verb] ?? DEFAULTS[verb] ?? ['500 inconnu\r\n'];
          send([].concat(reply));
          if (verb === 'DATA' && !state.replies.DATA) inData = true;
        }
      }
    },
  });

  return { readable, writable, close: async () => { session.closed = true; } };
}

# Worker du formulaire de contact — IMMEIT

Reçoit le formulaire de https://www.immeit.com sur `POST /api/contact` et envoie le message,
avec le modèle de mail IMMEIT, par la boîte AMEN `demandes-p2m@immeit.com`
(`smtp-fr.securemail.pro`, port 465). En cas d'échec, le site passe sur Web3Forms, puis sur `mailto:`.

En ligne : https://immeit-contact.taphaniangrio.workers.dev/api/contact

## Contenu

| Fichier | Rôle |
|---|---|
| `worker.js` | Le Worker et le modèle de mail |
| `logo.js` | Le logo officiel, joint à chaque mail pour s'afficher sans image externe |
| `test.mjs`, `sockets-stub.mjs` | Tests avec un faux serveur SMTP : rien ne sort sur le réseau |
| `saisir-mot-de-passe.ps1` | Fenêtre Windows : vérifie le mot de passe auprès d'AMEN, puis l'enregistre chez Cloudflare |

## Configuration

`wrangler.jsonc` n'est pas versionné (garde-fou anti-fuite du dépôt). À recréer ici avec ce contenu :

```jsonc
{
  "name": "immeit-contact",
  "main": "worker.js",
  "compatibility_date": "2026-10-01",
  "workers_dev": true,
  "preview_urls": false,
  "vars": {
    "SMTP_USER": "demandes-p2m@immeit.com",
    "MAIL_TO": "demandes-p2m@immeit.com",
    "MAIL_FROM_NAME": "IMMEIT Contact"
  },
  "ratelimits": [
    { "name": "LIMITEUR", "namespace_id": "1001", "simple": { "limit": 5, "period": 60 } }
  ]
}
```

Le mot de passe de la boîte est le secret Cloudflare `MAILBOX_PASSWORD`. Il n'est jamais écrit dans le dépôt.

## Commandes

À lancer depuis ce dossier, jamais depuis la racine du site : Wrangler y créerait un dossier `.wrangler/`.

```bash
npm install
```

```bash
node test.mjs
```

```bash
npx wrangler login --scopes account:read user:read workers:write workers_scripts:write workers_tail:read
```

```bash
npx wrangler deploy
```

## Si le mot de passe de la boîte change

Le Worker ne peut plus envoyer et le site passe sur Web3Forms. Pour le remettre à jour, connecter Wrangler
puis lancer `saisir-mot-de-passe.ps1`.

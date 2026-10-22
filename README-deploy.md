# Déploiement du Worker Cloudflare — IMMEIT

Branche `cloudflare/workers-autoconfig`. Le site est également publié en statique
sur GitHub Pages (branche `main`) : le Worker sert d'API pour le formulaire de
contact quand un service d'envoi est configuré.

> `wrangler.jsonc` n'est volontairement **pas** versionné (garde-fou anti-fuite du
> dépôt). Recréez-le localement avec le contenu ci-dessous.

## 1. Prérequis

```bash
npm install -g wrangler
wrangler login
```

## 2. `wrangler.jsonc` (à recréer à la racine de la branche)

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "immeit",
  "main": "worker.js",
  "compatibility_date": "2026-06-30",
  "observability": { "enabled": true },
  "assets": { "directory": ".", "binding": "ASSETS" },
  "compatibility_flags": ["nodejs_compat"]
}
```

## 3. Secret d'envoi (au choix)

```bash
# Option A — Resend (https://resend.com, domaine immeit.com à vérifier)
wrangler secret put RESEND_API_KEY
wrangler secret put MAIL_FROM            # optionnel : "IMMEIT <site@immeit.com>"

# Option B — Web3Forms (https://web3forms.com, clé UUID)
wrangler secret put WEB3FORMS_ACCESS_KEY
```

Sans secret, `POST /api/contact` répond `503` et le site bascule sur son repli
`mailto:` — le formulaire reste utilisable.

## 4. Déployer

```bash
wrangler deploy
```

## 5. Domaine personnalisé

Dans Cloudflare → **Workers & Pages** → `immeit` → **Settings** → **Domains & Routes**

- **Custom Domain** : `immeit.com` et `www.immeit.com`
- Ou **Route** : `immeit.com/*` → Worker `immeit` (requiert la zone sur Cloudflare)

Le certificat TLS est émis automatiquement par Cloudflare.

## 6. Vérification

```bash
curl -X POST https://immeit.taphaniangrio.workers.dev/api/contact \
  -H "Content-Type: application/json" \
  -d '{"prenom":"Test","nom":"User","email":"test@example.com","sujet":"Essai","message":"Message de test"}'
```

Réponse attendue : `{"success":true,"message":"Votre message a bien été envoyé."}`

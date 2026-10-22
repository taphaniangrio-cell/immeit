# Déploiement du Worker Cloudflare — IMMEIT

Branche `cloudflare/workers-autoconfig`. Le site est également publié en statique
sur GitHub Pages (branche `main`) : le Worker sert d'API pour le formulaire de
contact quand un service d'envoi est configuré, et peut aussi servir le site
intégralement si le domaine est rattaché à Cloudflare.

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
  "assets": {
    "directory": ".",
    "binding": "ASSETS",
    "html_handling": "none"
  },
  "compatibility_flags": ["nodejs_compat"]
}
```

`html_handling: "none"` sert les `.html` à leur URL exacte, sans redirection
(cohérent avec les balises `canonical` du site). La racine `/` est traitée
explicitement dans `worker.js` pour servir `index.html`.

## 3. `.assetsignore` — déjà versionné

Empêche la publication de `.git` (historique complet du dépôt), de `.gitignore`,
de `wrangler.jsonc` et de `worker.js` lui-même. Sans ce fichier, un déploiement
depuis un clone complet expose **tout l'historique git** publiquement.

## 4. Secret d'envoi (au choix)

```bash
# Option A — Resend (https://resend.com, domaine immeit.com à vérifier)
wrangler secret put RESEND_API_KEY
wrangler secret put MAIL_FROM            # optionnel : "IMMEIT <site@immeit.com>"

# Option B — Web3Forms (https://web3forms.com, clé UUID)
wrangler secret put WEB3FORMS_ACCESS_KEY
```

Sans secret, `POST /api/contact` répond `503` et le site bascule sur son repli
`mailto:` — le formulaire reste utilisable.

## 5. Déployer

```bash
wrangler deploy
```

## 6. Domaine personnalisé

Dans Cloudflare → **Workers & Pages** → `immeit` → **Settings** → **Domains & Routes**

- **Custom Domain** : `immeit.com` et `www.immeit.com`
- Ou **Route** : `immeit.com/*` → Worker `immeit` (requiert la zone sur Cloudflare)

Le certificat TLS est émis automatiquement par Cloudflare.

## 7. Vérification

```bash
curl -X POST https://immeit.taphaniangrio.workers.dev/api/contact \
  -H "Content-Type: application/json" \
  -d '{"prenom":"Test","nom":"User","email":"test@example.com","sujet":"Essai","message":"Message de test"}'
```

Réponse attendue : `{"success":true,"message":"Votre message a bien été envoyé."}`

Contrôles de non-régression :

```bash
# aucune fuite de code ou d'historique git
for p in /.git /.gitignore /wrangler.jsonc /worker.js /send_mail.php; do
  curl -s -o /dev/null -w "$p %{http_code}\n" "https://immeit.taphaniangrio.workers.dev$p"
done

# toutes les routes du site répondent 200
for p in / /climatisation.html /methodes-maintenance.html /mentions-legales.html \
         /politique-confidentialite.html /404.html /style.css /script.js /locales/fr.json; do
  curl -s -o /dev/null -w "$p %{http_code}\n" "https://immeit.taphaniangrio.workers.dev$p"
done
```

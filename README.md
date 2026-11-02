# IMMEIT — site vitrine

Site statique (HTML / CSS / JS pur, aucun build). Déploiement principal :
**GitHub Pages** sur la branche `main`.

---

## Branches

| Branche | Rôle |
|---|---|
| `main` | **Source de vérité + site publié** par GitHub Pages. Ne contient que des fichiers statiques servables tels quels. |
| `gh-pages` | Miroir de `main` (sauvegarde). La configuration Pages utilise `main` comme source. |
| `cloudflare/workers-autoconfig` | Déploiement Cloudflare Worker : sert les assets + expose `POST /api/contact`. Voir `README-deploy.md`. |
| `amen-hosting` | Kit de déploiement pour l'hébergement AMEN (Apache + PHP) : contient en plus `.htaccess` et `send_mail.php`. |

---

## DNS — configuration requise

Le domaine est enregistré chez AMEN (`ns1/ns2.amenworld.com`) mais doit pointer
vers GitHub Pages :

| Type | Nom | Valeur |
|---|---|---|
| `A` | `@` (apex) | `185.199.108.153` |
| `A` | `@` (apex) | `185.199.109.153` |
| `A` | `@` (apex) | `185.199.110.153` |
| `A` | `@` (apex) | `185.199.111.153` |
| `CNAME` | `www` | `taphaniangrio-cell.github.io` |

À supprimer : les enregistrements `A` pointant vers `81.88.57.96` (ancien hôte AMEN).

GitHub émet et renouvelle automatiquement le certificat TLS pour `immeit.com` **et**
`www.immeit.com`. `https_enforced` est actif : HTTP est redirigé vers HTTPS.
L'apex `immeit.com` redirige (301) vers `www.immeit.com`.

> ⚠️ Ne pas remettre l'apex sur l'IP AMEN : le port 443 n'y est pas ouvert et le
> navigateur expire en `ERR_CONNECTION_TIMED_OUT` (le HSTS force le passage direct
> en HTTPS).

---

## Formulaire de contact

Le site est **100 % statique** : aucun PHP n'est exécuté. `script.js` essaie les
fournisseurs dans l'ordre et retombe sur `mailto:` si aucun ne répond.

| Ordre | Fournisseur | Configuration |
|---|---|---|
| 0 | `send_mail.php` (PHP) | Uniquement si aucun service n'est configuré et si l'hôte exécute du PHP (branche `amen-hosting`) |
| 1 | Cloudflare Worker | `window.WORKER_API_URL` — désactivé, laisser vide (Worker supprimé) |
| 2 | Web3Forms | `window.WEB3FORMS_KEY` — clé d'accès dans `index.html`, publique par conception (offre gratuite : 250 envois par mois) |
| 3 | `mailto:` | Repli automatique, ouvre le client mail du visiteur |

Les deux points de configuration sont dans `index.html` (bloc `<script>` en tête de page).

---

## Design system

Direction « plan technique » : tout le style vit dans `style.css` et tout le comportement dans `script.js`.

| Élément | Choix |
|---|---|
| Polices | Archivo (titres et texte), IBM Plex Mono (annotations et chiffres) |
| Couleurs | Variables en tête de `style.css` : Encre `#0A1626`, Signal `#E5A93C`, Papier `#F5F6F4` |
| Thèmes | Clair par défaut, classe `.on-ink` pour les sections sombres |
| Tailles | Échelle unique `--t-*` en tête de `style.css` : ne pas ajouter d'autre taille de police. Toutes les dimensions sont en `rem` et le `rem` suit la taille de la fenêtre |
| Sections | Classe `.panel` : chaque section occupe un écran. `script.js` (`fitPanels`) réduit le `rem` si une section dépasse. Si un texte s'allonge beaucoup, revérifier le rendu à 1280×560 (écran 1080p avec zoom Windows à 150 %) |
| Textes | `locales/fr.json` et `locales/en.json` : `i18n.js` remplace le contenu des éléments `data-i18n` au chargement. Modifier un texte dans le HTML seul ne suffit pas |
| Photos | `img/` : visuels générés par IA, à remplacer par des photos de terrain réelles dès que possible |

Après une modification de `style.css` ou `script.js`, incrémenter le `?v=` dans les pages HTML.

---

## Publication

Le site est publié automatiquement à chaque `push` sur `main` :

```bash
git push origin main
```

Statut du build : `gh api repos/taphaniangrio-cell/immeit/pages/builds/latest`

---

## Restauration de l'hébergement AMEN (si souhaité)

```bash
git checkout amen-hosting
#	uploader le contenu du dossier sur le docroot AMEN (FTP)
#	activer un certificat SSL pour immeit.com et www.immeit.com dans le panel AMEN
```

Contraintes AMEN : le SSL doit être actif (port 443) et le dossier racine doit
contenir `.htaccess` + `send_mail.php` + les fichiers du site. L'hébergement AMEN
historique ne(listenerait plus) le port 443 et servait un dossier racine vide.

---

## Journal d'incident

**2026-10-22 — Site inaccessible (`ERR_CONNECTION_TIMED_OUT`)**

- Cause : DNS apex/`www` pointait vers l'IP AMEN `81.88.57.96`, dont le port 443
  n'était pas ouvert. Le HSTS (`includeSubDomains`) forçait Chrome vers HTTPS.
- Constat complémentaire : le dossier racine AMEN était vide (`index.html` en 500
  PHP, tout le reste en 404, `.htaccess` non chargé).
- Correctif : DNS basculé vers GitHub Pages, certificat déjà provisionné.
- Correctifs annexes : `send_mail.php` retiré de l'espace publié (code source
  exposé publiquement), chaîne d'envoi du formulaire refaite pour un hébergement
  statique, `sitemap.xml` complété (pages légales).

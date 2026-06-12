# IMMEIT — Correctifs Audit Responsivité & SEO
## Guide de déploiement — Juin 2026

---

## 📦 Fichiers livrés

| Fichier | Description | Priorité |
|---------|-------------|----------|
| `sitemap.xml` | Sitemap complet toutes pages | 🔴 CRITIQUE |
| `robots.txt` | Robots.txt avec Sitemap directive | 🔴 CRITIQUE |
| `schema-org-snippet.html` | JSON-LD Organization + FAQ + Service | 🔴 CRITIQUE |
| `head-templates-pages-secondaires.html` | Head complet pour methodes-maintenance.html + climatisation.html | 🟠 HIGH |
| `.htaccess` | Security headers + gzip + cache | 🟠 HIGH |
| `correctifs-images-responsive.html` | WebP + srcset + lazy loading + counter fix | 🟠 HIGH |

---

## ✅ Checklist de déploiement (ordre recommandé)

### SPRINT 1 — Actions SEO immédiates (2-3h total)

- [ ] **1.** Déposer `sitemap.xml` à la racine du site via cPanel File Manager
  - Vérifier : https://www.immeit.com/sitemap.xml doit répondre 200 OK
  
- [ ] **2.** Déposer/mettre à jour `robots.txt` à la racine du site
  - Vérifier : https://www.immeit.com/robots.txt contient `Sitemap: https://www.immeit.com/sitemap.xml`

- [ ] **3.** Insérer tout le contenu de `schema-org-snippet.html` dans `<head>` de `index.html`
  - Juste avant `</head>`
  - Valider sur : https://search.google.com/test/rich-results

- [ ] **4.** Remplacer le `<head>` de `methodes-maintenance.html` avec le template correspondant
  - Vérifier le title, canonical, og:title dans l'outil d'inspection

- [ ] **5.** Remplacer le `<head>` de `climatisation.html` avec le template correspondant

- [ ] **6.** Ajouter `<meta name="robots" content="noindex, follow">` dans :
  - `mentions-legales.html`
  - `politique-confidentialite.html`

- [ ] **7.** Dans `index.html` <head>, modifier :
  - Title : remplacer par `IMMEIT — Maintenance Industrielle &amp; Méthodes | Dakar · Paris`
  - Ajouter : `<link rel="alternate" hreflang="fr" href="https://www.immeit.com/">`
  - Ajouter : `<link rel="alternate" hreflang="x-default" href="https://www.immeit.com/">`

- [ ] **8.** Soumettre le sitemap dans Google Search Console
  - Aller sur : https://search.google.com/search-console/
  - Sitemaps → Ajouter : `https://www.immeit.com/sitemap.xml`
  - Vérifier aussi sur Bing Webmaster Tools : https://www.bing.com/webmasters/

---

### SPRINT 2 — Performance images (2-3h)

- [ ] **9.** Convertir toutes les images en WebP via https://squoosh.app
  - `indicateur-de-production.jpg` → générer versions 480w, 768w, 1200w en WebP + JPEG
  - `logo-immeit.jpeg` → WebP
  - `logo-P2M.jpeg` → WebP
  - `logo-INDUSTRELEC.jpeg` → WebP

- [ ] **10.** Remplacer les balises `<img>` dans index.html avec les balises `<picture>` du fichier `correctifs-images-responsive.html`

- [ ] **11.** Ajouter dans `<head>` de index.html le preload héro :
  ```html
  <link rel="preload" as="image" href="indicateur-de-production.webp" type="image/webp">
  ```

- [ ] **12.** Remplacer le script des compteurs KPI par la version du fichier `correctifs-images-responsive.html`

---

### SPRINT 3 — Sécurité et finitions (1-2h)

- [ ] **13.** Déposer le fichier `.htaccess` à la racine (fusionner avec l'existant si déjà présent)
  - ⚠️ ATTENTION : faire une SAUVEGARDE de l'htaccess actuel avant
  - Tester immédiatement que le site répond correctement après déploiement
  - Commencer avec HSTS `max-age=86400` (1 jour) avant de passer à 1 an

- [ ] **14.** Vérifier le score sécurité sur : https://securityheaders.com/?q=www.immeit.com

- [ ] **15.** Ajouter `lang="fr"` sur `<html>` de toutes les pages secondaires

---

### SPRINT 4 — Visibilité locale (4h)

- [ ] **16.** Créer Google Business Profile pour Dakar :
  - https://business.google.com/ → Ajouter une entreprise
  - Catégorie : "Ingénierie industrielle" ou "Entreprise de maintenance"
  - Adresse : Cité Safco Niacoulrab, Villa N°40, Keur Massar, Dakar
  - Téléphone : +221 71 033 88 09
  - Lien site : https://www.immeit.com
  - Ajouter photos (logo + photo bureau/équipe)

- [ ] **17.** Créer Google Business Profile pour Paris (même compte, second établissement)

- [ ] **18.** S'inscrire sur les annuaires pro francophones :
  - https://www.kompass.com (premium pour SN et FR)
  - https://www.goafricaonline.com/sn/ (Sénégal)
  - https://www.pagesjaunes.fr (France)
  - https://www.societe.com (France)

---

## 🎯 Score projeté après chaque sprint

| Après sprint | Score estimé |
|-------------|-------------|
| Baseline (actuel) | 56/100 |
| Sprint 1 (SEO) | 72/100 |
| Sprint 2 (Performance) | 78/100 |
| Sprint 3 (Sécurité) | 83/100 |
| Sprint 4 (Local) | 87/100 |

---

## 🔍 Outils de vérification

- Lighthouse : Chrome DevTools → onglet Lighthouse (mobile + desktop)
- Rich Snippets : https://search.google.com/test/rich-results
- Security headers : https://securityheaders.com
- robots.txt validator : https://www.google.com/webmasters/tools/robots-testing-tool
- Meta tags : https://metatags.io/?url=https://www.immeit.com
- Page Speed Insights : https://pagespeed.web.dev/?url=https://www.immeit.com
- WAVE accessibility : https://wave.webaim.org/report#/https://www.immeit.com

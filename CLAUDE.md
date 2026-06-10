# CLAUDE.md — Corrections prioritaires audit www.immeit.com
> Fichier d'instructions pour agent IA (Claude Code, Cursor, Cline, Gemini CLI).
> Lire entièrement avant de commencer. Exécuter les tâches dans l'ordre des priorités.

---

## Contexte du projet

- **Site :** www.immeit.com — site vitrine statique HTML/CSS/JS
- **Hébergeur :** Vercel (déploiement depuis GitHub)
- **Pages existantes :**
  - `index.html` — page principale
  - `methodes-maintenance.html` — page service
  - `climatisation.html` — page service
  - `mentions-legales.html` — page légale
  - `politique-confidentialite.html` — page légale
- **Services tiers :** Google Analytics 4 (GA4), Formspree (formulaire contact)
- **Score audit global avant corrections : 43/100**

---

## Instructions pour l'agent IA

1. Traiter les tâches dans l'ordre numérique strict (P1 avant P2 avant P3).
2. Pour chaque tâche : lire le fichier cible avant de modifier, ne jamais écraser du contenu existant sans le conserver.
3. Les blocs de code fournis sont à insérer/remplacer exactement là où indiqué.
4. Créer les nouveaux fichiers à la racine du projet sauf indication contraire.
5. Après chaque groupe de tâches, confirmer les fichiers modifiés/créés.

---

## PRIORITÉ 1 — Critique (RGPD + Sécurité)

### T01 — Créer `vercel.json` avec headers de sécurité

Créer le fichier `vercel.json` à la racine du projet avec ce contenu exact :

```json
{
  "cleanUrls": true,
  "trailingSlash": false,
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=(), payment=()"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://www.google-analytics.com https://formspree.io; frame-ancestors 'none'"
        }
      ]
    }
  ]
}
```

---

### T02 — Corriger la contradiction légale sur les cookies

**Problème :** `mentions-legales.html` dit "aucun cookie de traçage" alors que `politique-confidentialite.html` mentionne Google Analytics. Contradiction RGPD active.

Dans `mentions-legales.html`, localiser la section Cookies (section 5 ou équivalent) et remplacer tout texte indiquant l'absence de cookies de traçage par :

```html
<h2>5. Cookies</h2>
<p>
  Ce site utilise Google Analytics, un service de mesure d'audience de Google LLC,
  qui dépose un cookie à des fins statistiques (audiences anonymisées).
  Conformément au RGPD et aux recommandations de la CNIL, votre consentement
  est recueilli avant tout dépôt de ce cookie via notre bandeau de gestion des cookies.
</p>
<p>
  Vous pouvez à tout moment modifier vos préférences via le lien
  <a href="#" id="open-cookie-preferences">Gérer mes cookies</a>
  ou en consultant notre
  <a href="/politique-confidentialite.html">politique de confidentialité</a>.
</p>
<p>
  Les messages transmis via le formulaire de contact transitent par
  <strong>Formspree, Inc.</strong> (sous-traitant technique, États-Unis)
  sous protocole HTTPS sécurisé.
</p>
```

---

### T03 — Ajouter Consent Mode v2 + bandeau CMP dans `index.html`

Dans `index.html`, dans la section `<head>`, **avant** le script Google Analytics existant, insérer :

```html
<!-- Consent Mode v2 Google — refus par défaut (RGPD) -->
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('consent', 'default', {
    'ad_storage': 'denied',
    'analytics_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'wait_for_update': 2000
  });
  gtag('js', new Date());
</script>
```

Ensuite, **après** le script GA4 existant, insérer le bandeau CMP :

```html
<!-- Bandeau consentement cookies (cookieconsent v3 — gratuit, RGPD-ready) -->
<link rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/orestbida/cookieconsent@3.0.1/dist/cookieconsent.css">
<script defer
  src="https://cdn.jsdelivr.net/gh/orestbida/cookieconsent@3.0.1/dist/cookieconsent.umd.js">
</script>
<script>
  document.addEventListener('DOMContentLoaded', function () {
    CookieConsent.run({
      guiOptions: {
        consentModal: { layout: 'bar', position: 'bottom' }
      },
      categories: {
        necessary: {
          enabled: true,
          readOnly: true
        },
        analytics: {
          enabled: false,
          services: {
            ga4: {
              label: 'Google Analytics 4',
              onAccept: function () {
                gtag('consent', 'update', { 'analytics_storage': 'granted' });
              },
              onReject: function () {
                gtag('consent', 'update', { 'analytics_storage': 'denied' });
              }
            }
          }
        }
      },
      language: {
        default: 'fr',
        translations: {
          fr: {
            consentModal: {
              title: 'Nous utilisons des cookies',
              description: 'IMMEIT utilise Google Analytics pour mesurer l\'audience du site de façon anonymisée. Vous pouvez accepter ou refuser ce cookie.',
              acceptAllBtn: 'Tout accepter',
              acceptNecessaryBtn: 'Refuser',
              showPreferencesBtn: 'Personnaliser',
              footer: '<a href="/mentions-legales.html">Mentions légales</a> · <a href="/politique-confidentialite.html">Politique de confidentialité</a>'
            },
            preferencesModal: {
              title: 'Préférences cookies',
              acceptAllBtn: 'Tout accepter',
              acceptNecessaryBtn: 'Tout refuser',
              savePreferencesBtn: 'Enregistrer',
              sections: [
                {
                  title: 'Cookies nécessaires',
                  description: 'Ces cookies sont indispensables au fonctionnement du site.',
                  linkedCategory: 'necessary'
                },
                {
                  title: 'Cookies de mesure d\'audience',
                  description: 'Google Analytics mesure les visites de façon anonymisée pour améliorer le site.',
                  linkedCategory: 'analytics'
                }
              ]
            }
          }
        }
      }
    });

    // Lien "Gérer mes cookies" dans mentions légales
    var btn = document.getElementById('open-cookie-preferences');
    if (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        CookieConsent.showPreferences();
      });
    }
  });
</script>
```

---

## PRIORITÉ 2 — Majeur (SEO + Cohérence)

### T04 — Remplacer `og:image` SVG par PNG dans `index.html`

Dans `<head>` de `index.html`, localiser :
```html
<meta property="og:image" content="...og-image.svg">
```
Remplacer par :
```html
<meta property="og:image" content="https://www.immeit.com/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:type" content="image/png">
<meta property="og:image:alt" content="IMMEIT — Expert en méthodes de maintenance et performance industrielle">
```

> **Note manuelle :** Créer le fichier `og-image.png` (1200×630 px, fond #111927, logo IMMEIT centré, tagline "Expert en méthodes de maintenance industrielle", couleur texte #FFFFFF). Outils : Canva, Figma, ou GIMP.

---

### T05 — Compléter les balises meta de `methodes-maintenance.html`

Dans la section `<head>`, après les balises existantes (`<title>`, `<meta charset>`, `<meta viewport>`), ajouter :

```html
<html lang="fr"><!-- S'assurer que l'attribut lang="fr" est bien présent sur la balise <html> -->

<!-- SEO de base -->
<meta name="author" content="IMMEIT">
<meta name="language" content="fr">
<meta name="robots" content="index, follow">
<meta name="theme-color" content="#111927">
<link rel="canonical" href="https://www.immeit.com/methodes-maintenance.html">

<!-- Open Graph -->
<meta property="og:title" content="Méthodes Maintenance & Performance Industrielle — IMMEIT">
<meta property="og:description" content="IMMEIT accompagne les industriels dans la structuration de leur maintenance : audit, GMAO, KPI, AMDEC, plans de maintenance préventive et réglementaire.">
<meta property="og:image" content="https://www.immeit.com/og-methodes.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="https://www.immeit.com/methodes-maintenance.html">
<meta property="og:type" content="website">
<meta property="og:site_name" content="IMMEIT">
<meta property="og:locale" content="fr_FR">

<!-- Twitter / X Cards -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Méthodes Maintenance & Performance Industrielle — IMMEIT">
<meta name="twitter:description" content="Solutions de maintenance structurées à Dakar et Paris : audit, GMAO, KPI, fiabilité.">
<meta name="twitter:image" content="https://www.immeit.com/og-methodes.png">
```

> **Note :** Appliquer le même traitement à `climatisation.html` en adaptant le titre, la description et l'image à la thématique climatisation/CVC.

---

### T06 — Créer `robots.txt`

Créer le fichier `robots.txt` à la racine du projet (dossier `public/` si Vercel utilise un dossier source, sinon à la racine) :

```
User-agent: *
Allow: /
Disallow:

Sitemap: https://www.immeit.com/sitemap.xml
```

---

### T07 — Créer `sitemap.xml`

Créer le fichier `sitemap.xml` à la racine du projet (même dossier que `robots.txt`) :

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.immeit.com/</loc>
    <lastmod>2026-06-10</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://www.immeit.com/methodes-maintenance.html</loc>
    <lastmod>2026-06-10</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://www.immeit.com/climatisation.html</loc>
    <lastmod>2026-06-10</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>
```

---

### T08 — Ajouter Schema.org JSON-LD dans `index.html`

Dans `<head>` de `index.html`, ajouter avant `</head>` :

```html
<!-- Données structurées Schema.org — LocalBusiness -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "name": "IMMEIT",
  "alternateName": "Installation, Méthodes et Maintenance des Équipements Industriels et Tertiaires",
  "description": "Cabinet expert en méthodes de maintenance et performance industrielle, accompagnant les entreprises de Dakar à Paris dans la fiabilisation de leurs équipements.",
  "url": "https://www.immeit.com",
  "logo": "https://www.immeit.com/logo-immeit.svg",
  "image": "https://www.immeit.com/og-image.png",
  "telephone": "+221710338809",
  "email": "contact@immeit.com",
  "foundingDate": "2024",
  "founder": {
    "@type": "Person",
    "name": "Yelli NIANG"
  },
  "address": [
    {
      "@type": "PostalAddress",
      "streetAddress": "Cité Safco Niacoulrab, Villa N°40",
      "postalCode": "11515",
      "addressLocality": "Keur Massar, Dakar",
      "addressCountry": "SN"
    },
    {
      "@type": "PostalAddress",
      "addressLocality": "Paris",
      "addressCountry": "FR"
    }
  ],
  "areaServed": [
    { "@type": "Country", "name": "Sénégal" },
    { "@type": "Country", "name": "France" },
    { "@type": "Country", "name": "Mali" },
    { "@type": "Country", "name": "Côte d'Ivoire" }
  ],
  "sameAs": [
    "https://www.linkedin.com/company/immeit-installation-m%C3%A9thodes-maintenance-des-%C3%A9quipements-industriels-et-tertiaires/"
  ],
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Services IMMEIT",
    "itemListElement": [
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Audit de maintenance industrielle" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Méthodes de maintenance (AMDEC, GMAO, KPI)" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Maintenance climatisation CVC" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Plans de maintenance préventive et réglementaire" } }
    ]
  }
}
</script>
```

---

### T09 — Ajouter le footer complet aux sous-pages de service

Dans `methodes-maintenance.html` et `climatisation.html`, **à la fin du `<body>`**, vérifier si un `<footer>` complet est présent. S'il est absent ou incomplet (pas de liens légaux, pas de copyright, pas de réseaux sociaux), le remplacer/ajouter :

```html
<footer role="contentinfo" class="site-footer">
  <div class="footer-container">

    <div class="footer-brand">
      <a href="/">
        <img src="/logo-immeit.svg" alt="IMMEIT — Retour à l'accueil" width="110" height="55"
          onerror="this.onerror=null; this.src='/logo-immeit.jpeg';">
      </a>
      <p class="footer-tagline">Expert en méthodes de maintenance<br>et performance industrielle</p>
    </div>

    <nav aria-label="Navigation secondaire du footer">
      <ul>
        <li><a href="/#about">À propos</a></li>
        <li><a href="/#services">Nos services</a></li>
        <li><a href="/#methodologie">Méthodologie</a></li>
        <li><a href="/#faq">FAQ</a></li>
        <li><a href="/#contact">Contact</a></li>
      </ul>
    </nav>

    <div class="footer-services">
      <p><strong>Nos expertises</strong></p>
      <ul>
        <li><a href="/methodes-maintenance.html">Méthodes de maintenance</a></li>
        <li><a href="/climatisation.html">Climatisation CVC</a></li>
      </ul>
    </div>

    <div class="footer-contact">
      <p><strong>Contact</strong></p>
      <p>
        <a href="tel:+221710338809">+221 71 033 88 09 🇸🇳</a><br>
        <a href="tel:+33754011945">+33 7 54 01 19 45 🇫🇷</a><br>
        <a href="mailto:contact@immeit.com">contact@immeit.com</a>
      </p>
      <div class="footer-social">
        <a href="https://www.linkedin.com/company/immeit-installation-m%C3%A9thodes-maintenance-des-%C3%A9quipements-industriels-et-tertiaires/"
          aria-label="IMMEIT sur LinkedIn" rel="noopener noreferrer" target="_blank">LinkedIn</a>
        <a href="https://wa.me/221710338809" aria-label="WhatsApp Sénégal"
          rel="noopener noreferrer" target="_blank">WhatsApp 🇸🇳</a>
        <a href="https://wa.me/33754011945" aria-label="WhatsApp France"
          rel="noopener noreferrer" target="_blank">WhatsApp 🇫🇷</a>
      </div>
    </div>

  </div>

  <div class="footer-legal">
    <p>© 2026 IMMEIT — Tous droits réservés</p>
    <nav aria-label="Liens légaux">
      <a href="/mentions-legales.html">Mentions légales</a>
      <a href="/politique-confidentialite.html">Politique de confidentialité</a>
    </nav>
  </div>
</footer>
```

---

### T10 — Corriger les liens de navigation des sous-pages

Dans `methodes-maintenance.html` et `climatisation.html`, effectuer un remplacement global :

| Rechercher | Remplacer par |
|---|---|
| `href="https://www.immeit.com/index.html#` | `href="/#` |
| `href="/index.html#` | `href="/#` |
| `href="index.html#` | `href="/#` |

Exemple :
```html
<!-- AVANT -->
<a href="https://www.immeit.com/index.html#about">À propos</a>
<a href="/index.html#contact">Contact</a>

<!-- APRÈS -->
<a href="/#about">À propos</a>
<a href="/#contact">Contact</a>
```

---

## PRIORITÉ 3 — Mineur (Performance + UX)

### T11 — Remplacer les images JPEG par WebP (avec fallback)

Pour chaque image `.jpg` / `.jpeg` référencée dans les fichiers HTML (logos partenaires, photos, illustrations), remplacer la balise `<img>` par un élément `<picture>` :

```html
<!-- AVANT -->
<img src="/indicateur-de-production.jpg" alt="Tableau de bord KPI industriel">

<!-- APRÈS -->
<picture>
  <source srcset="/indicateur-de-production.webp" type="image/webp">
  <img src="/indicateur-de-production.jpg" alt="Tableau de bord KPI industriel"
    loading="lazy" width="800" height="600">
</picture>

<!-- Exemple logo partenaire -->
<picture>
  <source srcset="/logo-P2M.webp" type="image/webp">
  <img src="/logo-P2M.jpeg" alt="Logo P2M — Partenaire IMMEIT"
    loading="lazy" width="120" height="60">
</picture>
```

> **Note :** Les fichiers `.webp` doivent être créés séparément (conversion avec `cwebp`, Squoosh, ou Photoshop). Commande : `cwebp -q 85 fichier.jpg -o fichier.webp`

---

### T12 — Remplacer le logo JPEG par SVG

Dans tous les fichiers HTML, remplacer :
```html
<img src="/logo-immeit.jpeg" alt="...">
```
Par :
```html
<img src="/logo-immeit.svg" alt="IMMEIT" width="110" height="55"
  onerror="this.onerror=null; this.src='/logo-immeit.jpeg';">
```

---

### T13 — Créer la page `404.html`

Créer `404.html` à la racine du projet. La page doit reprendre exactement le header et footer du site (même `<link>` CSS, même logo, même navigation) :

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page introuvable (404) — IMMEIT</title>
  <meta name="robots" content="noindex, nofollow">
  <!-- Reprendre ici les mêmes <link> CSS que les autres pages -->
</head>
<body>
  <!-- Reprendre le même <header> / nav que les autres pages -->

  <main id="main-content" style="min-height:60vh; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:4rem 1.5rem;">
    <p style="font-size:5rem; font-weight:700; opacity:.15;">404</p>
    <h1 style="font-size:1.75rem; margin-bottom:1rem;">Page introuvable</h1>
    <p style="max-width:420px; margin-bottom:2rem; opacity:.7;">
      Cette page n'existe pas ou a été déplacée.
      Retournez à l'accueil pour retrouver nos services.
    </p>
    <a href="/" class="btn-primary">Retour à l'accueil</a>
  </main>

  <!-- Reprendre le même <footer> que les autres pages -->
</body>
</html>
```

---

### T14 — Ajouter skip-to-content sur `methodes-maintenance.html`

Juste après la balise `<body>`, insérer :

```html
<a href="#main-content" class="skip-link">Aller au contenu principal</a>
```

S'assurer que le contenu principal a bien `id="main-content"`. Ajouter le CSS si absent :

```css
.skip-link {
  position: absolute;
  left: -9999px;
  top: 0;
  z-index: 9999;
  background: #F59E0B;
  color: #111927;
  padding: 8px 16px;
  font-weight: 700;
  border-radius: 0 0 4px 4px;
}
.skip-link:focus {
  left: 0;
}
```

---

### T15 — Ajouter les preconnect hints dans `index.html`

Dans `<head>` de `index.html`, **en tout premier** (avant les CSS), ajouter :

```html
<!-- Preconnect pour ressources tierces -->
<link rel="preconnect" href="https://www.googletagmanager.com" crossorigin>
<link rel="preconnect" href="https://www.google-analytics.com" crossorigin>
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="dns-prefetch" href="//formspree.io">
<link rel="dns-prefetch" href="//cdn.jsdelivr.net">
```

---

### T16 — Ajouter bouton retour en haut dans `index.html`

Avant `</body>` de `index.html`, ajouter :

```html
<!-- Bouton retour en haut -->
<button id="back-to-top" aria-label="Retour en haut de page" title="Retour en haut">
  &#8679;
</button>

<style>
#back-to-top {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 44px;
  height: 44px;
  background: #F59E0B;
  color: #111927;
  border: none;
  border-radius: 50%;
  font-size: 22px;
  font-weight: 700;
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
  transition: opacity .3s, transform .3s;
  z-index: 999;
  box-shadow: 0 2px 8px rgba(0,0,0,.3);
}
#back-to-top.visible {
  opacity: 1;
  pointer-events: auto;
}
#back-to-top:hover {
  transform: translateY(-3px);
}
</style>

<script>
(function () {
  var btn = document.getElementById('back-to-top');
  window.addEventListener('scroll', function () {
    btn.classList.toggle('visible', window.scrollY > 450);
  }, { passive: true });
  btn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
</script>
```

---

### T17 — Ajouter CTA de conversion sur `climatisation.html`

Avant le `<footer>` de `climatisation.html`, insérer une section de conversion :

```html
<section class="cta-section" style="text-align:center; padding:4rem 1.5rem; background: var(--color-bg-alt, #1a2535);">
  <h2 style="font-size:1.75rem; margin-bottom:1rem;">Demandez un devis climatisation gratuit</h2>
  <p style="max-width:480px; margin:0 auto 2rem; opacity:.8;">
    Nos experts IMMEIT évaluent vos besoins en climatisation et CVC
    et vous contactent sous 24h ouvrées.
  </p>
  <div style="display:flex; gap:1rem; justify-content:center; flex-wrap:wrap;">
    <a href="/#contact" class="btn-primary">Demander un devis</a>
    <a href="tel:+221710338809" class="btn-secondary">+221 71 033 88 09</a>
  </div>
</section>
```

---

### T18 — Ajouter liens WhatsApp France dans le footer de `index.html`

Dans le footer existant de `index.html`, ajouter le lien WhatsApp France à côté du lien WhatsApp Sénégal :

```html
<a href="https://wa.me/33754011945"
  aria-label="Contacter IMMEIT sur WhatsApp France"
  rel="noopener noreferrer"
  target="_blank">
  WhatsApp France 🇫🇷
</a>
```

---

## Récapitulatif des fichiers à créer / modifier

| Fichier | Action | Tâches |
|---|---|---|
| `vercel.json` | **Créer** | T01 |
| `index.html` | **Modifier** | T03, T04, T08, T15, T16, T18 |
| `methodes-maintenance.html` | **Modifier** | T05, T09, T10, T14 |
| `climatisation.html` | **Modifier** | T05, T09, T10, T17 |
| `mentions-legales.html` | **Modifier** | T02 |
| `robots.txt` | **Créer** | T06 |
| `sitemap.xml` | **Créer** | T07 |
| `404.html` | **Créer** | T13 |
| Toutes les pages HTML | **Modifier** | T11, T12 |

## Actions manuelles requises (non automatisables par l'IA)

- [ ] Créer `og-image.png` (1200×630 px) — Canva / Figma / GIMP
- [ ] Créer `og-methodes.png` et `og-climatisation.png` pour les sous-pages
- [ ] Convertir les fichiers JPEG en WebP : `cwebp -q 85 fichier.jpg -o fichier.webp`
- [ ] Tester le bandeau CMP sur mobile iOS Safari après déploiement
- [ ] Valider le sitemap dans Google Search Console après déploiement
- [ ] Soumettre robots.txt dans Google Search Console
- [ ] Tester les balises OG via [developers.facebook.com/tools/debug](https://developers.facebook.com/tools/debug/) et [cards-dev.twitter.com/validator](https://cards-dev.twitter.com/validator)
- [ ] Valider les données structurées via [search.google.com/test/rich-results](https://search.google.com/test/rich-results)

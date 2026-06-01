# Plan de corrections responsivité — www.immeit.com
> Document de spécifications techniques à transmettre à une IA de développement.  
> Priorités : P1 (critique / bloquant), P2 (important), P3 (amélioration).  
> Toutes les corrections sont CSS/HTML first, sans framework externe requis.

---

## Contexte du site

- Site vitrine one-page en HTML/CSS/JS vanille
- Pages : `index.html` (principale) + `pourquoi-choisir-immeit.html` (sous-page)
- Sections : Hero · À propos · Services · Méthodologie · Piliers · Engagements · FAQ · Témoignages · Contact · Footer
- Cible mobile prioritaire : Android 360px, iPhone 390px, tablette 768px

---

## CORRECTION 1 — Menu hamburger mobile [P1 — CRITIQUE]

### Problème
La navigation contient 8 liens texte affichés en ligne. Sur écran < 768px, ils débordent horizontalement et se superposent. Aucun mécanisme de collapse n'existe.

### Ce que tu dois faire

**1.1 — Ajouter le bouton hamburger dans le `<header>` / `<nav>`**

```html
<!-- Ajouter dans le <header>, après le logo, AVANT la liste de liens -->
<button
  class="nav-toggle"
  aria-label="Ouvrir le menu"
  aria-expanded="false"
  aria-controls="nav-menu"
>
  <span class="hamburger-bar"></span>
  <span class="hamburger-bar"></span>
  <span class="hamburger-bar"></span>
</button>
```

**1.2 — Ajouter un `id` à la liste de navigation**

```html
<!-- Trouver le <ul> ou <nav> contenant les liens et ajouter id="nav-menu" -->
<ul id="nav-menu" class="nav-links">
  <!-- liens existants inchangés -->
</ul>
```

**1.3 — CSS à ajouter**

```css
/* ========== NAVIGATION MOBILE ========== */
.nav-toggle {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  min-width: 44px;
  min-height: 44px;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
  z-index: 1001;
}

.hamburger-bar {
  display: block;
  width: 24px;
  height: 2px;
  background-color: currentColor;
  border-radius: 2px;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

/* Animation croix quand le menu est ouvert */
.nav-toggle[aria-expanded="true"] .hamburger-bar:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}
.nav-toggle[aria-expanded="true"] .hamburger-bar:nth-child(2) {
  opacity: 0;
}
.nav-toggle[aria-expanded="true"] .hamburger-bar:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

@media (max-width: 767px) {
  .nav-toggle {
    display: flex;
  }

  #nav-menu {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    background-color: #111927; /* couleur thème du site */
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2rem;
    z-index: 1000;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  #nav-menu.is-open {
    display: flex;
  }

  #nav-menu a {
    font-size: 1.25rem;
    padding: 12px 24px;
    min-height: 44px;
    display: flex;
    align-items: center;
    color: #ffffff;
    text-decoration: none;
  }

  #nav-menu a:hover,
  #nav-menu a:focus {
    opacity: 0.75;
  }
}
```

**1.4 — JavaScript à ajouter (en fin de `<body>` ou dans le script existant)**

```javascript
const navToggle = document.querySelector('.nav-toggle');
const navMenu   = document.getElementById('nav-menu');

if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', isOpen.toString());
    navToggle.setAttribute('aria-label', isOpen ? 'Fermer le menu' : 'Ouvrir le menu');
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Fermer le menu au clic sur un lien
  navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Ouvrir le menu');
      document.body.style.overflow = '';
    });
  });

  // Fermer avec la touche Échap
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navMenu.classList.contains('is-open')) {
      navMenu.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      navToggle.focus();
    }
  });
}
```

### Critères de validation
- [ ] Sur 360px : le menu hamburger est visible, les liens texte sont masqués
- [ ] Clic sur le hamburger : le menu s'ouvre en plein écran
- [ ] Clic sur un lien : le menu se ferme et la page scrolle vers la section
- [ ] Touche Échap : ferme le menu
- [ ] `aria-expanded` bascule correctement entre `true` et `false`

---

## CORRECTION 2 — Formulaire de contact responsive [P1 — CRITIQUE]

### Problème
Les champs du formulaire (Prénom, Nom, Email, Sujet, Message) n'ont pas de largeur fluide déclarée. Sur iOS Safari, les `<input>` sans `font-size: 16px` déclenchent un zoom automatique indésirable.

### Ce que tu dois faire

**2.1 — CSS à ajouter (dans la media query mobile ET globalement)**

```css
/* ========== FORMULAIRE — BASE GLOBALE ========== */
.contact-form input,
.contact-form select,
.contact-form textarea {
  width: 100%;
  box-sizing: border-box;
  font-size: 16px; /* IMPÉRATIF : évite le zoom auto sur iOS Safari */
  padding: 12px 16px;
  border-radius: 6px;
  border: 1px solid #ccc;
  background: #fff;
  color: #111;
  transition: border-color 0.2s ease;
  -webkit-appearance: none; /* supprime les styles natifs iOS */
  appearance: none;
}

.contact-form input:focus,
.contact-form select:focus,
.contact-form textarea:focus {
  outline: none;
  border-color: #111927;
  box-shadow: 0 0 0 3px rgba(17, 25, 39, 0.15);
}

.contact-form textarea {
  min-height: 140px;
  resize: vertical;
}

/* Ligne Prénom / Nom côte à côte sur desktop, colonne sur mobile */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 600px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .contact-form input,
  .contact-form select,
  .contact-form textarea {
    font-size: 16px; /* maintenir 16px sur mobile */
  }
}
```

**2.2 — HTML : restructurer le formulaire si les champs Prénom/Nom sont côte à côte**

```html
<!-- Envelopper Prénom et Nom dans un div.form-row -->
<div class="form-row">
  <div class="form-group">
    <label for="prenom">Prénom *</label>
    <input type="text" id="prenom" name="prenom" required autocomplete="given-name">
  </div>
  <div class="form-group">
    <label for="nom">Nom *</label>
    <input type="text" id="nom" name="nom" required autocomplete="family-name">
  </div>
</div>
```

**2.3 — Compteur de caractères et bouton submit**

```css
/* Placement du compteur au-dessus du bouton */
.char-counter {
  display: block;
  text-align: right;
  font-size: 12px;
  color: #666;
  margin-top: 4px;
  margin-bottom: 12px;
}

.contact-form .btn-submit {
  width: 100%;
  min-height: 48px;
  font-size: 16px;
  cursor: pointer;
  padding: 12px 24px;
}

@media (min-width: 600px) {
  .contact-form .btn-submit {
    width: auto; /* bouton de taille naturelle sur desktop */
  }
}
```

**2.4 — Test clavier virtuel mobile**
Après correction, tester sur un vrai device (ou DevTools Device Mode) :
1. Ouvrir le formulaire sur mobile
2. Tapper dans le champ Prénom → aucun zoom ne doit se déclencher
3. Faire défiler jusqu'au bouton "Envoyer" → il doit rester visible au-dessus du clavier

### Critères de validation
- [ ] Aucun zoom au focus des inputs sur iOS Safari
- [ ] Tous les champs font 100% de la largeur sur 360px
- [ ] Les champs Prénom/Nom s'empilent verticalement sur mobile
- [ ] Le bouton "Envoyer" est toujours accessible avec le clavier ouvert

---

## CORRECTION 3 — Image hero responsive avec srcset [P1 — CRITIQUE]

### Problème
L'image `indicateur-de-production.jpg` est chargée sans `srcset`. Sur mobile, une image 1200px+ est téléchargée inutilement, dégradant le LCP (Largest Contentful Paint).

### Ce que tu dois faire

**3.1 — Générer les variantes d'image**

Créer 3 versions de `indicateur-de-production.jpg` :
- `indicateur-de-production-480.jpg` → largeur 480px, qualité 75%
- `indicateur-de-production-768.jpg` → largeur 768px, qualité 80%
- `indicateur-de-production-1200.jpg` → largeur 1200px, qualité 85% (existant renommé)

Outils acceptables : `sharp`, `imagemagick`, `squoosh`, ou outil de build existant.

**3.2 — Si l'image est dans un tag `<img>` (cas fréquent pour le hero)**

```html
<img
  src="indicateur-de-production-768.jpg"
  srcset="
    indicateur-de-production-480.jpg  480w,
    indicateur-de-production-768.jpg  768w,
    indicateur-de-production-1200.jpg 1200w
  "
  sizes="
    (max-width: 480px) 480px,
    (max-width: 768px) 768px,
    1200px
  "
  alt="Tableau de bord des indicateurs de production industrielle"
  loading="eager"
  fetchpriority="high"
  width="1200"
  height="675"
>
```

**3.3 — Si l'image est en `background-image` CSS**

```css
.hero {
  background-image: url('indicateur-de-production-768.jpg');
  background-size: cover;
  background-position: center;
}

@media (min-width: 769px) {
  .hero {
    background-image: url('indicateur-de-production-1200.jpg');
  }
}

@media (max-width: 480px) {
  .hero {
    background-image: url('indicateur-de-production-480.jpg');
    background-position: center top; /* recadrer intelligemment sur mobile */
  }
}
```

**3.4 — Ajouter `loading="lazy"` sur toutes les autres images hors viewport**

```html
<!-- Logo IMMEIT dans la section À propos -->
<img src="logo-immeit.jpeg" alt="Logo IMMEIT" loading="lazy" width="120" height="60">

<!-- Toutes les images qui ne sont pas dans le premier écran visible -->
<!-- Ajouter loading="lazy" et les attributs width/height si absents -->
```

### Critères de validation
- [ ] Sur 360px : une image ≤ 480px est chargée (vérifier dans l'onglet Network de DevTools)
- [ ] Sur desktop : l'image 1200px est chargée
- [ ] L'image hero a `fetchpriority="high"` ou `loading="eager"` (c'est le LCP)
- [ ] Toutes les autres images ont `loading="lazy"`
- [ ] Tous les `<img>` ont `width` et `height` pour éviter le layout shift (CLS)

---

## CORRECTION 4 — Grilles de services et piliers responsive [P2 — IMPORTANT]

### Problème
La section "2 domaines d'activités" et la section "9 piliers" utilisent probablement des grilles fixes. Sur mobile < 600px, les cartes sont trop étroites ou débordent.

### Ce que tu dois faire

**4.1 — Section "2 domaines d'activités"**

```css
/* Remplacer la grille fixe par une grille auto-adaptative */
.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  padding: 0;
}

@media (max-width: 600px) {
  .services-grid {
    grid-template-columns: 1fr; /* 1 colonne sur mobile */
    gap: 16px;
  }

  .service-card {
    padding: 20px;
  }

  /* Les liens de service doivent avoir une zone tactile suffisante */
  .service-card a,
  .service-card .btn {
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    padding: 10px 16px;
  }
}
```

**4.2 — Section "9 piliers"**

```css
.piliers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
}

@media (max-width: 600px) {
  .piliers-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .pilier-card {
    padding: 16px;
  }

  /* Le titre numéroté ne doit pas déborder */
  .pilier-card h3 {
    font-size: clamp(0.9rem, 3vw, 1.1rem);
    line-height: 1.4;
  }
}
```

**4.3 — Section "4 engagements"**

```css
.engagements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
}

@media (max-width: 600px) {
  .engagements-grid {
    grid-template-columns: 1fr;
  }
}
```

### Critères de validation
- [ ] Sur 360px : chaque service, pilier et engagement s'affiche en colonne unique
- [ ] Aucun débordement horizontal (`overflow-x: hidden` sur body ne doit pas être nécessaire)
- [ ] Le texte des titres de piliers reste lisible sans troncature

---

## CORRECTION 5 — Section méthodologie : stepper vertical sur mobile [P2 — IMPORTANT]

### Problème
Les 5 étapes numérotées (01 à 05) sont probablement en ligne horizontale. Sur mobile, elles sont illisibles ou créent un scroll horizontal.

### Ce que tu dois faire

**5.1 — CSS du stepper**

```css
/* ========== STEPPER — DESKTOP (horizontal) ========== */
.methodo-steps {
  display: flex;
  flex-direction: row;
  gap: 0;
  position: relative;
}

/* Ligne de connexion horizontale entre les étapes */
.methodo-steps::before {
  content: '';
  position: absolute;
  top: 28px; /* centré sur les cercles numérotés */
  left: 5%;
  right: 5%;
  height: 2px;
  background: linear-gradient(to right, #111927, #444);
  z-index: 0;
}

.methodo-step {
  flex: 1;
  text-align: center;
  padding: 0 12px;
  position: relative;
  z-index: 1;
}

.step-number {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #111927;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0 auto 16px;
}

/* ========== STEPPER — MOBILE (vertical) ========== */
@media (max-width: 767px) {
  .methodo-steps {
    flex-direction: column;
    gap: 0;
  }

  /* Ligne de connexion verticale */
  .methodo-steps::before {
    top: 28px;
    left: 27px; /* aligné avec le centre des cercles */
    right: auto;
    width: 2px;
    height: calc(100% - 56px);
    background: linear-gradient(to bottom, #111927, #444);
  }

  .methodo-step {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 20px;
    text-align: left;
    padding: 0 0 32px 0;
  }

  .methodo-step:last-child {
    padding-bottom: 0;
  }

  .step-number {
    flex-shrink: 0;
    margin: 0;
    width: 56px;
    height: 56px;
  }

  .step-content {
    flex: 1;
    padding-top: 10px;
  }

  .step-content h3 {
    font-size: 1rem;
    margin-bottom: 6px;
  }

  .step-content p {
    font-size: 0.9rem;
    line-height: 1.6;
    color: inherit;
  }
}
```

### Critères de validation
- [ ] Sur 360px : les 5 étapes s'affichent verticalement avec la ligne de connexion à gauche
- [ ] Sur 768px+ : les étapes reviennent en ligne horizontale
- [ ] Le texte descriptif de chaque étape est lisible sans scroll horizontal

---

## CORRECTION 6 — Zones tactiles minimum 44×44px [P2 — IMPORTANT]

### Problème
Certains boutons, liens et éléments interactifs ont des zones de clic insuffisantes pour les doigts sur mobile (recommandation Apple HIG et Material Design : 44px minimum).

### Ce que tu dois faire

**6.1 — Règle CSS globale à appliquer**

```css
/* ========== ZONES TACTILES MOBILES ========== */
@media (max-width: 767px) {
  /* Tous les liens de navigation */
  nav a,
  .nav-links a {
    min-height: 44px;
    display: flex;
    align-items: center;
    padding: 10px 12px;
  }

  /* Tous les boutons */
  button,
  .btn,
  [role="button"],
  input[type="submit"],
  input[type="button"] {
    min-height: 44px;
    min-width: 44px;
    padding: 10px 20px;
    font-size: 1rem;
  }

  /* Liens d'action (CTA) dans le hero */
  .hero-cta a,
  .hero .btn {
    min-height: 48px;
    padding: 12px 28px;
    font-size: 1rem;
  }

  /* FAQ accordéon triggers */
  .faq-question,
  .faq-toggle,
  details summary {
    min-height: 48px;
    display: flex;
    align-items: center;
    padding: 12px 16px;
    cursor: pointer;
  }
}
```

**6.2 — Vérification des liens de service**

```css
/* Les 3 liens "Découvrir" des services */
.service-card .link-discover {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 10px 0;
  gap: 6px;
}
```

### Critères de validation
- [ ] Inspecter chaque élément cliquable sur mobile → dimensions ≥ 44×44px
- [ ] Les triggers FAQ ont une hauteur ≥ 48px
- [ ] Les boutons CTA hero ont une hauteur ≥ 48px

---

## CORRECTION 7 — Typographie fluide et lisibilité mobile [P2 — IMPORTANT]

### Problème
Sur mobile, les textes longs (descriptions des piliers, témoignages, FAQ) peuvent être trop petits si déclarés en valeurs fixes, et le H1 hero peut être disproportionné.

### Ce que tu dois faire

**7.1 — Typographie fluide avec `clamp()`**

```css
/* ========== TYPOGRAPHIE FLUIDE ========== */

/* H1 hero : grand sur desktop, raisonnable sur mobile */
.hero h1 {
  font-size: clamp(1.75rem, 5vw, 3.5rem);
  line-height: 1.2;
}

/* H2 sections */
h2 {
  font-size: clamp(1.4rem, 4vw, 2.5rem);
  line-height: 1.3;
}

/* H3 sous-sections */
h3 {
  font-size: clamp(1.1rem, 3vw, 1.5rem);
  line-height: 1.4;
}

/* Corps de texte : jamais en dessous de 15px */
body,
p,
li {
  font-size: clamp(0.9375rem, 2.5vw, 1rem); /* 15px → 16px */
  line-height: 1.7;
}

/* Textes secondaires (descriptions de piliers, etc.) */
.card-description,
.pilier-card p,
.service-description {
  font-size: clamp(0.875rem, 2.2vw, 0.9375rem);
  line-height: 1.65;
}
```

**7.2 — Section témoignages**

```css
/* ========== TÉMOIGNAGES ========== */
.testimonials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

@media (max-width: 600px) {
  .testimonials-grid {
    grid-template-columns: 1fr;
  }

  .testimonial-card blockquote {
    font-size: 0.9rem;
    line-height: 1.65;
  }

  /* Éviter les guillemets décoratifs qui débordent */
  .testimonial-card blockquote::before {
    font-size: 3rem;
    line-height: 0;
    vertical-align: -0.4em;
  }
}
```

### Critères de validation
- [ ] Le H1 hero ne dépasse pas la largeur du viewport sur 360px
- [ ] Aucun texte de corps en dessous de 15px sur mobile
- [ ] Les témoignages s'empilent sur mobile

---

## CORRECTION 8 — Accessibilité des liens réseaux sociaux et footer [P3 — AMÉLIORATION]

### Problème
Les liens LinkedIn, Facebook et WhatsApp dans le footer sont des URLs brutes sans texte d'ancre accessible. Les lecteurs d'écran et les utilisateurs sans vue ne peuvent pas identifier leur destination.

### Ce que tu dois faire

**8.1 — HTML : ajouter `aria-label` et du texte masqué visuellement**

```html
<!-- AVANT (problématique) -->
<a href="https://www.linkedin.com/company/immeit-...">...</a>
<a href="https://www.facebook.com/immeit">...</a>
<a href="https://wa.me/221710338809">...</a>

<!-- APRÈS (accessible) -->
<a
  href="https://www.linkedin.com/company/immeit-installation-m%C3%A9thodes-maintenance-des-%C3%A9quipements-industriels-et-tertiaires/"
  aria-label="Suivez IMMEIT sur LinkedIn"
  target="_blank"
  rel="noopener noreferrer"
>
  <!-- icône SVG ou image existante -->
  <span class="sr-only">LinkedIn</span>
</a>

<a
  href="https://www.facebook.com/immeit"
  aria-label="Suivez IMMEIT sur Facebook"
  target="_blank"
  rel="noopener noreferrer"
>
  <span class="sr-only">Facebook</span>
</a>

<a
  href="https://wa.me/221710338809"
  aria-label="Contactez IMMEIT sur WhatsApp"
  target="_blank"
  rel="noopener noreferrer"
>
  <span class="sr-only">WhatsApp</span>
</a>
```

**8.2 — CSS pour la classe `.sr-only` (si non existante)**

```css
/* Texte visible uniquement par les lecteurs d'écran */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

**8.3 — Vérifier que les liens tel: sont présents partout**

```html
<!-- S'assurer que ces patterns apparaissent dans TOUT le HTML du site -->
<!-- Sénégal -->
<a href="tel:+221710338809">+221 71 033 88 09</a>
<!-- France -->
<a href="tel:+33754011945">+33 7 54 01 19 45</a>
<!-- Email -->
<a href="mailto:demandes-p2m@immeit.com">demandes-p2m@immeit.com</a>
```

### Critères de validation
- [ ] Chaque lien social a un `aria-label` descriptif
- [ ] Tous les liens ont `rel="noopener noreferrer"` si `target="_blank"`
- [ ] Les numéros de téléphone sont en `<a href="tel:...">` dans toutes les occurrences du site

---

## CORRECTION 9 — Animations : respect de `prefers-reduced-motion` [P3 — AMÉLIORATION]

### Problème
Les compteurs animés (0 → valeur finale) et autres animations JS/CSS consomment du CPU sur mobile lent et peuvent gêner les utilisateurs sensibles aux animations (épilepsie, vertiges).

### Ce que tu dois faire

**9.1 — CSS : désactiver toutes les animations CSS si préférence système**

```css
/* Ajouter à la FIN du fichier CSS, après toutes les déclarations */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**9.2 — JavaScript : compteurs animés**

```javascript
// Envelopper la logique d'animation des compteurs dans une vérification
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function animateCounter(element, targetValue, duration = 2000) {
  if (prefersReducedMotion) {
    // Afficher la valeur finale directement
    element.textContent = targetValue;
    return;
  }

  // ... logique d'animation existante ...
  let start = 0;
  const step = (timestamp) => {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    element.textContent = Math.floor(progress * targetValue);
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// Utiliser IntersectionObserver pour déclencher uniquement au scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseInt(el.dataset.target, 10);
      animateCounter(el, target);
      observer.unobserve(el);
    }
  });
}, { threshold: 0.5 });

// Observer tous les éléments de compteur
document.querySelectorAll('[data-counter]').forEach(el => observer.observe(el));
```

**9.3 — HTML : ajouter l'attribut `data-target` aux compteurs**

```html
<!-- Ajouter data-counter et data-target aux éléments de compteur -->
<span data-counter data-target="50">0</span> <!-- Clients accompagnés -->
<span data-counter data-target="10">0</span> <!-- Collaborateurs -->
<span data-counter data-target="3">0</span>  <!-- Domaines d'expertise -->
```

### Critères de validation
- [ ] Sur système avec `prefers-reduced-motion: reduce` (paramètre accessibilité Windows/macOS/iOS) : aucune animation ne se déclenche, les valeurs finales s'affichent directement
- [ ] Les compteurs se déclenchent uniquement quand ils entrent dans le viewport (IntersectionObserver)

---

## CORRECTION 10 — Section partenaires : contenu placeholder à corriger [P2 — IMPORTANT]

### Problème
La section "Nos partenaires" contient deux instances du logo IMMEIT, dont l'une pointe vers LinkedIn. C'est un contenu placeholder non finalisé qui consomme de l'espace inutilement sur mobile.

### Ce que tu dois faire — 2 options

**Option A (recommandée) : Ajouter les vrais logos partenaires**

```html
<section class="partners">
  <p class="section-label">Nos partenaires</p>
  <div class="partners-logos">
    <!-- Remplacer par les vrais logos des partenaires industriels -->
    <img src="logo-renault.svg"   alt="Renault Group" loading="lazy" height="40">
    <img src="logo-stellantis.svg" alt="Stellantis"    loading="lazy" height="40">
    <img src="logo-safran.svg"    alt="Safran"         loading="lazy" height="40">
    <!-- etc. selon les partenaires réels -->
  </div>
</section>
```

```css
.partners-logos {
  display: flex;
  flex-wrap: wrap;
  gap: 24px 40px;
  align-items: center;
  justify-content: center;
  filter: grayscale(100%); /* look professionnel unifié */
  opacity: 0.7;
}

.partners-logos img {
  height: 36px;
  width: auto;
  max-width: 120px;
  object-fit: contain;
}

@media (max-width: 480px) {
  .partners-logos {
    gap: 16px 24px;
  }
  .partners-logos img {
    height: 28px;
  }
}
```

**Option B : Supprimer la section temporairement**

```html
<!-- Commenter ou supprimer jusqu'à ce que les vrais logos soient disponibles -->
<!-- <section class="partners">...</section> -->
```

### Critères de validation
- [ ] La section affiche de vrais logos ou est absente (pas de doublon du logo IMMEIT)
- [ ] Les logos s'affichent en ligne sur desktop et en grille wrappée sur mobile

---

## CSS global mobile-first à vérifier / ajouter

**Ajouter ces règles de base si elles n'existent pas dans le fichier CSS principal :**

```css
/* ========== BASE MOBILE-FIRST ========== */

/* Empêcher le scroll horizontal global */
html, body {
  max-width: 100%;
  overflow-x: hidden;
}

/* Conteneur principal */
.container,
.wrapper {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  box-sizing: border-box;
}

@media (max-width: 480px) {
  .container,
  .wrapper {
    padding: 0 16px;
  }
}

/* Toutes les images sont fluides par défaut */
img {
  max-width: 100%;
  height: auto;
  display: block;
}

/* Box-sizing global */
*, *::before, *::after {
  box-sizing: border-box;
}

/* Scroll doux pour les ancres */
html {
  scroll-behavior: smooth;
}

/* Focus visible pour accessibilité clavier */
:focus-visible {
  outline: 3px solid #111927;
  outline-offset: 2px;
  border-radius: 2px;
}
```

---

## Ordre d'implémentation recommandé

| Ordre | Correction | Effort estimé | Impact |
|-------|-----------|---------------|--------|
| 1 | Menu hamburger (C1) | 3–4h | ⚡ Critique |
| 2 | CSS base mobile-first | 1h | ⚡ Critique |
| 3 | Formulaire contact (C2) | 1–2h | ⚡ Critique |
| 4 | Images srcset (C3) | 2–3h | ⚡ Critique |
| 5 | Grilles services/piliers (C4) | 1–2h | 🔶 Important |
| 6 | Stepper méthodologie (C5) | 2h | 🔶 Important |
| 7 | Zones tactiles (C6) | 1h | 🔶 Important |
| 8 | Typographie fluide (C7) | 1h | 🔶 Important |
| 9 | Section partenaires (C10) | 1h | 🔶 Important |
| 10 | Liens sociaux accessibles (C8) | 30min | 🔵 Amélioration |
| 11 | reduced-motion (C9) | 1h | 🔵 Amélioration |

**Durée totale estimée : 15 à 20 heures de développement**

---

## Checklist de validation finale (à faire après toutes les corrections)

### Tests DevTools (Chrome / Firefox)
- [ ] 360×640px (Samsung Galaxy A) — aucun scroll horizontal
- [ ] 390×844px (iPhone 14) — navigation hamburger fonctionnelle
- [ ] 768×1024px (tablette) — layout intermédiaire correct
- [ ] 1280×800px (desktop) — aucune régression

### Tests sur device réel
- [ ] iOS Safari 16+ : pas de zoom au focus des inputs
- [ ] Chrome Android : menu hamburger, tap targets
- [ ] Mode portrait ET paysage sur mobile

### Score Lighthouse
- [ ] Mobile Performance ≥ 75 (avant : estimé ~45–55)
- [ ] Accessibility ≥ 85 (avant : estimé ~60–70)
- [ ] Best Practices ≥ 90

### Outils recommandés
- Chrome DevTools → Device Toolbar (Ctrl+Shift+M)
- [PageSpeed Insights](https://pagespeed.web.dev/) → tester l'URL mobile
- [axe DevTools](https://www.deque.com/axe/) → audit accessibilité
- [WAVE](https://wave.webaim.org/) → vérification rapide accessibilité

---

*Document généré suite à l'audit responsivité de www.immeit.com — Mai 2026*

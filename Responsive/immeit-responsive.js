/* ============================================================
   IMMEIT — JAVASCRIPT RESPONSIVE
   Instruction pour l'IA : Ajoute ce script juste avant
   la balise </body> de chaque page HTML avec :
   <script src="immeit-responsive.js"></script>
   Ou copie tout ce contenu dans ton fichier JS existant.
   ============================================================ */


document.addEventListener('DOMContentLoaded', function () {


  /* ----------------------------------------------------------
     1. MENU HAMBURGER
     Cherche automatiquement .hamburger et .nav-links
  ---------------------------------------------------------- */

  const hamburger = document.querySelector('.hamburger');
  const navLinks  = document.querySelector('.nav-links');

  if (hamburger && navLinks) {

    hamburger.setAttribute('aria-label', 'Ouvrir le menu');
    hamburger.setAttribute('aria-expanded', 'false');

    hamburger.addEventListener('click', function () {
      const isOpen = navLinks.classList.toggle('open');
      hamburger.classList.toggle('active', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    /* Fermer le menu quand on clique sur un lien */
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('open');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    /* Fermer si on clique en dehors du menu */
    document.addEventListener('click', function (e) {
      if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('open');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });

    /* Fermer si on redimensionne au-dessus de 768px */
    window.addEventListener('resize', function () {
      if (window.innerWidth > 768) {
        navLinks.classList.remove('open');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }


  /* ----------------------------------------------------------
     2. COMPTEURS ANIMÉS (Clients, Collaborateurs, etc.)
     Cherche tous les éléments avec data-count="NNN"
  ---------------------------------------------------------- */

  function animateCounter(el, target, duration) {
    var start     = 0;
    var step      = Math.ceil(target / (duration / 16));
    var interval  = setInterval(function () {
      start += step;
      if (start >= target) {
        el.textContent = target + (el.dataset.suffix || '');
        clearInterval(interval);
      } else {
        el.textContent = start + (el.dataset.suffix || '');
      }
    }, 16);
  }

  var counters = document.querySelectorAll('[data-count]');

  if (counters.length > 0 && 'IntersectionObserver' in window) {
    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !entry.target.dataset.animated) {
          entry.target.dataset.animated = 'true';
          var target = parseInt(entry.target.dataset.count, 10);
          animateCounter(entry.target, target, 1500);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(function (counter) {
      counterObserver.observe(counter);
    });
  }


  /* ----------------------------------------------------------
     3. SCROLL REVEAL — apparition des sections au scroll
     S'applique aux éléments avec class="reveal"
  ---------------------------------------------------------- */

  var style = document.createElement('style');
  style.textContent = [
    '.reveal {',
    '  opacity: 0;',
    '  transform: translateY(30px);',
    '  transition: opacity 0.6s ease, transform 0.6s ease;',
    '}',
    '.reveal.visible {',
    '  opacity: 1;',
    '  transform: translateY(0);',
    '}'
  ].join('');
  document.head.appendChild(style);

  var revealEls = document.querySelectorAll('.reveal');

  if (revealEls.length > 0 && 'IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    revealEls.forEach(function (el) {
      revealObserver.observe(el);
    });
  }


  /* ----------------------------------------------------------
     4. FAQ ACCORDÉON
     Cherche automatiquement les .faq-question et .faq-answer
  ---------------------------------------------------------- */

  var faqStyle = document.createElement('style');
  faqStyle.textContent = [
    '.faq-answer {',
    '  max-height: 0;',
    '  overflow: hidden;',
    '  transition: max-height 0.35s ease, padding 0.35s ease;',
    '  padding: 0;',
    '}',
    '.faq-answer.open {',
    '  max-height: 500px;',
    '  padding-bottom: 1rem;',
    '}'
  ].join('');
  document.head.appendChild(faqStyle);

  var faqQuestions = document.querySelectorAll('.faq-question');

  faqQuestions.forEach(function (question) {
    question.addEventListener('click', function () {
      var answer = question.nextElementSibling;
      if (!answer) return;
      var isOpen = answer.classList.toggle('open');
      question.setAttribute('aria-expanded', isOpen);
    });
  });


  /* ----------------------------------------------------------
     5. BOUTON "RETOUR EN HAUT" automatique
  ---------------------------------------------------------- */

  var backBtn = document.createElement('button');
  backBtn.innerHTML    = '&#8679;';
  backBtn.title        = 'Retour en haut';
  backBtn.setAttribute('aria-label', 'Retour en haut de page');

  var backStyle = [
    'position:fixed',
    'bottom:1.5rem',
    'right:1.5rem',
    'width:44px',
    'height:44px',
    'border-radius:50%',
    'border:none',
    'font-size:1.4rem',
    'cursor:pointer',
    'opacity:0',
    'pointer-events:none',
    'transition:opacity 0.3s',
    'z-index:9999',
    'display:flex',
    'align-items:center',
    'justify-content:center'
  ].join(';');

  backBtn.setAttribute('style', backStyle);
  document.body.appendChild(backBtn);

  window.addEventListener('scroll', function () {
    var show = window.scrollY > 400;
    backBtn.style.opacity        = show ? '1' : '0';
    backBtn.style.pointerEvents  = show ? 'auto' : 'none';
  });

  backBtn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });


});

/* ============================================================
   FIN DU FICHIER IMMEIT-RESPONSIVE.JS
   ============================================================ */

/* ============================================================
   IMMEIT — JAVASCRIPT RESPONSIVE V2
   Hamburger, FAQ Accordéon, Compteurs, Témoignages dots
   ============================================================ */

(function () {
  'use strict';

  /* ── 1. MENU HAMBURGER ───────────────────────────────── */
  const hamburger = document.querySelector('.hamburger');
  const navLinks  = document.querySelector('.nav__links');
  const navOverlay = document.querySelector('.nav-overlay');

  if (hamburger && navLinks) {

    hamburger.setAttribute('aria-label', 'Ouvrir le menu de navigation');
    hamburger.setAttribute('aria-expanded', 'false');

    function toggleMenu(open) {
      const isOpen = open !== undefined ? open : !navLinks.classList.contains('open');
      navLinks.classList.toggle('open', isOpen);
      hamburger.classList.toggle('active', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
      if (navOverlay) navOverlay.classList.toggle('active', isOpen);
    }

    hamburger.addEventListener('click', function () {
      toggleMenu();
    });

    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        toggleMenu(false);
      });
    });

    if (navOverlay) {
      navOverlay.addEventListener('click', function () {
        toggleMenu(false);
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) {
        toggleMenu(false);
        hamburger.focus();
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 768) {
        toggleMenu(false);
      }
    });
  }

  /* ── 2. FAQ ACCORDÉON ─────────────────────────────────── */
  const faqItems = document.querySelectorAll('.faq__item');

  if (faqItems.length > 0 && typeof toggleFaq === 'undefined') {
    window.toggleFaq = function (el) {
      const isOpen = el.classList.contains('open');
      faqItems.forEach(function (item) {
        item.classList.remove('open');
      });
      if (!isOpen) {
        el.classList.add('open');
      }
    };
  }

  /* ── 3. COMPTEURS ANIMÉS ──────────────────────────────── */
  function animateCounter(el, target, duration) {
    var start = 0;
    var increment = target / (duration / 16);
    var current = start;

    var timer = setInterval(function () {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = Math.round(current) + (el.dataset.suffix || '');
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

  /* ── 4. TÉMOIGNAGES — DOTS PAGINATION ─────────────────── */
  var testimonialsTrack = document.querySelector('.testimonials__grid');
  var dots = document.querySelectorAll('.testimonials-dots .dot');

  if (testimonialsTrack && dots.length) {
    function updateDots() {
      var scrollLeft = testimonialsTrack.scrollLeft;
      var totalScroll = testimonialsTrack.scrollWidth - testimonialsTrack.clientWidth;
      var progress = totalScroll > 0 ? scrollLeft / totalScroll : 0;
      var activeIndex = Math.round(progress * (dots.length - 1));

      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === activeIndex);
      });
    }

    testimonialsTrack.addEventListener('scroll', updateDots, { passive: true });

    var cards = testimonialsTrack.querySelectorAll('.testimonial__card');
    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        var card = cards[i];
        if (card) {
          testimonialsTrack.scrollTo({
            left: card.offsetLeft - 16,
            behavior: 'smooth'
          });
        }
      });
    });

    updateDots();
  }

  /* ── 5. SCROLL REVEAL ─────────────────────────────────── */
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

  /* ── 6. FLIP-CARD TOUCH (mobile) ──────────────────────── */
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    document.querySelectorAll('.flip-card').forEach(function (card) {
      card.addEventListener('click', function () {
        this.classList.toggle('flipped');
      });
    });
  }

})();

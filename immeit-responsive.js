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
      if (window.innerWidth > 900) {
        toggleMenu(false);
      }
    });
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
    var cards = testimonialsTrack.querySelectorAll('.testimonial__card');

    function updateDots() {
      if (!cards.length) return;
      var trackCenter = testimonialsTrack.scrollLeft + testimonialsTrack.clientWidth / 2;
      var activeIndex = 0;
      var minDist = Infinity;
      cards.forEach(function (card, i) {
        var cardCenter = card.offsetLeft + card.offsetWidth / 2;
        var dist = Math.abs(trackCenter - cardCenter);
        if (dist < minDist) {
          minDist = dist;
          activeIndex = i;
        }
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === activeIndex);
      });
    }

    testimonialsTrack.addEventListener('scroll', updateDots, { passive: true });
    testimonialsTrack.addEventListener('scrollend', updateDots, { passive: true });
    window.addEventListener('resize', updateDots);

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        var card = cards[i];
        if (card) {
          var scrollAmount = card.offsetLeft - (testimonialsTrack.clientWidth - card.offsetWidth) / 2;
          testimonialsTrack.scrollTo({
            left: Math.max(0, scrollAmount),
            behavior: 'smooth'
          });
        }
      });
    });

    updateDots();
  }

  /* ── 5. MÉTHODOLOGIE — DOTS PAGINATION ─────────────────── */
  var methodoTrack = document.querySelector('.methodo__grid');
  var methodoDots = document.querySelectorAll('.methodo-dots .dot');

  if (methodoTrack && methodoDots.length) {
    var methodoCards = methodoTrack.querySelectorAll('.methodo__card');

    function updateMethodoDots() {
      if (!methodoCards.length) return;
      var trackCenter = methodoTrack.scrollLeft + methodoTrack.clientWidth / 2;
      var activeIndex = 0;
      var minDist = Infinity;
      methodoCards.forEach(function (card, i) {
        var cardCenter = card.offsetLeft + card.offsetWidth / 2;
        var dist = Math.abs(trackCenter - cardCenter);
        if (dist < minDist) {
          minDist = dist;
          activeIndex = i;
        }
      });
      methodoDots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === activeIndex);
      });
    }

    methodoTrack.addEventListener('scroll', updateMethodoDots, { passive: true });
    methodoTrack.addEventListener('scrollend', updateMethodoDots, { passive: true });
    window.addEventListener('resize', updateMethodoDots);

    methodoDots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        var card = methodoCards[i];
        if (card) {
          var scrollAmount = card.offsetLeft - (methodoTrack.clientWidth - card.offsetWidth) / 2;
          methodoTrack.scrollTo({
            left: Math.max(0, scrollAmount),
            behavior: 'smooth'
          });
        }
      });
    });

    updateMethodoDots();
  }

  /* ── 6. SCROLL REVEAL ─────────────────────────────────── */
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

})();

document.addEventListener('DOMContentLoaded', () => {
 
 
   // ===== CSRF Token =====
   function generateCSRFToken() {
     // Generate a random token
     const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
     // Set it in the meta tag and hidden input
     const metaTag = document.getElementById('csrf-token');
     const hiddenInput = document.getElementById('csrf_token_input');
     if (metaTag) metaTag.content = token;
     if (hiddenInput) hiddenInput.value = token;
     return token;
   }
   
   // Generate token on page load
   generateCSRFToken();
   
   // Regenerate token periodically (every hour) to prevent token theft
   setInterval(generateCSRFToken, 3600000);
 
   // ===== Loader =====
  const loader = document.getElementById('loader');
  window.addEventListener('load', () => {
    setTimeout(() => loader.classList.add('hidden'), 300);
  });
  setTimeout(() => loader.classList.add('hidden'), 2000);

  // ===== Particles =====
  const particlesContainer = document.getElementById('particles');
  if (particlesContainer) {
    for (let i = 0; i < 35; i++) {
      const p = document.createElement('div');
      p.className = 'hero__particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.width = (Math.random() * 3 + 2) + 'px';
      p.style.height = p.style.width;
      p.style.animationDelay = (Math.random() * 20) + 's';
      p.style.animationDuration = (15 + Math.random() * 15) + 's';
      p.style.opacity = (Math.random() * 0.5 + 0.1);
      particlesContainer.appendChild(p);
    }
  }
  // ===== Gear SVG =====
  (function initGear() {
    var c = document.getElementById('heroGears');
    if (!c) return;
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 200 200');
    svg.style.cssText = 'position:absolute;top:2%;right:2%;width:180px;height:180px;display:block;overflow:visible';
    svg.style.animation = 'spin 60s linear infinite';
    svg.classList.add('hero__gear');
    var defs = document.createElementNS(ns, 'defs');
    function addGrad(id, cx, cy, r, stops) {
      var g = document.createElementNS(ns, 'radialGradient');
      g.setAttribute('id', id);
      if (cx !== undefined) { g.setAttribute('cx', cx); g.setAttribute('cy', cy); g.setAttribute('r', r); }
      stops.forEach(function (s) {
        var el = document.createElementNS(ns, 'stop');
        el.setAttribute('offset', s[0]); el.setAttribute('stop-color', s[1]);
        g.appendChild(el);
      });
      defs.appendChild(g);
    }
    addGrad('m1', '35%', '30%', '75%', [['0%','#f5f5f5'],['25%','#d4d4d4'],['55%','#9a9a9a'],['80%','#707070'],['100%','#555555']]);
    addGrad('m2', '60%', '65%', '72%', [['0%','#b8b8b8'],['40%','#888888'],['80%','#606060'],['100%','#444444']]);
    addGrad('m3', '40%', '40%', '70%', [['0%','#e0e0e0'],['50%','#a0a0a0'],['100%','#6a6a6a']]);
    addGrad('m4', undefined, undefined, undefined, [['0%','#7a7a7a'],['100%','#4a4a4a']]);
    svg.appendChild(defs);
    // shadow
    var sh = document.createElementNS(ns, 'ellipse');
    sh.setAttribute('cx', '104'); sh.setAttribute('cy', '104');
    sh.setAttribute('rx', '90'); sh.setAttribute('ry', '88');
    sh.setAttribute('fill', 'rgba(0,0,0,0.18)');
    svg.appendChild(sh);
    // teeth (12)
    var tg = document.createElementNS(ns, 'g');
    for (var i = 0; i < 12; i++) {
      var t = document.createElementNS(ns, 'path');
      t.setAttribute('d', 'M87,4 L113,4 L115,16 Q115,20 110,20 L90,20 Q85,20 85,16 Z');
      t.setAttribute('fill', 'url(#m1)');
      t.setAttribute('transform', 'rotate(' + (i * 30) + ' 100 100)');
      tg.appendChild(t);
    }
    svg.appendChild(tg);
    // outer rim
    var rim = document.createElementNS(ns, 'circle');
    rim.setAttribute('cx', '100'); rim.setAttribute('cy', '100');
    rim.setAttribute('r', '82'); rim.setAttribute('fill', 'url(#m1)');
    svg.appendChild(rim);
    // bevel
    var bev = document.createElementNS(ns, 'circle');
    bev.setAttribute('cx', '100'); bev.setAttribute('cy', '100');
    bev.setAttribute('r', '78'); bev.setAttribute('fill', 'url(#m2)');
    svg.appendChild(bev);
    // inner face
    var face = document.createElementNS(ns, 'circle');
    face.setAttribute('cx', '100'); face.setAttribute('cy', '100');
    face.setAttribute('r', '74'); face.setAttribute('fill', 'url(#m3)');
    svg.appendChild(face);
    // thin highlight ring
    var hr = document.createElementNS(ns, 'circle');
    hr.setAttribute('cx', '100'); hr.setAttribute('cy', '100');
    hr.setAttribute('r', '76'); hr.setAttribute('fill', 'none');
    hr.setAttribute('stroke', 'rgba(255,255,255,0.25)');
    hr.setAttribute('stroke-width', '1');
    svg.appendChild(hr);
    // cutout zone (bg color)
    var cut = document.createElementNS(ns, 'circle');
    cut.setAttribute('cx', '100'); cut.setAttribute('cy', '100');
    cut.setAttribute('r', '48'); cut.setAttribute('fill', '#111927');
    svg.appendChild(cut);
    // 6 spokes
    var sg = document.createElementNS(ns, 'g');
    for (var i = 0; i < 6; i++) {
      var sp = document.createElementNS(ns, 'path');
      sp.setAttribute('d', 'M95,50 L105,50 L105,90 L95,90 Z');
      sp.setAttribute('fill', 'url(#m4)');
      sp.setAttribute('transform', 'rotate(' + (i * 60) + ' 100 100)');
      sg.appendChild(sp);
    }
    svg.appendChild(sg);
    // hub
    var hub = document.createElementNS(ns, 'circle');
    hub.setAttribute('cx', '100'); hub.setAttribute('cy', '100');
    hub.setAttribute('r', '22'); hub.setAttribute('fill', 'url(#m1)');
    svg.appendChild(hub);
    var hub2 = document.createElementNS(ns, 'circle');
    hub2.setAttribute('cx', '100'); hub2.setAttribute('cy', '100');
    hub2.setAttribute('r', '18'); hub2.setAttribute('fill', 'url(#m2)');
    svg.appendChild(hub2);
    // bore
    var bore = document.createElementNS(ns, 'circle');
    bore.setAttribute('cx', '100'); bore.setAttribute('cy', '100');
    bore.setAttribute('r', '7'); bore.setAttribute('fill', '#111927');
    svg.appendChild(bore);
    // keyway
    var kw = document.createElementNS(ns, 'path');
    kw.setAttribute('d', 'M96,100 L96,108 L104,108 L104,100 Z');
    kw.setAttribute('fill', '#111927');
    svg.appendChild(kw);
    c.appendChild(svg);
  })();

  // ===== Navbar scroll =====
  const navbar = document.getElementById('navbar');

  let scrollTicking = false;
  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      requestAnimationFrame(() => {
        navbar.classList.toggle('scrolled', window.scrollY > 60);
        backToTop?.classList.toggle('visible', window.scrollY > 400);
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  });

  // ===== Badge scroll =====
  const badgeInner = document.getElementById('badgeInner');
  const badgeEl = document.getElementById('badgeText');
  if (badgeInner && badgeEl) {
    const sentence = window.I18N?.__('hero.badge') || 'IMMEIT — Méthodes maintenance et performance industrielle · Maintenance multi-technique · Installation et maintenance de climatisation | Sénégal & France | Expertise grands comptes : P2M et INDUSTRELEC';
    badgeEl.textContent = sentence;
    const clone = badgeEl.cloneNode(true);
    clone.id = 'badgeTextClone';
    clone.setAttribute('aria-hidden', 'true');
    badgeInner.appendChild(clone);
    badgeInner.classList.add('scroll');
  }

  // ===== Mobile menu =====
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  const navOverlay = document.getElementById('navOverlay');
  const navLinkItems = document.querySelectorAll('.nav__link');

  function closeNav() {
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
    navLinks.classList.remove('active');
    navOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  function openNav() {
    hamburger.classList.add('active');
    hamburger.setAttribute('aria-expanded', 'true');
    navLinks.classList.add('active');
    navOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  hamburger.addEventListener('click', () => {
    if (navLinks.classList.contains('active')) {
      closeNav();
    } else {
      openNav();
    }
  });

  navOverlay.addEventListener('click', closeNav);

  navLinkItems.forEach(link => {
    link.addEventListener('click', closeNav);
  });

  // Fermer le menu si redimensionnement > 900px
  window.addEventListener('resize', () => {
    if (window.innerWidth > 900 && navLinks.classList.contains('active')) {
      closeNav();
    }
  });

  // ===== Active nav link on scroll =====
  const sections = document.querySelectorAll('section[id]');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinkItems.forEach(link => link.classList.remove('active'));
          const activeLink = document.querySelector(`.nav__link[href="#${entry.target.id}"]`);
          if (activeLink) activeLink.classList.add('active');
        }
      });
    },
    { rootMargin: '-50% 0px -50% 0px' }
  );

  sections.forEach(section => observer.observe(section));

  // ===== Footer fixed on contact =====
  const contactSection = document.getElementById('contact');
  const footerEl = document.querySelector('.footer');

  if (contactSection && footerEl) {
    function pinFooter() {
      const h = footerEl.offsetHeight + 80;
      footerEl.style.setProperty('--footer-h', h + 'px');
      footerEl.classList.add('footer--fixed');
      contactSection.classList.add('footer-pinned');
    }

    function unpinFooter() {
      footerEl.classList.remove('footer--fixed');
      contactSection.classList.remove('footer-pinned');
    }

    const footerObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          entry.isIntersecting ? pinFooter() : unpinFooter();
        });
      },
      { threshold: 0 }
    );
    footerObserver.observe(contactSection);

    document.querySelectorAll('a[href="#contact"]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        pinFooter();
        const form = document.getElementById('contactForm');
        if (form) {
          const target = form.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
        } else {
          window.scrollTo({ top: Math.max(0, contactSection.offsetTop - 10), behavior: 'smooth' });
        }
        history.pushState(null, '', '#contact');
      });
    });

    window.addEventListener('resize', () => {
      if (footerEl.classList.contains('footer--fixed')) pinFooter();
    });
  }

  // ===== Counter animation =====
  const counters = document.querySelectorAll('[data-count]');

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.getAttribute('data-count'));
          const suffix = el.getAttribute('data-suffix') || '+';
          let current = 0;
          const increment = Math.ceil(target / 60);
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              current = target;
              clearInterval(timer);
            }
            el.textContent = current + suffix;
          }, 30);
          counterObserver.unobserve(el);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach(counter => counterObserver.observe(counter));

  // ===== Performance bars =====
  const perfBars = document.querySelectorAll('.perf__bar');
  const perfValues = document.querySelectorAll('[id^="perfVal"]');
  const CIRCUMFERENCE = 2 * Math.PI * 60;

  function animatePerfBar(bar, valueEl) {
    const target = parseFloat(bar.getAttribute('data-target'));
    const decimal = parseInt(bar.getAttribute('data-decimal')) || 0;
    const offset = CIRCUMFERENCE * (1 - target / 100);
    bar.style.setProperty('--offset', offset + 'px');
    bar.classList.add('animated');

    let current = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      valueEl.textContent = current.toFixed(decimal);
    }, 30);
  }

  const perfObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = Array.from(perfBars).indexOf(entry.target);
          if (index >= 0 && perfValues[index]) {
            animatePerfBar(entry.target, perfValues[index]);
          }
          perfObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );

  perfBars.forEach(bar => perfObserver.observe(bar));

  // ===== Reveal on scroll =====
  const revealElements = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08 }
  );

  revealElements.forEach(el => revealObserver.observe(el));

  // ===== Back to top =====
  const backToTop = document.getElementById('backToTop');

  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ===== Toast notification =====
  function showToast(message, type) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'toast toast--' + type;
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast--visible'));
    setTimeout(() => {
      toast.classList.remove('toast--visible');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ===== Contact form =====
  const form = document.getElementById('contactForm');
  if (!form) return;

  const prenomInput = document.getElementById('prenom');
  const nomInput = document.getElementById('nom');
  const emailInput = document.getElementById('email');
  const subjectInput = document.getElementById('subject');
  const messageInput = document.getElementById('message');
  const prenomError = document.getElementById('prenomError');
  const nomError = document.getElementById('nomError');
  const emailError = document.getElementById('emailError');
  const subjectError = document.getElementById('subjectError');
  const messageError = document.getElementById('messageError');
  const submitBtn = document.getElementById('submitBtn');

  const charCounter = document.getElementById('charCounter');
  const MAX_CHARS = 2000;

  updateCharCounter();
  if (messageInput) autoResize(messageInput);

  function setFieldState(input, errorEl, isValid, message) {
    input.classList.remove('error', 'success');
    errorEl.textContent = '';
    if (isValid === true) {
      input.classList.add('success');
    } else if (isValid === false) {
      input.classList.add('error');
      errorEl.textContent = message;
    }
  }

  function validatePrenom() {
    const val = prenomInput.value.trim();
    if (val.length === 0) { setFieldState(prenomInput, prenomError, null); return null; }
    if (val.length < 2) { setFieldState(prenomInput, prenomError, false, (window.I18N?.__('validation.firstname.required') || 'Le prénom doit contenir au moins 2 caractères')); return false; }
    if (val.length > 50) { setFieldState(prenomInput, prenomError, false, (window.I18N?.__('validation.firstname.max') || 'Le prénom ne peut pas dépasser 50 caractères')); return false; }
    setFieldState(prenomInput, prenomError, true);
    return true;
  }

  function validateNom() {
    const val = nomInput.value.trim();
    if (val.length === 0) { setFieldState(nomInput, nomError, null); return null; }
    if (val.length < 2) { setFieldState(nomInput, nomError, false, (window.I18N?.__('validation.lastname.required') || 'Le nom doit contenir au moins 2 caractères')); return false; }
    if (val.length > 50) { setFieldState(nomInput, nomError, false, (window.I18N?.__('validation.lastname.max') || 'Le nom ne peut pas dépasser 50 caractères')); return false; }
    setFieldState(nomInput, nomError, true);
    return true;
  }

  function validateEmail() {
    const val = emailInput.value.trim();
    if (val.length === 0) { setFieldState(emailInput, emailError, null); return null; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val)) { setFieldState(emailInput, emailError, false, (window.I18N?.__('validation.email.invalid') || 'Email invalide (ex: nom@domaine.com)')); return false; }
    setFieldState(emailInput, emailError, true);
    return true;
  }

  function validateSubject() {
    const val = subjectInput.value.trim();
    if (val.length === 0) { setFieldState(subjectInput, subjectError, null); return null; }
    if (val.length > 200) { setFieldState(subjectInput, subjectError, false, (window.I18N?.__('validation.subject.max') || 'Le sujet ne peut pas dépasser 200 caractères')); return false; }
    setFieldState(subjectInput, subjectError, true);
    return true;
  }

  function validateMessage() {
    const val = messageInput.value.trim();
    if (val.length === 0) { setFieldState(messageInput, messageError, null); return null; }
    if (val.length < 10) { setFieldState(messageInput, messageError, false, (window.I18N?.__('validation.message.required') || 'Le message doit contenir au moins 10 caractères')); return false; }
    if (val.length > 2000) { setFieldState(messageInput, messageError, false, (window.I18N?.__('validation.message.max') || 'Le message ne peut pas dépasser 2000 caractères')); return false; }
    setFieldState(messageInput, messageError, true);
    return true;
  }

  prenomInput.addEventListener('blur', validatePrenom);
  prenomInput.addEventListener('input', function () {
    if (this.classList.contains('error') || this.classList.contains('success')) validatePrenom();
  });

  nomInput.addEventListener('blur', validateNom);
  nomInput.addEventListener('input', function () {
    if (this.classList.contains('error') || this.classList.contains('success')) validateNom();
  });

  emailInput.addEventListener('blur', validateEmail);
  emailInput.addEventListener('input', function () {
    if (this.classList.contains('error') || this.classList.contains('success')) validateEmail();
  });

  subjectInput.addEventListener('blur', validateSubject);
  subjectInput.addEventListener('input', function () {
    if (this.classList.contains('error') || this.classList.contains('success')) validateSubject();
  });

  messageInput.addEventListener('blur', validateMessage);
  messageInput.addEventListener('input', function () {
    if (this.classList.contains('error') || this.classList.contains('success')) validateMessage();
    updateCharCounter();
    autoResize(this);
  });

  function updateCharCounter() {
    if (!charCounter) return;
    const len = messageInput.value.length;
    const remaining = MAX_CHARS - len;
    charCounter.textContent = remaining;
    charCounter.classList.remove('form__char-counter--warn', 'form__char-counter--danger');
    if (remaining <= 20) charCounter.classList.add('form__char-counter--danger');
    else if (remaining <= 100) charCounter.classList.add('form__char-counter--warn');
  }

  // ===== Auto-resize textarea =====
  function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = Math.max(60, el.scrollHeight) + 'px';
  }

  // ===== Confetti =====
  function fireConfetti() {
    const colors = ['#C99A3E', '#1F538C', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    for (let i = 0; i < 40; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + 'vw';
      piece.style.top = '-10px';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.width = (Math.random() * 6 + 4) + 'px';
      piece.style.height = (Math.random() * 6 + 4) + 'px';
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      piece.style.animationDuration = (Math.random() * 2 + 1.5) + 's';
      piece.style.animationDelay = (Math.random() * 0.5) + 's';
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), 4000);
    }
  }

  function setLoading(loading) {
    if (loading) {
      submitBtn.innerHTML = '<span class="btn__text"><i class="fas fa-spinner fa-spin"></i> ' + (window.I18N?.__('form.sending') || 'Envoi en cours...') + '</span><span class="btn__shimmer"></span>';
      submitBtn.disabled = true;
    } else {
      submitBtn.innerHTML = '<span class="btn__text"><i class="fas fa-paper-plane"></i> ' + (window.I18N?.__('form.send') || 'Envoyer') + '</span><span class="btn__shimmer"></span>';
      submitBtn.disabled = false;
    }
  }

  function clearForm() {
    form.reset();
    [prenomInput, nomInput, emailInput, subjectInput, messageInput].forEach(el => el.classList.remove('success', 'error'));
    [prenomError, nomError, emailError, subjectError, messageError].forEach(el => el.textContent = '');
    updateCharCounter();
    if (messageInput) {
      messageInput.style.height = 'auto';
    }
  }

  function showConfirmation(bannerHtml) {
    const banner = document.createElement('div');
    banner.className = 'form-banner form-banner--' + (bannerHtml.includes('check-circle') ? 'success' : 'error');
    banner.innerHTML = bannerHtml;
    submitBtn.parentNode.insertBefore(banner, submitBtn);
    if (bannerHtml.includes('check-circle')) {
      fireConfetti();
    }
    setTimeout(() => { banner.classList.add('form-banner--hide'); setTimeout(() => banner.remove(), 400); }, 5000);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const isPrenomValid = validatePrenom();
    const isNomValid = validateNom();
    const isEmailValid = validateEmail();
    const isSubjectValid = validateSubject();
    const isMessageValid = validateMessage();

    const __t = (k, fb) => window.I18N?.__(k) || fb;
    if (!isPrenomValid || !isNomValid || !isEmailValid || !isSubjectValid || !isMessageValid) {
      if (prenomInput.classList.contains('error')) {
        prenomInput.focus();
        showToast(__t('toast.firstname', 'Veuillez remplir votre prénom'), 'error');
      } else if (nomInput.classList.contains('error')) {
        nomInput.focus();
        showToast(__t('toast.lastname', 'Veuillez remplir votre nom'), 'error');
      } else if (emailInput.classList.contains('error')) {
        emailInput.focus();
        showToast(__t('toast.email', 'Veuillez remplir votre email'), 'error');
      } else if (subjectInput.classList.contains('error')) {
        subjectInput.focus();
        showToast(__t('toast.subject', 'Veuillez remplir le sujet'), 'error');
      } else if (messageInput.classList.contains('error')) {
        messageInput.focus();
        showToast(__t('toast.message', 'Veuillez remplir votre message'), 'error');
      } else {
        const req = __t('toast.required', 'Veuillez remplir tous les champs obligatoires');
        if (!prenomInput.value.trim()) {
          prenomInput.focus();
          showToast(req, 'error');
        } else if (!nomInput.value.trim()) {
          nomInput.focus();
          showToast(req, 'error');
        } else if (!emailInput.value.trim()) {
          emailInput.focus();
          showToast(req, 'error');
        } else if (!subjectInput.value.trim()) {
          subjectInput.focus();
          showToast(req, 'error');
        } else {
          messageInput.focus();
          showToast(req, 'error');
        }
      }
      form.classList.add('shake');
      setTimeout(() => form.classList.remove('shake'), 500);
      return;
    }

    setLoading(true);

    const prenom = prenomInput.value.trim();
    const nom = nomInput.value.trim();
    const email = emailInput.value.trim();
    const sujet = subjectInput.value.trim() || (window.I18N?.__('form.subject') || 'Nouveau message');
    const message = messageInput.value.trim();
    const fromName = `${prenom} ${nom}`;

    const API_TUNNEL = window.SERVER_API_URL || localStorage.getItem('immeit_api_url') || '';
    const WORKER_API = window.WORKER_API_URL || ''; // configurable via injection serveur

     function buildApiPayload() {
       const csrfToken = document.getElementById('csrf_token_input')?.value || '';
       return { prenom, nom, email, subject: sujet, message, name: fromName, csrf_token: csrfToken };
     }

    async function fetchTunnelUrl() {
      try {
        const r = await fetch('https://raw.githubusercontent.com/taphaniangrio-cell/immeit/main/tunnel-url.json?_=' + Date.now());
        if (r.ok) { const d = await r.json(); return d.api_url || ''; }
      } catch {}
      return '';
    }

    // 1) Envoi direct au serveur (même origine)
    let ok = false;
    try {
      const r = await fetch('/api/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buildApiPayload())
      });
      const d = await r.json();
      if (d.success) ok = true;
    } catch {}

    // 2) Tunnel — essayer TOUTES les URLs connues avec retry
    if (!ok) {
      const candidates = new Set();
      const gitUrl = await fetchTunnelUrl();
      if (gitUrl) candidates.add(gitUrl);
      if (API_TUNNEL && API_TUNNEL !== gitUrl) candidates.add(API_TUNNEL);

      for (const url of candidates) {
        for (let attempt = 0; attempt < 3 && !ok; attempt++) {
          if (attempt > 0) await new Promise(r => setTimeout(r, 2000));
          try {
            const r = await fetch(url + '/api/contact', {
              method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buildApiPayload())
            });
            const d = await r.json();
            if (d.success) {
              ok = true;
              localStorage.setItem('immeit_api_url', url);
              break;
            }
          } catch {}
        }
      }
    }

    // 3) Cloudflare Worker (MailChannels) — si configuré
    if (!ok && WORKER_API) {
      try {
        const r = await fetch(WORKER_API, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buildApiPayload())
        });
        const d = await r.json();
        if (d.success) ok = true;
      } catch {}
    }

    // 4) Fallback Web3Forms
    if (!ok) {
      try {
        const r = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          body: new URLSearchParams({
            'access_key': '1537e384-9a6b-433e-b684-a6916a6de7e5',
            'subject': `[IMMEIT] ${fromName} - ${sujet}`,
            'from_name': fromName,
            'email': email,
            'Prénom': prenom,
            'Nom': nom,
            'Sujet': sujet,
            'Message': message,
            '_template': 'box',
          })
        });
        const d = await r.json();
        if (d.success) ok = true;
      } catch {}
    }

    if (ok) {
      setLoading(false);
      showConfirmation('<i class="fas fa-check-circle"></i> ' + (window.I18N?.__('toast.success') || 'Message envoyé avec succès ! Nous vous répondrons sous 24h.'));
      clearForm();
      if (typeof gtag === 'function') gtag('event', 'generate_lead', { value: 1, currency: 'EUR', event_category: 'Contact', event_label: sujet, subject: sujet, lead_source: 'Formulaire site web' });
      return;
    }

    setLoading(false);
    showConfirmation('<i class="fas fa-exclamation-circle"></i> ' + (window.I18N?.__('toast.error') || 'Échec de l\'envoi. Écrivez-nous à ') + '<a href="mailto:demandes-p2m@immeit.com">demandes-p2m@immeit.com</a>');
  });

  // ===== Keyboard shortcut =====
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinks.classList.contains('active')) {
      closeNav();
    }
  });

  // ===== GA tracking — contact links =====
  document.querySelectorAll('.contact__links a').forEach(el => {
    el.addEventListener('click', function () {
      if (typeof gtag !== 'function') return;
      const href = this.getAttribute('href') || '';
      if (href.startsWith('tel:+221')) {
        gtag('event', 'phone_click_sn', { event_category: 'Contact', event_label: 'Téléphone Sénégal' });
      } else if (href.startsWith('tel:+33')) {
        gtag('event', 'phone_click_fr', { event_category: 'Contact', event_label: 'Téléphone France' });
      } else if (href.startsWith('mailto:')) {
        gtag('event', 'email_click', { event_category: 'Contact', event_label: 'Email cliqué' });
      }
    });
  });

});

// ===== FAQ toggle =====
function toggleFaq(el) {
  el.classList.toggle('open');
}

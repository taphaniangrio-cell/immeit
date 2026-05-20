document.addEventListener('DOMContentLoaded', () => {

  // ===== Loader =====
  const loader = document.getElementById('loader');
  window.addEventListener('load', () => {
    setTimeout(() => loader.classList.add('hidden'), 300);
  });
  setTimeout(() => loader.classList.add('hidden'), 2000);

  // ===== Particles =====
  const particlesContainer = document.getElementById('particles');
  if (particlesContainer) {
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div');
      p.className = 'hero__particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.width = (Math.random() * 4 + 2) + 'px';
      p.style.height = p.style.width;
      p.style.animationDelay = (Math.random() * 20) + 's';
      p.style.animationDuration = (15 + Math.random() * 15) + 's';
      p.style.opacity = (Math.random() * 0.5 + 0.1);
      particlesContainer.appendChild(p);
    }
  }

  // ===== Header scroll effect =====
  const header = document.getElementById('header');

  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 60);
  });

  // ===== Badge scroll =====
  const badgeEl = document.getElementById('badgeText');
  if (badgeEl) {
    const sentence = 'IMMEIT — Méthodes maintenance et performance industrielle · Maintenance multi-technique · Installation et maintenance de climatisation | Sénégal & France | Expertise grands comptes : Renault, Stellantis, SAFRAN, SUEZ, Air Liquide';
    badgeEl.textContent = sentence;
    badgeEl.classList.add('scroll');
  }

  // ===== Mobile menu =====
  const hamburger = document.getElementById('hamburger');
  const nav = document.getElementById('nav');
  const navOverlay = document.getElementById('navOverlay');
  const navLinks = document.querySelectorAll('.nav__link');

  function closeNav() {
    hamburger.classList.remove('active');
    nav.classList.remove('active');
    navOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  function openNav() {
    hamburger.classList.add('active');
    nav.classList.add('active');
    navOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  hamburger.addEventListener('click', () => {
    if (nav.classList.contains('active')) {
      closeNav();
    } else {
      openNav();
    }
  });

  navOverlay.addEventListener('click', closeNav);

  navLinks.forEach(link => {
    link.addEventListener('click', closeNav);
  });

  // ===== Active nav link on scroll =====
  const sections = document.querySelectorAll('section[id]');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(link => link.classList.remove('active'));
          const activeLink = document.querySelector(`.nav__link[href="#${entry.target.id}"]`);
          if (activeLink) activeLink.classList.add('active');
        }
      });
    },
    { rootMargin: '-50% 0px -50% 0px' }
  );

  sections.forEach(section => observer.observe(section));

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

  // ===== Performance circular bars =====
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
    { threshold: 0.1 }
  );

  revealElements.forEach(el => revealObserver.observe(el));

  // ===== Back to top =====
  const backToTop = document.getElementById('backToTop');

  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('visible', window.scrollY > 400);
  });

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ===== Contact form =====
  const form = document.getElementById('contactForm');
  if (!form) return;

  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const subjectInput = document.getElementById('subject');
  const messageInput = document.getElementById('message');
  const nameError = document.getElementById('nameError');
  const emailError = document.getElementById('emailError');
  const messageError = document.getElementById('messageError');
  const charCounter = document.getElementById('charCounter');
  const submitBtn = document.getElementById('submitBtn');

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

  function validateName() {
    const val = nameInput.value.trim();
    if (val.length === 0) { setFieldState(nameInput, nameError, null); return null; }
    if (val.length < 2) { setFieldState(nameInput, nameError, false, 'Le nom doit contenir au moins 2 caractères'); return false; }
    if (val.length > 100) { setFieldState(nameInput, nameError, false, 'Le nom ne peut pas dépasser 100 caractères'); return false; }
    setFieldState(nameInput, nameError, true);
    return true;
  }

  function validateEmail() {
    const val = emailInput.value.trim();
    if (val.length === 0) { setFieldState(emailInput, emailError, null); return null; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val)) { setFieldState(emailInput, emailError, false, 'Email invalide (ex: nom@domaine.com)'); return false; }
    setFieldState(emailInput, emailError, true);
    return true;
  }

  function validateMessage() {
    const val = messageInput.value.trim();
    if (val.length === 0) { setFieldState(messageInput, messageError, null); return null; }
    if (val.length < 10) { setFieldState(messageInput, messageError, false, 'Le message doit contenir au moins 10 caractères'); return false; }
    if (val.length > 2000) { setFieldState(messageInput, messageError, false, 'Le message ne peut pas dépasser 2000 caractères'); return false; }
    setFieldState(messageInput, messageError, true);
    return true;
  }

  nameInput.addEventListener('blur', validateName);
  nameInput.addEventListener('input', function () {
    if (this.classList.contains('error') || this.classList.contains('success')) validateName();
  });

  emailInput.addEventListener('blur', validateEmail);
  emailInput.addEventListener('input', function () {
    if (this.classList.contains('error') || this.classList.contains('success')) validateEmail();
  });

  messageInput.addEventListener('blur', validateMessage);
  messageInput.addEventListener('input', function () {
    if (this.classList.contains('error') || this.classList.contains('success')) validateMessage();
    updateCharCounter();
  });

  function updateCharCounter() {
    const len = messageInput.value.length;
    const max = 2000;
    charCounter.textContent = len + ' / ' + max;
    charCounter.classList.remove('warning', 'full');
    if (len > max * 0.9) charCounter.classList.add('warning');
    if (len >= max) charCounter.classList.add('full');
  }

  messageInput.addEventListener('input', updateCharCounter);

  subjectInput.addEventListener('input', function () {
    if (this.value.length > 200) this.value = this.value.slice(0, 200);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const isNameValid = validateName();
    const isEmailValid = validateEmail();
    const isMessageValid = validateMessage();

    if (!isNameValid || !isEmailValid || !isMessageValid) {
      if (nameInput.classList.contains('error')) nameInput.focus();
      else if (emailInput.classList.contains('error')) emailInput.focus();
      else if (messageInput.classList.contains('error')) messageInput.focus();
      form.classList.add('shake');
      setTimeout(() => form.classList.remove('shake'), 500);
      return;
    }

    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
    submitBtn.disabled = true;

    const payload = {
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      subject: subjectInput.value.trim(),
      message: messageInput.value.trim()
    };

    const API = window.location.hostname === 'localhost'
      ? 'http://localhost:3001/api/contact'
      : '/api/contact';

    fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(result => {
      if (result.success) {
        showFormMessage('Message envoyé !', '#10b981');
      } else {
        throw new Error(result.error || 'Erreur');
      }
    })
    .catch(() => {
      showFormMessage('Échec de l\'envoi', '#ef4444');
    });

    function showFormMessage(label, color) {
      submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> ' + label;
      submitBtn.style.background = 'linear-gradient(135deg, ' + color + ', ' + color + ')';
      submitBtn.style.boxShadow = '0 4px 16px ' + color + '59';
      setTimeout(resetForm, 3000);
    }

    function resetForm() {
      submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Envoyer le message';
      submitBtn.style.background = '';
      submitBtn.style.boxShadow = '';
      submitBtn.disabled = false;
      form.reset();
      [nameInput, emailInput, messageInput, subjectInput].forEach(el => {
        el.classList.remove('success', 'error');
      });
      [nameError, emailError, messageError].forEach(el => el.textContent = '');
      charCounter.textContent = '0 / 2000';
      charCounter.classList.remove('warning', 'full');
    }
  });

  // ===== Map modal =====
  const mapBtn = document.getElementById('mapBtn');
  const mapModal = document.getElementById('mapModal');
  const mapOverlay = document.getElementById('mapOverlay');
  const mapClose = document.getElementById('mapClose');

  if (mapBtn && mapModal) {
    function openMap() {
      mapModal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function closeMap() {
      mapModal.classList.remove('open');
      document.body.style.overflow = '';
    }

    mapBtn.addEventListener('click', openMap);
    mapOverlay.addEventListener('click', closeMap);
    mapClose.addEventListener('click', closeMap);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mapModal.classList.contains('open')) closeMap();
    });
  }

  // ===== Keyboard shortcut =====
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('active')) {
      closeNav();
    }
  });

});
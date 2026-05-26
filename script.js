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

  // ===== Navbar scroll =====
  const navbar = document.getElementById('navbar');
  const floatingCta = document.getElementById('floatingCta');

  let scrollTicking = false;
  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      requestAnimationFrame(() => {
        navbar.classList.toggle('scrolled', window.scrollY > 60);
        backToTop?.classList.toggle('visible', window.scrollY > 400);
        if (floatingCta) {
          floatingCta.style.display = window.scrollY < window.innerHeight ? 'inline-flex' : 'none';
        }
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  });

  // ===== Badge scroll =====
  const badgeInner = document.getElementById('badgeInner');
  const badgeEl = document.getElementById('badgeText');
  if (badgeInner && badgeEl) {
    const sentence = 'IMMEIT — Méthodes maintenance et performance industrielle · Maintenance multi-technique · Installation et maintenance de climatisation | Sénégal & France | Expertise grands comptes : P2M et INDUSTRELEC';
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
    navLinks.classList.remove('active');
    navOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  function openNav() {
    hamburger.classList.add('active');
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
    if (val.length < 2) { setFieldState(prenomInput, prenomError, false, 'Le prénom doit contenir au moins 2 caractères'); return false; }
    if (val.length > 50) { setFieldState(prenomInput, prenomError, false, 'Le prénom ne peut pas dépasser 50 caractères'); return false; }
    setFieldState(prenomInput, prenomError, true);
    return true;
  }

  function validateNom() {
    const val = nomInput.value.trim();
    if (val.length === 0) { setFieldState(nomInput, nomError, null); return null; }
    if (val.length < 2) { setFieldState(nomInput, nomError, false, 'Le nom doit contenir au moins 2 caractères'); return false; }
    if (val.length > 50) { setFieldState(nomInput, nomError, false, 'Le nom ne peut pas dépasser 50 caractères'); return false; }
    setFieldState(nomInput, nomError, true);
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

  function validateSubject() {
    const val = subjectInput.value.trim();
    if (val.length === 0) { setFieldState(subjectInput, subjectError, null); return null; }
    if (val.length > 200) { setFieldState(subjectInput, subjectError, false, 'Le sujet ne peut pas dépasser 200 caractères'); return false; }
    setFieldState(subjectInput, subjectError, true);
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
  });

  // ===== Form submission =====
  function setLoading(loading) {
    if (loading) {
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
      submitBtn.disabled = true;
    } else {
      submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Envoyer';
      submitBtn.disabled = false;
    }
  }

  function clearForm() {
    form.reset();
    [prenomInput, nomInput, emailInput, subjectInput, messageInput].forEach(el => el.classList.remove('success', 'error'));
    [prenomError, nomError, emailError, subjectError, messageError].forEach(el => el.textContent = '');
  }

  function showConfirmation(bannerHtml) {
    const banner = document.createElement('div');
    banner.className = 'form-banner form-banner--' + (bannerHtml.includes('check-circle') ? 'success' : 'error');
    banner.innerHTML = bannerHtml;
    submitBtn.parentNode.insertBefore(banner, submitBtn);
    setTimeout(() => { banner.classList.add('form-banner--hide'); setTimeout(() => banner.remove(), 400); }, 5000);
  }

  const API_URL = (window.SERVER_API_URL || '') + '/api/contact';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const isPrenomValid = validatePrenom();
    const isNomValid = validateNom();
    const isEmailValid = validateEmail();
    const isSubjectValid = validateSubject();
    const isMessageValid = validateMessage();

    if (!isPrenomValid || !isNomValid || !isEmailValid || !isSubjectValid || !isMessageValid) {
      if (prenomInput.classList.contains('error')) {
        prenomInput.focus();
        showToast('Veuillez remplir votre prénom', 'error');
      } else if (nomInput.classList.contains('error')) {
        nomInput.focus();
        showToast('Veuillez remplir votre nom', 'error');
      } else if (emailInput.classList.contains('error')) {
        emailInput.focus();
        showToast('Veuillez remplir votre email', 'error');
      } else if (subjectInput.classList.contains('error')) {
        subjectInput.focus();
        showToast('Veuillez remplir le sujet', 'error');
      } else if (messageInput.classList.contains('error')) {
        messageInput.focus();
        showToast('Veuillez remplir votre message', 'error');
      } else {
        if (!prenomInput.value.trim()) {
          prenomInput.focus();
          showToast('Veuillez remplir tous les champs obligatoires', 'error');
        } else if (!nomInput.value.trim()) {
          nomInput.focus();
          showToast('Veuillez remplir tous les champs obligatoires', 'error');
        } else if (!emailInput.value.trim()) {
          emailInput.focus();
          showToast('Veuillez remplir tous les champs obligatoires', 'error');
        } else if (!subjectInput.value.trim()) {
          subjectInput.focus();
          showToast('Veuillez remplir tous les champs obligatoires', 'error');
        } else {
          messageInput.focus();
          showToast('Veuillez remplir tous les champs obligatoires', 'error');
        }
      }
      form.classList.add('shake');
      setTimeout(() => form.classList.remove('shake'), 500);
      return;
    }

    setLoading(true);

    const prenomVal = prenomInput.value.trim();
    const nomVal = nomInput.value.trim();
    const emailVal = emailInput.value.trim();
    const subjectVal = subjectInput.value.trim() || 'Nouveau message IMMEIT';
    const messageVal = messageInput.value.trim();

    const payload = {
      name: `${prenomVal} ${nomVal}`,
      prenom: prenomVal,
      nom: nomVal,
      email: emailVal,
      subject: subjectVal,
      message: messageVal
    };

    const WEB3FORMS_KEY = '1537e384-9a6b-433e-b684-a6916a6de7e5';

    let sent = false;

    const serverPromise = (async () => {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 20000);
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: ctrl.signal
        });
        clearTimeout(timer);
        const data = await res.json().catch(() => ({}));
        return data.success === true;
      } catch { return false; }
    })();

    const web3Promise = (async () => {
      if (!WEB3FORMS_KEY) return false;
      try {
        const fd = new FormData();
        fd.append('access_key', WEB3FORMS_KEY);
        fd.append('subject', `${subjectVal} - Site IMMEIT`);
        fd.append('message', `Nom : ${prenomVal} ${nomVal}\nEmail : ${emailVal}\n\nMessage :\n${messageVal}`);
        const res = await fetch('https://api.web3forms.com/submit', { method: 'POST', body: fd });
        const data = await res.json();
        return data.success === true;
      } catch { return false; }
    })();

    const [serverOk, web3Ok] = await Promise.all([serverPromise, web3Promise]);
    sent = serverOk || web3Ok;

    setLoading(false);

    if (sent) {
      showConfirmation('<i class="fas fa-check-circle"></i> Message envoyé avec succès ! Nous vous répondrons sous 24h.');
      clearForm();
      if (typeof gtag === 'function') {
        gtag('event', 'generate_lead', {
          value: 1,
          currency: 'EUR',
          event_category: 'Contact',
          event_label: payload.subject,
          subject: payload.subject,
          lead_source: 'Formulaire site web'
        });
      }
    } else {
      showConfirmation('<i class="fas fa-exclamation-circle"></i> Échec de l\'envoi. Écrivez-nous à <a href="mailto:demandes-p2m@immeit.com">demandes-p2m@immeit.com</a>');
    }
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

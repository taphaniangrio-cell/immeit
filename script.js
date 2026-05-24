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

  const LOCAL_API = '/api/contact';
  const WEB3FORMS_KEY = '1ab9a3f0-c552-4d33-8d3a-88872d7b547c';

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

    const payload = {
      name: `${prenomInput.value.trim()} ${nomInput.value.trim()}`,
      prenom: prenomInput.value.trim(),
      nom: nomInput.value.trim(),
      email: emailInput.value.trim(),
      subject: subjectInput.value.trim() || 'Nouveau message IMMEIT',
      message: messageInput.value.trim()
    };

    async function postTo(url, data) {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 5000);
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          signal: ctrl.signal
        });
        clearTimeout(timer);
        return res.ok;
      } catch {
        return false;
      }
    }

    // Try local server (SMTP direct + beau template HTML)
    let ok = await postTo(LOCAL_API, payload);

    // Fallback: Web3Forms
    if (!ok) {
      try {
        const now = new Date();
        const dateStr = now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) + ' à ' + now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const firstLetter = payload.name.charAt(0).toUpperCase();
        const escapedMsg = payload.message.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
        const escapedName = payload.name.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        const escapedEmail = payload.email.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        const escapedSubject = payload.subject.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

        const htmlMessage = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{margin:0;padding:0;background-color:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
.wrapper{background-color:#f0f2f5;padding:32px 16px}
.container{max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)}
.header{background:#0f172a;padding:24px 32px}
.header-logo{display:flex;align-items:center;gap:10px}
.header-logo span{color:#C99A3E;font-size:18px;font-weight:700}
.header-badge{background:rgba(201,154,62,0.15);color:#C99A3E;padding:2px 12px;border-radius:12px;font-size:11px;font-weight:600;margin-left:auto}
.subject-bar{background:#f8fafc;padding:16px 32px;border-bottom:1px solid #e8eaed}
.subject-bar h2{margin:0;font-size:16px;font-weight:600;color:#202124}
.meta{padding:20px 32px;border-bottom:1px solid #e8eaed}
.meta-flex{display:flex;align-items:flex-start;gap:14px}
.avatar{width:44px;height:44px;min-width:44px;border-radius:50%;background:linear-gradient(135deg,#C99A3E,#d4a843);display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:700;color:#fff}
.meta-info{flex:1;min-width:0}
.meta-name{font-size:15px;font-weight:600;color:#202124}
.meta-email{font-size:13px;color:#5f6368}
.meta-email a{color:#1a73e8;text-decoration:none}
.meta-date{font-size:12px;color:#5f6368;margin-top:2px}
.body{padding:24px 32px 20px}
.body-label{font-size:11px;font-weight:600;color:#5f6368;text-transform:uppercase;letter-spacing:0.8px;margin:0 0 12px}
.body-text{margin:0;font-size:15px;color:#3c4043;line-height:1.7}
.footer{background:#f8fafc;padding:16px 32px;text-align:center;border-top:1px solid #e8eaed}
.footer-brand{font-size:13px;font-weight:600;color:#0f172a;margin:0 0 2px}
.footer-brand span{color:#C99A3E}
.footer-text{font-size:11px;color:#5f6368;margin:0}
.footer-text a{color:#C99A3E;text-decoration:none}
.btn-reply{display:inline-block;padding:8px 20px;background:#1a73e8;color:#fff!important;text-decoration:none;font-size:13px;font-weight:600;border-radius:6px;margin-top:8px}
</style></head><body>
<div class="wrapper"><div class="container">
<div class="header"><div class="header-logo"><span>IMMEIT</span><span class="header-badge">NOUVEAU CONTACT</span></div></div>
<div class="subject-bar"><h2>${escapedSubject}</h2></div>
<div class="meta"><div class="meta-flex">
<div class="avatar">${firstLetter}</div>
<div class="meta-info"><div class="meta-name">${escapedName}</div>
<div class="meta-email"><a href="mailto:${escapedEmail}">${escapedEmail}</a></div></div>
<div class="meta-date">${dateStr}</div>
</div></div>
<div class="body"><p class="body-label">Message</p><p class="body-text">${escapedMsg}</p></div>
<div class="footer">
<p class="footer-brand">IMMEIT <span>—</span> Installation, Méthodes &amp; Maintenance</p>
<p class="footer-text">Ce message a été envoyé depuis le formulaire de contact du site <a href="https://immeit.com">immeit.com</a></p>
<a href="mailto:${escapedEmail}?subject=Re%3A%20${encodeURIComponent(payload.subject)}" class="btn-reply">Répondre à ${escapedName}</a>
</div>
</div></div></body></html>`;

        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_key: WEB3FORMS_KEY,
            name: payload.name,
            email: payload.email,
            subject: payload.subject + ' - Site IMMEIT',
            message: htmlMessage
          })
        });
        ok = res.ok;
      } catch {
        ok = false;
      }
    }

    setLoading(false);

    if (ok) {
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

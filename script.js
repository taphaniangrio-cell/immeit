document.addEventListener('DOMContentLoaded', () => {

  // ===== Navigation =====
  const navbar = document.getElementById('navbar');
  const backToTop = document.getElementById('backToTop');

  const contactPanel = document.getElementById('contact');

  let scrollTicking = false;
  function onScroll() {
    navbar?.classList.toggle('scrolled', window.scrollY > 40);
    // Le bouton de retour ne doit pas recouvrir celui du formulaire
    const contactRect = contactPanel?.getBoundingClientRect();
    const onContact = contactRect && contactRect.top < window.innerHeight / 2 && contactRect.bottom > window.innerHeight / 2;
    backToTop?.classList.toggle('visible', window.scrollY > 600 && !onContact);
    scrollTicking = false;
  }
  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      requestAnimationFrame(onScroll);
      scrollTicking = true;
    }
  }, { passive: true });
  onScroll();

  backToTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // ===== Menu mobile =====
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  if (hamburger && navLinks) {
    function toggleMenu(open) {
      const isOpen = open !== undefined ? open : !navLinks.classList.contains('open');
      navLinks.classList.toggle('open', isOpen);
      hamburger.classList.toggle('active', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    }

    hamburger.addEventListener('click', () => toggleMenu());
    navLinks.querySelectorAll('a').forEach(link => link.addEventListener('click', () => toggleMenu(false)));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) {
        toggleMenu(false);
        hamburger.focus();
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 899) toggleMenu(false);
    });
  }

  // ===== Listes dépliables =====
  const mobileQuery = window.matchMedia('(max-width: 899px)');

  // Index + détail : un seul service affiché à la fois
  document.querySelectorAll('[data-browser]').forEach(list => {
    const items = Array.from(list.querySelectorAll('.browser__item'));

    items.forEach(item => {
      item.querySelector('.browser__head').addEventListener('click', () => {
        items.forEach(other => {
          const isOpen = other === item;
          other.classList.toggle('is-open', isOpen);
          other.querySelector('.browser__head').setAttribute('aria-expanded', String(isOpen));
        });
      });
    });
  });

  // Listes [data-compact] : tout est visible sur ordinateur, dépliable sur mobile
  function syncCompactLists() {
    document.querySelectorAll('[data-compact]').forEach(list => {
      list.querySelectorAll('.acc').forEach((item, i) => {
        const head = item.querySelector('.acc__head');
        if (mobileQuery.matches) {
          const isOpen = i === 0;
          item.classList.toggle('is-open', isOpen);
          head.setAttribute('role', 'button');
          head.setAttribute('tabindex', '0');
          head.setAttribute('aria-expanded', String(isOpen));
        } else {
          item.classList.remove('is-open');
          head.removeAttribute('role');
          head.removeAttribute('tabindex');
          head.removeAttribute('aria-expanded');
        }
      });
    });
  }

  function toggleCompactItem(head) {
    const item = head.closest('.acc');
    const willOpen = !item.classList.contains('is-open');
    item.closest('[data-compact]').querySelectorAll('.acc').forEach(other => {
      const isOpen = other === item && willOpen;
      other.classList.toggle('is-open', isOpen);
      other.querySelector('.acc__head').setAttribute('aria-expanded', String(isOpen));
    });
  }

  document.addEventListener('click', (e) => {
    const head = e.target.closest?.('[data-compact] .acc__head');
    if (head && mobileQuery.matches) toggleCompactItem(head);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const head = e.target.closest?.('[data-compact] .acc__head');
    if (head && mobileQuery.matches) {
      e.preventDefault();
      toggleCompactItem(head);
    }
  });

  mobileQuery.addEventListener('change', syncCompactLists);
  syncCompactLists();

  // ===== Un écran par section =====
  // Réduit le rem tant qu'une section dépasse de l'écran, dans son état le plus long
  // (élément le plus long ouvert dans chaque liste dépliable).
  const screenPanels = Array.from(document.querySelectorAll('.panel, .hero, .page-hero'));

  function openLongestItems() {
    const restore = [];
    const textLength = el => (el ? el.textContent.length : 0);

    function forceOpen(items, bodySelector, setState) {
      const longest = items.reduce((a, b) => (textLength(b.querySelector(bodySelector)) > textLength(a.querySelector(bodySelector)) ? b : a));
      items.forEach(item => {
        const wasOpen = setState(item);
        restore.push(() => setState(item, wasOpen));
      });
      items.forEach(item => setState(item, item === longest));
    }

    const classState = (item, value) => {
      const current = item.classList.contains('is-open');
      if (value !== undefined) item.classList.toggle('is-open', value);
      return current;
    };
    const detailsState = (item, value) => {
      const current = item.open;
      if (value !== undefined) item.open = value;
      return current;
    };

    document.querySelectorAll('.faq__list').forEach(list => {
      forceOpen(Array.from(list.querySelectorAll('.faq__item')), '.faq__answer', detailsState);
    });
    if (mobileQuery.matches) {
      document.querySelectorAll('[data-browser]').forEach(list => {
        forceOpen(Array.from(list.querySelectorAll('.browser__item')), '.browser__body', classState);
      });
      document.querySelectorAll('[data-compact]').forEach(list => {
        forceOpen(Array.from(list.querySelectorAll('.acc')), '.acc__body', classState);
      });
    }
    return () => restore.forEach(fn => fn());
  }

  function fitPanels() {
    if (!screenPanels.length) return;
    const root = document.documentElement;
    root.style.removeProperty('font-size');
    const restoreItems = openLongestItems();
    const overflows = () => screenPanels.some(panel => panel.offsetHeight > parseFloat(getComputedStyle(panel).minHeight) + 1);
    // Plancher de lisibilité : en dessous, la section grandit plutôt que le texte ne rétrécit
    const minSize = mobileQuery.matches ? 12.5 : 11;
    let size = parseFloat(getComputedStyle(root).fontSize);
    while (overflows() && size > minSize) {
      size = Math.max(minSize, size - 0.25);
      root.style.fontSize = size + 'px';
    }
    restoreItems();
  }

  let fitTimer;
  function scheduleFit() {
    clearTimeout(fitTimer);
    fitTimer = setTimeout(fitPanels, 120);
  }

  fitPanels();
  window.addEventListener('resize', scheduleFit);
  window.addEventListener('load', fitPanels);
  document.fonts?.ready.then(fitPanels);
  window.I18N?.onLanguageChange(() => requestAnimationFrame(fitPanels));

  // ===== Lien actif au défilement =====
  const navLinkItems = document.querySelectorAll('.nav__link');
  const sections = document.querySelectorAll('section[id]');

  if (navLinkItems.length && sections.length) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinkItems.forEach(link => link.classList.remove('active'));
        document.querySelector(`.nav__link[href="#${entry.target.id}"]`)?.classList.add('active');
      });
    }, { rootMargin: '-50% 0px -50% 0px' });
    sections.forEach(section => sectionObserver.observe(section));
  }

  // ===== Indicateurs =====
  const kpiNumbers = document.querySelectorAll('.kpi__num');

  function formatKpi(value, decimals) {
    const lang = window.I18N?.currentLang === 'en' ? 'en-GB' : 'fr-FR';
    return value.toLocaleString(lang, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }

  function animateKpi(el) {
    const target = parseFloat(el.dataset.target);
    const decimals = parseInt(el.dataset.decimal, 10) || 0;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = formatKpi(target, decimals);
      return;
    }
    const start = performance.now();
    const duration = 1500;
    function frame(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = formatKpi(target * eased, decimals);
      if (progress < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  window.I18N?.onLanguageChange(() => {
    kpiNumbers.forEach(el => {
      el.textContent = formatKpi(parseFloat(el.dataset.target), parseInt(el.dataset.decimal, 10) || 0);
    });
  });

  // ===== Apparition au défilement =====
  const observed = document.querySelectorAll('.reveal, [data-observe]');

  // Décale légèrement les éléments d'une même grille
  document.querySelectorAll('.kpis, .steps, .pillars, .commitments, .quotes, .tools, .reasons').forEach(grid => {
    Array.from(grid.children).forEach((child, i) => child.style.setProperty('--i', Math.min(i, 5)));
  });

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        entry.target.querySelectorAll?.('.kpi__num').forEach(animateKpi);
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });
    observed.forEach(el => revealObserver.observe(el));
  } else {
    observed.forEach(el => el.classList.add('visible'));
  }

  // ===== Toast =====
  function showToast(message, type) {
    document.querySelector('.toast')?.remove();
    const toast = document.createElement('div');
    toast.className = 'toast toast--' + type;
    toast.setAttribute('role', 'alert');
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast--visible'));
    setTimeout(() => {
      toast.classList.remove('toast--visible');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ===== GA — liens de contact =====
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

  // ===== Formulaire de contact =====
  const form = document.getElementById('contactForm');
  if (!form) return;

  const prenomInput = document.getElementById('prenom');
  const nomInput = document.getElementById('nom');
  const emailInput = document.getElementById('email');
  const telephoneInput = document.getElementById('telephone');
  const subjectInput = document.getElementById('subject');
  const messageInput = document.getElementById('message');
  const prenomError = document.getElementById('prenomError');
  const nomError = document.getElementById('nomError');
  const emailError = document.getElementById('emailError');
  const telephoneError = document.getElementById('telephoneError');
  const subjectError = document.getElementById('subjectError');
  const messageError = document.getElementById('messageError');
  const submitBtn = document.getElementById('submitBtn');
  const submitLabel = submitBtn.querySelector('.btn__text');

  const charCounter = document.getElementById('charCounter');
  const MAX_CHARS = 2000;

  updateCharCounter();

  function setFieldState(input, errorEl, isValid, message) {
    input.classList.remove('error', 'success');
    input.removeAttribute('aria-invalid');
    errorEl.textContent = '';
    if (isValid === true) {
      input.classList.add('success');
    } else if (isValid === false) {
      input.classList.add('error');
      input.setAttribute('aria-invalid', 'true');
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

  function validateTelephone() {
    const val = telephoneInput.value.trim();
    if (val.length === 0) { setFieldState(telephoneInput, telephoneError, null); return null; }
    const phoneRegex = /^[+]?[\d\s\-().]{6,20}$/;
    if (!phoneRegex.test(val)) { setFieldState(telephoneInput, telephoneError, false, (window.I18N?.__('validation.phone.invalid') || 'Numéro de téléphone invalide')); return false; }
    setFieldState(telephoneInput, telephoneError, true);
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

  [
    [prenomInput, validatePrenom],
    [nomInput, validateNom],
    [emailInput, validateEmail],
    [telephoneInput, validateTelephone],
    [subjectInput, validateSubject],
    [messageInput, validateMessage],
  ].forEach(([input, validate]) => {
    input.addEventListener('blur', validate);
    input.addEventListener('input', function () {
      if (this.classList.contains('error') || this.classList.contains('success')) validate();
    });
  });

  messageInput.addEventListener('input', function () {
    updateCharCounter();
    if (mobileQuery.matches) autoResize(this);
  });

  function updateCharCounter() {
    if (!charCounter) return;
    const remaining = MAX_CHARS - messageInput.value.length;
    charCounter.textContent = remaining;
    charCounter.classList.remove('form__char-counter--warn', 'form__char-counter--danger');
    if (remaining <= 20) charCounter.classList.add('form__char-counter--danger');
    else if (remaining <= 100) charCounter.classList.add('form__char-counter--warn');
  }

  function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }

  function setLoading(loading) {
    submitLabel.textContent = loading
      ? (window.I18N?.__('form.sending') || 'Envoi en cours...')
      : (window.I18N?.__('form.send') || 'Envoyer');
    submitBtn.disabled = loading;
  }

  function clearForm() {
    form.reset();
    [prenomInput, nomInput, emailInput, telephoneInput, subjectInput, messageInput].forEach(el => {
      el.classList.remove('success', 'error');
      el.removeAttribute('aria-invalid');
    });
    [prenomError, nomError, emailError, telephoneError, subjectError, messageError].forEach(el => el.textContent = '');
    updateCharCounter();
    messageInput.style.height = '';
  }

  function showConfirmation(bannerHtml) {
    const banner = document.createElement('div');
    banner.className = 'form-banner';
    banner.setAttribute('role', 'status');
    banner.innerHTML = bannerHtml;
    submitBtn.closest('.form__foot').before(banner);
    setTimeout(() => { banner.classList.add('form-banner--hide'); setTimeout(() => banner.remove(), 400); }, 8000);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const isPrenomValid = validatePrenom();
    const isNomValid = validateNom();
    const isEmailValid = validateEmail();
    const isTelephoneValid = validateTelephone();
    const isSubjectValid = validateSubject();
    const isMessageValid = validateMessage();

    const __t = (k, fb) => window.I18N?.__(k) || fb;
    if (!isPrenomValid || !isNomValid || !isEmailValid || isTelephoneValid === false || !isSubjectValid || !isMessageValid) {
      if (prenomInput.classList.contains('error')) {
        prenomInput.focus();
        showToast(__t('toast.firstname', 'Veuillez remplir votre prénom'), 'error');
      } else if (nomInput.classList.contains('error')) {
        nomInput.focus();
        showToast(__t('toast.lastname', 'Veuillez remplir votre nom'), 'error');
      } else if (emailInput.classList.contains('error')) {
        emailInput.focus();
        showToast(__t('toast.email', 'Veuillez remplir votre email'), 'error');
      } else if (telephoneInput.classList.contains('error')) {
        telephoneInput.focus();
        showToast(__t('toast.phone', 'Numéro de téléphone invalide'), 'error');
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
        } else if (!nomInput.value.trim()) {
          nomInput.focus();
        } else if (!emailInput.value.trim()) {
          emailInput.focus();
        } else if (!subjectInput.value.trim()) {
          subjectInput.focus();
        } else {
          messageInput.focus();
        }
        showToast(req, 'error');
      }
      form.classList.add('shake');
      setTimeout(() => form.classList.remove('shake'), 500);
      return;
    }

    setLoading(true);

    const prenom = prenomInput.value.trim();
    const nom = nomInput.value.trim();
    const email = emailInput.value.trim();
    const telephone = telephoneInput.value.trim();
    const sujet = subjectInput.value.trim() || (window.I18N?.__('form.subject') || 'Nouveau message');
    const message = messageInput.value.trim();
    const fromName = `${prenom} ${nom}`;

    const WORKER_API  = window.WORKER_API_URL  || '';
    const FORMSPREE_ID = window.FORMSPREE_FORM_ID || '';

    function buildApiPayload() {
      return { prenom, nom, email, telephone, sujet, subject: sujet, message, name: fromName };
    }

    // Lit une réponse JSON sans propager une erreur de parsing (405/404/HTML)
    async function readJson(r) {
      const type = (r.headers.get('content-type') || '').toLowerCase();
      if (!type.includes('application/json')) return null;
      try { return await r.json(); } catch (e) { return null; }
    }

    let ok = false;

    // 0) PHP send_mail — uniquement si aucun service n'est configuré et si l'hôte exécute du PHP
    //    (hébergement AMEN). Sur un hébergeur statique la réponse n'est pas du JSON : ignorée sans erreur.
    if (!WORKER_API && !FORMSPREE_ID) {
      try {
        const fd = new FormData();
        fd.append('prenom', prenom);
        fd.append('nom', nom);
        fd.append('email', email);
        fd.append('telephone', telephone);
        fd.append('sujet', sujet);
        fd.append('message', message);
        const r = await fetch('/send_mail.php', { method: 'POST', body: fd });
        const d = await readJson(r);
        if (d && d.success) ok = true;
      } catch (e) { console.warn('send_mail.php failed:', e); }
    }

    // 1) Cloudflare Worker — API JSON (prioritaire si configurée)
    if (!ok && WORKER_API) {
      try {
        const r = await fetch(WORKER_API, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buildApiPayload())
        });
        const d = await readJson(r);
        if (d && d.success) ok = true;
      } catch (e) { console.warn('Worker API failed:', e); }
    }

    // 2) Formspree — hébergement 100 % statique, aucun serveur requis
    if (!ok && FORMSPREE_ID) {
      try {
        const r = await fetch('https://formspree.io/f/' + FORMSPREE_ID, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            prenom, nom, email, telephone, sujet, message,
            _subject: '[IMMEIT - Demande] ' + sujet,
            _gotcha: form.querySelector('[name="_gotcha"]')?.value || ''
          }),
          signal: AbortSignal.timeout(15000)
        });
        if (r.ok) ok = true;
        else console.warn('Formspree failed:', r.status);
      } catch (e) { console.warn('Formspree failed:', e); }
    }

    if (ok) {
      setLoading(false);
      showConfirmation(window.I18N?.__('toast.success') || 'Message envoyé avec succès ! Nous vous répondrons sous 24h.');
      clearForm();
      if (typeof gtag === 'function') gtag('event', 'generate_lead', { value: 1, currency: 'EUR', event_category: 'Contact', event_label: sujet, subject: sujet, lead_source: 'Formulaire site web' });
      return;
    }

    // 3) Repli mailto: — ouvre le logiciel de messagerie du visiteur
    const mailBody = `Prénom: ${prenom}\nNom: ${nom}\nEmail: ${email}\nTéléphone: ${telephone}\nSujet: ${sujet}\n\n${message}`;
    window.location.href = 'mailto:contact@immeit.com'
      + '?subject=' + encodeURIComponent('[IMMEIT - Demande] ' + sujet)
      + '&body='   + encodeURIComponent(mailBody);

    setLoading(false);
    showConfirmation((window.I18N?.__('toast.fallback') || 'Votre logiciel de messagerie va s\'ouvrir avec le message pré-rempli. Sinon, écrivez-nous à ') + '<a href="mailto:contact@immeit.com">contact@immeit.com</a>');
  });

});

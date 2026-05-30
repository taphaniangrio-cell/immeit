(function () {
  const STORAGE_KEY = 'immeit_lang';
  const DEFAULT_LANG = 'fr';

  let currentLang = DEFAULT_LANG;
  let translations = {};
  let loaded = false;

  const listeners = [];

  function getInitialLang() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'fr' || stored === 'en') return stored;
    const navLang = (navigator.language || '').slice(0, 2);
    if (navLang === 'en') return 'en';
    return DEFAULT_LANG;
  }

  async function loadLang(lang) {
    try {
      const resp = await fetch('locales/' + lang + '.json?v=' + Date.now());
      translations = await resp.json();
      currentLang = lang;
      loaded = true;
      localStorage.setItem(STORAGE_KEY, lang);
      applyTranslations();
      listeners.forEach(fn => fn(lang));
      return true;
    } catch (e) {
      if (lang !== DEFAULT_LANG) {
        return loadLang(DEFAULT_LANG);
      }
      return false;
    }
  }

  function applyTranslations() {
    document.documentElement.lang = currentLang;

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const attr = el.getAttribute('data-i18n-attr');
      const value = get(key);
      if (value === null || value === undefined) return;
      if (attr) {
        el.setAttribute(attr, value);
      } else {
        el.innerHTML = value;
      }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const value = get(key);
      if (value !== null && value !== undefined) {
        el.setAttribute('placeholder', value);
      }
    });

    const metaDesc = document.querySelector('meta[name="description"]');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    const twitterDesc = document.querySelector('meta[name="twitter:description"]');
    const titleEl = document.querySelector('title');

    const page = getPagePrefix();

    if (titleEl) {
      const t = get(page + 'meta.title') || get('meta.title');
      if (t) titleEl.innerHTML = t;
    }
    if (metaDesc) {
      const d = get(page + 'meta.description') || get('meta.description');
      if (d) metaDesc.setAttribute('content', d);
    }
    if (ogTitle) {
      const t = get(page + 'meta.ogTitle') || get(page + 'meta.title') || get('meta.ogTitle');
      if (t) ogTitle.setAttribute('content', t);
    }
    if (ogDesc) {
      const d = get(page + 'meta.ogDescription') || get(page + 'meta.description') || get('meta.ogDescription');
      if (d) ogDesc.setAttribute('content', d);
    }
    if (twitterDesc) {
      const d = get(page + 'meta.twitterDescription') || get(page + 'meta.description') || get('meta.twitterDescription');
      if (d) twitterDesc.setAttribute('content', d);
    }

    updateSwitcher();
  }

  function getPagePrefix() {
    const path = window.location.pathname;
    if (path.includes('methodes-maintenance')) return 'mm.';
    if (path.includes('climatisation')) return 'clim.';
    if (path.includes('maintenance-multi-technique')) return 'mmt.';
    if (path.includes('pourquoi-choisir-immeit')) return 'why.';
    return '';
  }

  function get(key) {
    return translations[key] !== undefined ? translations[key] : null;
  }

  function __(key) {
    const val = get(key);
    return val !== null ? val : key;
  }

  function updateSwitcher() {
    const btn = document.querySelector('.lang-switcher');
    if (!btn) return;
    btn.innerHTML = get('lang.switch') || (currentLang === 'fr' ? 'EN' : 'FR');
    btn.setAttribute('aria-label', get('lang.label') || (currentLang === 'fr' ? 'English' : 'Français'));
  }

  function createSwitcher() {
    const existing = document.querySelector('.lang-switcher');
    if (existing) return;

    const actions = document.querySelector('.nav__actions');
    if (!actions) return;

    const btn = document.createElement('button');
    btn.className = 'lang-switcher';
    btn.setAttribute('aria-label', 'Switch language');
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      const next = currentLang === 'fr' ? 'en' : 'fr';
      loadLang(next);
    });
    actions.insertBefore(btn, actions.firstChild);
    updateSwitcher();
  }

  function onLanguageChange(fn) {
    listeners.push(fn);
    if (loaded) fn(currentLang);
  }

  window.I18N = {
    get currentLang() { return currentLang; },
    loadLang,
    __,
    get,
    onLanguageChange,
  };

  document.addEventListener('DOMContentLoaded', async () => {
    currentLang = getInitialLang();
    createSwitcher();
    await loadLang(currentLang);
  });
})();

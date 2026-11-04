'use strict';

(() => {
  const GLOBAL_THEME_KEY = 'nexchat-theme';
  const ADMIN_THEME_KEY = 'nexchat-admin-theme';
  const LEGACY_KEY = 'nexchat-home-theme';
  const SIDEBAR_THEME_KEY = 'nexchat-chat-sidebar-theme';
  const allowedThemes = new Set(['auto', 'light', 'dark']);
  const adminScope = /^\/admin(?:\/|$)/.test(window.location.pathname);
  const storageKey = adminScope ? ADMIN_THEME_KEY : GLOBAL_THEME_KEY;

  let selected = 'auto';
  try {
    const saved = localStorage.getItem(storageKey)
      || (!adminScope ? localStorage.getItem(LEGACY_KEY) : null)
      || 'auto';
    selected = allowedThemes.has(saved) ? saved : 'auto';
  } catch (_error) {
    selected = 'auto';
  }

  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches === true;
  const resolved = selected === 'dark' || (selected === 'auto' && prefersDark) ? 'dark' : 'light';
  const root = document.documentElement;
  // Resolve the first-paint language before the deferred translation bundle runs.
  // A user choice always wins; otherwise use the cached country result, time zone,
  // then the browser language. i18n.js verifies the country with /api/locale.
  const languageLocales = {vi:'vi-VN',en:'en-US',zh:'zh-CN',ru:'ru-RU',de:'de-DE',th:'th-TH',es:'es-ES',fr:'fr-FR',ja:'ja-JP'};
  const normalizeLanguage = (value) => {
    const code = String(value || '').trim().toLowerCase().replace('_','-').split('-')[0];
    return languageLocales[code] ? code : '';
  };
  let earlyLanguage = '';
  try {
    const saved = normalizeLanguage(localStorage.getItem('nexchat-language'));
    const source = localStorage.getItem('nexchat-language-source');
    if (saved && source !== 'auto') { earlyLanguage = saved; if (source !== 'manual') localStorage.setItem('nexchat-language-source','manual'); }
    if (!earlyLanguage) {
      const cached = JSON.parse(localStorage.getItem('nexchat-language-auto-cache') || 'null');
      if (cached && Date.now() - Number(cached.at || 0) < 30 * 24 * 60 * 60 * 1000) earlyLanguage = normalizeLanguage(cached.language);
    }
  } catch (_error) {}
  if (!earlyLanguage) {
    let zone = '';
    try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (_error) {}
    const zoneLanguage = {
      'Asia/Ho_Chi_Minh':'vi','Asia/Saigon':'vi','Asia/Shanghai':'zh','Asia/Chongqing':'zh','Asia/Taipei':'zh','Asia/Hong_Kong':'zh','Asia/Macau':'zh',
      'Europe/Moscow':'ru','Europe/Berlin':'de','Europe/Vienna':'de','Europe/Zurich':'de','Asia/Bangkok':'th','Europe/Madrid':'es','Atlantic/Canary':'es',
      'Europe/Paris':'fr','Europe/Monaco':'fr','Asia/Tokyo':'ja'
    }[zone];
    earlyLanguage = zoneLanguage || normalizeLanguage(navigator.language) || 'vi';
  }
  root.lang = languageLocales[earlyLanguage] || languageLocales.vi;
  root.dataset.language = earlyLanguage;
  const chatScope = /^\/chat(?:\/|$)/.test(window.location.pathname);
  if (chatScope) {
    let sidebarTheme = resolved === 'dark' ? 'cosmic' : 'heaven';
    try {
      const savedSidebarTheme = localStorage.getItem(SIDEBAR_THEME_KEY);
      if (savedSidebarTheme === 'cosmic' || savedSidebarTheme === 'heaven') sidebarTheme = savedSidebarTheme;
    } catch (_error) {}
    root.dataset.sidebarTheme = sidebarTheme;
  }
  root.dataset.theme = resolved;
  root.dataset.themeMode = selected;
  if (adminScope) root.dataset.adminTheme = resolved === 'dark' ? 'cyber' : 'aurora';
  root.style.colorScheme = resolved;
  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) themeColor.setAttribute('content', adminScope ? (resolved === 'dark' ? '#050816' : '#eef8ff') : (resolved === 'dark' ? '#171923' : '#ffffff'));
})();

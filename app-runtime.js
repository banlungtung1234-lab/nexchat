'use strict';

(() => {
  if (window.NexRuntime?.version) return;

  const VERSION = '1.0.0';
  const root = document.documentElement;
  const state = {
    version: VERSION,
    viewportFrame: 0,
    layerFrame: 0,
    lastWidth: 0,
    lastHeight: 0,
    visualHeight: 0,
    keyboardHeight: 0,
    keyboardOpen: false,
    mobile: false,
    runtimeQuality: 'balanced',
    frameSample: 0,
    scrollEndTimer: 0,
    scrollFrame: 0,
    longTaskObserver: null,
    longTaskBudget: 0,
    longTaskResetTimer: 0,
  };

  const isEditable = (node) => Boolean(node && (
    node.matches?.('input, textarea, select, [contenteditable="true"]')
    || node.closest?.('[contenteditable="true"]')
  ));

  function requestedPerformanceMode() {
    try {
      const value = localStorage.getItem('nexchat-smart-performance') || 'auto';
      return ['auto', 'economy', 'full'].includes(value) ? value : 'auto';
    } catch { return 'auto'; }
  }

  function deviceTier() {
    const memory = Number(navigator.deviceMemory || 0);
    const cores = Number(navigator.hardwareConcurrency || 0);
    const saveData = navigator.connection?.saveData === true;
    const width = Math.round(window.visualViewport?.width || window.innerWidth || root.clientWidth || 0);
    const mobile = width <= 1024 || matchMedia('(pointer: coarse) and (max-width: 1366px)').matches;
    const unknownHardware = memory <= 0 || cores <= 0;
    if (saveData || (memory > 0 && memory <= 2) || (cores > 0 && cores <= 2)) return 'economy';
    if ((memory > 0 && memory <= 4) || (cores > 0 && cores <= 4) || (mobile && unknownHardware)) return 'balanced';
    return 'full';
  }

  function viewportSnapshot() {
    const layoutWidth = Math.max(1, window.innerWidth || root.clientWidth || 1);
    const layoutHeight = Math.max(1, window.innerHeight || root.clientHeight || 1);
    const visual = window.visualViewport;
    const width = Math.max(1, Math.round(visual?.width || layoutWidth));
    const height = Math.max(1, Math.round(visual?.height || layoutHeight));
    const offsetTop = Math.max(0, Math.round(visual?.offsetTop || 0));
    const offsetLeft = Math.max(0, Math.round(visual?.offsetLeft || 0));
    const scale = Number(visual?.scale || 1);
    return { layoutWidth, layoutHeight, width, height, offsetTop, offsetLeft, scale };
  }

  function updateLayerState() {
    const body = document.body;
    if (!body) return;
    const mobile = state.mobile;
    const visibleModal = [...document.querySelectorAll('.modal-backdrop')].some((node) => (
      !node.classList.contains('hidden')
      && !node.classList.contains('is-closing')
      && !node.classList.contains('modal-closing')
      && getComputedStyle(node).display !== 'none'
    ));
    const drawerOpen = body.classList.contains('chat-sidebar-open') || body.classList.contains('admin-sidebar-open');
    const sheetOpen = body.classList.contains('sidebar-theme-panel-open') || Boolean(document.querySelector('.global-theme-menu.is-open'));
    body.classList.toggle('mobile-layer-open', mobile && (visibleModal || drawerOpen || sheetOpen));
    body.dataset.mobileLayer = visibleModal ? 'modal' : drawerOpen ? 'drawer' : sheetOpen ? 'sheet' : 'none';
  }

  function scheduleLayerUpdate() {
    if (state.layerFrame) return;
    state.layerFrame = requestAnimationFrame(() => {
      state.layerFrame = 0;
      updateLayerState();
    });
  }

  function cleanupStaleMobileLayers() {
    const body = document.body;
    if (!body) return;
    document.querySelectorAll('.sidebar-overlay.is-closing').forEach((overlay) => {
      const sidebar = overlay.previousElementSibling;
      if (!sidebar?.classList.contains('open') && !sidebar?.classList.contains('is-open')) {
        overlay.classList.add('hidden');
        overlay.classList.remove('is-closing', 'is-visible');
      }
    });
    if (!state.mobile) {
      body.classList.remove('chat-sidebar-open', 'admin-sidebar-open', 'mobile-layer-open');
      document.querySelectorAll('.sidebar.open,.sidebar.is-open,.admin-sidebar.open,.admin-sidebar.is-open').forEach((drawer) => drawer.classList.remove('open', 'is-open'));
      document.querySelectorAll('.sidebar-overlay').forEach((overlay) => overlay.classList.add('hidden'));
    }
    scheduleLayerUpdate();
  }

  function updateEnvironment() {
    const snap = viewportSnapshot();
    const editableFocused = isEditable(document.activeElement);
    const occlusion = Math.max(0, Math.round(snap.layoutHeight - snap.height - snap.offsetTop));
    const keyboardOpen = editableFocused && occlusion >= 100;
    const keyboardHeight = keyboardOpen ? occlusion : 0;
    const coarsePointer = matchMedia('(pointer: coarse)').matches;
    const mobile = snap.width <= 1024 || (coarsePointer && snap.width <= 1366 && snap.height <= 1024);
    const compactHeight = snap.height <= 620;
    const phone = snap.width <= 560;
    const landscape = snap.width > snap.height;

    root.style.setProperty('--app-width', `${snap.width}px`);
    root.style.setProperty('--app-height', `${snap.layoutHeight}px`);
    root.style.setProperty('--visual-width', `${snap.width}px`);
    root.style.setProperty('--visual-height', `${snap.height}px`);
    root.style.setProperty('--visual-offset-top', `${snap.offsetTop}px`);
    root.style.setProperty('--visual-offset-left', `${snap.offsetLeft}px`);
    root.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
    root.style.setProperty('--keyboard-inset', `${keyboardHeight}px`);
    root.style.setProperty('--mobile-app-height', `${snap.height}px`);
    root.style.setProperty('--mobile-admin-height', `${snap.height}px`);
    root.style.setProperty('--app-vh', `${snap.height * 0.01}px`);
    root.style.setProperty('--viewport-scale', String(snap.scale));

    root.dataset.viewport = phone ? 'phone' : snap.width <= 1024 ? 'tablet' : 'desktop';
    root.dataset.orientation = landscape ? 'landscape' : 'portrait';
    root.dataset.viewportClass = snap.width < 360 ? 'micro' : snap.width < 480 ? 'small' : snap.width < 768 ? 'phone' : snap.width < 1180 ? 'tablet' : snap.width < 1800 ? 'desktop' : 'wide';
    root.dataset.input = coarsePointer ? 'touch' : 'precision';
    root.dataset.compactHeight = compactHeight ? 'true' : 'false';
    root.dataset.mobileUi = mobile ? 'true' : 'false';
    const performanceMode = requestedPerformanceMode();
    root.dataset.performanceMode = performanceMode;
    root.dataset.performance = performanceMode === 'auto' ? deviceTier() : performanceMode;
    root.dataset.network = navigator.onLine ? 'online' : 'offline';
    root.dataset.keyboard = keyboardOpen ? 'open' : 'closed';
    root.classList.toggle('mobile-keyboard-open', keyboardOpen);

    const body = document.body;
    body?.classList.toggle('mobile-ui-active', mobile);
    body?.classList.toggle('mobile-phone-ui', phone);
    body?.classList.toggle('mobile-tablet-ui', mobile && !phone);
    body?.classList.toggle('mobile-landscape', mobile && landscape);
    body?.classList.toggle('mobile-compact-height', mobile && compactHeight);
    body?.classList.toggle('mobile-keyboard-open', keyboardOpen);

    state.lastWidth = snap.width;
    state.lastHeight = snap.layoutHeight;
    state.visualHeight = snap.height;
    state.keyboardHeight = keyboardHeight;
    state.keyboardOpen = keyboardOpen;
    const mobileChanged = state.mobile !== mobile;
    state.mobile = mobile;
    scheduleLayerUpdate();
    document.dispatchEvent(new CustomEvent('nexchat:runtime-environment', { detail:{ mobile, phone, landscape, compactHeight, keyboardOpen, performance:root.dataset.performance } }));
    if (mobileChanged) {
      document.dispatchEvent(new CustomEvent('nexchat:runtime-mobile-change', { detail:{ mobile } }));
      runWhenIdle(() => sampleFrameBudget('mobile-change'), 700);
    }
  }

  function scheduleEnvironmentUpdate() {
    if (state.viewportFrame) return;
    state.viewportFrame = requestAnimationFrame(() => {
      state.viewportFrame = 0;
      updateEnvironment();
    });
  }

  function runWhenIdle(callback, timeout = 900) {
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(callback, { timeout });
      return;
    }
    setTimeout(callback, Math.min(timeout, 120));
  }

  function applyRuntimeQuality(quality, reason = 'environment') {
    const allowed = ['smooth', 'balanced', 'limited'];
    const next = allowed.includes(quality) ? quality : 'balanced';
    state.runtimeQuality = next;
    root.dataset.runtimeQuality = next;
    root.dataset.runtimeQualityReason = reason;
    root.style.setProperty('--runtime-motion-scale', next === 'smooth' ? '1' : next === 'balanced' ? '.92' : '.78');
    document.dispatchEvent(new CustomEvent('nexchat:runtime-quality', { detail: { quality: next, reason } }));
  }

  function environmentRuntimeQuality() {
    const requested = requestedPerformanceMode();
    if (requested === 'economy') return 'limited';
    if (requested === 'full') return 'smooth';
    const tier = deviceTier();
    if (tier === 'economy') return 'limited';
    if (tier === 'balanced') return 'balanced';
    return 'smooth';
  }

  function sampleFrameBudget(reason = 'startup') {
    if (document.hidden || state.frameSample) return;
    const requested = requestedPerformanceMode();
    if (requested !== 'auto') {
      applyRuntimeQuality(environmentRuntimeQuality(), 'manual');
      return;
    }
    let last = performance.now();
    let frames = 0;
    let elapsed = 0;
    let longFrames = 0;
    const targetFrames = state.mobile ? 54 : 72;
    const sample = (now) => {
      if (document.hidden) {
        state.frameSample = 0;
        return;
      }
      const delta = Math.max(0, Math.min(120, now - last));
      last = now;
      if (delta > 0) {
        elapsed += delta;
        frames += 1;
        if (delta > 28) longFrames += 1;
      }
      if (frames < targetFrames) {
        state.frameSample = requestAnimationFrame(sample);
        return;
      }
      state.frameSample = 0;
      const average = elapsed / Math.max(1, frames);
      const fps = average > 0 ? 1000 / average : 60;
      const longRatio = longFrames / Math.max(1, frames);
      const tier = deviceTier();
      let quality = tier === 'economy' ? 'limited' : tier === 'balanced' ? 'balanced' : 'smooth';
      if (fps < 43 || longRatio > .24) quality = 'limited';
      else if (fps < 55 || longRatio > .11 || tier === 'balanced') quality = 'balanced';
      applyRuntimeQuality(quality, `${reason}:${Math.round(fps)}fps`);
    };
    state.frameSample = requestAnimationFrame(sample);
  }

  function updatePageVisibility() {
    const hidden = document.hidden;
    root.dataset.pageVisibility = hidden ? 'hidden' : 'visible';
    document.body?.classList.toggle('runtime-paused', hidden);
    if (!hidden) runWhenIdle(() => sampleFrameBudget('resume'), 1200);
  }

  function markScrollActivity() {
    if (!state.scrollFrame) {
      state.scrollFrame = requestAnimationFrame(() => {
        state.scrollFrame = 0;
        root.dataset.runtimeScrolling = 'true';
        document.body?.classList.add('runtime-scrolling');
      });
    }
    clearTimeout(state.scrollEndTimer);
    state.scrollEndTimer = setTimeout(() => {
      root.dataset.runtimeScrolling = 'false';
      document.body?.classList.remove('runtime-scrolling');
    }, 150);
  }

  function initialiseMobileLongTaskGuard() {
    if (!('PerformanceObserver' in window) || state.longTaskObserver) return;
    try {
      state.longTaskObserver = new PerformanceObserver((list) => {
        if (!state.mobile || requestedPerformanceMode() !== 'auto' || document.hidden) return;
        for (const entry of list.getEntries()) state.longTaskBudget += Math.max(0, Number(entry.duration || 0) - 45);
        clearTimeout(state.longTaskResetTimer);
        state.longTaskResetTimer = setTimeout(() => { state.longTaskBudget = 0; }, 8000);
        if (state.longTaskBudget >= 320 && state.runtimeQuality !== 'limited') {
          applyRuntimeQuality('limited', 'mobile-long-tasks');
          state.longTaskBudget = 0;
          document.dispatchEvent(new CustomEvent('nexchat:mobile-performance-guard', { detail:{ quality:'limited', reason:'long-tasks' } }));
        }
      });
      state.longTaskObserver.observe({ entryTypes:['longtask'] });
    } catch { state.longTaskObserver = null; }
  }

  function initialiseSmoothRuntime() {
    applyRuntimeQuality(environmentRuntimeQuality(), 'environment');
    initialiseMobileLongTaskGuard();
    updatePageVisibility();
    document.addEventListener('scroll', markScrollActivity, { passive: true, capture: true });
    document.addEventListener('visibilitychange', updatePageVisibility);
    document.addEventListener('nexchat:performance-mode', () => runWhenIdle(() => sampleFrameBudget('mode'), 600));
    runWhenIdle(() => sampleFrameBudget('startup'), 1100);
    setTimeout(() => runWhenIdle(() => sampleFrameBudget('settled'), 900), 7000);
  }

  function markReady() {
    updateEnvironment();
    cleanupStaleMobileLayers();
    requestAnimationFrame(() => {
      root.classList.add('app-runtime-ready');
      document.body?.classList.add('app-runtime-ready');
      root.classList.add('runtime-hydrated');
    });
  }

  function updateNetwork() {
    root.dataset.network = navigator.onLine ? 'online' : 'offline';
    document.dispatchEvent(new CustomEvent('nexchat:network', { detail: { online: navigator.onLine } }));
  }

  addEventListener('resize', scheduleEnvironmentUpdate, { passive: true });
  addEventListener('orientationchange', () => setTimeout(() => { scheduleEnvironmentUpdate(); cleanupStaleMobileLayers(); }, 80), { passive: true });
  addEventListener('online', updateNetwork, { passive: true });
  addEventListener('offline', updateNetwork, { passive: true });
  addEventListener('focusin', scheduleEnvironmentUpdate, true);
  addEventListener('focusout', () => setTimeout(scheduleEnvironmentUpdate, 100), true);
  addEventListener('storage', (event) => { if (event.key === 'nexchat-smart-performance') scheduleEnvironmentUpdate(); });
  addEventListener('pageshow', () => { scheduleEnvironmentUpdate(); cleanupStaleMobileLayers(); }, { passive: true });
  addEventListener('pagehide', scheduleLayerUpdate, { passive: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { scheduleEnvironmentUpdate(); cleanupStaleMobileLayers(); } });
  window.visualViewport?.addEventListener('resize', scheduleEnvironmentUpdate, { passive: true });
  window.visualViewport?.addEventListener('scroll', scheduleEnvironmentUpdate, { passive: true });
  navigator.connection?.addEventListener?.('change', scheduleEnvironmentUpdate);

  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const contrastQuery = matchMedia('(prefers-contrast: more)');
  const coarseQuery = matchMedia('(pointer: coarse)');
  const applyPreferences = () => {
    root.dataset.motion = motionQuery.matches ? 'reduced' : 'full';
    root.dataset.contrast = contrastQuery.matches ? 'more' : 'normal';
    root.dataset.input = coarseQuery.matches ? 'touch' : 'precision';
    scheduleEnvironmentUpdate();
  };
  motionQuery.addEventListener?.('change', applyPreferences);
  contrastQuery.addEventListener?.('change', applyPreferences);
  coarseQuery.addEventListener?.('change', applyPreferences);
  applyPreferences();

  const layerObserver = new MutationObserver((records) => {
    if (records.some((record) => record.type === 'attributes' || record.addedNodes.length || record.removedNodes.length)) scheduleLayerUpdate();
  });
  const observeLayers = () => layerObserver.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'aria-hidden'] });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { observeLayers(); initialiseSmoothRuntime(); markReady(); }, { once: true });
  } else {
    observeLayers();
    initialiseSmoothRuntime();
    markReady();
  }

  window.NexRuntime = Object.freeze({
    version: state.version,
    refresh: scheduleEnvironmentUpdate,
    refreshLayers: scheduleLayerUpdate,
    get keyboardOpen() { return state.keyboardOpen; },
    get keyboardHeight() { return state.keyboardHeight; },
    get mobile() { return state.mobile; },
    get runtimeQuality() { return state.runtimeQuality; },
    get viewport() { return { width: state.lastWidth, height: state.lastHeight, visualHeight: state.visualHeight }; },
  });


  // VIP/LEGEND artwork fallback: never leave a blank glowing circle when an
  // image request is interrupted by cache, deployment, or network errors.
  document.addEventListener('error', (event) => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement) || !image.classList.contains('rank-emblem-art')) return;
    const host = image.closest('.rank-emblem-image-host');
    if (host) host.classList.add('rank-emblem-fallback');
  }, true);
  document.addEventListener('load', (event) => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement) || !image.classList.contains('rank-emblem-art')) return;
    const host = image.closest('.rank-emblem-image-host');
    if (host) host.classList.remove('rank-emblem-fallback');
  }, true);
})();

(() => {
  const root = document.documentElement;
  const body = document.body;
  const header = document.getElementById('homeHeader');
  const menuButton = document.getElementById('homeMenuButton');
  const nav = document.getElementById('homeNav');
  const optionsButton = document.getElementById('homeThemeButton');
  const motionTrigger = document.getElementById('homeMotionButton');
  const optionsClose = document.getElementById('homeOptionsClose');
  const optionsPanel = document.getElementById('homeOptions');
  const optionsScrim = document.getElementById('homeOptionsScrim');
  const cosmosCanvas = document.getElementById('homeCosmos');
  const backToTop = document.getElementById('homeBackToTop');
  const themeState = document.getElementById('homeThemeState');
  const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
  const smallScreenQuery = window.matchMedia('(max-width: 760px)');

  let effectiveMotion = 'balanced';
  let scrollFrame = 0;
  let pointerFrame = 0;
  let pointerX = window.innerWidth * 0.5;
  let pointerY = window.innerHeight * 0.5;
  let pointerAppliedX = 0;
  let pointerAppliedY = 0;
  let pointerLastPaintAt = 0;
  let optionsCloseTimer = 0;
  let cosmosController = null;
  let v10MotionActive = false;
  let v10ResolvedMotion = 'balanced';

  const allowedThemeValues = new Set(['auto', 'light', 'dark']);
  const allowedMotionValues = new Set(['auto', 'full', 'reduced']);

  function readSetting(key, fallback, allowed) {
    try {
      const value = localStorage.getItem(key) || fallback;
      return allowed.has(value) ? value : fallback;
    } catch (_error) {
      return fallback;
    }
  }

  function saveSetting(key, value) {
    try { localStorage.setItem(key, value); } catch (_error) {}
  }

  function updateOptionsSummary() {
    const activeTheme = document.querySelector('.home-choice-grid[data-home-theme] > button.active b');
    const themeLabel = activeTheme?.textContent?.trim() || 'Tự động';
    if (themeState) themeState.textContent = themeLabel;
    if (optionsButton) {
      const selectedTheme = readSetting('nexchat-theme', 'auto', allowedThemeValues);
      optionsButton.dataset.themeChoice = selectedTheme;
      const themeIcon = optionsButton.querySelector('.home-theme-button-icon');
      if (themeIcon) themeIcon.textContent = selectedTheme === 'light' ? '☀' : selectedTheme === 'dark' ? '☾' : '◐';
      optionsButton.title = `Giao diện: ${themeLabel}`;
      optionsButton.setAttribute('aria-label', `Mở lựa chọn giao diện. Đang dùng ${themeLabel}.`);
    }
  }

  function preferredTheme() {
    const saved = readSetting('nexchat-theme', 'auto', allowedThemeValues);
    if (saved === 'auto') return darkQuery.matches ? 'dark' : 'light';
    return saved;
  }

  function applyTheme() {
    const selected = readSetting('nexchat-theme', 'auto', allowedThemeValues);
    const resolved = preferredTheme();
    root.dataset.homeTheme = resolved;
    root.dataset.theme = resolved;
    root.dataset.themeMode = selected;
    root.style.colorScheme = resolved;
    cosmosController?.setTheme(resolved);
    document.querySelectorAll('.home-choice-grid[data-home-theme] > button').forEach((button) => {
      const active = button.dataset.value === selected;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    updateOptionsSummary();
  }

  function deviceNeedsBalancedMotion() {
    const lowCpu = Number(navigator.hardwareConcurrency || 8) <= 4;
    const lowMemory = Number(navigator.deviceMemory || 8) <= 4;
    return smallScreenQuery.matches || lowCpu || lowMemory || !finePointerQuery.matches;
  }

  function resolveMotion(selected) {
    if (selected === 'reduced') return 'reduced';
    if (selected === 'full') return 'full';
    if (reduceQuery.matches) return 'reduced';
    return deviceNeedsBalancedMotion() ? 'balanced' : 'full';
  }

  function setHomeMotionVisual(mode) {
    effectiveMotion = mode;
    body.dataset.homeMotion = effectiveMotion;
    body.classList.toggle('home-motion-reduced', effectiveMotion === 'reduced');
    body.classList.toggle('home-motion-balanced', effectiveMotion === 'balanced');
    body.classList.toggle('home-motion-full', effectiveMotion === 'full');
    if (effectiveMotion !== 'full') {
      root.style.setProperty('--home-pointer-x', '0px');
      root.style.setProperty('--home-pointer-y', '0px');
    }
    cosmosController?.setMode(effectiveMotion);
  }

  function syncV10Motion(detail = {}) {
    const resolved = String(detail.resolved || v10ResolvedMotion || 'balanced');
    v10ResolvedMotion = resolved;
    v10MotionActive = true;
    const mapped = resolved === 'cinematic' ? 'full' : resolved === 'balanced' ? 'balanced' : 'reduced';
    setHomeMotionVisual(mapped);
    if (motionTrigger) motionTrigger.dataset.resolved = resolved;
  }

  function applyMotion() {
    if (v10MotionActive) {
      syncV10Motion({ resolved: v10ResolvedMotion });
      return;
    }
    const selected = readSetting('nexchat-home-motion', 'auto', allowedMotionValues);
    setHomeMotionVisual(resolveMotion(selected));
  }

  function closeMenu() {
    body.classList.remove('home-menu-open');
    menuButton?.setAttribute('aria-expanded', 'false');
  }

  let optionsTransitionToken = 0;

  function finishOptionsClosed(token = optionsTransitionToken) {
    if (token !== optionsTransitionToken) return;
    optionsPanel?.classList.remove('is-open');
    optionsPanel?.classList.add('hidden');
    optionsPanel?.setAttribute('aria-hidden', 'true');
    optionsScrim?.classList.remove('is-open');
    optionsScrim?.classList.add('hidden');
    optionsScrim?.setAttribute('aria-hidden', 'true');
    body.classList.remove('home-options-open');
  }

  function closeOptions({ restoreFocus = false, immediate = false } = {}) {
    const token = ++optionsTransitionToken;
    clearTimeout(optionsCloseTimer);

    // Always clean every related state, even when the panel is already hidden.
    // This prevents a stale scrim/backdrop-filter from surviving BFCache,
    // rapid double clicks or an interrupted close transition.
    optionsPanel?.classList.remove('is-open');
    optionsPanel?.setAttribute('aria-hidden', 'true');
    optionsButton?.setAttribute('aria-expanded', 'false');
    optionsScrim?.classList.remove('is-open');
    optionsScrim?.setAttribute('aria-hidden', 'true');
    body.classList.remove('home-options-open');

    if (immediate || !optionsPanel || optionsPanel.classList.contains('hidden')) {
      finishOptionsClosed(token);
    } else {
      const finish = () => finishOptionsClosed(token);
      const onTransitionEnd = (event) => {
        if (event.target !== optionsPanel || !['opacity','transform'].includes(event.propertyName)) return;
        optionsPanel.removeEventListener('transitionend', onTransitionEnd);
        finish();
      };
      optionsPanel.addEventListener('transitionend', onTransitionEnd);
      optionsCloseTimer = window.setTimeout(() => {
        optionsPanel.removeEventListener('transitionend', onTransitionEnd);
        finish();
      }, 240);
    }

    if (restoreFocus) optionsButton?.focus({ preventScroll: true });
  }

  function openOptions() {
    if (!optionsPanel) return;
    const token = ++optionsTransitionToken;
    clearTimeout(optionsCloseTimer);
    optionsPanel.classList.remove('hidden');
    optionsScrim?.classList.remove('hidden');
    optionsPanel.setAttribute('aria-hidden', 'false');
    optionsScrim?.setAttribute('aria-hidden', 'false');
    optionsButton?.setAttribute('aria-expanded', 'true');
    closeMenu();
    requestAnimationFrame(() => {
      if (token !== optionsTransitionToken) return;
      body.classList.add('home-options-open');
      optionsPanel.classList.add('is-open');
      optionsScrim?.classList.add('is-open');
    });
  }

  menuButton?.addEventListener('click', () => {
    const open = !body.classList.contains('home-menu-open');
    body.classList.toggle('home-menu-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    if (open) closeOptions();
  });

  nav?.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });

  optionsButton?.addEventListener('click', (event) => {
    event.stopPropagation();
    if (optionsPanel?.classList.contains('hidden')) openOptions();
    else closeOptions();
  });

  optionsScrim?.addEventListener('click', () => closeOptions());

  optionsClose?.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    closeOptions({ restoreFocus: true });
  });

  optionsPanel?.addEventListener('click', (event) => {
    event.stopPropagation();
    const themeButton = event.target.closest('.home-choice-grid[data-home-theme] > button');
    const motionButton = event.target.closest('.home-choice-grid[data-home-motion] > button');
    if (themeButton) {
      saveSetting('nexchat-theme', themeButton.dataset.value);
      saveSetting('nexchat-home-theme', themeButton.dataset.value);
      applyTheme();
    }
    if (motionButton) {
      saveSetting('nexchat-home-motion', motionButton.dataset.value);
      applyMotion();
    }
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.home-nav-shell')) closeOptions();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMenu();
      closeOptions({ restoreFocus: true });
    }
  });

  function syncScrollUI() {
    scrollFrame = 0;
    const y = window.scrollY;
    header?.classList.toggle('is-scrolled', y > 18);
    const showBackToTop = y > Math.max(480, window.innerHeight * 0.7);
    backToTop?.classList.toggle('is-visible', showBackToTop);
    backToTop?.setAttribute('aria-hidden', String(!showBackToTop));
  }

  window.addEventListener('scroll', () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(syncScrollUI);
  }, { passive: true });

  backToTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: effectiveMotion === 'reduced' ? 'auto' : 'smooth' });
  });

  const revealNodes = [...document.querySelectorAll('.home-reveal')];
  revealNodes.forEach((node, index) => node.style.setProperty('--reveal-order', String(index % 5)));
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px -7% 0px', threshold: 0.07 });
    revealNodes.forEach((node) => observer.observe(node));
  } else {
    revealNodes.forEach((node) => node.classList.add('is-visible'));
  }

  const animatedSections = [...document.querySelectorAll('.home-product-stage,.home-security-visual,.home-feature-card,.home-tier-card,.home-experience-shell')];
  if ('IntersectionObserver' in window) {
    const motionObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) entry.target.classList.toggle('motion-suspended', !entry.isIntersecting);
    }, { rootMargin: '180px 0px', threshold: 0.01 });
    animatedSections.forEach((node) => motionObserver.observe(node));
  }

  function applyPointerMotion(now = performance.now()) {
    pointerFrame = 0;
    if (effectiveMotion !== 'full' || document.hidden) return;
    const targetX = (pointerX / Math.max(window.innerWidth, 1) - 0.5) * 14;
    const targetY = (pointerY / Math.max(window.innerHeight, 1) - 0.5) * 12;
    pointerAppliedX += (targetX - pointerAppliedX) * 0.18;
    pointerAppliedY += (targetY - pointerAppliedY) * 0.18;
    if (now - pointerLastPaintAt >= 30) {
      root.style.setProperty('--home-pointer-x', `${pointerAppliedX.toFixed(2)}px`);
      root.style.setProperty('--home-pointer-y', `${pointerAppliedY.toFixed(2)}px`);
      pointerLastPaintAt = now;
    }
    if (Math.abs(targetX - pointerAppliedX) > 0.08 || Math.abs(targetY - pointerAppliedY) > 0.08) {
      pointerFrame = requestAnimationFrame(applyPointerMotion);
    }
  }

  window.addEventListener('pointermove', (event) => {
    if (!finePointerQuery.matches || effectiveMotion !== 'full') return;
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (!pointerFrame) pointerFrame = requestAnimationFrame(applyPointerMotion);
  }, { passive: true });

  function createCosmos(canvas) {
    if (!canvas) return null;
    const section = canvas.closest('.home-hero');
    const context = canvas.getContext('2d', { alpha: true, desynchronized: true });
    if (!section || !context) return null;

    const atmosphereCanvas = document.createElement('canvas');
    const atmosphereContext = atmosphereCanvas.getContext('2d', { alpha: true, desynchronized: true });
    const saveData = Boolean(navigator.connection?.saveData);
    const cpuCores = Number(navigator.hardwareConcurrency || 8);
    const deviceMemory = Number(navigator.deviceMemory || 8);
    const isLowPower = saveData || cpuCores <= 4 || deviceMemory <= 4;
    const isMidPower = !isLowPower && (cpuCores <= 8 || deviceMemory <= 8);

    let width = 1;
    let height = 1;
    let ratio = 1;
    let atmosphereRatio = 1;
    let stars = [];
    let dust = [];
    let clouds = [];
    let ribbons = [];
    let meteors = [];
    let planets = [];
    let galaxies = [];
    let frameId = 0;
    let resizeFrame = 0;
    let lastFrameAt = 0;
    let lastDrawAt = performance.now();
    let lastAtmosphereAt = 0;
    let atmosphereDirty = true;
    let nextMeteorAt = 0;
    let sectionVisible = true;
    let documentVisible = !document.hidden;
    let motionMode = effectiveMotion;
    let colorTheme = preferredTheme();
    let smoothParallaxX = 0;
    let smoothParallaxY = 0;
    let currentFps = 40;
    let baseFps = 40;
    let minimumFps = 30;
    let averageDrawCost = 0;
    let qualityCheckFrames = 0;

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const wrap = (value, limit) => ((value % limit) + limit) % limit;

    function configureFrameBudget() {
      if (motionMode === 'full') {
        baseFps = isLowPower ? 38 : isMidPower ? 46 : 52;
        minimumFps = isLowPower ? 30 : 36;
      } else if (motionMode === 'balanced') {
        baseFps = isLowPower ? 26 : 30;
        minimumFps = 24;
      } else {
        baseFps = 1;
        minimumFps = 1;
      }
      currentFps = baseFps;
      averageDrawCost = 0;
      qualityCheckFrames = 0;
    }

    function effectScale() {
      if (isLowPower) return 0.78;
      if (isMidPower) return 0.98;
      return 1.14;
    }

    function starCount() {
      const area = width * height;
      const density = motionMode === 'full' ? 7600 : motionMode === 'balanced' ? 20800 : 32000;
      const maxBase = width < 620 ? (motionMode === 'full' ? 92 : 36) : (motionMode === 'full' ? 160 : 62);
      return clamp(Math.round(area / density), 26, Math.round(maxBase * effectScale()));
    }

    function dustCount() {
      if (motionMode === 'reduced') return 10;
      const base = width < 620 ? (motionMode === 'full' ? 30 : 12) : (motionMode === 'full' ? 58 : 22);
      return Math.max(10, Math.round(base * effectScale()));
    }

    function cloudCount() {
      if (motionMode === 'reduced') return 2;
      return motionMode === 'full' ? (isLowPower ? 3 : 4) : 2;
    }

    function ribbonCount() {
      if (motionMode === 'reduced') return 0;
      if (width < 620) return motionMode === 'full' ? 1 : 0;
      return motionMode === 'full' ? (isLowPower ? 2 : 3) : 1;
    }

    function planetCount() {
      if (width < 520) return 1;
      if (motionMode === 'full') return isLowPower ? 2 : 3;
      return 1;
    }

    function galaxyCount() {
      if (motionMode === 'reduced') return width < 640 ? 1 : 2;
      if (width < 640) return motionMode === 'full' ? 2 : 1;
      return motionMode === 'full' ? (isLowPower ? 2 : 3) : 1;
    }

    function rebuildScene() {
      stars = Array.from({ length: starCount() }, () => {
        const depth = 0.25 + Math.random() * 0.95;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          radius: 0.38 + Math.random() * (1.35 + depth * 0.72),
          alpha: 0.14 + Math.random() * 0.62,
          phase: Math.random() * Math.PI * 2,
          speed: 0.00038 + Math.random() * 0.0011,
          depth,
          driftX: (Math.random() - 0.5) * (0.0018 + depth * 0.0027),
          driftY: (Math.random() - 0.5) * (0.0009 + depth * 0.0016),
          tone: Math.floor(Math.random() * 3),
          flare: Math.random() > 0.89,
        };
      });
      dust = Array.from({ length: dustCount() }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 0.7 + Math.random() * 1.9,
        alpha: 0.025 + Math.random() * 0.095,
        depth: 0.18 + Math.random() * 0.65,
        speed: 0.00055 + Math.random() * 0.001,
        phase: Math.random() * Math.PI * 2,
        tone: Math.floor(Math.random() * 3),
      }));
      clouds = Array.from({ length: cloudCount() }, (_, index) => ({
        x: width * (0.12 + Math.random() * 0.76),
        y: height * (0.08 + Math.random() * 0.84),
        radius: Math.max(width, height) * (0.16 + Math.random() * 0.14),
        alpha: 0.035 + Math.random() * 0.052,
        phase: Math.random() * Math.PI * 2,
        speed: 0.000045 + Math.random() * 0.000065,
        driftX: width * (0.025 + Math.random() * 0.032),
        driftY: height * (0.018 + Math.random() * 0.026),
        tone: index % 3,
      }));
      ribbons = Array.from({ length: ribbonCount() }, (_, index) => ({
        y: height * (0.16 + index * 0.28 + Math.random() * 0.07),
        amplitude: height * (0.034 + Math.random() * 0.05),
        width: (width < 620 ? 11 : 16) + Math.random() * (width < 620 ? 7 : 13),
        alpha: 0.045 + Math.random() * 0.048,
        phase: Math.random() * Math.PI * 2,
        speed: 0.00005 + Math.random() * 0.000038,
        tone: index % 3,
        tilt: (Math.random() - 0.5) * height * 0.075,
      }));
      planets = Array.from({ length: planetCount() }, (_, index) => {
        const major = index === 0;
        const baseRadius = Math.min(width, height) * (major ? (width < 720 ? 0.16 : 0.21) : (width < 720 ? 0.07 : 0.10));
        const radius = baseRadius * (0.94 + Math.random() * 0.14);
        return {
          x: width * (major ? (width < 760 ? 0.16 : 0.20) : 0.84) + (Math.random() - 0.5) * width * 0.04,
          y: height * (major ? (width < 760 ? 0.24 : 0.28) : (width < 760 ? 0.68 : 0.72)) + (Math.random() - 0.5) * height * 0.04,
          radius,
          glow: radius * (major ? 2.6 : 2.1),
          alpha: major ? 0.82 : 0.58,
          tone: major ? 1 : 0,
          ring: major || (!isLowPower && motionMode === 'full' && index > 0),
          ringTilt: major ? -0.34 : 0.52,
          ringWidth: radius * (major ? 1.68 : 1.48),
          ringHeight: radius * (major ? 0.46 : 0.38),
          phase: Math.random() * Math.PI * 2,
          speed: major ? 0.000032 : 0.000048,
          driftX: width * (major ? 0.012 : 0.016),
          driftY: height * (major ? 0.008 : 0.012),
          texture: 3 + Math.floor(Math.random() * 3),
        };
      });
      galaxies = Array.from({ length: galaxyCount() }, (_, index) => ({
        x: width * (index === 0 ? 0.68 : 0.34),
        y: height * (index === 0 ? 0.22 : 0.62),
        radius: Math.min(width, height) * (index === 0 ? 0.23 : 0.16),
        angle: index === 0 ? -0.28 : 0.54,
        alpha: index === 0 ? 0.30 : 0.22,
        phase: Math.random() * Math.PI * 2,
        speed: 0.000026 + Math.random() * 0.000018,
        driftX: width * (index === 0 ? 0.024 : 0.018),
        driftY: height * (index === 0 ? 0.015 : 0.012),
        tone: index % 3,
        stars: 12 + Math.round(Math.random() * 8),
      }));
      meteors = [];
      atmosphereDirty = true;
      nextMeteorAt = performance.now() + (motionMode === 'full' ? 640 : 1600) + Math.random() * (motionMode === 'full' ? 1400 : 2600);
    }

    function desiredPixelRatio() {
      const area = Math.max(1, width * height);
      const maxPixels = motionMode === 'full'
         ? (isLowPower ? 1800000 : isMidPower ? 2800000 : 3800000)
        : (isLowPower ? 950000 : 1200000);
      const areaCap = Math.sqrt(maxPixels / area);
      const hardCap = motionMode === 'full' ? (isLowPower ? 1.08 : isMidPower ? 1.34 : 1.56) : 1.02;
      return clamp(Math.min(window.devicePixelRatio || 1, hardCap, areaCap), 0.82, hardCap);
    }

    function resize(force = false) {
      const rect = section.getBoundingClientRect();
      const nextWidth = Math.max(1, Math.round(rect.width));
      const nextHeight = Math.max(1, Math.round(rect.height));
      const sizeChanged = Math.abs(nextWidth - width) > 1 || Math.abs(nextHeight - height) > 1;
      width = nextWidth;
      height = nextHeight;
      const nextRatio = desiredPixelRatio();
      const ratioChanged = Math.abs(nextRatio - ratio) > 0.02;
      if (!force && !sizeChanged && !ratioChanged) return;
      ratio = nextRatio;
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      const area = width * height;
      atmosphereRatio = area > 1500000 ? 0.62 : area > 900000 ? 0.72 : 0.84;
      if (isLowPower) atmosphereRatio = Math.min(atmosphereRatio, 0.66);
      atmosphereCanvas.width = Math.max(1, Math.round(width * atmosphereRatio));
      atmosphereCanvas.height = Math.max(1, Math.round(height * atmosphereRatio));
      atmosphereContext?.setTransform(atmosphereRatio, 0, 0, atmosphereRatio, 0, 0);
      rebuildScene();
      draw(performance.now(), true);
    }

    function scheduleResize() {
      if (resizeFrame) return;
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = 0;
        resize();
      });
    }

    function spawnMeteor(now) {
      const maxMeteors = motionMode === 'full' ? (isLowPower ? 2 : 4) : 1;
      if (motionMode === 'reduced' || meteors.length >= maxMeteors) return;
      const startX = width * (0.42 + Math.random() * 0.68);
      const startY = height * (-0.02 + Math.random() * 0.32);
      const speed = width < 620 ? 0.40 : 0.58;
      meteors.push({
        x: startX,
        y: startY,
        vx: -(0.72 + Math.random() * 0.28) * speed,
        vy: (0.36 + Math.random() * 0.24) * speed,
        length: 92 + Math.random() * (width < 620 ? 74 : 146),
        born: now,
        life: 980 + Math.random() * 620,
        tone: Math.floor(Math.random() * 3),
        width: 1.1 + Math.random() * 0.95,
      });
      nextMeteorAt = now + (motionMode === 'full' ? 1100 : 4800) + Math.random() * (motionMode === 'full' ? 2400 : 5200);
    }

    function drawRibbons(ctx, now, dark, parallaxX, parallaxY) {
      if (!ribbons.length || !ctx) return;
      const palettes = dark
        ? [['65,221,239','112,151,255','151,105,255'],['109,160,255','154,104,255','218,92,190'],['54,209,224','121,110,246','222,112,190']]
        : [['57,165,190','95,122,220','145,98,210'],['78,126,205','124,92,214','188,86,165'],['48,157,180','103,104,214','183,94,168']];
      ctx.save();
      ctx.globalCompositeOperation = dark ? 'screen' : 'source-over';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (const ribbon of ribbons) {
        const palette = palettes[ribbon.tone] || palettes[0];
        const phase = now * ribbon.speed + ribbon.phase;
        const baseY = ribbon.y + Math.sin(phase) * ribbon.amplitude * 0.36 + parallaxY * 0.12;
        const startX = -width * 0.12 + parallaxX * 0.08;
        const endX = width * 1.12 + parallaxX * 0.08;
        const cp1X = width * 0.26;
        const cp2X = width * 0.72;
        const cp1Y = baseY + Math.sin(phase + 1.1) * ribbon.amplitude + ribbon.tilt;
        const cp2Y = baseY + Math.cos(phase * 0.82 + 2.1) * ribbon.amplitude - ribbon.tilt * 0.55;
        const endY = baseY + Math.sin(phase + 2.8) * ribbon.amplitude * 0.42;
        const gradient = ctx.createLinearGradient(startX, baseY, endX, endY);
        gradient.addColorStop(0, `rgba(${palette[0]},0)`);
        gradient.addColorStop(0.18, `rgba(${palette[0]},${ribbon.alpha * 0.62})`);
        gradient.addColorStop(0.52, `rgba(${palette[1]},${ribbon.alpha})`);
        gradient.addColorStop(0.78, `rgba(${palette[2]},${ribbon.alpha * 0.72})`);
        gradient.addColorStop(1, `rgba(${palette[2]},0)`);
        const trace = (lineWidth, alphaScale) => {
          ctx.globalAlpha = alphaScale;
          ctx.lineWidth = lineWidth;
          ctx.strokeStyle = gradient;
          ctx.beginPath();
          ctx.moveTo(startX, baseY);
          ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, endX, endY);
          ctx.stroke();
        };
        ctx.shadowColor = `rgba(${palette[1]},${dark ? 0.18 : 0.08})`;
        ctx.shadowBlur = ribbon.width * (dark ? 0.9 : 0.55);
        trace(ribbon.width * 1.8, 0.4);
        ctx.shadowBlur = 0;
        trace(Math.max(1, ribbon.width * 0.42), dark ? 0.64 : 0.42);
      }
      ctx.restore();
    }

    function drawClouds(ctx, now, dark, parallaxX, parallaxY) {
      if (!ctx) return;
      ctx.save();
      ctx.globalCompositeOperation = dark ? 'lighter' : 'source-over';
      const palettes = dark
        ? [['80,215,238','76,111,236'],['147,105,255','99,67,211'],['219,91,188','121,53,151']]
        : [['55,171,193','116,208,218'],['116,91,224','184,171,255'],['201,91,173','244,187,228']];
      for (const cloud of clouds) {
        const cx = cloud.x + Math.sin(now * cloud.speed + cloud.phase) * cloud.driftX + parallaxX * 0.22;
        const cy = cloud.y + Math.cos(now * cloud.speed * 0.84 + cloud.phase) * cloud.driftY + parallaxY * 0.18;
        const palette = palettes[cloud.tone] || palettes[0];
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, cloud.radius);
        gradient.addColorStop(0, `rgba(${palette[0]},${cloud.alpha * (dark ? 1 : 0.72)})`);
        gradient.addColorStop(0.34, `rgba(${palette[1]},${cloud.alpha * 0.5})`);
        gradient.addColorStop(1, `rgba(${palette[1]},0)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(cx - cloud.radius, cy - cloud.radius, cloud.radius * 2, cloud.radius * 2);
      }
      ctx.restore();
    }

    function renderAtmosphere(now, dark, parallaxX, parallaxY) {
      if (!atmosphereContext) return;
      atmosphereContext.clearRect(0, 0, width, height);
      drawRibbons(atmosphereContext, now, dark, parallaxX, parallaxY);
      drawClouds(atmosphereContext, now, dark, parallaxX, parallaxY);
      atmosphereDirty = false;
      lastAtmosphereAt = now;
    }

    function drawGalaxies(now, dark, parallaxX, parallaxY) {
      if (!galaxies.length) return;
      const palettes = dark
        ? [['89,222,242','255,255,255','122,95,255'],['132,108,255','252,241,255','218,98,195'],['54,203,227','216,233,255','126,173,255']]
        : [['83,166,196','255,255,255','125,103,214'],['128,118,214','255,255,255','194,126,182'],['70,171,196','239,248,255','126,152,228']];
      context.save();
      context.globalCompositeOperation = dark ? 'screen' : 'source-over';
      for (const galaxy of galaxies) {
        const palette = palettes[galaxy.tone] || palettes[0];
        const driftX = Math.sin(now * galaxy.speed + galaxy.phase) * galaxy.driftX + parallaxX * 0.18;
        const driftY = Math.cos(now * galaxy.speed * 0.82 + galaxy.phase) * galaxy.driftY + parallaxY * 0.14;
        const x = galaxy.x + driftX;
        const y = galaxy.y + driftY;
        const spin = galaxy.angle + Math.sin(now * galaxy.speed * 1.2 + galaxy.phase) * 0.08;
        context.save();
        context.translate(x, y);
        context.rotate(spin);
        const glow = context.createRadialGradient(0, 0, 0, 0, 0, galaxy.radius * 1.3);
        glow.addColorStop(0, `rgba(${palette[1]},${galaxy.alpha * (dark ? 0.24 : 0.17)})`);
        glow.addColorStop(0.24, `rgba(${palette[0]},${galaxy.alpha * (dark ? 0.20 : 0.13)})`);
        glow.addColorStop(0.56, `rgba(${palette[2]},${galaxy.alpha * (dark ? 0.14 : 0.10)})`);
        glow.addColorStop(1, `rgba(${palette[2]},0)`);
        context.fillStyle = glow;
        context.beginPath();
        context.ellipse(0, 0, galaxy.radius * 1.22, galaxy.radius * 0.42, 0, 0, Math.PI * 2);
        context.fill();

        context.globalAlpha = galaxy.alpha * (dark ? 0.78 : 0.56);
        context.lineCap = 'round';
        for (let arm = 0; arm < 3; arm += 1) {
          context.beginPath();
          for (let step = 0; step <= 1; step += 0.1) {
            const theta = step * Math.PI * 2.1 + arm * (Math.PI * 2 / 3);
            const radius = galaxy.radius * (0.16 + step * 0.82);
            const px = Math.cos(theta) * radius;
            const py = Math.sin(theta) * radius * 0.34;
            if (step === 0) context.moveTo(px, py);
            else context.lineTo(px, py);
          }
          const armGradient = context.createLinearGradient(-galaxy.radius, 0, galaxy.radius, 0);
          armGradient.addColorStop(0, `rgba(${palette[0]},0)`);
          armGradient.addColorStop(0.5, `rgba(${palette[1]},${galaxy.alpha * 0.34})`);
          armGradient.addColorStop(1, `rgba(${palette[2]},0)`);
          context.strokeStyle = armGradient;
          context.lineWidth = Math.max(1, galaxy.radius * 0.055);
          context.stroke();
        }

        for (let starIndex = 0; starIndex < galaxy.stars; starIndex += 1) {
          const progress = starIndex / Math.max(1, galaxy.stars - 1);
          const theta = progress * Math.PI * 2.1 + galaxy.phase + (starIndex % 3) * 2.09;
          const radius = galaxy.radius * (0.12 + progress * 0.8);
          const px = Math.cos(theta) * radius;
          const py = Math.sin(theta) * radius * 0.34;
          context.globalAlpha = galaxy.alpha * 0.42 * (1 - progress * 0.4);
          context.fillStyle = `rgba(${palette[1]},0.95)`;
          context.beginPath();
          context.arc(px, py, progress < 0.25 ? 1.1 : 0.8, 0, Math.PI * 2);
          context.fill();
        }

        context.globalAlpha = galaxy.alpha * (dark ? 0.92 : 0.64);
        const core = context.createRadialGradient(0, 0, 0, 0, 0, galaxy.radius * 0.34);
        core.addColorStop(0, `rgba(255,255,255,${dark ? 0.96 : 0.88})`);
        core.addColorStop(0.28, `rgba(${palette[0]},${dark ? 0.60 : 0.46})`);
        core.addColorStop(1, `rgba(${palette[2]},0)`);
        context.fillStyle = core;
        context.beginPath();
        context.ellipse(0, 0, galaxy.radius * 0.34, galaxy.radius * 0.18, 0, 0, Math.PI * 2);
        context.fill();
        context.restore();
      }
      context.restore();
    }

    function drawPlanets(now, dark, parallaxX, parallaxY) {
      if (!planets.length) return;
      const palettes = dark
        ? [['96,219,239','38,84,161','14,21,57'],['161,121,255','78,58,171','18,20,58']]
        : [['98,186,212','148,200,237','218,233,255'],['165,146,244','208,196,255','238,236,255']];
      context.save();
      context.globalCompositeOperation = dark ? 'screen' : 'source-over';
      for (const planet of planets) {
        const palette = palettes[planet.tone] || palettes[0];
        const driftX = Math.sin(now * planet.speed + planet.phase) * planet.driftX + parallaxX * (planet.radius > 90 ? 0.24 : 0.16);
        const driftY = Math.cos(now * planet.speed * 0.82 + planet.phase) * planet.driftY + parallaxY * (planet.radius > 90 ? 0.18 : 0.12);
        const x = planet.x + driftX;
        const y = planet.y + driftY;
        context.save();
        context.translate(x, y);

        const halo = context.createRadialGradient(0, 0, planet.radius * 0.12, 0, 0, planet.glow);
        halo.addColorStop(0, `rgba(${palette[0]},${planet.alpha * 0.26})`);
        halo.addColorStop(0.42, `rgba(${palette[1]},${planet.alpha * 0.12})`);
        halo.addColorStop(1, `rgba(${palette[1]},0)`);
        context.globalAlpha = 1;
        context.fillStyle = halo;
        context.beginPath();
        context.arc(0, 0, planet.glow, 0, Math.PI * 2);
        context.fill();

        if (planet.ring) {
          context.save();
          context.rotate(planet.ringTilt);
          const ring = context.createLinearGradient(-planet.ringWidth, 0, planet.ringWidth, 0);
          ring.addColorStop(0, `rgba(${palette[0]},0)`);
          ring.addColorStop(0.18, `rgba(${palette[0]},${planet.alpha * 0.18})`);
          ring.addColorStop(0.5, `rgba(255,255,255,${planet.alpha * 0.20})`);
          ring.addColorStop(0.82, `rgba(${palette[1]},${planet.alpha * 0.14})`);
          ring.addColorStop(1, `rgba(${palette[1]},0)`);
          context.strokeStyle = ring;
          context.lineWidth = Math.max(1.2, planet.radius * 0.14);
          context.beginPath();
          context.ellipse(0, 0, planet.ringWidth, planet.ringHeight, 0, 0, Math.PI * 2);
          context.stroke();
          context.restore();
        }

        const body = context.createRadialGradient(-planet.radius * 0.32, -planet.radius * 0.28, planet.radius * 0.12, 0, 0, planet.radius);
        body.addColorStop(0, `rgba(255,255,255,${planet.alpha * 0.94})`);
        body.addColorStop(0.24, `rgba(${palette[0]},${planet.alpha * 0.80})`);
        body.addColorStop(0.68, `rgba(${palette[1]},${planet.alpha * 0.72})`);
        body.addColorStop(1, `rgba(${palette[2]},${planet.alpha * 0.94})`);
        context.fillStyle = body;
        context.beginPath();
        context.arc(0, 0, planet.radius, 0, Math.PI * 2);
        context.fill();

        context.save();
        context.beginPath();
        context.arc(0, 0, planet.radius, 0, Math.PI * 2);
        context.clip();
        for (let stripe = 0; stripe < planet.texture; stripe += 1) {
          const offset = ((stripe / Math.max(1, planet.texture - 1)) - 0.5) * planet.radius * 1.05;
          const band = context.createLinearGradient(-planet.radius, offset, planet.radius, offset + planet.radius * 0.12);
          band.addColorStop(0, `rgba(${palette[0]},0)`);
          band.addColorStop(0.35, `rgba(${palette[1]},${planet.alpha * 0.10})`);
          band.addColorStop(0.7, `rgba(255,255,255,${planet.alpha * 0.07})`);
          band.addColorStop(1, `rgba(${palette[2]},0)`);
          context.fillStyle = band;
          context.fillRect(-planet.radius * 1.2, offset - planet.radius * 0.14, planet.radius * 2.4, planet.radius * 0.22);
        }
        const shadow = context.createRadialGradient(planet.radius * 0.42, planet.radius * 0.26, planet.radius * 0.1, 0, 0, planet.radius * 1.2);
        shadow.addColorStop(0, 'rgba(0,0,0,0)');
        shadow.addColorStop(1, `rgba(0,0,0,${dark ? 0.26 : 0.12})`);
        context.fillStyle = shadow;
        context.beginPath();
        context.arc(0, 0, planet.radius, 0, Math.PI * 2);
        context.fill();
        context.restore();

        context.globalAlpha = planet.alpha * (dark ? 0.34 : 0.22);
        context.strokeStyle = `rgba(255,255,255,${dark ? 0.64 : 0.42})`;
        context.lineWidth = Math.max(1, planet.radius * 0.03);
        context.beginPath();
        context.arc(-planet.radius * 0.08, -planet.radius * 0.06, planet.radius * 0.72, -2.24, -0.56);
        context.stroke();

        if (planet.ring) {
          context.save();
          context.rotate(planet.ringTilt);
          context.beginPath();
          context.rect(-planet.ringWidth * 1.12, 0, planet.ringWidth * 2.24, planet.ringHeight * 1.5);
          context.clip();
          context.strokeStyle = `rgba(255,255,255,${planet.alpha * 0.22})`;
          context.lineWidth = Math.max(1, planet.radius * 0.05);
          context.beginPath();
          context.ellipse(0, 0, planet.ringWidth, planet.ringHeight, 0, 0, Math.PI * 2);
          context.stroke();
          context.restore();
        }

        context.restore();
      }
      context.restore();
    }

    function drawDust(now, dark, parallaxX, parallaxY) {
      const palette = dark ? ['129,225,242','174,143,255','232,135,211'] : ['71,153,186','125,96,225','190,84,165'];
      context.save();
      context.globalCompositeOperation = dark ? 'lighter' : 'source-over';
      for (const particle of dust) {
        const drift = now * particle.speed * (0.16 + particle.depth * 0.22);
        const x = wrap(particle.x + Math.cos(particle.phase) * drift + parallaxX * particle.depth * 0.38, width);
        const y = wrap(particle.y + Math.sin(particle.phase) * drift + parallaxY * particle.depth * 0.3, height);
        const pulse = 0.62 + Math.sin(now * particle.speed + particle.phase) * 0.38;
        context.globalAlpha = particle.alpha * pulse;
        context.fillStyle = `rgb(${palette[particle.tone]})`;
        context.beginPath();
        context.arc(x, y, particle.radius, 0, Math.PI * 2);
        context.fill();
      }
      context.restore();
    }

    function drawStars(now, dark, parallaxX, parallaxY) {
      const colors = dark ? ['232,239,255','139,226,255','194,170,255'] : ['88,83,168','40,141,174','126,92,207'];
      context.save();
      context.globalCompositeOperation = dark ? 'lighter' : 'source-over';
      for (const star of stars) {
        const driftX = now * star.driftX * (0.18 + star.depth * 0.35);
        const driftY = now * star.driftY * (0.18 + star.depth * 0.35);
        const x = wrap(star.x + driftX + parallaxX * star.depth, width);
        const y = wrap(star.y + driftY + parallaxY * star.depth, height);
        const pulse = motionMode === 'reduced' ? 1 : 0.72 + Math.sin(now * star.speed + star.phase) * 0.28;
        const alpha = star.alpha * pulse;
        context.globalAlpha = alpha;
        context.fillStyle = `rgb(${colors[star.tone]})`;
        context.beginPath();
        context.arc(x, y, star.radius, 0, Math.PI * 2);
        context.fill();
        if (star.radius > 1.4 || star.flare) {
          const flareAlpha = alpha * (motionMode === 'full' ? 0.36 : 0.2);
          context.globalAlpha = flareAlpha;
          context.fillRect(x - 3.4 * star.depth, y - 0.3, 6.8 * star.depth, 0.6);
          context.fillRect(x - 0.3, y - 3.4 * star.depth, 0.6, 6.8 * star.depth);
        }
      }
      context.restore();
    }

    function drawMeteors(now, dark, delta) {
      const tones = dark ? ['91,219,255','159,119,255','242,124,211'] : ['45,143,186','112,87,224','190,74,160'];
      context.save();
      context.globalCompositeOperation = 'lighter';
      meteors = meteors.filter((meteor) => {
        const age = now - meteor.born;
        if (age >= meteor.life) return false;
        meteor.x += meteor.vx * delta;
        meteor.y += meteor.vy * delta;
        const progress = age / meteor.life;
        const alpha = Math.sin(progress * Math.PI) * (dark ? 0.82 : 0.52);
        const vectorLength = Math.hypot(meteor.vx, meteor.vy) || 1;
        const tailX = meteor.x - (meteor.vx / vectorLength) * meteor.length;
        const tailY = meteor.y - (meteor.vy / vectorLength) * meteor.length;
        const tone = tones[meteor.tone];
        const gradient = context.createLinearGradient(tailX, tailY, meteor.x, meteor.y);
        gradient.addColorStop(0, `rgba(${tone},0)`);
        gradient.addColorStop(0.62, `rgba(${tone},${alpha * 0.2})`);
        gradient.addColorStop(0.9, `rgba(${tone},${alpha * 0.7})`);
        gradient.addColorStop(1, `rgba(255,255,255,${alpha})`);
        context.strokeStyle = gradient;
        context.lineWidth = width < 620 ? meteor.width : meteor.width * 1.16;
        context.beginPath();
        context.moveTo(tailX, tailY);
        context.lineTo(meteor.x, meteor.y);
        context.stroke();
        context.globalAlpha = alpha;
        context.fillStyle = '#fff';
        context.beginPath();
        context.arc(meteor.x, meteor.y, width < 620 ? 1.15 : 1.65, 0, Math.PI * 2);
        context.fill();
        context.globalAlpha = 1;
        return meteor.x > -meteor.length && meteor.y < height + meteor.length;
      });
      context.restore();
    }

    function draw(now, forceAtmosphere = false) {
      const startedAt = performance.now();
      context.clearRect(0, 0, width, height);
      const dark = colorTheme === 'dark';
      const desiredParallaxX = motionMode === 'full' ? ((pointerX / Math.max(window.innerWidth, 1)) - 0.5) * 18 : 0;
      const desiredParallaxY = motionMode === 'full' ? ((pointerY / Math.max(window.innerHeight, 1)) - 0.5) * 14 : 0;
      smoothParallaxX += (desiredParallaxX - smoothParallaxX) * 0.1;
      smoothParallaxY += (desiredParallaxY - smoothParallaxY) * 0.1;

      const atmosphereFps = motionMode === 'full' ? (isLowPower ? 10 : isMidPower ? 13 : 16) : 9;
      if (forceAtmosphere || atmosphereDirty || now - lastAtmosphereAt >= 1000 / atmosphereFps) {
        renderAtmosphere(now, dark, smoothParallaxX, smoothParallaxY);
      }
      drawGalaxies(now, dark, smoothParallaxX, smoothParallaxY);
      if (atmosphereCanvas.width && atmosphereCanvas.height) {
        context.globalAlpha = 1;
        context.drawImage(atmosphereCanvas, 0, 0, width, height);
      }
      drawPlanets(now, dark, smoothParallaxX, smoothParallaxY);
      drawDust(now, dark, smoothParallaxX, smoothParallaxY);
      drawStars(now, dark, smoothParallaxX, smoothParallaxY);
      const delta = Math.min(40, Math.max(0, now - lastDrawAt));
      drawMeteors(now, dark, delta);
      lastDrawAt = now;

      const drawCost = performance.now() - startedAt;
      averageDrawCost = averageDrawCost ? averageDrawCost * 0.92 + drawCost * 0.08 : drawCost;
      qualityCheckFrames += 1;
      if (qualityCheckFrames >= 100 && motionMode !== 'reduced') {
        qualityCheckFrames = 0;
        if (averageDrawCost > 13 && currentFps > minimumFps) currentFps = Math.max(minimumFps, currentFps - 4);
        else if (averageDrawCost < 7 && currentFps < baseFps) currentFps = Math.min(baseFps, currentFps + 2);
      }
    }

    function shouldAnimate() {
      return motionMode !== 'reduced' && sectionVisible && documentVisible;
    }

    function loop(now) {
      frameId = 0;
      if (!shouldAnimate()) return;
      const interval = 1000 / Math.max(1, currentFps);
      if (now - lastFrameAt >= interval) {
        if (now >= nextMeteorAt) spawnMeteor(now);
        draw(now);
        lastFrameAt = now;
      }
      frameId = requestAnimationFrame(loop);
    }

    function start() {
      if (!shouldAnimate()) {
        draw(performance.now(), true);
        return;
      }
      if (!frameId) frameId = requestAnimationFrame(loop);
    }

    function stop() {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = 0;
    }

    const visibilityObserver = 'IntersectionObserver' in window
      ? new IntersectionObserver(([entry]) => {
          sectionVisible = Boolean(entry?.isIntersecting);
          body.classList.toggle('home-hero-offscreen', !sectionVisible);
          if (sectionVisible) start(); else stop();
        }, { rootMargin: '100px 0px', threshold: 0.01 })
      : null;
    visibilityObserver?.observe(section);

    const resizeObserver = 'ResizeObserver' in window ? new ResizeObserver(scheduleResize) : null;
    resizeObserver?.observe(section);
    if (!resizeObserver) window.addEventListener('resize', scheduleResize, { passive: true });

    configureFrameBudget();
    resize(true);
    start();

    return {
      setMode(value) {
        if (motionMode === value) return;
        motionMode = value;
        configureFrameBudget();
        stop();
        resize(true);
        start();
      },
      setTheme(value) {
        colorTheme = value;
        atmosphereDirty = true;
        draw(performance.now(), true);
      },
      setDocumentVisible(value) {
        documentVisible = value;
        if (documentVisible) start(); else stop();
      },
    };
  }

  function syncVisibility() {
    body.classList.toggle('home-paused', document.hidden);
    cosmosController?.setDocumentVisible(!document.hidden);
  }

  document.addEventListener('nexchat:v10-motion', (event) => syncV10Motion(event.detail || {}));
  document.addEventListener('visibilitychange', syncVisibility);
  darkQuery.addEventListener?.('change', applyTheme);
  reduceQuery.addEventListener?.('change', applyMotion);
  smallScreenQuery.addEventListener?.('change', applyMotion);
  finePointerQuery.addEventListener?.('change', applyMotion);
  window.addEventListener('resize', () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(syncScrollUI);
  }, { passive: true });
  window.addEventListener('languagechange', () => {
    document.title = `${window.I18N?.t('homeTitle') || 'NexChat'} · NexChat`;
    updateOptionsSummary();
  });
  window.addEventListener('storage', (event) => {
    if (event.key === 'nexchat-theme') applyTheme();
    if (event.key === 'nexchat-home-motion' && !v10MotionActive) applyMotion();
    if (event.key === 'nexchat-v10-motion:public') requestAnimationFrame(() => {
      const resolved = document.documentElement.dataset.v10MotionResolved;
      if (resolved) syncV10Motion({ resolved });
    });
  });

  // Browser history restoration can revive DOM classes from an interrupted
  // animation. Reset the options layer on every page activation so the page
  // can never remain blurred without a visible panel.
  window.addEventListener('pageshow', () => closeOptions({ immediate: true }));
  window.addEventListener('pagehide', () => closeOptions({ immediate: true }));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) closeOptions({ immediate: true });
  });
  closeOptions({ immediate: true });

  cosmosController = createCosmos(cosmosCanvas);
  applyTheme();
  applyMotion();
  syncVisibility();
  syncScrollUI();
  requestAnimationFrame(() => document.querySelector('.home-hero .home-reveal')?.classList.add('is-visible'));
})();

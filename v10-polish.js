'use strict';

(() => {
  if (window.NexPolish?.version) return;
  const VERSION = '1.0.0';
  const root = document.documentElement;

  function createAmbientLayer() {
    if (document.querySelector('.v10-polish-ambient')) return;
    const layer = document.createElement('div');
    layer.className = 'v10-polish-ambient';
    layer.setAttribute('aria-hidden', 'true');
    layer.innerHTML = '<i></i><i></i><i></i><i></i><i></i><i></i>';
    document.body.prepend(layer);
  }


  function createCosmosLayer() {
    if (document.querySelector('.v10-cosmos-layer')) return;
    const layer = document.createElement('div');
    layer.className = 'v10-cosmos-layer';
    layer.setAttribute('aria-hidden', 'true');
    const performanceTier = root.dataset.performance || 'balanced';
    const starCount = performanceTier === 'economy' ? 34 : performanceTier === 'balanced' ? 52 : 72;
    const stars = Array.from({ length: starCount }, (_, index) => {
      const x = (index * 37 + 11) % 100;
      const y = (index * 61 + 7) % 100;
      const size = 1 + (index % 3);
      const delay = -((index * 0.43) % 6).toFixed(2);
      const duration = (4.6 + (index % 7) * 0.7).toFixed(1);
      return `<i class="v10-cosmos-star" style="--x:${x}%;--y:${y}%;--size:${size}px;--delay:${delay}s;--duration:${duration}s"></i>`;
    }).join('');
    const meteorOffsets = performanceTier === 'economy' ? [0, 6.1, 12.6] : performanceTier === 'balanced' ? [0, 3.8, 7.5, 11.6, 15.4] : [0, 2.2, 4.4, 6.1, 8.3, 10.2, 12.6];
    const meteors = meteorOffsets.map((delay, index) =>
      `<b class="v10-cosmos-meteor meteor-${index + 1}" style="--meteor-delay:${delay}s"></b>`
    ).join('');
    layer.innerHTML = `<span class="v10-cosmos-nebula nebula-a"></span><span class="v10-cosmos-nebula nebula-b"></span><span class="v11-cosmos-ribbon ribbon-a"></span><span class="v11-cosmos-ribbon ribbon-b"></span><span class="v11-cosmos-lens"></span><span class="v11-cosmos-grid"></span><span class="v10-cosmos-dust"></span>${stars}${meteors}`;
    document.body.prepend(layer);
  }

  function enableCinematicParallax() {
    if (window.__nexchatCinematicParallax) return;
    window.__nexchatCinematicParallax = true;
    let frame = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = matchMedia('(pointer: fine)');
    const animate = () => {
      frame = 0;
      currentX += (targetX - currentX) * .08;
      currentY += (targetY - currentY) * .08;
      root.style.setProperty('--v11-parallax-x', `${(currentX*12).toFixed(2)}px`);
      root.style.setProperty('--v11-parallax-y', `${(currentY*10).toFixed(2)}px`);
      if (Math.abs(targetX-currentX) > .03 || Math.abs(targetY-currentY) > .03) frame = requestAnimationFrame(animate);
    };
    const update = (event) => {
      if (reduced.matches || !finePointer.matches || root.dataset.v10MotionResolved !== 'cinematic') return;
      targetX = ((event.clientX / Math.max(innerWidth,1)) - .5) * 2;
      targetY = ((event.clientY / Math.max(innerHeight,1)) - .5) * 2;
      if (!frame) frame = requestAnimationFrame(animate);
    };
    addEventListener('pointermove', update, { passive:true });
    addEventListener('pointerleave', () => { targetX=0; targetY=0; if(!frame) frame=requestAnimationFrame(animate); }, { passive:true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { targetX=0; targetY=0; currentX=0; currentY=0; root.style.setProperty('--v11-parallax-x','0px'); root.style.setProperty('--v11-parallax-y','0px'); }
    });
  }


  function createSidebarCosmosLayer() {
    const sidebar = document.querySelector('body.smart-app-page .smart-sidebar');
    if (!sidebar || sidebar.querySelector(':scope > .v10-sidebar-cosmos')) return;
    const layer = document.createElement('div');
    layer.className = 'v10-sidebar-cosmos';
    layer.setAttribute('aria-hidden', 'true');
    const performanceTier = root.dataset.performance || 'balanced';
    const starCount = performanceTier === 'economy' ? 24 : performanceTier === 'balanced' ? 38 : 52;
    const stars = Array.from({ length: starCount }, (_, index) => {
      const x = (index * 43 + 7) % 100;
      const y = (index * 67 + 13) % 100;
      const size = 1 + (index % 3) * 0.55;
      const alpha = (0.34 + (index % 5) * 0.11).toFixed(2);
      const delay = -((index * 0.37) % 9).toFixed(2);
      const duration = (5.8 + (index % 8) * 0.85).toFixed(1);
      const driftX = ((index % 2 ? 1 : -1) * (3 + index % 5)).toFixed(1);
      return `<i class="v10-sidebar-star" style="--x:${x}%;--y:${y}%;--size:${size}px;--alpha:${alpha};--delay:${delay}s;--duration:${duration}s;--drift-x:${driftX}px"></i>`;
    }).join('');
    const meteorDelays = performanceTier === 'economy' ? [0, 9.5] : performanceTier === 'balanced' ? [0, 5.2, 10.4] : [0, 3.8, 7.5, 11.6, 15.4];
    const meteors = meteorDelays.map((delay, index) =>
      `<b class="v10-sidebar-meteor meteor-${index + 1}" style="--meteor-delay:${delay}s"></b>`
    ).join('');
    layer.innerHTML = `<span class="v10-sidebar-nebula nebula-a"></span><span class="v10-sidebar-nebula nebula-b"></span><span class="v10-sidebar-aurora"></span><span class="v10-sidebar-dust"></span>${stars}${meteors}`;
    sidebar.prepend(layer);
  }

  const CONNECTION_TEXT = {
    vi:{online:'Trực tuyến',offline:'Ngoại tuyến',wifi:'Wi‑Fi',ethernet:'Mạng dây',cellular:'Mạng di động',weak2g:'2G yếu',dataSaver:'Tiết kiệm dữ liệu',reconnecting:'Đang kết nối lại',connected:'Đã kết nối'},
    en:{online:'Online',offline:'Offline',wifi:'Wi‑Fi',ethernet:'Ethernet',cellular:'Mobile network',weak2g:'Weak 2G',dataSaver:'Data saver',reconnecting:'Reconnecting',connected:'Connected'},
    zh:{online:'在线',offline:'离线',wifi:'Wi‑Fi',ethernet:'有线网络',cellular:'移动网络',weak2g:'弱 2G',dataSaver:'省流量',reconnecting:'正在重新连接',connected:'已连接'},
    ru:{online:'В сети',offline:'Не в сети',wifi:'Wi‑Fi',ethernet:'Проводная сеть',cellular:'Мобильная сеть',weak2g:'Слабая 2G',dataSaver:'Экономия трафика',reconnecting:'Переподключение',connected:'Подключено'},
    de:{online:'Online',offline:'Offline',wifi:'Wi‑Fi',ethernet:'Ethernet',cellular:'Mobilfunk',weak2g:'Schwaches 2G',dataSaver:'Datensparen',reconnecting:'Verbindung wird wiederhergestellt',connected:'Verbunden'},
    th:{online:'ออนไลน์',offline:'ออฟไลน์',wifi:'Wi‑Fi',ethernet:'เครือข่ายสาย',cellular:'เครือข่ายมือถือ',weak2g:'2G อ่อน',dataSaver:'ประหยัดข้อมูล',reconnecting:'กำลังเชื่อมต่อใหม่',connected:'เชื่อมต่อแล้ว'},
    es:{online:'En línea',offline:'Sin conexión',wifi:'Wi‑Fi',ethernet:'Ethernet',cellular:'Red móvil',weak2g:'2G débil',dataSaver:'Ahorro de datos',reconnecting:'Reconectando',connected:'Conectado'},
    fr:{online:'En ligne',offline:'Hors ligne',wifi:'Wi‑Fi',ethernet:'Ethernet',cellular:'Réseau mobile',weak2g:'2G faible',dataSaver:'Économie de données',reconnecting:'Reconnexion',connected:'Connecté'},
    ja:{online:'オンライン',offline:'オフライン',wifi:'Wi‑Fi',ethernet:'有線ネットワーク',cellular:'モバイル回線',weak2g:'弱い 2G',dataSaver:'データセーバー',reconnecting:'再接続中',connected:'接続済み'},
  };
  function connectionText() {
    const raw = window.I18N?.language || window.I18N?.currentLanguage?.() || document.documentElement.lang || 'vi';
    const lang = String(raw).toLowerCase().replace('_','-').split('-')[0];
    return CONNECTION_TEXT[lang] || CONNECTION_TEXT.en;
  }

  function connectionInfo() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const online = navigator.onLine !== false;
    const transport = String(connection?.type || '').toLowerCase();
    const effective = String(connection?.effectiveType || '').toLowerCase();
    const downlink = Number(connection?.downlink || 0);
    const rtt = Number(connection?.rtt || 0);
    const text = connectionText();
    let label = online ? text.online : text.offline;
    let kind = online ? 'online' : 'offline';

    if (online && transport === 'wifi') { label = text.wifi; kind = 'wifi'; }
    else if (online && transport === 'ethernet') { label = text.ethernet; kind = 'ethernet'; }
    else if (online && transport === 'cellular') {
      kind = 'cellular';
      if (effective === 'slow-2g') label = text.weak2g;
      else if (effective === '2g') label = '2G';
      else if (effective === '3g') label = '3G';
      else if (effective === '4g') label = '4G';
      else label = text.cellular;
    } else if (online && transport === 'bluetooth') { label = 'Bluetooth'; kind = 'bluetooth'; }
    else if (online && transport === 'wimax') { label = 'WiMAX'; kind = 'wimax'; }
    else if (online && transport === 'none') { label = text.offline; kind = 'offline'; }
    // effectiveType is an estimated quality class. Never infer 5G or a physical mobile transport from speed.

    if (connection?.saveData && online) label += ` · ${text.dataSaver}`;
    return { online, label, kind, transport, effective, downlink, rtt, saveData: Boolean(connection?.saveData) };
  }

  function updateConnectionUI() {
    const info = connectionInfo();
    root.dataset.networkTransport = info.kind;
    document.querySelectorAll('[data-connection-state]').forEach((node) => {
      node.dataset.networkKind = info.kind;
      node.title = info.transport
        ? `Kết nối: ${info.label}`
        : `Trình duyệt không cung cấp loại Wi‑Fi/di động; trạng thái hiện tại: ${info.label}`;
      const label = node.querySelector('[data-connection-label]');
      const copy = connectionText();
      const nextLabel = info.online ? `${copy.connected} · ${info.label}` : copy.reconnecting;
      if (label && label.textContent !== nextLabel) label.textContent = nextLabel;
    });
    document.querySelectorAll('.v10-motion-diagnostics span').forEach((item) => {
      const small = item.querySelector('small');
      if (!small || !/kết nối|network|réseau|netzwerk|接続|เครือข่าย|red/i.test(small.textContent || '')) return;
      const value = item.querySelector('b');
      if (value && value.textContent !== info.label) value.textContent = info.label;
    });
  }

  function stabiliseLoader() {
    const loader = document.getElementById('pageLoader');
    if (!loader) return;
    let permanentlyHidden = false;
    const hide = () => {
      if (permanentlyHidden) return;
      permanentlyHidden = true;
      loader.classList.add('loaded');
      loader.dataset.polishHidden = 'true';
    };
    const readyAt = performance.now();
    const scheduleHide = () => setTimeout(hide, Math.max(0, 170 - (performance.now() - readyAt)));
    if (document.readyState === 'complete') scheduleHide();
    else window.addEventListener('load', scheduleHide, { once:true });
    // Prevent delayed scripts from repeatedly toggling the loader after the first stable paint.
    const observer = new MutationObserver(() => {
      if (permanentlyHidden && !loader.classList.contains('loaded')) loader.classList.add('loaded');
    });
    observer.observe(loader, { attributes:true, attributeFilter:['class'] });
  }

  function showActionSuccess(title = 'Đã hoàn tất', message = '') {
    document.querySelector('.v10-action-success')?.remove();
    const modal = document.createElement('div');
    modal.className = 'v10-action-success';
    modal.setAttribute('role', 'status');
    modal.setAttribute('aria-live', 'polite');
    modal.innerHTML = `<section class="v10-action-success-card"><div class="v10-action-success-icon" aria-hidden="true">✓</div><h3></h3><p></p><button type="button" class="primary-button">Đã hiểu</button></section>`;
    modal.querySelector('h3').textContent = title;
    modal.querySelector('p').textContent = message;
    document.body.append(modal);
    requestAnimationFrame(() => modal.classList.add('is-visible'));
    let timer = setTimeout(close, 2600);
    function close() {
      if (!modal.isConnected) return;
      clearTimeout(timer);
      modal.classList.remove('is-visible');
      setTimeout(() => modal.remove(), 220);
    }
    modal.querySelector('button').addEventListener('click', close);
    modal.addEventListener('click', (event) => { if (event.target === modal) close(); });
    return close;
  }

  function observeDiagnostics() {
    let queued = false;
    const observer = new MutationObserver((records) => {
      const diagnosticsAdded = records.some((record) => [...record.addedNodes].some((node) =>
        node.nodeType === 1 && (node.matches?.('.v10-motion-diagnostics') || node.querySelector?.('.v10-motion-diagnostics'))
      ));
      if (!diagnosticsAdded || queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; updateConnectionUI(); });
    });
    observer.observe(document.body, { childList:true, subtree:true });
  }

  function init() {
    stabiliseLoader();
    updateConnectionUI();
    observeDiagnostics();
    const mountDecorations = () => {
      createAmbientLayer();
      createCosmosLayer();
      createSidebarCosmosLayer();
      enableCinematicParallax();
    };
    if (typeof requestIdleCallback === 'function') requestIdleCallback(mountDecorations, { timeout: 700 });
    else setTimeout(mountDecorations, 80);
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    connection?.addEventListener?.('change', updateConnectionUI);
    addEventListener('online', updateConnectionUI, { passive:true });
    addEventListener('offline', updateConnectionUI, { passive:true });
    document.addEventListener('nexchat:network', updateConnectionUI);
    document.addEventListener('nexchat:v10-motion', () => requestAnimationFrame(updateConnectionUI));
    addEventListener('languagechange', updateConnectionUI);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();

  window.NexPolish = Object.freeze({ version:VERSION, connectionInfo, updateConnectionUI, showActionSuccess });
})();

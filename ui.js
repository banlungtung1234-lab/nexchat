(() => {
  const escapeHTML = (value = "") => String(value)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");


  const classicIconPaths = {
    globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.5 4 5.5 4 9s-1.4 6.5-4 9c-2.6-2.5-4-5.5-4-9s1.4-6.5 4-9Z"/>',
    inbox:'<path d="M4 5h16v14H4z"/><path d="M4 13h4l2 3h4l2-3h4"/>',
    sparkles:'<path d="m12 3 1.1 3.2L16 7.3l-2.9 1.1L12 12l-1.1-3.6L8 7.3l2.9-1.1L12 3Z"/><path d="m18.5 13 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z"/><path d="m5 13 .7 1.8 1.8.7-1.8.7L5 18l-.7-1.8-1.8-.7 1.8-.7L5 13Z"/>',
    bookmark:'<path d="M6 4h12v17l-6-4-6 4V4Z"/>',
    headset:'<path d="M4 13v-1a8 8 0 0 1 16 0v1"/><path d="M4 13h3v6H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 1-2ZM20 13h-3v6h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-1-2ZM17 19c-.8 1.3-2.3 2-4 2h-1"/>',
    'user-plus':'<circle cx="9" cy="8" r="4"/><path d="M2.5 21a7 7 0 0 1 13 0M18 8v6M15 11h6"/>',
    users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    pin:'<path d="m15 4 5 5-3 1-4 4-1 5-2-2-2-2 5-1 4-4 1-3-5-5Z"/><path d="m9 15-5 5"/>',
    archive:'<path d="M3 6h18v4H3zM5 10h14v10H5zM9 14h6"/>',
    language:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.5 4 5.5 4 9s-1.4 6.5-4 9c-2.6-2.5-4-5.5-4-9s1.4-6.5 4-9Z"/>',
    logout:'<path d="M10 4H5v16h5M14 8l4 4-4 4M18 12H9"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',
    history:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
    menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
    folder:'<path d="M3 6h7l2 2h9v11H3z"/>',
    palette:'<path d="M12 3a9 9 0 0 0 0 18h1.2a2 2 0 0 0 1.7-3.1l-.2-.3a2 2 0 0 1 1.7-3.1H18a3 3 0 0 0 3-3A8.5 8.5 0 0 0 12 3Z"/><circle cx="7.5" cy="10" r=".8"/><circle cx="10" cy="6.8" r=".8"/><circle cx="14" cy="6.8" r=".8"/><circle cx="16.5" cy="10" r=".8"/>',
    more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    edit:'<path d="M4 20h4l11-11-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/>',
    'bell-off':'<path d="M13.7 21a2 2 0 0 1-3.4 0M18 8a6 6 0 0 0-9.8-4.6M6 8v3c0 2-1 4-2 5h12M3 3l18 18"/>',
    lightbulb:'<path d="M9 18h6M10 22h4"/><path d="M8.5 15.5A7 7 0 1 1 15.5 15.5c-.9.7-1.5 1.4-1.5 2.5h-4c0-1.1-.6-1.8-1.5-2.5Z"/>',
    close:'<path d="m6 6 12 12M18 6 6 18"/>',
    trash:'<path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"/>',
    ban:'<circle cx="12" cy="12" r="9"/><path d="m6 6 12 12"/>',
    download:'<path d="M12 3v12M7 10l5 5 5-5M4 20h16"/>',
    message:'<path d="M4 5h16v12H8l-4 4V5Z"/><path d="M8 9h8M8 13h5"/>',
    'message-circle':'<path d="M21 11.5a8.5 8.5 0 0 1-9 8.5 9.4 9.4 0 0 1-4-.9L3 21l1.9-4.6A8.5 8.5 0 1 1 21 11.5Z"/><path d="M8 10h8M8 14h5"/>',
    camera:'<path d="M4 7h4l2-3h4l2 3h4v13H4z"/><circle cx="12" cy="13" r="4"/>',
    mic:'<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/>',
    'map-pin':'<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    image:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 20"/>',
    video:'<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/>',
    file:'<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    'chevron-left':'<path d="m15 5-7 7 7 7"/>',
    'chevron-right':'<path d="m9 5 7 7-7 7"/>',
    'chevron-down':'<path d="m5 9 7 7 7-7"/>',
    send:'<path d="m3 11 18-8-8 18-2-8-8-2Z"/><path d="m11 13 5-5"/>',
    paperclip:'<path d="m8 12 6.5-6.5a3 3 0 0 1 4.2 4.2L10 18.4a5 5 0 0 1-7.1-7.1l8.4-8.4"/><path d="m10 14 6-6"/>',
    smile:'<circle cx="12" cy="12" r="9"/><path d="M8.5 10h.01M15.5 10h.01M8 14c1 2 2.5 3 4 3s3-1 4-3"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    shield:'<path d="M12 3 5 6v5c0 4.6 2.8 8.1 7 10 4.2-1.9 7-5.4 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-5"/>',
    'shield-alert':'<path d="M12 3 5 6v5c0 4.6 2.8 8.1 7 10 4.2-1.9 7-5.4 7-10V6l-7-3Z"/><path d="M12 8v5M12 16.5h.01"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    briefcase:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V4h6v3M3 12h18M10 12v2h4v-2"/>',
    graduation:'<path d="m3 10 9-5 9 5-9 5-9-5Z"/><path d="M7 13v4c3 2 7 2 10 0v-4M21 10v6"/>',
    copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/>',
    undo:'<path d="M9 7 4 12l5 5"/><path d="M4 12h10a6 6 0 0 1 6 6"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
    monitor:'<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 22h8M12 18v4"/>',
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/>',
    moon:'<path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.8 8.8 0 1 0 20.5 14.2Z"/>',
    bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M14 21h-4"/>',
    lock:'<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2"/>',
    phone:'<path d="M7.2 3.5 4.8 5.2c-.8.6-1.1 1.6-.8 2.6 1.5 5.3 5 8.8 10.3 10.3 1 .3 2-.1 2.6-.8l1.7-2.4-4-2-1.5 1.6c-2.2-.9-3.8-2.5-4.7-4.7L10 8.3l-2.8-4.8Z"/>',
    mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
    tag:'<path d="M20 13 13 20l-9-9V4h7l9 9Z"/><circle cx="8.5" cy="8.5" r="1.2"/>',
    activity:'<path d="M3 12h4l2-5 4 10 2-5h6"/>',
    star:'<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/>',
    box:'<path d="m4 7 8-4 8 4-8 4-8-4Z"/><path d="M4 7v10l8 4 8-4V7M12 11v10"/>',
    'user-check':'<circle cx="9" cy="8" r="4"/><path d="M2.5 21a7 7 0 0 1 13 0M16 12l2 2 4-5"/>'
  };
  function iconHTML(name, className = "") {
    const path = classicIconPaths[name] || classicIconPaths.info;
    return `<svg class="classic-ui-icon ${escapeHTML(className)}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
  }
  function hydrateClassicIcons(root = document) {
    const nodes = [];
    if (root?.matches?.("[data-classic-icon]")) nodes.push(root);
    root?.querySelectorAll?.("[data-classic-icon]").forEach((node) => nodes.push(node));
    nodes.forEach((node) => {
      if (!node.firstElementChild?.matches?.("svg.classic-ui-icon")) node.innerHTML = iconHTML(node.dataset.classicIcon, node.dataset.iconClass || "");
    });
  }
  function observeClassicIcons() {
    if (!document.body || window.__nexchatIconObserver) return;
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) hydrateClassicIcons(node);
      }));
    });
    observer.observe(document.body, { childList:true, subtree:true });
    window.__nexchatIconObserver = observer;
  }

  const fallbackText = {
    notification: "Thông báo", confirm: "Xác nhận", cancel: "Hủy", logout: "Đăng xuất",
    securityKicker: "BẢO MẬT NEXCHAT",
    logoutConfirmTitle: "Xác nhận đăng xuất",
    logoutConfirmText: "Bạn có chắc muốn đăng xuất khỏi NexChat?",
    adminLogoutConfirmText: "Bạn có chắc muốn kết thúc phiên quản trị và quay lại trang đăng nhập?",
    logoutProcessing: "Đang đăng xuất...",
    show: "Hiện", hide: "Ẩn", close: "Đóng"
  };
  const tr = (key) => window.I18N?.t(key) || fallbackText[key] || key;
  const AVATAR_VIEWER_COPY = {
    vi:{title:'Ảnh đại diện của {name}',view:'Xem đầy đủ ảnh đại diện của {name}',hint:'Xem ảnh',empty:'Ảnh đại diện',choose:'Chưa có ảnh đại diện. Nhấn để chọn ảnh.',error:'Không thể mở ảnh này.'},
    en:{title:"{name}'s profile photo",view:"View {name}'s full profile photo",hint:'View photo',empty:'Profile photo',choose:'No profile photo yet. Press to choose one.',error:'This image could not be opened.'},
    zh:{title:'{name} 的头像',view:'查看 {name} 的完整头像',hint:'查看图片',empty:'头像',choose:'暂无头像。按下可选择图片。',error:'无法打开此图片。'},
    ru:{title:'Фото профиля: {name}',view:'Открыть фото профиля {name} полностью',hint:'Открыть фото',empty:'Фото профиля',choose:'Фото профиля пока нет. Нажмите, чтобы выбрать.',error:'Не удалось открыть изображение.'},
    de:{title:'Profilbild von {name}',view:'Vollständiges Profilbild von {name} anzeigen',hint:'Foto ansehen',empty:'Profilbild',choose:'Noch kein Profilbild. Drücken, um eines auszuwählen.',error:'Dieses Bild konnte nicht geöffnet werden.'},
    th:{title:'รูปโปรไฟล์ของ {name}',view:'ดูรูปโปรไฟล์แบบเต็มของ {name}',hint:'ดูรูป',empty:'รูปโปรไฟล์',choose:'ยังไม่มีรูปโปรไฟล์ กดเพื่อเลือกรูป',error:'ไม่สามารถเปิดรูปนี้ได้'},
    es:{title:'Foto de perfil de {name}',view:'Ver la foto de perfil completa de {name}',hint:'Ver foto',empty:'Foto de perfil',choose:'Aún no hay foto de perfil. Pulsa para elegir una.',error:'No se pudo abrir esta imagen.'},
    fr:{title:'Photo de profil de {name}',view:'Afficher la photo de profil complète de {name}',hint:'Voir la photo',empty:'Photo de profil',choose:'Aucune photo de profil. Appuyez pour en choisir une.',error:"Impossible d’ouvrir cette image."},
    ja:{title:'{name}のプロフィール画像',view:'{name}のプロフィール画像を全表示',hint:'画像を見る',empty:'プロフィール画像',choose:'プロフィール画像はまだありません。押して選択してください。',error:'この画像を開けませんでした。'}
  };
  function avatarViewerLanguage(){
    const raw=String(window.I18N?.currentLanguage?.()||window.I18N?.language||document.documentElement.lang||'vi').toLowerCase();
    if(raw.startsWith('zh'))return 'zh';
    if(raw.startsWith('ru'))return 'ru';
    if(raw.startsWith('de'))return 'de';
    if(raw.startsWith('th'))return 'th';
    if(raw.startsWith('es'))return 'es';
    if(raw.startsWith('fr'))return 'fr';
    if(raw.startsWith('ja'))return 'ja';
    if(raw.startsWith('en'))return 'en';
    return 'vi';
  }
  function avatarViewerText(name='',key='title'){
    const copy=AVATAR_VIEWER_COPY[avatarViewerLanguage()]||AVATAR_VIEWER_COPY.vi;
    const template=copy[key]||copy.title;
    return String(template).replace('{name}',String(name||copy.empty));
  }
  let csrfToken = '';
  function absorbSecurityHeaders(response) {
    const token = response?.headers?.get?.('x-csrf-token') || '';
    if (token) csrfToken = token;
  }
  function isMutation(method) { return !['GET','HEAD','OPTIONS'].includes(String(method || 'GET').toUpperCase()); }

  async function fetchJSON(url, options = {}) {
    const config = { credentials:'same-origin', ...options, headers: { ...(options.headers || {}) } };
    if (isMutation(config.method) && csrfToken && !config.headers['X-CSRF-Token'] && !config.headers['x-csrf-token']) config.headers['X-CSRF-Token'] = csrfToken;
    const formDataBody = config.body instanceof FormData;
    if (config.body && !formDataBody) {
      config.headers["Content-Type"] = "application/json";
      if (typeof config.body !== "string") config.body = JSON.stringify(config.body);
    }
    const explicitTimeout = Number(config.timeoutMs);
    delete config.timeoutMs;
    const timeoutMs = Number.isFinite(explicitTimeout) && explicitTimeout > 0
      ? explicitTimeout
      : formDataBody ? 120000 : 30000;
    const externalSignal = config.signal || null;
    const controller = new AbortController();
    let timedOut = false;
    const abortFromCaller = () => controller.abort(externalSignal?.reason);
    if (externalSignal?.aborted) abortFromCaller();
    else externalSignal?.addEventListener?.('abort', abortFromCaller, { once:true });
    config.signal = controller.signal;
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
    try {
      const response = await fetch(url, config);
      absorbSecurityHeaders(response);
      const contentType = response.headers.get('content-type') || '';
      const data = response.status === 204
        ? { ok:true }
        : contentType.includes('application/json')
          ? await response.json().catch(() => ({ ok:false, message:"Phản hồi máy chủ không hợp lệ." }))
          : { ok:response.ok, message:await response.text().catch(() => '') };
      if (data?.csrfToken) csrfToken = data.csrfToken;
      if (!response.ok) {
        const error = new Error(data.message || "Yêu cầu không thành công.");
        error.status = response.status; error.data = data; throw error;
      }
      return data;
    } catch (error) {
      if (error?.name === 'AbortError' && timedOut) {
        const timeoutError = new Error('Kết nối mất quá nhiều thời gian. Vui lòng kiểm tra mạng và thử lại.');
        timeoutError.code = 'REQUEST_TIMEOUT';
        throw timeoutError;
      }
      if (error instanceof TypeError && !navigator.onLine) {
        const offlineError = new Error('Thiết bị đang ngoại tuyến. Vui lòng kết nối mạng và thử lại.');
        offlineError.code = 'OFFLINE';
        throw offlineError;
      }
      throw error;
    } finally {
      clearTimeout(timer);
      externalSignal?.removeEventListener?.('abort', abortFromCaller);
    }
  }

  const modalReturnFocus = new WeakMap();
  const modalTimers = new WeakMap();
  const modalCloseHandlers = new WeakMap();
  let modalBodyStyle = null;
  function visibleModals() { return [...document.querySelectorAll('.modal-backdrop:not(.hidden)')]; }
  function clearModalLifecycle(modal) {
    const timer = modalTimers.get(modal);
    if (timer) clearTimeout(timer);
    modalTimers.delete(modal);
    const registered = modalCloseHandlers.get(modal);
    if (registered) {
      registered.target?.removeEventListener?.('transitionend', registered.handler);
      modalCloseHandlers.delete(modal);
    }
  }
  function lockModalScroll() {
    if (modalBodyStyle || !document.body) return;
    const scrollbar = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    modalBodyStyle = { overflow:document.body.style.overflow, paddingRight:document.body.style.paddingRight };
    document.body.style.overflow = 'hidden';
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
    document.body.classList.add('modal-scroll-locked');
  }
  function unlockModalScroll() {
    if (!modalBodyStyle || visibleModals().length) return;
    document.body.style.overflow = modalBodyStyle.overflow;
    document.body.style.paddingRight = modalBodyStyle.paddingRight;
    document.body.classList.remove('modal-scroll-locked');
    modalBodyStyle = null;
  }
  function openModal(id) {
    const modal = document.getElementById(id); if (!modal) return;
    if (!modal.classList.contains("hidden") && modal.dataset.modalPhase !== "closing") return;
    const card = modal.querySelector('.modal-card');
    if (!card) {
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
      console.error(`[NexChat] Modal ${id} is missing .modal-card`);
      return;
    }
    // Keep every dialog at the document root so transforms/filters on feature
    // containers can never hide the card behind a blur-only backdrop.
    if (modal.parentElement !== document.body) document.body.appendChild(modal);
    clearModalLifecycle(modal);
    modal.dataset.modalPhase = "opening";
    if (!modalReturnFocus.has(modal)) modalReturnFocus.set(modal, document.activeElement instanceof HTMLElement ? document.activeElement : null);
    modal.classList.remove("hidden", "modal-visible", "modal-closing", "modal-force-visible");
    modal.classList.add("modal-opening");
    modal.removeAttribute('inert');
    modal.setAttribute("aria-hidden", "false");
    card.removeAttribute('inert');
    card.removeAttribute('hidden');
    const stackIndex = visibleModals().filter((item) => item !== modal).length;
    modal.style.zIndex = String(2147483000 + Math.min(stackIndex, 200));
    lockModalScroll();

    // Commit synchronously. A modal may never expose only its blurred backdrop.
    void modal.offsetWidth;
    modal.classList.add("modal-visible", "modal-force-visible");
    modal.classList.remove("modal-opening");
    modal.dataset.modalPhase = "open";

    const focusTimer = setTimeout(() => {
      if (modal.classList.contains("hidden") || modal.dataset.modalPhase !== "open") return;
      const style = getComputedStyle(card);
      const rect = card.getBoundingClientRect();
      const invisible = style.display === 'none' || style.visibility === 'hidden' || Number.parseFloat(style.opacity || '1') < .5 || rect.width < 2 || rect.height < 2;
      if (invisible) {
        // Last-resort runtime recovery for stale cached CSS or browser animation
        // throttling. The class is scoped to the currently open dialog only.
        modal.classList.add('modal-force-visible');
        card.style.setProperty('display', 'block', 'important');
        card.style.setProperty('visibility', 'visible', 'important');
        card.style.setProperty('opacity', '1', 'important');
        card.style.setProperty('transform', 'translate3d(0,0,0) scale(1)', 'important');
        card.style.setProperty('pointer-events', 'auto', 'important');
      }
      const preferred = modal.querySelector('[autofocus], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])');
      preferred?.focus({ preventScroll:true });
      modalTimers.delete(modal);
    }, 80);
    modalTimers.set(modal, focusTimer);
  }
  function resetPasswordVisibility(root = document) {
    root.querySelectorAll?.('input[data-password-field], input[type="password"], input[data-was-password="true"]').forEach((input) => {
      input.type = "password";
      input.dataset.wasPassword = "true";
      const toggle = root.querySelector?.(`[data-toggle-password="${CSS.escape(input.id || '')}"]`) || document.querySelector(`[data-toggle-password="${CSS.escape(input.id || '')}"]`);
      if (toggle) {
        toggle.textContent = tr("show");
        toggle.setAttribute("aria-pressed", "false");
      }
    });
  }
  function closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal || modal.dataset.locked === "true" || modal.classList.contains("hidden") || modal.dataset.modalPhase === "closing") return;
    clearModalLifecycle(modal);
    modal.dataset.modalPhase = "closing";
    resetPasswordVisibility(modal);
    modal.classList.remove("modal-visible", "modal-opening");
    modal.classList.add("modal-closing");
    modal.setAttribute("aria-hidden", "true");

    let finished = false;
    const finish = () => {
      if (finished || modal.dataset.modalPhase !== "closing") return;
      finished = true;
      clearModalLifecycle(modal);
      modal.classList.add("hidden");
      modal.classList.remove("modal-closing", "modal-opening", "modal-visible", "modal-force-visible");
      modal.style.removeProperty('z-index');
      const card = modal.querySelector('.modal-card');
      if (card) {
        ['display','visibility','opacity','transform','pointer-events'].forEach((property) => card.style.removeProperty(property));
      }
      delete modal.dataset.modalPhase;
      unlockModalScroll();
      const returnFocus = modalReturnFocus.get(modal);
      modalReturnFocus.delete(modal);
      if (returnFocus?.isConnected && typeof returnFocus.focus === 'function') {
        requestAnimationFrame(() => returnFocus.focus({ preventScroll:true }));
      }
    };
    const card = modal.querySelector('.modal-card') || modal;
    const onTransitionEnd = (event) => {
      if (event.target !== card || event.propertyName !== 'transform') return;
      finish();
    };
    card.addEventListener('transitionend', onTransitionEnd);
    modalCloseHandlers.set(modal, { target:card, handler:onTransitionEnd });
    // Fallback only; the normal path completes on transitionend.
    modalTimers.set(modal, setTimeout(finish, 360));
  }

  let activeToast = null;
  function toast(message, type = "info", title = tr("notification")) {
    const container = document.getElementById("toastContainer"); if (!container) return null;
    const safeType = ["success","error","warning","info"].includes(type) ? type : "info";
    let item = activeToast && activeToast.isConnected ? activeToast : container.firstElementChild;
    const updating = Boolean(item);
    if (!item) {
      item = document.createElement("div");
      container.replaceChildren(item);
    }
    clearTimeout(item.__nexToastTimer);
    activeToast = item;
    item.className = `toast ${safeType}${updating ? " toast-updated" : ""}`;
    item.setAttribute('role', safeType === 'error' ? 'alert' : 'status');
    item.setAttribute('aria-live', safeType === 'error' ? 'assertive' : 'polite');
    item.innerHTML = `<span class="toast-icon">${iconHTML(safeType === "success" ? "check" : safeType === "error" ? "shield-alert" : "info")}</span><div><strong>${escapeHTML(title)}</strong><p>${escapeHTML(message)}</p></div><button type="button" aria-label="${escapeHTML(tr('close') || 'Đóng')}">${iconHTML("close")}</button>`;
    item.__nexToastDuration = Math.max(4300, Math.min(9000, 2800 + String(message || '').length * 38));
    if (!item.__nexToastBound) {
      item.__nexToastBound = true;
      item.__nexToastDismiss = () => {
        clearTimeout(item.__nexToastTimer);
        if (!item.isConnected || item.classList.contains('toast-leaving')) return;
        item.classList.add('toast-leaving');
        setTimeout(() => { if (activeToast === item) activeToast = null; item.remove(); }, 270);
      };
      item.__nexToastStart = () => {
        clearTimeout(item.__nexToastTimer);
        item.__nexToastTimer = setTimeout(item.__nexToastDismiss, item.__nexToastDuration || 4300);
      };
      item.addEventListener('click', (event) => { if (event.target.closest('button')) item.__nexToastDismiss(); });
      item.addEventListener('mouseenter', () => clearTimeout(item.__nexToastTimer));
      item.addEventListener('mouseleave', item.__nexToastStart);
      item.addEventListener('focusin', () => clearTimeout(item.__nexToastTimer));
      item.addEventListener('focusout', item.__nexToastStart);
    }
    if (updating) requestAnimationFrame(() => item.classList.remove('toast-updated'));
    item.__nexToastStart();
    return item;
  }

  function setLoading(button, loading) {
    if (!button) return; button.disabled = loading; button.classList.toggle("is-loading", loading);
  }
  function locale() { return window.I18N?.locale || "vi-VN"; }
  function formatDate(value, includeTime = true) {
    if (!value) return "—"; const date = new Date(value); if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat(locale(), includeTime
      ? { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }
      : { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
  }
  function formatTime(value) {
    const date = new Date(value); if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat(locale(), { hour: "2-digit", minute: "2-digit" }).format(date);
  }
  function formatBytes(bytes = 0) {
    const value = Number(bytes) || 0; if (value < 1024) return `${value} B`;
    if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KB`;
    return `${(value / 1024 ** 2).toFixed(1)} MB`;
  }
  function initials(name = "?") {
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    return (parts.length > 1 ? `${parts[0][0]}${parts.at(-1)[0]}` : parts[0]?.slice(0, 1) || "?").toUpperCase();
  }

  const avatarPalettes = [
    ["#6d5dfc","#9b5cf6"],["#0ea5e9","#22c55e"],["#f97316","#ec4899"],
    ["#14b8a6","#6366f1"],["#ef4444","#f59e0b"],["#8b5cf6","#06b6d4"],
    ["#10b981","#3b82f6"],["#e11d48","#7c3aed"],["#2563eb","#4f46e5"],
    ["#7c3aed","#db2777"],["#0891b2","#059669"],["#ea580c","#ca8a04"]
  ];
  function hashSeed(value = "") {
    let hash = 2166136261;
    for (const char of String(value)) {
      hash ^= char.codePointAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }
  function avatarMeta(user = {}) {
    const seed = user.id || user.username || user.nickname || "nexchat";
    const hash = hashSeed(seed);
    const palette = avatarPalettes[hash % avatarPalettes.length];
    return {
      a: palette[0], b: palette[1],
      angle: 120 + (hash % 80),
      pattern: `avatar-pattern-${(hash % 4) + 1}`,
      initials: initials(user.nickname || user.username || "?"),
    };
  }
  function profileRank(user = {}) {
    const badges = user?.profileBadges || {};
    const now = Date.now();
    const active = (grant) => Boolean(grant && (!grant.expiresAt || now < Number(grant.expiresAt)));
    if (active(badges.legend)) return "legend";
    if (active(badges.vip)) return "vip";
    return "standard";
  }
  function badgeRemainingText(grant = null, compact = false) {
    if (!grant) return "";
    if (grant.timingHidden) return "";
    if (!grant.expiresAt) return compact ? "Vĩnh viễn" : "Đặc quyền vĩnh viễn";
    const left = Number(grant.expiresAt) - Date.now();
    if (left <= 0) return "Đã hết hạn";
    const totalSeconds = Math.max(0, Math.floor(left / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const clock = [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
    if (days > 0) return compact ? `${days} ngày ${clock}` : `Còn ${days} ngày ${clock}`;
    if (hours > 0) return compact ? clock : `Còn ${clock}`;
    const shortClock = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    return compact ? shortClock : `Còn ${shortClock}`;
  }
  function profileBadgeHTML(user = {}) {
    const rank = profileRank(user);
    const grant = user?.profileBadges?.[rank];
    const remaining = badgeRemainingText(grant, false);
    const legendTitle = remaining ? `LEGEND · ${escapeHTML(remaining)}` : "LEGEND";
    const vipTitle = remaining ? `VIP · ${escapeHTML(remaining)}` : "VIP";
    if (rank === "legend") return `<span class="profile-rank-badge profile-rank-legend rank-emblem-image-host" title="${legendTitle}" aria-label="LEGEND"><img class="rank-emblem-art" src="/legend-emblem.webp?v=1.0.0" alt="" aria-hidden="true" decoding="async"><b>L</b><i></i></span>`;
    if (rank === "vip") return `<span class="profile-rank-badge profile-rank-vip rank-emblem-image-host" title="${vipTitle}" aria-label="VIP"><img class="rank-emblem-art" src="/vip-emblem.webp?v=1.0.0" alt="" aria-hidden="true" decoding="async"><b>V</b><i aria-hidden="true"></i></span>`;
    return '';
  }
  function avatarHTML(user = {}, className = "avatar", options = {}) {
    const image = user?.profile?.avatarUrl || user?.avatarUrl || "";
    const meta = avatarMeta(user);
    const online = options.online ?? user?.online;
    const stateClass = options.blocked ? " avatar-blocked" : "";
    const rank = profileRank(user);
    const rankClass = rank === "standard" ? "" : ` rank-avatar rank-${rank}`;
    const presence = options.presence === false ? "" : `<i class="avatar-presence ${online ? "online" : ""}" aria-hidden="true"></i>`;
    const badges = options.badges === false ? "" : profileBadgeHTML(user);
    const fallback = `<b class="smart-avatar-fallback">${escapeHTML(meta.initials)}</b><em aria-hidden="true"></em>`;
    const baseStyle = `--avatar-a:${meta.a};--avatar-b:${meta.b};--avatar-angle:${meta.angle}deg`;
    if (image) {
      const safeImage = escapeHTML(image);
      return `<span class="${escapeHTML(className)} smart-avatar avatar-image ${meta.pattern}${rankClass}${stateClass}" data-profile-rank="${rank}" data-avatar-src="${safeImage}" style="${baseStyle}" aria-label="${escapeHTML(user.nickname || user.username || "Ảnh đại diện")}">${fallback}<img class="smart-avatar-photo" src="${safeImage}" alt="" loading="lazy" decoding="async">${badges}${presence}</span>`;
    }
    return `<span class="${escapeHTML(className)} smart-avatar ${meta.pattern}${rankClass}${stateClass}" data-profile-rank="${rank}" style="${baseStyle}" aria-label="${escapeHTML(user.nickname || user.username || "Ảnh đại diện")}">${fallback}${badges}${presence}</span>`;
  }
  function updateAvatarImageState(image, failed = false) {
    const host = image?.closest?.('.smart-avatar');
    if (!host) return;
    host.classList.toggle('avatar-image-load-failed', Boolean(failed));
    host.classList.toggle('avatar-image-loaded', !failed);
    image.hidden = Boolean(failed);
  }
  document.addEventListener('load', (event) => {
    if (event.target?.classList?.contains('smart-avatar-photo')) updateAvatarImageState(event.target, false);
  }, true);
  document.addEventListener('error', (event) => {
    if (event.target?.classList?.contains('smart-avatar-photo')) updateAvatarImageState(event.target, true);
  }, true);
  function setAvatar(element, user = {}, options = {}) {
    if (!element) return;
    const wrapper = document.createElement("div");
    wrapper.innerHTML = avatarHTML(user, options.className || element.className || "avatar", options);
    element.replaceWith(wrapper.firstElementChild);
  }
  function restrictionHTML(restriction) {
    if (!restriction) return "";
    const type = restriction.type === "ban" ? "Cấm tài khoản" : "Khóa tài khoản";
    const duration = restriction.permanent ? "Vĩnh viễn" : formatDate(restriction.until);
    return `<strong>${escapeHTML(type)}</strong><br>Thời hạn: ${escapeHTML(duration)}<br>Lý do: ${escapeHTML(restriction.reason || "—")}`;
  }
  function autoResize(textarea) {
    if (!textarea) return; textarea.style.height = "auto"; textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
  }
  function attachmentHTML(attachment) {
    if (!attachment) return "";
    const safeUrl = escapeHTML(attachment.url), name = escapeHTML(attachment.name);
    if (attachment.kind === "image") return `<div class="message-attachment image-attachment"><button type="button" class="message-image-button" data-media-src="${safeUrl}" data-media-name="${name}" aria-label="Xem ảnh ${name}"><img src="${safeUrl}" alt="${name}" loading="lazy" decoding="async" fetchpriority="low"></button></div>`;
    if (attachment.kind === "video") return `<div class="message-attachment"><video controls preload="none"><source src="${safeUrl}" type="${escapeHTML(attachment.mime)}"></video></div>`;
    if (attachment.kind === "audio") return `<div class="message-attachment"><audio controls preload="none" src="${safeUrl}"></audio></div>`;
    return `<div class="message-attachment"><a class="file-attachment" href="${safeUrl}" target="_blank" rel="noopener" download><span class="file-icon">${iconHTML("file")}</span><div><strong>${name}</strong><small>${formatBytes(attachment.size)}</small></div><span>↓</span></a></div>`;
  }

  let mediaViewer = null;
  let mediaViewerRestoreFocus = null;
  function ensureMediaViewer() {
    if (mediaViewer) return mediaViewer;
    mediaViewer = document.createElement("div");
    mediaViewer.id = "mediaViewer";
    mediaViewer.className = "media-viewer hidden";
    mediaViewer.setAttribute("role", "dialog");
    mediaViewer.setAttribute("aria-modal", "true");
    mediaViewer.setAttribute("aria-labelledby", "mediaViewerCaption");
    mediaViewer.innerHTML = `<div class="media-viewer-toolbar"><strong id="mediaViewerCaption" class="media-viewer-caption"></strong><button class="media-viewer-close" type="button" aria-label="${escapeHTML(tr("close"))}">${iconHTML("close")}</button></div><div class="media-viewer-stage"><span class="media-viewer-loader" aria-hidden="true"></span><img alt="" draggable="false"></div>`;
    document.body.appendChild(mediaViewer);
    const image = mediaViewer.querySelector("img");
    image.addEventListener("load", () => mediaViewer?.classList.remove("is-loading", "is-error"));
    image.addEventListener("error", () => {
      mediaViewer?.classList.remove("is-loading");
      mediaViewer?.classList.add("is-error");
      toast(avatarViewerText("", "error"), "error");
    });
    mediaViewer.addEventListener("click", (event) => {
      if (event.target === mediaViewer || event.target.closest(".media-viewer-close") || event.target.classList.contains("media-viewer-stage")) closeMediaViewer();
    });
    return mediaViewer;
  }
  function openMediaViewer({ src = "", name = "Ảnh", kind = "image", trigger = null } = {}) {
    const safeSrc = String(src || "").trim();
    if (!safeSrc) return false;
    const viewer = ensureMediaViewer();
    const image = viewer.querySelector("img");
    const caption = viewer.querySelector(".media-viewer-caption");
    mediaViewerRestoreFocus = trigger instanceof HTMLElement ? trigger : (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    viewer.dataset.mediaKind = kind;
    viewer.classList.add("is-loading");
    viewer.classList.remove("is-error", "hidden");
    if (caption) caption.textContent = name || "Ảnh";
    image.alt = name || "Ảnh";
    image.src = safeSrc;
    document.body.classList.add("media-viewer-open");
    viewer.querySelector(".media-viewer-close")?.focus({ preventScroll: true });
    return true;
  }
  function closeMediaViewer() {
    if (!mediaViewer || mediaViewer.classList.contains("hidden")) return;
    mediaViewer.classList.add("hidden");
    mediaViewer.classList.remove("is-loading", "is-error");
    delete mediaViewer.dataset.mediaKind;
    const image = mediaViewer.querySelector("img");
    if (image) image.removeAttribute("src");
    document.body.classList.remove("media-viewer-open");
    const restore = mediaViewerRestoreFocus;
    mediaViewerRestoreFocus = null;
    if (restore?.isConnected) requestAnimationFrame(() => restore.focus?.({ preventScroll: true }));
  }
  function avatarPreviewSource(trigger) {
    if (!trigger) return "";
    const direct = trigger.dataset.avatarPreview || trigger.dataset.mediaSrc || trigger.dataset.avatarSrc;
    if (direct) return direct;
    const avatar = trigger.matches?.("[data-avatar-src]") ? trigger : trigger.querySelector?.("[data-avatar-src]");
    if (avatar?.dataset.avatarSrc) return avatar.dataset.avatarSrc;
    const image = trigger.matches?.("img") ? trigger : trigger.querySelector?.("img.smart-avatar-photo, img.profile-avatar-photo");
    return image?.currentSrc || image?.src || "";
  }
  function openAvatarPreview(trigger) {
    const src = avatarPreviewSource(trigger);
    if (!src) return false;
    const person = trigger.dataset.avatarPerson || "";
    const name = trigger.dataset.avatarName || avatarViewerText(person, "title");
    return openMediaViewer({ src, name, kind: "avatar", trigger });
  }

  let announcementTimer = null;
  let announcementRotationTimer = null;
  let announcementResizeTimer = null;
  let announcementIndex = 0;
  let serverAnnouncements = [];

  function announcementAllowed() {
    return document.body?.classList.contains("app-page");
  }
  function suspendServerAnnouncement() {
    clearAnnouncementTimers();
    document.getElementById("serverAnnouncement")?.remove();
    document.body?.classList.remove("has-server-announcement");
  }
  function syncServerAnnouncementVisibility() {
    if (!announcementAllowed()) return suspendServerAnnouncement();
    if (serverAnnouncements.length) showServerAnnouncement(serverAnnouncements);
  }

  function normalizeClientAnnouncements(value) {
    const source = Array.isArray(value) ? value : (Array.isArray(value?.announcements) ? value.announcements : (value ? [value] : []));
    const seen = new Set();
    return source.map((item) => ({
      id:String(item?.id || ""),
      message:String(item?.message || "").trim(),
      createdAt:item?.createdAt || "",
      expiresAt:Number(item?.expiresAt),
    })).filter((item) => item.id && item.message && Number.isFinite(item.expiresAt) && item.expiresAt > Date.now() && !seen.has(item.id) && seen.add(item.id))
      .sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0,1);
  }
  function useInlineAnnouncementLayout() {
    return document.body?.classList.contains("app-page");
  }
  function mountAnnouncementNode(node) {
    if (!node) return;
    const panel = document.querySelector(".smart-chat-panel");
    const header = panel?.querySelector(".smart-chat-header");
    if (useInlineAnnouncementLayout() && panel && header) {
      node.classList.add("server-announcement-inline");
      if (node.parentElement !== panel || node.previousElementSibling !== header) header.insertAdjacentElement("afterend", node);
      return;
    }
    node.classList.remove("server-announcement-inline");
    if (node.parentElement !== document.body || document.body.firstElementChild !== node) document.body.prepend(node);
  }
  function ensureAnnouncementNode() {
    let node = document.getElementById("serverAnnouncement");
    if (!node) {
      node = document.createElement("aside");
      node.id = "serverAnnouncement";
      node.className = "server-announcement";
      node.setAttribute("role", "status");
      node.setAttribute("aria-live", "polite");
      node.innerHTML = `<span class="server-announcement-icon">${iconHTML("bell")}</span><div class="server-announcement-window"><div class="server-announcement-runner"><div class="server-announcement-copy"><span class="server-announcement-text"></span></div></div></div><div class="server-announcement-meta"><time class="server-announcement-time"></time></div>`;
    }
    mountAnnouncementNode(node);
    return node;
  }
  function clearAnnouncementTimers() {
    if (announcementTimer) clearInterval(announcementTimer);
    if (announcementRotationTimer) clearTimeout(announcementRotationTimer);
    clearTimeout(announcementResizeTimer);
    announcementTimer = null;
    announcementRotationTimer = null;
    announcementResizeTimer = null;
  }
  function formatAnnouncementRemaining(expiresAt) {
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) return "0:00";
    const totalSeconds = Math.ceil(remaining / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return hours ? `${hours}:${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}` : `${minutes}:${String(seconds).padStart(2,"0")}`;
  }
  function configureAnnouncementMotion(node, announcement) {
    const windowNode = node.querySelector(".server-announcement-window");
    const runner = node.querySelector(".server-announcement-runner");
    const copy = node.querySelector(".server-announcement-copy");
    if (!windowNode || !runner || !copy) return;
    runner.classList.remove("is-static","is-marquee","is-switching");
    runner.style.removeProperty("--announcement-speed");
    runner.style.removeProperty("--announcement-travel");
    runner.style.animation = "none";
    void runner.offsetWidth;
    const firstWidth = Math.ceil(copy.scrollWidth);
    const available = Math.floor(windowNode.clientWidth);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches || document.body.classList.contains("motion-minimal") || document.documentElement.dataset.v10MotionResolved === "static";
    const overflow = Math.max(0, firstWidth - available + 12);
    if (reduced || overflow < 18) {
      runner.classList.add("is-static");
      runner.style.animation = "none";
      return;
    }
    const pxPerSecond = matchMedia("(max-width: 700px)").matches ? 34 : 42;
    const duration = Math.max(5.5, Math.min(18, overflow / pxPerSecond + 3.2));
    runner.style.setProperty("--announcement-speed", `${duration.toFixed(2)}s`);
    runner.style.setProperty("--announcement-travel", `${-overflow}px`);
    runner.classList.add("is-marquee");
    runner.style.removeProperty("animation");
  }
  function renderCurrentAnnouncement({animateSwitch=false} = {}) {
    serverAnnouncements = normalizeClientAnnouncements(serverAnnouncements);
    if (!serverAnnouncements.length) return hideServerAnnouncement();
    if (!announcementAllowed()) return suspendServerAnnouncement();
    announcementIndex = ((announcementIndex % serverAnnouncements.length) + serverAnnouncements.length) % serverAnnouncements.length;
    const announcement = serverAnnouncements[announcementIndex];
    const node = ensureAnnouncementNode();
    node.dataset.announcementId = announcement.id;
    node.classList.remove("has-multiple");
    node.querySelectorAll(".server-announcement-text").forEach((item) => { item.textContent = announcement.message; });
    const time = node.querySelector(".server-announcement-time");
    if (time) time.textContent = formatAnnouncementRemaining(announcement.expiresAt);
    document.body.classList.add("has-server-announcement");
    if (animateSwitch) {
      node.classList.remove("announcement-switch");
      void node.offsetWidth;
      node.classList.add("announcement-switch");
    }
    requestAnimationFrame(() => {
      configureAnnouncementMotion(node, announcement);
      if (announcementRotationTimer) clearTimeout(announcementRotationTimer);
    });
  }
  function hideServerAnnouncement(id = null) {
    if (id) serverAnnouncements = serverAnnouncements.filter((item) => item.id !== String(id));
    else serverAnnouncements = [];
    if (serverAnnouncements.length) return renderCurrentAnnouncement({animateSwitch:true});
    clearAnnouncementTimers();
    const node = document.getElementById("serverAnnouncement");
    if (!node) { document.body.classList.remove("has-server-announcement"); return; }
    if (node.classList.contains("announcement-ending")) return;
    node.classList.add("announcement-ending");
    setTimeout(() => {
      node.remove();
      document.body.classList.remove("has-server-announcement");
    }, 330);
  }
  function showServerAnnouncement(value) {
    const incoming = normalizeClientAnnouncements(value).slice(0,1);
    if (!incoming.length) return hideServerAnnouncement();
    const previous = serverAnnouncements[0];
    const next = incoming[0];
    const node = document.getElementById("serverAnnouncement");
    const unchanged = Boolean(node && !node.classList.contains("announcement-ending") && previous
      && previous.id === next.id && previous.message === next.message && previous.expiresAt === next.expiresAt);
    serverAnnouncements = incoming;
    announcementIndex = 0;
    if (!announcementAllowed()) return suspendServerAnnouncement();
    if (unchanged) {
      const time = node.querySelector(".server-announcement-time");
      if (time) time.textContent = formatAnnouncementRemaining(next.expiresAt);
      return;
    }
    clearAnnouncementTimers();
    renderCurrentAnnouncement();
    announcementTimer = setInterval(() => {
      serverAnnouncements = normalizeClientAnnouncements(serverAnnouncements);
      if (!serverAnnouncements.length) return hideServerAnnouncement();
      const current = serverAnnouncements[0];
      const activeNode = document.getElementById("serverAnnouncement");
      const time = activeNode?.querySelector(".server-announcement-time");
      if (time && current) time.textContent = formatAnnouncementRemaining(current.expiresAt);
    }, 1000);
  }
  window.addEventListener("resize", () => {
    if (!serverAnnouncements.length || !announcementAllowed()) return;
    clearTimeout(announcementResizeTimer);
    announcementResizeTimer = setTimeout(() => renderCurrentAnnouncement(), 140);
  }, { passive:true });
  function bindSystemSocket(socket) {
    if (!socket || socket.__nexchatSystemBound) return;
    socket.__nexchatSystemBound = true;
    socket.on("server:announcements", (announcements) => showServerAnnouncement(Array.isArray(announcements) ? announcements : []));
    socket.on("server:announcement", showServerAnnouncement);
    socket.on("server:announcement:clear", (payload = {}) => payload.all ? hideServerAnnouncement() : hideServerAnnouncement(payload.id || null));
  }
  async function loadSystemState() {
    try {
      const response = await fetch("/api/public/system-state", { cache: "no-store" });
      const data = await response.json();
      const announcements = data?.system?.activeAnnouncements || (data?.system?.activeAnnouncement ? [data.system.activeAnnouncement] : []);
      if (announcements.length) showServerAnnouncement(announcements);
      else hideServerAnnouncement();
      return data?.system || null;
    } catch { return null; }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => { hydrateClassicIcons(); observeClassicIcons(); });
  else { hydrateClassicIcons(); observeClassicIcons(); }

  document.addEventListener("pointerdown", (event) => {
    if (event.target.closest?.("[data-toggle-password]")) event.preventDefault();
  });

  document.addEventListener("click", (event) => {
    const mediaButton = event.target.closest("[data-media-src]");
    if (mediaButton) {
      event.preventDefault();
      openMediaViewer({ src: mediaButton.dataset.mediaSrc, name: mediaButton.dataset.mediaName || "Ảnh" });
      return;
    }
    const closeButton = event.target.closest("[data-close-modal]");
    if (closeButton) {
      event.preventDefault();
      closeModal(closeButton.dataset.closeModal);
      return;
    }
    const backdrop = event.target.classList?.contains("modal-backdrop") ? event.target : null;
    if (backdrop && backdrop.dataset.locked !== "true") {
      event.preventDefault();
      closeModal(backdrop.id);
      return;
    }
    const toggleButton = event.target.closest("[data-toggle-password]");
    if (toggleButton) {
      event.preventDefault();
      event.stopPropagation();
      const input = document.getElementById(toggleButton.dataset.togglePassword); if (!input) return;
      const reveal = input.type === "password";
      input.dataset.wasPassword = "true";
      input.type = reveal ? "text" : "password";
      toggleButton.textContent = tr(reveal ? "hide" : "show");
      toggleButton.setAttribute("aria-pressed", String(reveal));
      toggleButton.setAttribute("aria-label", tr(reveal ? "hide" : "show"));
      input.focus({ preventScroll:true });
      try { input.setSelectionRange(input.value.length, input.value.length); } catch (_) {}
    }
  });

  // Keep the user's visibility choice stable while the field/form remains open.
  // Previously, an empty field was forced back to type=password on input/focusout,
  // making the button jump from “Ẩn” back to “Hiện” immediately. Visibility is
  // now reset only when the modal closes or the form itself is reset.
  document.addEventListener("input", (event) => {
    const input = event.target.closest?.('input[type="password"], input[data-was-password="true"]');
    if (input) input.dataset.wasPassword = "true";
  });
  document.addEventListener("reset", (event) => {
    const form = event.target.closest?.('form');
    if (!form) return;
    requestAnimationFrame(() => resetPasswordVisibility(form));
  });
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest?.("[data-avatar-preview]");
    if (!trigger || trigger.closest('.hidden,[aria-hidden="true"]')) return;
    if (!openAvatarPreview(trigger)) return;
    event.preventDefault();
    event.stopPropagation();
  });
  document.addEventListener("keydown", (event) => {
    const trigger = event.target.closest?.("[data-avatar-preview]");
    if (!trigger || !["Enter", " "].includes(event.key)) return;
    if (!openAvatarPreview(trigger)) return;
    event.preventDefault();
    event.stopPropagation();
  });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && document.body.classList.contains("media-viewer-open")) closeMediaViewer(); });
  // Backdrop dismissal is handled on click, not mousedown. Keeping the overlay
  // alive through pointer-up prevents click-through and the visible double-jump.
  window.addEventListener("languagechange", () => {
    document.querySelectorAll("[data-toggle-password]").forEach((button) => {
      const input = document.getElementById(button.dataset.togglePassword);
      if (input) button.textContent = tr(input.type === "password" ? "show" : "hide");
    });
    document.querySelectorAll("[data-avatar-preview][data-avatar-person]").forEach((trigger) => {
      const person=trigger.dataset.avatarPerson||"";
      const hasImage=Boolean(avatarPreviewSource(trigger));
      trigger.dataset.avatarName=avatarViewerText(person,"title");
      trigger.dataset.avatarHint=avatarViewerText(person,"hint");
      trigger.setAttribute("aria-label",hasImage?avatarViewerText(person,"view"):avatarViewerText(person,"choose"));
    });
    const viewerClose=mediaViewer?.querySelector(".media-viewer-close");
    if(viewerClose)viewerClose.setAttribute("aria-label",tr("close"));
    renderConnectionState();
  });
  document.addEventListener("keydown", (event) => {
    const visible = visibleModals().at(-1);
    if (!visible) return;
    if (event.key === "Tab") {
      const focusable = [...visible.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
        .filter((node) => node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden');
      if (!focusable.length) { event.preventDefault(); visible.focus?.(); return; }
      const first = focusable[0], last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      return;
    }
    if (event.key === "Escape" && visible.dataset.locked !== "true") closeModal(visible.id);
  });
  const CONNECTION_TEXT = {
    vi:{connected:"Đã kết nối",reconnecting:"Đang kết nối lại"},
    en:{connected:"Connected",reconnecting:"Reconnecting"},
    zh:{connected:"已连接",reconnecting:"正在重新连接"},
    ru:{connected:"Подключено",reconnecting:"Повторное подключение"},
    de:{connected:"Verbunden",reconnecting:"Verbindung wird wiederhergestellt"},
    th:{connected:"เชื่อมต่อแล้ว",reconnecting:"กำลังเชื่อมต่อใหม่"},
    es:{connected:"Conectado",reconnecting:"Reconectando"},
    fr:{connected:"Connecté",reconnecting:"Reconnexion"},
    ja:{connected:"接続済み",reconnecting:"再接続中"},
  };
  const GENERIC_CONNECTION_LABELS = new Set(Object.values(CONNECTION_TEXT).flatMap((entry)=>Object.values(entry)));
  let lastConnectionState = { online:true, generic:true, customLabel:"" };
  function connectionLanguage(){
    const raw=window.I18N?.language||document.documentElement.lang||'vi';
    const code=String(raw).toLowerCase().replace('_','-').split('-')[0];
    return CONNECTION_TEXT[code]?code:'en';
  }
  function connectionText(key){return CONNECTION_TEXT[connectionLanguage()]?.[key]||CONNECTION_TEXT.en[key];}
  function renderConnectionState(){
    const {online,generic,customLabel}=lastConnectionState;
    document.documentElement.classList.toggle("is-offline", !online);
    const physical=online?window.NexPolish?.connectionInfo?.().label:"";
    const base=online?connectionText('connected'):connectionText('reconnecting');
    const resolvedLabel=generic?(online&&physical?`${base} · ${physical}`:base):customLabel;
    document.querySelectorAll("[data-connection-state]").forEach((node)=>{
      node.classList.toggle("offline",!online);
      node.dataset.connectionState=online?'connected':'reconnecting';
      const text=node.querySelector("[data-connection-label]");
      if(text)text.textContent=resolvedLabel;
      node.setAttribute('aria-label',resolvedLabel);
    });
    return resolvedLabel;
  }
  function setConnectionState(online,label=""){
    const supplied=String(label||'').trim();
    const generic=!supplied||GENERIC_CONNECTION_LABELS.has(supplied);
    lastConnectionState={online:Boolean(online),generic,customLabel:supplied};
    const resolvedLabel=renderConnectionState();
    document.dispatchEvent(new CustomEvent("nexchat:network",{detail:{online:Boolean(online),label:resolvedLabel}}));
  }


  let activeConfirmCleanup = null;
  let logoutInProgress = false;

  function ensureGlobalConfirmModal() {
    let modal = document.getElementById("globalConfirmModal");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "globalConfirmModal";
    modal.className = "modal-backdrop hidden global-confirm-backdrop";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "globalConfirmTitle");
    modal.innerHTML = `
      <div class="modal-card global-confirm-card" role="document">
        <div class="global-confirm-glow" aria-hidden="true"></div>
        <div class="global-confirm-icon" aria-hidden="true">
          <span class="logout-door-icon"><i></i><b>→</b></span>
        </div>
        <div class="global-confirm-copy">
          <span class="global-confirm-kicker" id="globalConfirmKicker">${escapeHTML(tr("securityKicker"))}</span>
          <h3 id="globalConfirmTitle">${escapeHTML(tr("logoutConfirmTitle"))}</h3>
          <p id="globalConfirmMessage">${escapeHTML(tr("logoutConfirmText"))}</p>
        </div>
        <div class="global-confirm-actions">
          <button id="globalConfirmCancel" class="secondary-button confirm-cancel-button" type="button">${escapeHTML(tr("cancel"))}</button>
          <button id="globalConfirmAccept" class="danger-button confirm-logout-button" type="button">
            <span class="confirm-button-label">${escapeHTML(tr("logout"))}</span>
            <span class="confirm-button-spinner" aria-hidden="true"></span>
          </button>
        </div>
        <div class="logout-progress-track" aria-hidden="true"><span></span></div>
      </div>`;
    document.body.appendChild(modal);
    return modal;
  }

  function confirmDialog({ title, message, confirmText, cancelText, kicker, danger = true, keepOpenOnConfirm = false, context = "custom" } = {}) {
    const modal = ensureGlobalConfirmModal();
    const kickerNode = modal.querySelector("#globalConfirmKicker");
    const titleNode = modal.querySelector("#globalConfirmTitle");
    const messageNode = modal.querySelector("#globalConfirmMessage");
    const accept = modal.querySelector("#globalConfirmAccept");
    const cancel = modal.querySelector("#globalConfirmCancel");
    const label = accept.querySelector(".confirm-button-label");
    kickerNode.textContent = kicker || tr("securityKicker");
    titleNode.textContent = title || tr("confirm");
    messageNode.textContent = message || "";
    modal.dataset.confirmContext = context;
    label.textContent = confirmText || tr("confirm");
    cancel.textContent = cancelText || tr("cancel");
    accept.classList.toggle("danger-button", danger);
    accept.classList.toggle("primary-button", !danger);
    accept.disabled = false;
    cancel.disabled = false;
    modal.classList.remove("logout-processing");
    modal.dataset.locked = "false";

    if (activeConfirmCleanup) activeConfirmCleanup(false);
    openModal(modal.id);

    return new Promise((resolve) => {
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        accept.removeEventListener("click", yes);
        cancel.removeEventListener("click", no);
        modal.removeEventListener("mousedown", backdrop);
        document.removeEventListener("keydown", escapeKey, true);
        activeConfirmCleanup = null;
        if (!value || !keepOpenOnConfirm) closeModal(modal.id);
        resolve(value);
      };
      const yes = () => finish(true);
      const no = () => finish(false);
      const backdrop = (event) => { if (event.target === modal) finish(false); };
      const escapeKey = (event) => { if (event.key === "Escape") { event.preventDefault(); finish(false); } };
      activeConfirmCleanup = finish;
      accept.addEventListener("click", yes);
      cancel.addEventListener("click", no);
      modal.addEventListener("mousedown", backdrop);
      document.addEventListener("keydown", escapeKey, true);
    });
  }

  async function runLogout(sourceButton) {
    if (logoutInProgress) return;
    const context = sourceButton?.dataset.logout || "user";
    const admin = context === "admin";
    const accepted = await confirmDialog({
      title: tr("logoutConfirmTitle"),
      message: admin ? tr("adminLogoutConfirmText") : tr("logoutConfirmText"),
      confirmText: tr("logout"),
      cancelText: tr("cancel"),
      kicker: tr("securityKicker"),
      danger: true,
      keepOpenOnConfirm: true,
      context: admin ? "logout-admin" : "logout-user",
    });
    if (!accepted) return;

    logoutInProgress = true;
    const modal = ensureGlobalConfirmModal();
    const accept = modal.querySelector("#globalConfirmAccept");
    const cancel = modal.querySelector("#globalConfirmCancel");
    const label = accept.querySelector(".confirm-button-label");
    modal.dataset.locked = "true";
    modal.classList.add("logout-processing");
    accept.disabled = true;
    cancel.disabled = true;
    label.textContent = tr("logoutProcessing");
    sourceButton?.classList.add("is-loading");
    sourceButton && (sourceButton.disabled = true);

    try {
      await fetchJSON("/api/logout", { method: "POST" });
    } catch (_) {
      // Phiên phía trình duyệt vẫn được kết thúc bằng việc quay về trang đăng nhập.
    }
    window.setTimeout(() => { window.location.assign("/login"); }, 460);
  }

  document.addEventListener("click", (event) => {
    const logoutButton = event.target.closest("[data-logout]");
    if (!logoutButton) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    runLogout(logoutButton);
  }, true);

  window.addEventListener("languagechange", () => {
    const modal = document.getElementById("globalConfirmModal");
    if (!modal) return;
    const context = modal.dataset.confirmContext || "custom";
    if (context !== "logout-admin" && context !== "logout-user") return;
    modal.querySelector("#globalConfirmKicker").textContent = tr("securityKicker");
    modal.querySelector("#globalConfirmTitle").textContent = tr("logoutConfirmTitle");
    modal.querySelector("#globalConfirmMessage").textContent = context === "logout-admin" ? tr("adminLogoutConfirmText") : tr("logoutConfirmText");
    modal.querySelector("#globalConfirmCancel").textContent = tr("cancel");
    modal.querySelector(".confirm-button-label").textContent = modal.classList.contains("logout-processing") ? tr("logoutProcessing") : tr("logout");
  });


  const GLOBAL_THEME_KEY = "nexchat-theme";
  const themeText = (key, fallback) => {
    const value = window.I18N?.t?.(key);
    return value && value !== key ? value : fallback;
  };
  const ADMIN_THEME_KEY = "nexchat-admin-theme";
  const globalThemeMedia = window.matchMedia("(prefers-color-scheme: dark)");
  function isAdminThemeScope() {
    return document.body?.matches(".admin-page") || /^\/admin(?:\/|$)/.test(window.location.pathname);
  }
  function selectedGlobalTheme() {
    try {
      if (isAdminThemeScope()) return localStorage.getItem(ADMIN_THEME_KEY) || "auto";
      return localStorage.getItem(GLOBAL_THEME_KEY) || localStorage.getItem("nexchat-home-theme") || "auto";
    } catch (_error) {
      return "auto";
    }
  }
  function resolvedGlobalTheme(selected = selectedGlobalTheme()) {
    return selected === "dark" || (selected === "auto" && globalThemeMedia.matches) ? "dark" : "light";
  }
  function applyGlobalTheme(selected = selectedGlobalTheme(), { persist = false } = {}) {
    if (!["auto","light","dark"].includes(selected)) selected = "auto";
    const adminScope = isAdminThemeScope();
    if (persist) {
      try {
        if (adminScope) localStorage.setItem(ADMIN_THEME_KEY, selected);
        else {
          localStorage.setItem(GLOBAL_THEME_KEY, selected);
          localStorage.setItem("nexchat-home-theme", selected);
        }
      } catch (_error) {
        // Giao diện vẫn đổi trong phiên hiện tại nếu bộ nhớ trình duyệt bị chặn.
      }
    }
    const resolved = resolvedGlobalTheme(selected);
    const root = document.documentElement;
    root.dataset.theme = resolved;
    root.dataset.themeMode = selected;
    root.style.colorScheme = resolved;
    if (adminScope) root.dataset.adminTheme = resolved === "dark" ? "cyber" : "aurora";
    else delete root.dataset.adminTheme;
    document.body?.classList.toggle("dark", resolved === "dark");
    document.body?.classList.toggle("light", resolved === "light");
    document.body?.classList.toggle("admin-theme-cyber", adminScope && resolved === "dark");
    document.body?.classList.toggle("admin-theme-aurora", adminScope && resolved === "light");
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute("content", adminScope ? (resolved === "dark" ? "#050816" : "#eef8ff") : (resolved === "dark" ? "#171923" : "#ffffff"));
    document.querySelectorAll("[data-global-theme-choice]").forEach((button) => {
      const active = button.dataset.globalThemeChoice === selected;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const current = document.querySelector("[data-global-theme-current]");
    if (current) {
      const resolvedName = adminScope ? (resolved === "dark" ? "Cyberpunk tối" : "Aurora sáng") : (resolved === "dark" ? themeText("themeDark", "Tối") : themeText("themeLight", "Sáng"));
      const selectedName = selected === "auto" ? `${themeText("themeAuto", "Tự động")} · ${resolvedName}` : resolvedName;
      if (current.classList.contains("auth-theme-toggle")) {
        const nextName = resolved === "dark" ? themeText("themeLight", "Sáng") : themeText("themeDark", "Tối");
        current.innerHTML = `${iconHTML(resolved === "dark" ? "moon" : "sun")}<span>${resolvedName}</span>`;
        current.setAttribute("aria-label", `Chuyển sang giao diện ${nextName.toLowerCase()}`);
        current.setAttribute("aria-pressed", String(resolved === "dark"));
        current.title = `Đang dùng giao diện ${resolvedName.toLowerCase()} · Nhấn để chuyển sang ${nextName.toLowerCase()}`;
      } else {
        current.innerHTML = iconHTML(resolved === "dark" ? "moon" : "sun");
        current.setAttribute("aria-label", `Giao diện ${selectedName}`);
        current.title = `Giao diện: ${selectedName}`;
      }
    }
    window.dispatchEvent(new CustomEvent("nexchat:theme", { detail: { selected, resolved, scope: adminScope ? "admin" : "global" } }));
  }
  function initGlobalTheme() {
    applyGlobalTheme();
    if (document.body.matches(".home-page")) return;
    const body = document.body;
    const adminScope = body.matches(".admin-page");
    const authScope = body.matches(".auth-page");
    const control = document.createElement("div");
    control.className = `global-theme-control${adminScope ? " admin-theme-control" : ""}${authScope ? " auth-theme-control" : ""}`;
    control.innerHTML = authScope
      ? `<button type="button" class="global-theme-button auth-theme-toggle" data-global-theme-current></button>`
      : adminScope
        ? `<button type="button" class="global-theme-button" data-global-theme-current aria-haspopup="true" aria-expanded="false"></button><div class="global-theme-menu admin-theme-menu" role="menu"><span data-theme-copy="adminThemeLabel"></span><button type="button" data-global-theme-choice="auto">${iconHTML("monitor")}<b data-theme-copy="themeAuto"></b><small data-theme-copy="adminThemeAutoDesc"></small></button><button type="button" data-global-theme-choice="light">${iconHTML("sun")}<b data-theme-copy="adminThemeLight"></b><small data-theme-copy="adminThemeLightDesc"></small></button><button type="button" data-global-theme-choice="dark">${iconHTML("moon")}<b data-theme-copy="adminThemeDark"></b><small data-theme-copy="adminThemeDarkDesc"></small></button></div>`
        : `<button type="button" class="global-theme-button" data-global-theme-current aria-haspopup="true" aria-expanded="false"></button><div class="global-theme-menu" role="menu"><span data-theme-copy="themeMenuLabel"></span><button type="button" data-global-theme-choice="auto">${iconHTML("monitor")}<b data-theme-copy="themeAuto"></b><small data-theme-copy="themeAutoDesc"></small></button><button type="button" data-global-theme-choice="light">${iconHTML("sun")}<b data-theme-copy="themeLight"></b><small data-theme-copy="themeLightDesc"></small></button><button type="button" data-global-theme-choice="dark">${iconHTML("moon")}<b data-theme-copy="themeDark"></b><small data-theme-copy="themeDarkDesc"></small></button></div>`;
    const host = body.matches(".app-page,.smart-app-page") ? document.querySelector(".chat-header-actions")
      : adminScope ? document.querySelector(".admin-topbar-tools")
      : body.matches(".support-page") ? document.querySelector(".support-header-actions")
      : body.matches(".auth-page") ? document.querySelector(".auth-card-top")
      : null;
    (host || body).prepend(control);
    const trigger = control.querySelector("[data-global-theme-current]");
    const menu = control.querySelector(".global-theme-menu");

    // Trang đăng nhập chỉ cần một nút chuyển Sáng/Tối trực tiếp. Điều này gọn hơn
    // menu ba lựa chọn và giữ hàng công cụ cân đối với bộ chọn ngôn ngữ duy nhất.
    if (authScope) {
      trigger.addEventListener("click", () => {
        const next = resolvedGlobalTheme() === "dark" ? "light" : "dark";
        applyGlobalTheme(next, { persist: true });
      });
      window.addEventListener("languagechange", () => applyGlobalTheme(selectedGlobalTheme()));
      applyGlobalTheme();
      return;
    }

    const refreshThemeCopy = () => {
      const fallbacks = {themeMenuLabel:"Giao diện",themeAuto:"Tự động",themeAutoDesc:"Theo thiết bị",themeLight:"Sáng",themeLightDesc:"Nền rõ ràng",themeDark:"Tối",themeDarkDesc:"Dịu mắt hơn",adminThemeLabel:"Giao diện Admin",adminThemeAutoDesc:"Theo sáng/tối của thiết bị",adminThemeLight:"Aurora sáng",adminThemeLightDesc:"Kính trong và ánh sáng cao cấp",adminThemeDark:"Cyberpunk tối",adminThemeDarkDesc:"Vũ trụ neon nâng cấp"};
      menu.querySelectorAll("[data-theme-copy]").forEach((node) => { const key=node.dataset.themeCopy; node.textContent=themeText(key,fallbacks[key]||key); });
      menu.setAttribute("aria-label", themeText(adminScope ? "adminThemeLabel" : "themeMenuLabel", adminScope ? "Giao diện Admin" : "Giao diện"));
      applyGlobalTheme(selectedGlobalTheme());
    };
    refreshThemeCopy();
    window.addEventListener("languagechange", refreshThemeCopy);

    // Menu nằm trực tiếp trong body để không bị overflow/transform của header che khuất.
    menu.classList.add("global-theme-menu-portal");
    body.append(menu);

    let closeCleanupTimer = 0;
    const clearCloseCleanup = () => {
      if (!closeCleanupTimer) return;
      clearTimeout(closeCleanupTimer);
      closeCleanupTimer = 0;
    };
    const cleanupClosedMenu = () => {
      if (control.classList.contains("open")) return;
      body.style.removeProperty("--global-theme-menu-reserve");
      menu.style.removeProperty("left");
      menu.style.removeProperty("top");
      menu.style.removeProperty("bottom");
      menu.style.removeProperty("width");
      menu.classList.remove("is-mobile-sheet");
    };

    const positionMenu = ({ force = false } = {}) => {
      if (!force && !control.classList.contains("open")) return;
      const viewportWidth = document.documentElement.clientWidth;
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const triggerRect = trigger.getBoundingClientRect();
      const compact = adminScope ? viewportWidth <= 1024 : viewportWidth <= 640;
      const preferredWidth = adminScope && viewportWidth >= 1200 ? 540 : adminScope ? 286 : 218;
      const width = Math.min(compact ? (adminScope ? 360 : 248) : preferredWidth, viewportWidth - 20);

      menu.classList.toggle("is-mobile-sheet", compact);
      menu.style.width = `${Math.max(190, width)}px`;

      if (compact) {
        menu.style.left = "50%";
        menu.style.top = "auto";
        menu.style.bottom = adminScope ? "10px" : "calc(10px + env(safe-area-inset-bottom))";
        body.style.removeProperty("--global-theme-menu-reserve");
        return;
      }

      menu.style.bottom = "auto";
      menu.style.left = "0px";
      menu.style.top = "0px";
      const measured = menu.getBoundingClientRect();
      const triggerVisible = triggerRect.width > 0 && triggerRect.height > 0;
      let left = triggerVisible ? triggerRect.right - measured.width : viewportWidth - measured.width - 10;
      left = Math.max(10, Math.min(left, viewportWidth - measured.width - 10));
      let top = triggerVisible ? triggerRect.bottom + 10 : 70;
      if (top + measured.height > viewportHeight - 10) {
        top = triggerVisible ? Math.max(10, triggerRect.top - measured.height - 10) : Math.max(10, viewportHeight - measured.height - 10);
      }
      menu.style.left = `${Math.round(left)}px`;
      menu.style.top = `${Math.round(top)}px`;

      body.style.removeProperty("--global-theme-menu-reserve");
      if (adminScope) {
        const header = control.closest(".admin-topbar");
        if (header) {
          const headerRect = header.getBoundingClientRect();
          const menuRect = menu.getBoundingClientRect();
          const reserve = Math.max(0, Math.ceil(menuRect.bottom - headerRect.bottom + 18));
          body.style.setProperty("--global-theme-menu-reserve", `${reserve}px`);
        }
      }
    };

    const setOpen = (open) => {
      const next = Boolean(open);
      clearCloseCleanup();
      trigger.setAttribute("aria-expanded", String(next));
      body.classList.toggle("global-theme-menu-open", next);
      if (next) {
        control.classList.add("open");
        body.style.removeProperty("--global-theme-menu-reserve");
        // Tính đúng vị trí trước rồi hiển thị ngay tại chỗ. Không chạy từ vị trí tạm.
        positionMenu({ force: true });
        menu.classList.add("is-open");
        return;
      }
      control.classList.remove("open");
      menu.classList.remove("is-open");
      closeCleanupTimer = window.setTimeout(cleanupClosedMenu, 0);
    };
    const close = () => setOpen(false);
    trigger.addEventListener("click", (event) => {
      event.stopPropagation();
      setOpen(!control.classList.contains("open"));
    });
    menu.addEventListener("click", (event) => {
      const button = event.target.closest("[data-global-theme-choice]");
      if (!button) return;
      applyGlobalTheme(button.dataset.globalThemeChoice, { persist: true });
      close();
    });
    document.addEventListener("click", (event) => { if (!control.contains(event.target) && !menu.contains(event.target)) close(); });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") close(); });
    window.addEventListener("resize", () => control.classList.contains("open") ? positionMenu() : close(), { passive: true });
    window.visualViewport?.addEventListener("resize", positionMenu, { passive: true });
    document.addEventListener("scroll", () => { if (control.classList.contains("open")) positionMenu(); }, { passive: true, capture: true });
    document.addEventListener("visibilitychange", () => { if (document.hidden) close(); });
    applyGlobalTheme();
  }
  globalThemeMedia.addEventListener?.("change", () => {
    if (selectedGlobalTheme() === "auto") applyGlobalTheme("auto");
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initGlobalTheme, { once: true });
  else initGlobalTheme();


  function initInteriorMotion() {
    const body = document.body;
    if (!body.matches(".smart-app-page,.admin-page,.support-page")) return;
    /* Các lớp nền động toàn trang từng gây repaint liên tục trên cả PC lẫn mobile.
       Giữ nền gradient tĩnh, loại lớp DOM chuyển động mà không ảnh hưởng chức năng. */
    document.querySelector(".interior-motion-layer")?.remove();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initInteriorMotion, { once: true });
  else initInteriorMotion();

  function initGlobalBackToTop() {
    const body = document.body;
    if (body.matches('.home-page,.app-page,.smart-app-page')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'global-back-to-top';
    button.setAttribute('aria-label', 'Cuộn lên đầu trang');
    button.setAttribute('aria-hidden', 'true');
    button.innerHTML = '<span aria-hidden="true">↑</span><b>Đầu trang</b>';
    body.append(button);
    const scrollHost = body.matches('.admin-page') ? document.querySelector('.admin-main') : window;
    if (!scrollHost) return button.remove();
    let frame = 0;
    const sync = () => {
      frame = 0;
      const offset = scrollHost === window ? window.scrollY : scrollHost.scrollTop;
      const viewport = scrollHost === window ? window.innerHeight : scrollHost.clientHeight;
      const visible = offset > Math.max(420, viewport * .65);
      button.classList.toggle('is-visible', visible);
      button.setAttribute('aria-hidden', String(!visible));
      button.tabIndex = visible ? 0 : -1;
    };
    scrollHost.addEventListener('scroll', () => {
      if (!frame) frame = requestAnimationFrame(sync);
    }, { passive: true });
    window.addEventListener('resize', sync, { passive: true });
    button.addEventListener('click', () => {
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || body.classList.contains('performance-lite');
      scrollHost.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    });
    sync();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initGlobalBackToTop, { once: true });
  else initGlobalBackToTop();


  function initAdvancedMotion() {
    const body = document.body;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lowPower = Boolean(navigator.connection?.saveData) || Number(navigator.deviceMemory || 8) <= 4 || Number(navigator.hardwareConcurrency || 8) <= 4 || matchMedia("(pointer:coarse)").matches;
    if (body.matches(".smart-app-page,.admin-page,.support-page")) body.classList.add("performance-optimized");
    let savedPerformanceLite = false;
    try { savedPerformanceLite = sessionStorage.getItem("nexchat-performance-lite") === "1"; } catch {}
    body.classList.toggle("performance-lite", lowPower || savedPerformanceLite);
    requestAnimationFrame(() => body.classList.add("motion-ready"));

    const revealSelector = ".conversation-item,.admin-user-item,.person-card,.request-item,.request-message-card,.badge-granted-user,.effect-granted-user,.session-item,.media-vault-item,.group-member-item";
    function prepareElements(scope = document) {
      const nodes = [];
      if (scope.nodeType === 1 && scope.matches?.(revealSelector)) nodes.push(scope);
      scope.querySelectorAll?.(revealSelector).forEach((node) => nodes.push(node));
      nodes.slice(0, 24).forEach((node, index) => {
        if (node.dataset.motionPrepared) return;
        node.dataset.motionPrepared = "1";
        if (reduce || body.classList.contains("performance-lite")) return;
        node.style.setProperty("--reveal-delay", `${Math.min(index * 18, 120)}ms`);
        node.classList.add("motion-reveal");
        node.addEventListener("animationend", () => node.classList.remove("motion-reveal"), { once: true });
      });
    }
    prepareElements(document);

    /* Tự đo độ mượt một lần. Máy có thông số tốt nhưng trình duyệt/GPU yếu vẫn được
       chuyển sang chế độ nhẹ; chỉ giảm trang trí động, không khóa chức năng. */
    if (!reduce && !body.classList.contains("performance-lite") && body.matches(".smart-app-page,.admin-page,.support-page")) {
      let frames = 0, longFrames = 0, last = performance.now(), started = last;
      const sample = (now) => {
        if (document.hidden) { last = now; started = now; frames = 0; longFrames = 0; return requestAnimationFrame(sample); }
        const delta = now - last; last = now; frames += 1;
        if (delta > 34) longFrames += 1;
        const elapsed = now - started;
        if (elapsed < 2400) return requestAnimationFrame(sample);
        const fps = frames * 1000 / Math.max(elapsed, 1);
        if (fps < 48 || longFrames > frames * .18) {
          body.classList.add("performance-lite");
          try { sessionStorage.setItem("nexchat-performance-lite", "1"); } catch {}
        }
      };
      requestAnimationFrame(sample);
    }

    document.addEventListener("visibilitychange", () => {
      body.classList.toggle("page-inactive", document.hidden);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initAdvancedMotion, { once: true });
  else initAdvancedMotion();

  function initStableTextEntry() {
    const selector = 'input[id]:not([type="password"]):not([type="file"]):not([type="checkbox"]):not([type="radio"]), textarea[id]';
    let snapshot = null;
    let restoreFrame = 0;

    const capture = (control) => {
      if (!control?.matches?.(selector)) return;
      snapshot = {
        id: control.id,
        node: control,
        value: control.value,
        start: typeof control.selectionStart === 'number' ? control.selectionStart : null,
        end: typeof control.selectionEnd === 'number' ? control.selectionEnd : null,
        time: performance.now(),
      };
    };

    document.addEventListener('focusin', (event) => capture(event.target), true);
    document.addEventListener('input', (event) => capture(event.target), true);
    document.addEventListener('compositionstart', (event) => {
      if (event.target?.matches?.('input,textarea')) event.target.dataset.composing = 'true';
      capture(event.target);
    }, true);
    document.addEventListener('compositionend', (event) => {
      if (event.target?.matches?.('input,textarea')) delete event.target.dataset.composing;
      capture(event.target);
    }, true);
    document.addEventListener('selectionchange', () => {
      const active = document.activeElement;
      if (active?.matches?.(selector)) capture(active);
    });

    const observer = new MutationObserver(() => {
      if (!snapshot || snapshot.node.isConnected || performance.now() - snapshot.time > 1200) return;
      if (restoreFrame) return;
      restoreFrame = requestAnimationFrame(() => {
        restoreFrame = 0;
        if (!snapshot || snapshot.node.isConnected) return;
        const replacement = document.getElementById(snapshot.id);
        if (!replacement || !replacement.matches(selector) || replacement.disabled) return;
        const hiddenHost = replacement.closest('.hidden,[aria-hidden="true"]');
        if (hiddenHost) return;
        if (!replacement.value || replacement.value === snapshot.value.slice(0, replacement.maxLength > 0 ? replacement.maxLength : undefined)) {
          replacement.value = replacement.maxLength > 0 ? snapshot.value.slice(0, replacement.maxLength) : snapshot.value;
        }
        replacement.focus({ preventScroll: true });
        if (snapshot.start !== null && typeof replacement.setSelectionRange === 'function') {
          const end = Math.min(snapshot.end ?? snapshot.start, replacement.value.length);
          const start = Math.min(snapshot.start, end);
          try { replacement.setSelectionRange(start, end); } catch (_) {}
        }
        replacement.classList.add('text-entry-restored');
        replacement.addEventListener('animationend', () => replacement.classList.remove('text-entry-restored'), { once: true });
        capture(replacement);
      });
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    window.addEventListener('pagehide', () => observer.disconnect(), { once: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initStableTextEntry, { once: true });
  else initStableTextEntry();

  window.UI = { escapeHTML, fetchJSON, openModal, closeModal, toast, setLoading, formatDate, formatTime, formatBytes, initials, avatarHTML, avatarMeta, profileRank, profileBadgeHTML, badgeRemainingText, setAvatar, setConnectionState, restrictionHTML, autoResize, attachmentHTML, openMediaViewer, closeMediaViewer, openAvatarPreview, avatarPreviewSource, avatarViewerText, showServerAnnouncement, hideServerAnnouncement, syncServerAnnouncementVisibility, bindSystemSocket, loadSystemState, confirmDialog, runLogout, iconHTML, hydrateClassicIcons };
})();

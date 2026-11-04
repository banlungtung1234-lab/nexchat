'use strict';

(() => {
  if (window.NexV10?.version) return;

  const VERSION = '1.0.0';
  // V1.0.0: restore mobile auto-adaptation, reliable touch selection and full control parity.
  const root = document.documentElement;
  const body = document.body;
  const page = body?.classList.contains('admin-page') ? 'admin'
    : body?.classList.contains('app-page') ? 'chat'
      : body?.classList.contains('support-page') ? 'support'
        : body?.classList.contains('auth-page') ? 'login' : 'home';
  const MODES = Object.freeze(['auto', 'cinematic', 'balanced', 'economy', 'static']);
  const STORAGE_PREFIX = 'nexchat-v10-motion';
  const storageBaseKey = `${STORAGE_PREFIX}:${page === 'admin' ? 'admin' : page === 'chat' ? 'chat' : 'public'}`;
  const state = {
    requested: 'auto',
    resolved: 'balanced',
    battery: null,
    observer: null,
    resizeFrame: 0,
    effectObserver: null,
    lastFocused: null,
    closeTimer: 0,
    panelOpen: false,
    panelTrigger: null,
    outsideBound: false,
    detailOpen: false,
    pingTimer: 0,
    pingPending: false,
    networkSample: { ping:0, lastUpdated:0, ok:false },
    scrollLockY: 0,
    scrollLockStyles: null,
    touchControl: null,
    suppressControlClickUntil: 0,
    autoSafetyReason: '',
  };

  const TEXT = {
    vi: {
      motion:'Chuyển động', title:'Chế độ chuyển động V11', subtitle:'Điều phối hiệu ứng theo thiết bị, pin và kết nối mà không thay đổi chức năng hiện có.',
      auto:'Thông minh', autoDesc:'Tự cân bằng theo thiết bị và môi trường.', cinematic:'Sinh động tối đa', cinematicDesc:'Đồ họa nhiều lớp, ánh sáng và chuyển động cao cấp.',
      balanced:'Cân bằng', balancedDesc:'Mượt, rõ và phù hợp sử dụng hằng ngày.', economy:'Tiết kiệm', economyDesc:'Giảm blur, bóng và số lớp chuyển động.', static:'Tĩnh', staticDesc:'Tắt chuyển động trang trí, giữ mọi chức năng.',
      active:'Đang dùng', detected:'Hệ thống chọn', close:'Đóng', device:'Thiết bị', battery:'Pin', network:'Kết nối', reduced:'Ưu tiên giảm chuyển động',
      fullPower:'Hiệu năng tốt', balancedPower:'Cân bằng tốt', constrained:'Cần tiết kiệm', charging:'Đang sạc', onBattery:'Dùng pin', unavailable:'Không có dữ liệu', saveData:'Tiết kiệm dữ liệu', effectReady:'Đặc quyền hiệu ứng đã mở', effectChoose:'Chạm để chọn hiệu ứng bóng chat', effectUsing:'Đang dùng', details:'Chi tiết thiết bị', detailHint:'Chạm để xem chi tiết', livePing:'Ping realtime', lastUpdate:'Cập nhật', exactView:'Thông số trình duyệt cung cấp', cpuThreads:'Luồng CPU', deviceRam:'RAM', screenRes:'Màn hình', viewport:'Khung nhìn', pixelRatio:'Tỉ lệ điểm ảnh', colorDepth:'Độ sâu màu', touchPoints:'Điểm chạm', platform:'Nền tảng', browser:'Trình duyệt', heapUsed:'JS heap dùng', heapLimit:'Giới hạn JS heap', timezone:'Múi giờ', languagePref:'Ngôn ngữ', refreshNow:'Vừa xong', noPing:'Chưa đo ping', availableArea:'Vùng hiển thị', orientation:'Hướng màn hình', connectionType:'Kiểu kết nối', connectionQuality:'Chất lượng mạng', downloadSpeed:'Tốc độ tải', latencyHint:'Độ trễ ước tính', cookieState:'Cookie', doNotTrack:'Không theo dõi', localStorage:'Lưu trữ cục bộ', sessionStorage:'Lưu trữ phiên', model:'Mẫu thiết bị', enabled:'Bật', disabled:'Tắt', yes:'Có', no:'Không', onlineState:'Trạng thái mạng', online:'Trực tuyến', offline:'Ngoại tuyến', unknown:'Không rõ', userAgent:'User Agent đầy đủ', browserBrands:'Nhận diện trình duyệt', systemVersion:'Phiên bản nền tảng', architectureLabel:'Kiến trúc', bitnessLabel:'Độ rộng bit',
    },
    en: {
      motion:'Motion', title:'V11 motion mode', subtitle:'Coordinates effects for the device, battery and connection without changing existing features.',
      auto:'Smart', autoDesc:'Automatically balances the current environment.', cinematic:'Maximum motion', cinematicDesc:'Layered graphics, premium lighting and richer motion.',
      balanced:'Balanced', balancedDesc:'Smooth and clear for everyday use.', economy:'Saver', economyDesc:'Reduces blur, shadows and animated layers.', static:'Still', staticDesc:'Stops decorative motion while keeping every feature.',
      active:'Active', detected:'System selected', close:'Close', device:'Device', battery:'Battery', network:'Network', reduced:'Reduced motion preferred',
      fullPower:'Good performance', balancedPower:'Balanced', constrained:'Resource saving', charging:'Charging', onBattery:'On battery', unavailable:'Unavailable', saveData:'Data saver', effectReady:'Exclusive effects unlocked', effectChoose:'Tap to choose a chat bubble effect', effectUsing:'Using', details:'Device details', detailHint:'Tap to view details', livePing:'Live ping', lastUpdate:'Updated', exactView:'Browser-reported values', cpuThreads:'CPU threads', deviceRam:'RAM', screenRes:'Screen', viewport:'Viewport', pixelRatio:'Pixel ratio', colorDepth:'Color depth', touchPoints:'Touch points', platform:'Platform', browser:'Browser', heapUsed:'JS heap used', heapLimit:'JS heap limit', timezone:'Time zone', languagePref:'Language', refreshNow:'Just now', noPing:'Ping not measured yet', availableArea:'Available area', orientation:'Orientation', connectionType:'Connection type', connectionQuality:'Network quality', downloadSpeed:'Downlink', latencyHint:'Estimated latency', cookieState:'Cookies', doNotTrack:'Do Not Track', localStorage:'Local storage', sessionStorage:'Session storage', model:'Device model', enabled:'Enabled', disabled:'Disabled', yes:'Yes', no:'No', onlineState:'Network state', online:'Online', offline:'Offline', unknown:'Unknown', userAgent:'Full user agent', browserBrands:'Browser identity', systemVersion:'Platform version', architectureLabel:'Architecture', bitnessLabel:'Bitness',
    },
    zh: { motion:'动态',title:'V11 动态模式',subtitle:'根据设备、电量和网络协调效果，不改变现有功能。',auto:'智能',autoDesc:'自动平衡当前环境。',cinematic:'极致动态',cinematicDesc:'多层图形、高级光效和丰富动画。',balanced:'均衡',balancedDesc:'流畅清晰，适合日常使用。',economy:'省电',economyDesc:'减少模糊、阴影和动画层。',static:'静态',staticDesc:'停止装饰动画，保留全部功能。',active:'正在使用',detected:'系统选择',close:'关闭',device:'设备',battery:'电量',network:'网络',reduced:'优先减少动态',fullPower:'性能良好',balancedPower:'均衡良好',constrained:'节省资源',charging:'正在充电',onBattery:'使用电池',unavailable:'暂无数据',saveData:'省流量',effectReady:'专属效果已解锁',effectChoose:'点击选择聊天气泡效果',effectUsing:'使用中',details:'设备详情',detailHint:'点击查看详情',livePing:'实时延迟',lastUpdate:'更新时间',exactView:'浏览器提供的参数',cpuThreads:'CPU 线程',deviceRam:'内存',screenRes:'屏幕',viewport:'视口',pixelRatio:'像素比',colorDepth:'色深',touchPoints:'触控点',platform:'平台',browser:'浏览器',heapUsed:'JS 堆已用',heapLimit:'JS 堆上限',timezone:'时区',languagePref:'语言',refreshNow:'刚刚',noPing:'尚未测量延迟',details:'设备详情',detailHint:'点击查看详情',livePing:'实时延迟',lastUpdate:'更新时间',exactView:'浏览器提供的参数',cpuThreads:'CPU 线程',deviceRam:'内存',screenRes:'屏幕',viewport:'视口',pixelRatio:'像素比',colorDepth:'色深',touchPoints:'触控点',platform:'平台',browser:'浏览器',heapUsed:'JS 堆已用',heapLimit:'JS 堆上限',timezone:'时区',languagePref:'语言',refreshNow:'刚刚',noPing:'尚未测量延迟' },
    ru: { motion:'Движение',title:'Режим движения V11',subtitle:'Настраивает эффекты под устройство, батарею и сеть без изменения функций.',auto:'Умный',autoDesc:'Автоматический баланс среды.',cinematic:'Максимум',cinematicDesc:'Многослойная графика, свет и премиальная анимация.',balanced:'Баланс',balancedDesc:'Плавно и удобно на каждый день.',economy:'Экономия',economyDesc:'Меньше размытия, теней и анимационных слоёв.',static:'Статика',staticDesc:'Отключает декоративное движение, сохраняя функции.',active:'Активно',detected:'Выбрано системой',close:'Закрыть',device:'Устройство',battery:'Батарея',network:'Сеть',reduced:'Предпочтение уменьшенного движения',fullPower:'Хорошая производительность',balancedPower:'Сбалансировано',constrained:'Экономия ресурсов',charging:'Заряжается',onBattery:'От батареи',unavailable:'Нет данных',saveData:'Экономия трафика',effectReady:'Эксклюзивные эффекты открыты',effectChoose:'Выберите эффект пузыря чата',effectUsing:'Используется',details:'Сведения об устройстве',detailHint:'Нажмите, чтобы открыть',livePing:'Пинг в реальном времени',lastUpdate:'Обновлено',exactView:'Данные браузера',cpuThreads:'Потоки CPU',deviceRam:'RAM',screenRes:'Экран',viewport:'Область просмотра',pixelRatio:'Pixel ratio',colorDepth:'Глубина цвета',touchPoints:'Точки касания',platform:'Платформа',browser:'Браузер',heapUsed:'Исп. JS heap',heapLimit:'Лимит JS heap',timezone:'Часовой пояс',languagePref:'Язык',refreshNow:'Только что',noPing:'Пинг ещё не измерен' },
    de: { motion:'Bewegung',title:'V11 Bewegungsmodus',subtitle:'Passt Effekte an Gerät, Akku und Verbindung an, ohne Funktionen zu ändern.',auto:'Intelligent',autoDesc:'Gleicht die aktuelle Umgebung automatisch aus.',cinematic:'Maximal lebendig',cinematicDesc:'Mehrschichtige Grafik, Premium-Licht und starke Bewegung.',balanced:'Ausgeglichen',balancedDesc:'Flüssig und klar für den Alltag.',economy:'Sparsam',economyDesc:'Weniger Unschärfe, Schatten und Animationsschichten.',static:'Statisch',staticDesc:'Stoppt dekorative Bewegung, alle Funktionen bleiben.',active:'Aktiv',detected:'Systemauswahl',close:'Schließen',device:'Gerät',battery:'Akku',network:'Netzwerk',reduced:'Weniger Bewegung bevorzugt',fullPower:'Gute Leistung',balancedPower:'Ausgeglichen',constrained:'Ressourcen sparen',charging:'Wird geladen',onBattery:'Akkubetrieb',unavailable:'Keine Daten',saveData:'Datensparen',effectReady:'Exklusive Effekte freigeschaltet',effectChoose:'Chatblasen-Effekt auswählen',effectUsing:'Aktiv',details:'Gerätedetails',detailHint:'Antippen für Details',livePing:'Live-Ping',lastUpdate:'Aktualisiert',exactView:'Vom Browser gemeldet',cpuThreads:'CPU-Threads',deviceRam:'RAM',screenRes:'Bildschirm',viewport:'Viewport',pixelRatio:'Pixelratio',colorDepth:'Farbtiefe',touchPoints:'Berührungspunkte',platform:'Plattform',browser:'Browser',heapUsed:'JS-Heap genutzt',heapLimit:'JS-Heap Limit',timezone:'Zeitzone',languagePref:'Sprache',refreshNow:'Gerade eben',noPing:'Ping noch nicht gemessen' },
    th: { motion:'การเคลื่อนไหว',title:'โหมดการเคลื่อนไหว V11',subtitle:'ปรับเอฟเฟกต์ตามอุปกรณ์ แบตเตอรี่ และเครือข่าย โดยไม่เปลี่ยนฟังก์ชันเดิม',auto:'อัจฉริยะ',autoDesc:'ปรับสมดุลตามสภาพแวดล้อมอัตโนมัติ',cinematic:'เคลื่อนไหวสูงสุด',cinematicDesc:'กราฟิกหลายชั้น แสงระดับพรีเมียม และภาพเคลื่อนไหวเต็มรูปแบบ',balanced:'สมดุล',balancedDesc:'ลื่นไหลและชัดเจนสำหรับการใช้งานประจำวัน',economy:'ประหยัด',economyDesc:'ลดเบลอ เงา และชั้นภาพเคลื่อนไหว',static:'นิ่ง',staticDesc:'หยุดภาพเคลื่อนไหวตกแต่ง แต่คงทุกฟังก์ชัน',active:'กำลังใช้',detected:'ระบบเลือก',close:'ปิด',device:'อุปกรณ์',battery:'แบตเตอรี่',network:'เครือข่าย',reduced:'ลดการเคลื่อนไหว',fullPower:'ประสิทธิภาพดี',balancedPower:'สมดุลดี',constrained:'ประหยัดทรัพยากร',charging:'กำลังชาร์จ',onBattery:'ใช้แบตเตอรี่',unavailable:'ไม่มีข้อมูล',saveData:'ประหยัดข้อมูล',effectReady:'ปลดล็อกเอฟเฟกต์พิเศษแล้ว',effectChoose:'แตะเพื่อเลือกเอฟเฟกต์บอลลูนแชท',effectUsing:'กำลังใช้',details:'รายละเอียดอุปกรณ์',detailHint:'แตะเพื่อดูรายละเอียด',livePing:'ปิงแบบเรียลไทม์',lastUpdate:'อัปเดต',exactView:'ค่าที่เบราว์เซอร์รายงาน',cpuThreads:'เธรด CPU',deviceRam:'RAM',screenRes:'หน้าจอ',viewport:'พื้นที่แสดงผล',pixelRatio:'อัตราพิกเซล',colorDepth:'ความลึกสี',touchPoints:'จุดสัมผัส',platform:'แพลตฟอร์ม',browser:'เบราว์เซอร์',heapUsed:'JS heap ที่ใช้',heapLimit:'ขีดจำกัด JS heap',timezone:'เขตเวลา',languagePref:'ภาษา',refreshNow:'เมื่อครู่',noPing:'ยังไม่ได้วัดปิง' },
    es: { motion:'Movimiento',title:'Modo de movimiento V11',subtitle:'Coordina efectos según dispositivo, batería y conexión sin cambiar las funciones existentes.',auto:'Inteligente',autoDesc:'Equilibra automáticamente el entorno actual.',cinematic:'Máximo movimiento',cinematicDesc:'Gráficos por capas, iluminación premium y animación avanzada.',balanced:'Equilibrado',balancedDesc:'Fluido y claro para uso diario.',economy:'Ahorro',economyDesc:'Reduce desenfoque, sombras y capas animadas.',static:'Estático',staticDesc:'Detiene el movimiento decorativo y mantiene todas las funciones.',active:'Activo',detected:'Selección del sistema',close:'Cerrar',device:'Dispositivo',battery:'Batería',network:'Red',reduced:'Se prefiere reducir movimiento',fullPower:'Buen rendimiento',balancedPower:'Equilibrado',constrained:'Ahorro de recursos',charging:'Cargando',onBattery:'Con batería',unavailable:'Sin datos',saveData:'Ahorro de datos',effectReady:'Efectos exclusivos desbloqueados',effectChoose:'Toca para elegir un efecto de burbuja',effectUsing:'En uso',details:'Detalles del dispositivo',detailHint:'Toca para ver detalles',livePing:'Ping en vivo',lastUpdate:'Actualizado',exactView:'Valores del navegador',cpuThreads:'Hilos CPU',deviceRam:'RAM',screenRes:'Pantalla',viewport:'Viewport',pixelRatio:'Relación de píxel',colorDepth:'Profundidad de color',touchPoints:'Puntos táctiles',platform:'Plataforma',browser:'Navegador',heapUsed:'JS heap usado',heapLimit:'Límite JS heap',timezone:'Zona horaria',languagePref:'Idioma',refreshNow:'Ahora mismo',noPing:'Aún sin medir ping' },
    fr: { motion:'Mouvement',title:'Mode de mouvement V11',subtitle:'Adapte les effets à l’appareil, la batterie et la connexion sans modifier les fonctions.',auto:'Intelligent',autoDesc:'Équilibre automatiquement l’environnement.',cinematic:'Mouvement maximal',cinematicDesc:'Graphismes multicouches, lumière premium et animation riche.',balanced:'Équilibré',balancedDesc:'Fluide et lisible au quotidien.',economy:'Économie',economyDesc:'Réduit le flou, les ombres et les couches animées.',static:'Statique',staticDesc:'Arrête les animations décoratives tout en gardant les fonctions.',active:'Actif',detected:'Choix du système',close:'Fermer',device:'Appareil',battery:'Batterie',network:'Réseau',reduced:'Mouvement réduit préféré',fullPower:'Bonnes performances',balancedPower:'Équilibré',constrained:'Économie de ressources',charging:'En charge',onBattery:'Sur batterie',unavailable:'Indisponible',saveData:'Économie de données',effectReady:'Effets exclusifs débloqués',effectChoose:'Touchez pour choisir un effet de bulle',effectUsing:'Utilisé',details:'Détails de l’appareil',detailHint:'Touchez pour voir',livePing:'Ping en direct',lastUpdate:'Mis à jour',exactView:'Valeurs fournies par le navigateur',cpuThreads:'Threads CPU',deviceRam:'RAM',screenRes:'Écran',viewport:'Viewport',pixelRatio:'Ratio de pixels',colorDepth:'Profondeur couleur',touchPoints:'Points tactiles',platform:'Plateforme',browser:'Navigateur',heapUsed:'JS heap utilisé',heapLimit:'Limite JS heap',timezone:'Fuseau horaire',languagePref:'Langue',refreshNow:'À l’instant',noPing:'Ping non mesuré',details:'Détails de l’appareil',detailHint:'Touchez pour voir',livePing:'Ping en direct',lastUpdate:'Mis à jour',exactView:'Valeurs fournies par le navigateur',cpuThreads:'Threads CPU',deviceRam:'RAM',screenRes:'Écran',viewport:'Viewport',pixelRatio:'Ratio de pixels',colorDepth:'Profondeur couleur',touchPoints:'Points tactiles',platform:'Plateforme',browser:'Navigateur',heapUsed:'JS heap utilisé',heapLimit:'Limite JS heap',timezone:'Fuseau horaire',languagePref:'Langue',refreshNow:'À l’instant',noPing:'Ping non mesuré' },
    ja: { motion:'モーション',title:'V11 モーションモード',subtitle:'既存機能を変えずに端末、バッテリー、接続に合わせて効果を調整します。',auto:'スマート',autoDesc:'現在の環境に合わせて自動調整します。',cinematic:'最大モーション',cinematicDesc:'多層グラフィック、上質な光、豊かな動き。',balanced:'バランス',balancedDesc:'日常利用に適した滑らかで明瞭な表示。',economy:'省電力',economyDesc:'ぼかし、影、アニメーション層を減らします。',static:'静止',staticDesc:'装飾的な動きを止め、全機能を維持します。',active:'使用中',detected:'システム選択',close:'閉じる',device:'端末',battery:'バッテリー',network:'接続',reduced:'動きを減らす設定',fullPower:'良好な性能',balancedPower:'バランス良好',constrained:'省リソース',charging:'充電中',onBattery:'バッテリー使用',unavailable:'データなし',saveData:'データセーバー',effectReady:'限定エフェクト解放済み',effectChoose:'チャット吹き出し効果を選択',effectUsing:'使用中',details:'端末の詳細',detailHint:'タップして詳細を表示',livePing:'リアルタイム Ping',lastUpdate:'更新',exactView:'ブラウザが提供する値',cpuThreads:'CPU スレッド',deviceRam:'RAM',screenRes:'画面',viewport:'ビューポート',pixelRatio:'ピクセル比',colorDepth:'色深度',touchPoints:'タッチ点数',platform:'プラットフォーム',browser:'ブラウザ',heapUsed:'使用中 JS heap',heapLimit:'JS heap 上限',timezone:'タイムゾーン',languagePref:'言語',refreshNow:'たった今',noPing:'まだ Ping 未計測' },
  };

  function language() {
    const raw = window.I18N?.language || window.I18N?.currentLanguage?.() || root.lang || 'vi';
    const code = String(raw).toLowerCase().replace('_','-').split('-')[0];
    return TEXT[code] ? code : 'en';
  }
  function t(key) { return TEXT[language()]?.[key] || TEXT.en[key] || key; }
  const SCALE_TEXT = {
    vi: {
      scaleKicker:'HIỂN THỊ THÔNG MINH', scaleTitle:'Quy mô giao diện', scaleDesc:'Thu nhỏ hoặc phóng to toàn bộ khung chat ngay trong trung tâm chuyển động, không làm bừa bộn hồ sơ.', scaleNote:'Thiết lập được lưu theo tài khoản và tự áp dụng lại trên thiết bị này.', scaleAuto:'Tự động', scaleAutoDesc:'Cân theo màn hình và thiết bị', scaleCompact:'Nhỏ gọn', scaleCompactDesc:'Hiện nhiều nội dung hơn', scaleBalanced:'Gọn', scaleBalancedDesc:'Rộng rãi nhưng tiết kiệm', scaleStandard:'Tiêu chuẩn', scaleStandardDesc:'Kích thước mặc định', scaleLarge:'Lớn', scaleLargeDesc:'Dễ đọc hơn', scaleXLarge:'Rất lớn', scaleXLargeDesc:'Tối ưu khả năng quan sát', scaleCurrent:'Đang dùng'
    },
    en: {
      scaleKicker:'SMART DISPLAY', scaleTitle:'Interface scale', scaleDesc:'Resize the full chat workspace right inside the motion center so the profile page stays clean.', scaleNote:'This setting is saved per account and is automatically restored on this device.', scaleAuto:'Auto', scaleAutoDesc:'Matches the screen and device', scaleCompact:'Compact', scaleCompactDesc:'Shows more content', scaleBalanced:'Tight', scaleBalancedDesc:'Roomy but efficient', scaleStandard:'Standard', scaleStandardDesc:'Default size', scaleLarge:'Large', scaleLargeDesc:'Easier to read', scaleXLarge:'Extra large', scaleXLargeDesc:'Maximum readability', scaleCurrent:'Current'
    }
  };
  const SCALE_CHOICES = [
    { value:'auto', labelKey:'scaleAuto', descKey:'scaleAutoDesc', short:'Auto' },
    { value:'0.85', labelKey:'scaleCompact', descKey:'scaleCompactDesc', short:'85%' },
    { value:'0.95', labelKey:'scaleBalanced', descKey:'scaleBalancedDesc', short:'95%' },
    { value:'1', labelKey:'scaleStandard', descKey:'scaleStandardDesc', short:'100%' },
    { value:'1.1', labelKey:'scaleLarge', descKey:'scaleLargeDesc', short:'110%' },
    { value:'1.2', labelKey:'scaleXLarge', descKey:'scaleXLargeDesc', short:'120%' },
  ];
  function st(key){ const code = language(); return SCALE_TEXT[code]?.[key] || SCALE_TEXT.en[key] || key; }
  function currentInterfaceScale(){
    const select = document.getElementById('interfaceScale');
    const current = String(select?.value || body?.dataset?.interfaceScale || safeGet('nexchat-interface-scale','auto'));
    return SCALE_CHOICES.some((item)=>item.value===current) ? current : 'auto';
  }
  function interfaceScaleSummary(value = currentInterfaceScale()){
    const item = SCALE_CHOICES.find((entry)=>entry.value===value) || SCALE_CHOICES[0];
    return { label: st(item.labelKey), desc: st(item.descKey), short: item.short };
  }
  function applyStandaloneInterfaceScale(next){
    const viewportWidth=Math.round(window.visualViewport?.width||window.innerWidth||document.documentElement.clientWidth||0);
    const mobileSafe=viewportWidth<=1024||window.matchMedia?.('(pointer: coarse) and (max-width: 1366px)')?.matches===true;
    const requestedResolved=Math.min(1.2,Math.max(.85,next==='auto'?(viewportWidth>=2200?1.08:viewportWidth>=1800?1.04:1):Number(next)||1));
    const resolved=mobileSafe?1:requestedResolved;
    const shell=document.querySelector('.app-shell.smart-shell');
    const root=document.documentElement;
    safeSet('nexchat-interface-scale',next);
    root.classList.remove('native-ui-zoom');
    root.classList.add('transform-ui-scale','interface-scale-transform-engine');
    root.style.setProperty('--ui-scale',String(resolved));
    root.style.setProperty('--ui-scale-inverse',String(1/resolved));
    root.dataset.interfaceScaleResolved=String(resolved);
    root.dataset.interfaceScaleRequested=String(requestedResolved);
    root.dataset.mobileScaleSafe=mobileSafe?'true':'false';
    document.body?.setAttribute('data-interface-scale',next);
    document.body?.setAttribute('data-interface-scale-resolved',String(resolved));
    document.body?.setAttribute('data-mobile-scale-safe',mobileSafe?'true':'false');
    if(shell){
      if(mobileSafe){
        shell.style.setProperty('position','fixed','important');
        shell.style.setProperty('inset','0','important');
        shell.style.setProperty('width','100vw','important');
        shell.style.setProperty('height','var(--mobile-app-height, 100dvh)','important');
        shell.style.setProperty('min-height','0','important');
        shell.style.setProperty('max-width','100vw','important');
        shell.style.setProperty('max-height','var(--mobile-app-height, 100dvh)','important');
        shell.style.setProperty('zoom','1','important');
        shell.style.setProperty('transform','none','important');
        shell.style.setProperty('will-change','auto','important');
      }else{
        const inverse=1/resolved;
        shell.style.setProperty('position','absolute','important');
        shell.style.setProperty('inset','0 auto auto 0','important');
        shell.style.setProperty('width',`${inverse*100}vw`,'important');
        shell.style.setProperty('height',`calc(var(--app-available-height, 100dvh) * ${inverse})`,'important');
        shell.style.setProperty('min-height',`calc(var(--app-available-height, 100dvh) * ${inverse})`,'important');
        shell.style.setProperty('max-width','none','important');
        shell.style.setProperty('max-height','none','important');
        shell.style.setProperty('zoom','1','important');
        shell.style.setProperty('transform',`scale(${resolved})`,'important');
        shell.style.setProperty('transform-origin','0 0','important');
      }
      shell.dataset.interfaceScaleApplied=next;
      shell.dataset.mobileScaleSafe=mobileSafe?'true':'false';
    }
    const detail={value:next,resolved,requestedResolved,mobileSafe,source:'v10-motion-fallback'};
    document.dispatchEvent(new CustomEvent('nexchat:interface-scale-applied',{detail}));
    window.dispatchEvent(new CustomEvent('nexchat:interface-scale-applied',{detail}));
  }
  function setInterfaceScale(value){
    const next = SCALE_CHOICES.some((item)=>item.value===String(value)) ? String(value) : 'auto';
    const select = document.getElementById('interfaceScale');
    if(select && select.value !== next) select.value = next;
    if(window.NexInterfaceScale?.save){
      Promise.resolve(window.NexInterfaceScale.save(next,{notify:true})).catch(()=>applyStandaloneInterfaceScale(next));
    }else{
      applyStandaloneInterfaceScale(next);
      if(select) select.dispatchEvent(new Event('change', { bubbles:true }));
    }
    requestAnimationFrame(renderPanel);
  }
  function safeGet(key, fallback = '') { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } }
  function safeSet(key, value) { try { localStorage.setItem(key, value); } catch {} }
  function isMobileEnvironment() {
    if (root.dataset.mobileUi === 'true' || body?.classList.contains('mobile-ui-active')) return true;
    const viewportWidth = Math.round(window.visualViewport?.width || window.innerWidth || root.clientWidth || 0);
    return viewportWidth <= 1024 || matchMedia('(pointer: coarse) and (max-width: 1366px)').matches;
  }
  function modeStorageKey() {
    return `${storageBaseKey}:${isMobileEnvironment() ? 'mobile' : 'desktop'}`;
  }
  function requestedMode() {
    const scopedKey = modeStorageKey();
    let value = safeGet(scopedKey, '');
    if (!value) {
      // Mobile starts safely in Smart mode instead of inheriting a heavy desktop choice.
      value = isMobileEnvironment() ? 'auto' : safeGet(storageBaseKey, 'auto');
      safeSet(scopedKey, value);
    }
    return MODES.includes(value) ? value : 'auto';
  }
  function connectionProfile() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return {
      saveData: connection?.saveData === true,
      transport: String(connection?.type || ''),
      effectiveType: String(connection?.effectiveType || ''),
      type: String(connection?.effectiveType || ''),
      downlink: Number(connection?.downlink || 0),
      rtt: Number(connection?.rtt || 0),
    };
  }
  function deviceProfile() {
    const memory = Number(navigator.deviceMemory || 0);
    const cores = Number(navigator.hardwareConcurrency || 0);
    const connection = connectionProfile();
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobile = isMobileEnvironment();
    const runtimeQuality = String(root.dataset.runtimeQuality || window.NexRuntime?.runtimeQuality || '');
    const performanceTier = String(root.dataset.performance || '');
    const performanceMode = String(root.dataset.performanceMode || 'auto');
    const unknownHardware = memory <= 0 || cores <= 0;
    const lowDevice = (memory > 0 && memory <= 3)
      || (cores > 0 && cores <= 3)
      || runtimeQuality === 'limited'
      || performanceTier === 'economy'
      || performanceMode === 'economy';
    const mediumDevice = lowDevice
      || (memory > 0 && memory <= 5)
      || (cores > 0 && cores <= 5)
      || runtimeQuality === 'balanced'
      || (mobile && unknownHardware);
    const slowNetwork = connection.saveData || /(^|-)2g$/.test(connection.type) || connection.type === 'slow-2g';
    const lowBattery = Boolean(state.battery && !state.battery.charging && state.battery.level <= 0.22);
    return { memory, cores, connection, reduced, lowDevice, mediumDevice, slowNetwork, lowBattery, mobile, runtimeQuality, performanceTier, unknownHardware };
  }

  function detailValue(value, fallback = '—') { return value === undefined || value === null || value === '' ? fallback : String(value); }
  function escapeHTML(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
  function formatBytes(bytes) {
    const value = Number(bytes || 0);
    if (!Number.isFinite(value) || value <= 0) return '—';
    const mb = value / 1048576;
    if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
    return `${mb.toFixed(0)} MB`;
  }
  function formatConnectionKind(connection) {
    const transport = String(connection?.type || '').toLowerCase();
    const effective = String(connection?.effectiveType || '').toLowerCase();
    const map = { wifi:'Wi‑Fi', ethernet:'Ethernet', cellular:'Cellular', bluetooth:'Bluetooth', wimax:'WiMAX', none:t('offline'), other:t('unknown') };
    return map[transport] || (effective ? effective.toUpperCase() : t('unknown'));
  }
  function formatEffectiveConnection(connection) {
    const effective = String(connection?.effectiveType || '').toLowerCase();
    return effective ? effective.toUpperCase() : t('unknown');
  }
  function formatOrientation() {
    const type = String(screen?.orientation?.type || '').toLowerCase();
    const angle = Number.isFinite(screen?.orientation?.angle) ? screen.orientation.angle : 0;
    if (!type) return t('unknown');
    const label = type.includes('portrait') ? 'Portrait' : type.includes('landscape') ? 'Landscape' : type;
    return `${label} · ${angle}°`;
  }
  function booleanLabel(value, mode = 'enabled') {
    const yes = mode === 'enabled' ? t('enabled') : t('yes');
    const no = mode === 'enabled' ? t('disabled') : t('no');
    return value ? yes : no;
  }
  function storageAvailable(type) {
    try {
      const storage = window[type];
      if (!storage) return false;
      const key = '__nexchat_storage_probe__';
      storage.setItem(key, '1');
      storage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }
  function relativeStamp(ts) {
    if (!ts) return t('noPing');
    const diff = Math.max(0, Math.round((Date.now() - ts) / 1000));
    if (diff <= 1) return t('refreshNow');
    return `${diff}s`;
  }
  async function sampleNetworkPing(force = false) {
    if (state.pingPending) return state.networkSample;
    if (navigator.onLine === false && !force) {
      state.networkSample = { ping:0, lastUpdated:Date.now(), ok:false };
      if (state.panelOpen) renderPanel();
      return state.networkSample;
    }
    state.pingPending = true;
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timeout = controller ? setTimeout(() => controller.abort(), 3500) : 0;
    const url = new URL(location.pathname || '/', location.origin);
    url.searchParams.set('nex_ping', String(Date.now()));
    const started = performance.now();
    try {
      await fetch(url.toString(), { method:'HEAD', cache:'no-store', credentials:'same-origin', signal: controller?.signal });
      state.networkSample = { ping: Math.max(1, Math.round(performance.now() - started)), lastUpdated: Date.now(), ok:true };
    } catch {
      state.networkSample = { ping:0, lastUpdated: Date.now(), ok:false };
    } finally {
      if (timeout) clearTimeout(timeout);
      state.pingPending = false;
      if (state.panelOpen) renderPanel();
    }
    return state.networkSample;
  }
  function startNetworkPingLoop() {
    if (state.pingTimer) clearInterval(state.pingTimer);
    const refresh = () => { if (!document.hidden) sampleNetworkPing(); };
    refresh();
    state.pingTimer = setInterval(refresh, 4000);
  }
  async function collectDeviceDetails() {
    const uaData = navigator.userAgentData;
    let high = {};
    if (uaData?.getHighEntropyValues) {
      try { high = await uaData.getHighEntropyValues(['architecture','bitness','model','platformVersion','uaFullVersion']); } catch {}
    }
    const memory = performance.memory || {};
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection || {};
    const brands = Array.isArray(uaData?.brands) ? uaData.brands.map((item) => `${item.brand} ${item.version}`).join(', ') : '';
    const userAgent = navigator.userAgent || '';
    return {
      cores: navigator.hardwareConcurrency || 0,
      ram: navigator.deviceMemory || 0,
      screen: `${Math.round(screen?.width || innerWidth || 0)} × ${Math.round(screen?.height || innerHeight || 0)}`,
      screenAvail: `${Math.round(screen?.availWidth || screen?.width || innerWidth || 0)} × ${Math.round(screen?.availHeight || screen?.height || innerHeight || 0)}`,
      viewport: `${Math.round(innerWidth || 0)} × ${Math.round(innerHeight || 0)}`,
      pixelRatio: Number(window.devicePixelRatio || 1).toFixed(2).replace(/\.00$/, ''),
      colorDepth: screen?.colorDepth ? `${screen.colorDepth}-bit` : '—',
      orientation: formatOrientation(),
      touchPoints: navigator.maxTouchPoints || 0,
      platform: uaData?.platform || navigator.platform || '—',
      platformVersion: high.platformVersion || '',
      browser: brands || userAgent || '—',
      brands: brands || '—',
      userAgent: userAgent || '—',
      heapUsed: formatBytes(memory.usedJSHeapSize),
      heapLimit: formatBytes(memory.jsHeapSizeLimit),
      timezone: Intl.DateTimeFormat?.().resolvedOptions?.().timeZone || '—',
      language: navigator.language || root.lang || '—',
      architecture: high.architecture || '',
      bitness: high.bitness || '',
      model: high.model || '—',
      online: navigator.onLine !== false,
      connectionType: formatConnectionKind(connection),
      effectiveType: formatEffectiveConnection(connection),
      downlink: connection?.downlink ? `${String(connection.downlink).replace(/\.0$/, '')} Mbps` : '—',
      rtt: connection?.rtt ? `${connection.rtt} ms` : '—',
      saveData: !!connection?.saveData,
      cookiesEnabled: !!navigator.cookieEnabled,
      doNotTrack: !['0', 'unspecified', ''].includes(String(navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack || '').toLowerCase()),
      localStorage: storageAvailable('localStorage'),
      sessionStorage: storageAvailable('sessionStorage'),
    };
  }
  async function renderDeviceDetail() {
    const backdrop = document.getElementById('v10MotionBackdrop');
    const panel = backdrop?.querySelector('.v10-device-detail');
    if (!panel) return;
    const grid = panel.querySelector('.v10-device-detail-grid');
    const title = panel.querySelector('[data-v10-detail-title]');
    const kicker = panel.querySelector('[data-v10-detail-kicker]');
    if (title) title.textContent = t('details');
    if (kicker) kicker.textContent = t('exactView');
    if (!state.detailOpen) {
      panel.classList.add('hidden');
      panel.setAttribute('aria-hidden', 'true');
      return;
    }
    panel.classList.remove('hidden');
    panel.setAttribute('aria-hidden', 'false');
    if (!grid) return;
    grid.innerHTML = '<div class="v10-device-detail-loading">…</div>';
    const info = await collectDeviceDetails();
    const platformText = `${info.platform}${info.platformVersion ? ` ${info.platformVersion}` : ''}`.trim() || '—';
    const platformMeta = [
      info.architecture ? `${t('architectureLabel')}: ${info.architecture}` : '',
      info.bitness ? `${t('bitnessLabel')}: ${info.bitness}-bit` : '',
    ].filter(Boolean).join(' · ');
    const browserText = detailValue(info.browser);
    const pair = (label, value, options = {}) => {
      const wrap = !!options.wrap;
      const span = Number(options.span || 1);
      const className = `${wrap ? 'is-wrap ' : ''}${span > 1 ? `is-span-${span}` : ''}`.trim();
      const title = escapeHTML(String(value ?? '—'));
      return `<div class="v10-detail-pair ${span > 1 ? `is-span-${span}` : ''}"><small>${escapeHTML(label)}</small><b class="${className}" title="${title}">${title}</b></div>`;
    };
    const full = (label, value, extraClass = '') => {
      const safe = escapeHTML(String(value ?? '—'));
      return `<div class="v10-detail-full ${extraClass}"><small>${escapeHTML(label)}</small><p title="${safe}">${safe}</p></div>`;
    };
    const card = (label, value, inner = '', extraClass = '') => {
      const safe = escapeHTML(String(value ?? '—'));
      const wrap = /is-wrap|is-browser|is-hero/.test(extraClass);
      return `<article class="v10-detail-card ${extraClass}`.trim() + `"><small>${escapeHTML(label)}</small><strong title="${safe}" class="${wrap ? 'is-wrap' : ''}">${safe}</strong>${inner}</article>`;
    };
    grid.innerHTML = [
      card(t('screenRes'), info.screen, `<div class="v10-detail-pairs">${pair(t('availableArea'), info.screenAvail)}${pair(t('viewport'), info.viewport)}${pair(t('pixelRatio'), info.pixelRatio)}${pair(t('colorDepth'), info.colorDepth)}${pair(t('orientation'), info.orientation, {wrap:true})}${pair(t('touchPoints'), detailValue(info.touchPoints))}</div>`, 'is-hero'),
      card(`${t('cpuThreads')} · ${t('deviceRam')}`, `${detailValue(info.cores || 0)} · ${info.ram ? `${info.ram} GB` : '—'}`, `<div class="v10-detail-pairs">${pair(t('heapUsed'), info.heapUsed)}${pair(t('heapLimit'), info.heapLimit)}${pair(t('onlineState'), info.online ? t('online') : t('offline'), {wrap:true})}</div>`),
      card(t('platform'), platformText, `<div class="v10-detail-pairs">${pair(t('systemVersion'), info.platformVersion || '—')}${pair(t('timezone'), info.timezone, {wrap:true})}${pair(t('languagePref'), info.language)}${pair(t('model'), info.model, {wrap:true, span:2})}</div>${platformMeta ? full(t('platform'), platformMeta, 'is-meta') : ''}`, 'is-wide is-wrap'),
      card(t('connectionType'), info.connectionType, `<div class="v10-detail-pairs">${pair(t('connectionQuality'), info.effectiveType)}${pair(t('downloadSpeed'), info.downlink)}${pair(t('latencyHint'), info.rtt)}${pair(t('saveData'), booleanLabel(info.saveData))}</div>`),
      card(t('browser'), browserText, `<div class="v10-detail-pairs is-three">${pair(t('cookieState'), booleanLabel(info.cookiesEnabled))}${pair(t('doNotTrack'), booleanLabel(info.doNotTrack, 'yesno'))}${pair(t('localStorage'), booleanLabel(info.localStorage))}${pair(t('sessionStorage'), booleanLabel(info.sessionStorage))}</div>${info.brands && info.brands !== '—' ? full(t('browserBrands'), info.brands) : ''}${full(t('userAgent'), info.userAgent)}`, 'is-wide is-wrap is-browser'),
    ].join('');
  }
  function toggleDeviceDetail(force) {
    state.detailOpen = typeof force === 'boolean' ? force : !state.detailOpen;
    renderDeviceDetail();
  }

  function resolveMode(requested = requestedMode()) {
    if (requested !== 'auto') {
      state.autoSafetyReason = 'manual';
      return requested;
    }
    const profile = deviceProfile();
    const performance = String(root.dataset.performanceMode || 'auto');
    if (profile.reduced) { state.autoSafetyReason = 'reduced-motion'; return 'static'; }
    if (performance === 'economy' || profile.runtimeQuality === 'limited') { state.autoSafetyReason = 'runtime-limited'; return 'economy'; }
    if (profile.lowBattery) { state.autoSafetyReason = 'low-battery'; return 'economy'; }
    if (profile.slowNetwork) { state.autoSafetyReason = 'slow-network'; return 'economy'; }
    if (profile.lowDevice) { state.autoSafetyReason = 'weak-device'; return 'economy'; }
    if (performance === 'full' && !profile.mediumDevice) { state.autoSafetyReason = 'full-performance'; return 'cinematic'; }
    if (profile.mediumDevice || (profile.mobile && profile.unknownHardware)) { state.autoSafetyReason = 'mobile-balanced'; return 'balanced'; }
    state.autoSafetyReason = 'default';
    return page === 'chat' || page === 'admin' ? 'balanced' : 'cinematic';
  }
  function modeLabel(mode) { return t(mode); }
  function applyMode(mode = requestedMode(), announce = false) {
    const requested = MODES.includes(mode) ? mode : 'auto';
    const resolved = resolveMode(requested);
    state.requested = requested;
    state.resolved = resolved;
    safeSet(modeStorageKey(), requested);
    if (!isMobileEnvironment()) safeSet(storageBaseKey, requested);
    root.dataset.v10Motion = requested;
    root.dataset.v10MotionResolved = resolved;
    root.dataset.v10Experience = 'ready';
    root.dataset.v10AutoSafety = state.autoSafetyReason || 'default';
    root.dataset.v10MobileAdaptive = isMobileEnvironment() ? 'true' : 'false';
    body?.setAttribute('data-v10-motion-requested', requested);
    body?.setAttribute('data-v10-motion-resolved', resolved);
    body?.classList.remove(...MODES.map((item) => `v10-motion-${item}`));
    body?.classList.add(`v10-motion-${resolved}`);
    document.querySelectorAll('[data-v10-motion-choice]').forEach((button) => {
      const active = button.dataset.v10MotionChoice === requested;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    document.querySelectorAll('[data-v10-motion-status]').forEach((node) => {
      node.textContent = requested === 'auto' ? `${modeLabel(requested)} · ${modeLabel(resolved)}` : modeLabel(requested);
    });
    const trigger = document.querySelectorAll('[data-v10-motion-trigger]');
    trigger.forEach((button) => {
      button.dataset.mode = resolved;
      button.setAttribute('aria-label', `${t('motion')}: ${modeLabel(requested)}`);
      const title = button.querySelector('[data-v10-trigger-title]');
      if (title) title.textContent = t('motion');
      const label = button.querySelector('[data-v10-trigger-label]');
      if (label) label.textContent = requested === 'auto' ? modeLabel(resolved) : modeLabel(requested);
    });
    renderPanel();
    document.dispatchEvent(new CustomEvent('nexchat:v10-motion', { detail:{ requested, resolved, page } }));
    if (announce) window.UI?.toast?.(`${t('active')}: ${modeLabel(requested === 'auto' ? resolved : requested)}`, 'success');
  }

  function modeIcon(mode) {
    return ({ auto:'✦', cinematic:'◈', balanced:'◎', economy:'◒', static:'■' })[mode] || '✦';
  }
  function modePerks(mode) {
    const bank = {
      vi: {
        auto:['Tự tối ưu', 'Theo thiết bị', 'Ổn định toàn cục'],
        cinematic:['Sao băng', 'Tinh vân động', 'Nổi khối chiều sâu'],
        balanced:['Mượt ổn định', 'Rõ nội dung', 'Dùng hằng ngày'],
        economy:['Nhẹ máy', 'Bớt blur', 'Giảm lớp động'],
        static:['Không chuyển động', 'Tập trung nội dung', 'Ổn định tuyệt đối'],
      },
      en: {
        auto:['Auto tune', 'Device-aware', 'Global stability'],
        cinematic:['Meteor trails', 'Living nebula', 'Deep layered surfaces'],
        balanced:['Stable smoothness', 'Clear content', 'Daily ready'],
        economy:['Lightweight', 'Less blur', 'Fewer layers'],
        static:['No motion', 'Content first', 'Maximum predictability'],
      }
    };
    const table = bank[language()] || bank.en;
    return table[mode] || [];
  }
  function modeDetail(mode) {
    const bank = {
      vi: {
        auto:'Tự theo dõi hiệu năng, pin và mạng để chọn mức hợp lý nhất theo thời điểm.',
        cinematic:'Mở tối đa lớp ánh sáng, quầng realtime, chiều sâu bề mặt, nhịp xuất hiện tin nhắn và nền vũ trụ; tự tạm dừng khi tab bị ẩn.',
        balanced:'Giữ giao diện sống động nhưng ưu tiên độ ổn định để dùng lâu dài.',
        economy:'Giảm hiệu ứng tốn tài nguyên nhưng vẫn giữ nhận diện và trải nghiệm chính.',
        static:'Dừng toàn bộ chuyển động trang trí để tập trung hoàn toàn vào nội dung.',
      },
      en: {
        auto:'Watches performance, battery and network, then chooses the best mode for the moment.',
        cinematic:'Enables stronger lighting, realtime halos, layered depth, message arrivals and cosmic background while automatically pausing off-screen.',
        balanced:'Keeps the UI lively while prioritizing stability for longer sessions.',
        economy:'Cuts expensive effects while preserving the core visual identity and features.',
        static:'Stops decorative motion completely so content stays the only focus.',
      }
    };
    const table = bank[language()] || bank.en;
    return table[mode] || '';
  }
  function modeIntensity(mode) {
    const bank = {
      vi: { auto:'Tự thích ứng', cinematic:'6 lớp nâng cấp', balanced:'Tối ưu hằng ngày', economy:'Ưu tiên hiệu năng', static:'Không trang trí động' },
      en: { auto:'Adaptive', cinematic:'6 upgraded layers', balanced:'Daily ready', economy:'Performance first', static:'No decorative motion' }
    };
    const table = bank[language()] || bank.en;
    return table[mode] || '';
  }
  function modeLevel(mode) {
    const resolved = mode === 'auto' ? state.resolved : mode;
    return ({ static:1, economy:2, balanced:3, cinematic:5 })[resolved] || 3;
  }
  function modeBadge(mode) {
    const bank = {
      vi: { auto:'Khuyên dùng', cinematic:'Tối đa', balanced:'Ổn định', economy:'Nhẹ máy', static:'Tập trung' },
      en: { auto:'Recommended', cinematic:'Maximum', balanced:'Stable', economy:'Lightweight', static:'Focused' }
    };
    const table = bank[language()] || bank.en;
    return table[mode] || '';
  }
  function modeVisualLabel(mode) {
    const bank = {
      vi: { auto:'Tự động điều phối', cinematic:'Không gian sống động', balanced:'Mượt và rõ', economy:'Hiệu năng ưu tiên', static:'Tĩnh hoàn toàn' },
      en: { auto:'Adaptive orchestration', cinematic:'Living visual space', balanced:'Smooth and clear', economy:'Performance first', static:'Fully still' }
    };
    const table = bank[language()] || bank.en;
    return table[mode] || modeIntensity(mode);
  }
  function activatePanelControl(control, source = 'click') {
    if (!(control instanceof Element)) return false;
    const modeChoice = control.closest('[data-v10-panel-choice]');
    if (modeChoice) {
      const nextMode = modeChoice.dataset.v10PanelChoice;
      if (!MODES.includes(nextMode)) return false;
      applyMode(nextMode, true);
      requestAnimationFrame(() => document.getElementById('v10MotionBackdrop')?.querySelector(`[data-v10-panel-choice="${nextMode}"]`)?.focus({ preventScroll:true }));
      document.dispatchEvent(new CustomEvent('nexchat:mobile-motion-selected', { detail:{ mode:nextMode, resolved:state.resolved, source } }));
      return true;
    }
    const scaleChoice = control.closest('[data-v10-scale-choice]');
    if (scaleChoice) {
      const nextScale = scaleChoice.dataset.v10ScaleChoice;
      setInterfaceScale(nextScale);
      requestAnimationFrame(() => document.getElementById('v10MotionBackdrop')?.querySelector(`[data-v10-scale-choice="${nextScale}"]`)?.focus({ preventScroll:true }));
      return true;
    }
    return false;
  }

  function panelElement() {
    let backdrop = document.getElementById('v10MotionBackdrop');
    if (backdrop) return backdrop;
    backdrop = document.createElement('div');
    backdrop.id = 'v10MotionBackdrop';
    backdrop.className = 'v10-motion-backdrop hidden';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'false');
    backdrop.setAttribute('aria-hidden', 'true');
    backdrop.setAttribute('aria-labelledby', 'v10MotionTitle');
    backdrop.innerHTML = `<section class="v10-motion-panel">
      <header class="v10-motion-panel-head">
        <div class="v10-motion-panel-mark" aria-hidden="true"><i></i><b>11</b></div>
        <div class="v10-motion-panel-heading"><small>NEXCHAT EXPERIENCE ENGINE</small><h2 id="v10MotionTitle"></h2><p data-v10-copy="subtitle"></p></div>
        <button type="button" class="v10-motion-close" data-v10-motion-close aria-label="Close"><span aria-hidden="true">×</span></button>
      </header>
      <div class="v10-motion-scroll">
        <section class="v10-motion-summary" aria-live="polite">
          <div class="v10-motion-preview" aria-hidden="true"><span></span><i></i><b></b><em></em></div>
          <div class="v10-motion-summary-copy"><small data-v10-summary-kicker></small><strong data-v10-summary-mode></strong><p data-v10-summary-detail></p><div class="v10-motion-level" aria-hidden="true"></div></div>
        </section>
        <div class="v10-motion-diagnostics" aria-live="polite"></div>
        <section class="v10-motion-selection">
          <div class="v10-motion-selection-head"><div><small data-v10-selection-kicker></small><strong data-v10-selection-title></strong></div><span data-v10-current-request></span></div>
          <div class="v10-motion-options" role="radiogroup" aria-labelledby="v10MotionTitle"></div>
        </section>
        <section class="v10-motion-scale" aria-live="polite">
          <div class="v10-motion-scale-head"><div><small data-v10-scale-kicker></small><strong data-v10-scale-title></strong><p data-v10-scale-desc></p></div><span class="v10-motion-scale-current"></span></div>
          <div class="v10-motion-scale-options" role="listbox" aria-label="Interface scale"></div>
          <p class="v10-motion-scale-note"></p>
        </section>
        <section class="v10-device-detail hidden" aria-hidden="true"><div class="v10-device-detail-head"><div><small data-v10-detail-kicker></small><strong data-v10-detail-title></strong></div><button type="button" class="v10-motion-close v10-device-detail-close" data-v10-detail-close aria-label="Close"><span aria-hidden="true">×</span></button></div><div class="v10-device-detail-grid"></div></section>
      </div>
      <footer><span class="v10-motion-live"><i></i><b></b></span><button type="button" class="secondary-button" data-v10-motion-close></button></footer>
    </section>`;
    body.append(backdrop);
    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop) { closePanel(); return; }
      if (event.target.closest('[data-v10-detail-close]')) { toggleDeviceDetail(false); return; }
      const diagnostic = event.target.closest('[data-v10-diagnostic]');
      if (diagnostic?.dataset.v10Diagnostic === 'device') { toggleDeviceDetail(); return; }
      if (event.target.closest('[data-v10-motion-close]')) { closePanel(); return; }
      const selectable = event.target.closest('[data-v10-panel-choice],[data-v10-scale-choice]');
      if (selectable) {
        if (performance.now() < state.suppressControlClickUntil) { event.preventDefault(); return; }
        activatePanelControl(selectable, 'click');
      }
    });
    backdrop.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse') return;
      const control = event.target.closest?.('[data-v10-panel-choice],[data-v10-scale-choice]');
      if (!control) return;
      state.touchControl = { pointerId:event.pointerId, control, x:event.clientX, y:event.clientY, moved:false };
      control.setPointerCapture?.(event.pointerId);
    }, { passive:true });
    backdrop.addEventListener('pointermove', (event) => {
      const touch = state.touchControl;
      if (!touch || touch.pointerId !== event.pointerId) return;
      if (Math.abs(event.clientX - touch.x) > 12 || Math.abs(event.clientY - touch.y) > 12) touch.moved = true;
    }, { passive:true });
    backdrop.addEventListener('pointerup', (event) => {
      const touch = state.touchControl;
      state.touchControl = null;
      if (!touch || touch.pointerId !== event.pointerId || touch.moved || !touch.control?.isConnected) return;
      event.preventDefault();
      event.stopPropagation();
      state.suppressControlClickUntil = performance.now() + 650;
      activatePanelControl(touch.control, 'touch');
    });
    backdrop.addEventListener('pointercancel', () => { state.touchControl = null; }, { passive:true });
    backdrop.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') { event.preventDefault(); closePanel(); return; }
      const activeDiagnostic = event.target.closest?.('[data-v10-diagnostic="device"]');
      if (activeDiagnostic && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); toggleDeviceDetail(); return; }
      const activeChoice = event.target.closest?.('[data-v10-panel-choice]');
      if (activeChoice && ['ArrowDown','ArrowRight','ArrowUp','ArrowLeft','Home','End'].includes(event.key)) {
        const choices = [...backdrop.querySelectorAll('[data-v10-panel-choice]')];
        const current = choices.indexOf(activeChoice);
        if (current >= 0) {
          event.preventDefault();
          let next = current;
          if (event.key === 'Home') next = 0;
          else if (event.key === 'End') next = choices.length - 1;
          else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (current + 1) % choices.length;
          else next = (current - 1 + choices.length) % choices.length;
          choices[next]?.focus({ preventScroll:true });
          choices[next]?.scrollIntoView({ block:'nearest', behavior:'smooth' });
        }
        return;
      }
      const activeScaleChoice = event.target.closest?.('[data-v10-scale-choice]');
      if (activeScaleChoice && ['ArrowDown','ArrowRight','ArrowUp','ArrowLeft','Home','End','Enter',' '].includes(event.key)) {
        const choices = [...backdrop.querySelectorAll('[data-v10-scale-choice]')];
        const current = choices.indexOf(activeScaleChoice);
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setInterfaceScale(activeScaleChoice.dataset.v10ScaleChoice);
          return;
        }
        if (current >= 0) {
          event.preventDefault();
          let next = current;
          if (event.key === 'Home') next = 0;
          else if (event.key === 'End') next = choices.length - 1;
          else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (current + 1) % choices.length;
          else next = (current - 1 + choices.length) % choices.length;
          choices[next]?.focus({ preventScroll:true });
          choices[next]?.scrollIntoView({ block:'nearest', behavior:'smooth' });
        }
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = [...backdrop.querySelectorAll('button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')]
        .filter((node) => node.getClientRects().length && node.getAttribute('aria-hidden') !== 'true');
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    return backdrop;
  }

// legacy verify markers: CPU ${profile.cores}T · RAM ~${profile.memory}GB
  function diagnosticsHTML() {
    const profile = deviceProfile();
    const strongDevice = (profile.memory >= 8 || profile.memory === 0) && (profile.cores >= 8 || profile.cores === 0) && !profile.lowDevice;
    const deviceValue = profile.lowDevice ? t('constrained') : strongDevice ? t('fullPower') : t('balancedPower');
    const screenWidth = Math.max(Number(screen?.width || 0), Number(innerWidth || 0));
    const screenHeight = Math.max(Number(screen?.height || 0), Number(innerHeight || 0));
    const memoryValue = profile.memory > 0 ? `RAM ${profile.memory}GB` : 'RAM —';
    const coreValue = profile.cores > 0 ? `CPU ${profile.cores}T` : 'CPU —';
    const displayValue = screenWidth && screenHeight ? `${Math.round(screenWidth)}×${Math.round(screenHeight)}` : '';
    const deviceMeta = [coreValue, memoryValue, displayValue].filter(Boolean).join(' · ');

    const batteryPercent = state.battery ? Math.round(state.battery.level * 100) : null;
    const batteryValue = batteryPercent === null ? '—' : `${batteryPercent}%${state.battery.charging ? ' · ⚡' : ''}`;
    const batteryMeta = batteryPercent === null ? t('unavailable') : state.battery.charging ? t('charging') : t('onBattery');

    const connection = profile.connection;
    const info = window.NexPolish?.connectionInfo?.() || {};
    const pingValue = state.networkSample.ping > 0 ? `${state.networkSample.ping} ms` : connection.rtt > 0 ? `${Math.round(connection.rtt)} ms` : '—';
    const networkValue = `${info.label || (navigator.onLine ? 'Online' : 'Offline')} · ${pingValue}`;
    const networkBits = [];
    if (connection.effectiveType) networkBits.push(connection.effectiveType.toUpperCase());
    else if (connection.transport) networkBits.push(connection.transport.toUpperCase());
    if (connection.downlink > 0) networkBits.push(`${connection.downlink >= 10 ? connection.downlink.toFixed(0) : connection.downlink.toFixed(1)} Mbps`);
    networkBits.push(`${t('livePing')}: ${pingValue}`);
    networkBits.push(`${t('lastUpdate')}: ${relativeStamp(state.networkSample.lastUpdated)}`);
    if (connection.saveData) networkBits.push(t('saveData'));
    const networkMeta = networkBits.join(' · ');

    const deviceState = profile.lowDevice ? 'warning' : 'good';
    const batteryState = batteryPercent !== null && batteryPercent <= 22 && !state.battery?.charging ? 'warning' : state.battery?.charging ? 'good' : 'neutral';
    const networkState = navigator.onLine ? (profile.slowNetwork ? 'warning' : 'good') : 'warning';
    const card = (kind, stateName, icon, label, value, meta, extra = '') => `<article class="v10-diagnostic-card diagnostic-${kind}" data-state="${stateName}" ${extra} title="${String(`${label}: ${value}. ${meta}`).replaceAll('"','&quot;')}"><i aria-hidden="true">${icon}</i><span><small>${label}</small><b>${value}</b><em>${meta}</em></span></article>`;
    return `${card('device',deviceState,'▣',t('device'),deviceValue,deviceMeta,`data-v10-diagnostic="device" role="button" tabindex="0" aria-expanded="${state.detailOpen ? 'true' : 'false'}" aria-label="${t('details')}"`)}${card('battery',batteryState,'◒',t('battery'),batteryValue,batteryMeta)}${card('network',networkState,'⌁',t('network'),networkValue,networkMeta,`data-v10-diagnostic="network"`)}${profile.reduced ? `<article class="is-warning" data-state="warning"><i aria-hidden="true">◌</i><span><small>${t('motion')}</small><b>${t('reduced')}</b><em>${modeLabel('static')}</em></span></article>` : ''}`;
  }
  function renderPanel() {
    const backdrop = document.getElementById('v10MotionBackdrop');
    if (!backdrop) return;
    const title = backdrop.querySelector('#v10MotionTitle');
    if (title) title.textContent = t('title');
    const subtitle = backdrop.querySelector('[data-v10-copy="subtitle"]');
    if (subtitle) subtitle.textContent = t('subtitle');
    const effective = state.requested === 'auto' ? state.resolved : state.requested;
    backdrop.dataset.previewMode = effective;
    const summaryKicker = backdrop.querySelector('[data-v10-summary-kicker]');
    if (summaryKicker) summaryKicker.textContent = `${t('active')} · ${modeVisualLabel(effective)}`;
    const summaryMode = backdrop.querySelector('[data-v10-summary-mode]');
    if (summaryMode) summaryMode.textContent = modeLabel(effective);
    const summaryDetail = backdrop.querySelector('[data-v10-summary-detail]');
    if (summaryDetail) summaryDetail.textContent = modeDetail(effective);
    const level = backdrop.querySelector('.v10-motion-level');
    if (level) {
      const currentLevel = modeLevel(effective);
      level.innerHTML = Array.from({ length:5 }, (_, index) => `<i class="${index < currentLevel ? 'is-on' : ''}"></i>`).join('') + `<span>${modeIntensity(effective)}</span>`;
    }
    const selectionKicker = backdrop.querySelector('[data-v10-selection-kicker]');
    if (selectionKicker) selectionKicker.textContent = 'NEXCHAT MOTION PROFILE';
    const selectionTitle = backdrop.querySelector('[data-v10-selection-title]');
    if (selectionTitle) selectionTitle.textContent = t('motion');
    const currentRequest = backdrop.querySelector('[data-v10-current-request]');
    if (currentRequest) currentRequest.textContent = state.requested === 'auto' ? `${modeLabel('auto')} · ${modeLabel(state.resolved)}` : modeLabel(state.requested);
    const diagnostics = backdrop.querySelector('.v10-motion-diagnostics');
    if (diagnostics) diagnostics.innerHTML = diagnosticsHTML();
    const scaleKicker = backdrop.querySelector('[data-v10-scale-kicker]');
    if (scaleKicker) scaleKicker.textContent = st('scaleKicker');
    const scaleTitle = backdrop.querySelector('[data-v10-scale-title]');
    if (scaleTitle) scaleTitle.textContent = st('scaleTitle');
    const scaleDesc = backdrop.querySelector('[data-v10-scale-desc]');
    if (scaleDesc) scaleDesc.textContent = st('scaleDesc');
    const scaleCurrent = backdrop.querySelector('.v10-motion-scale-current');
    const currentScale = currentInterfaceScale();
    const currentScaleSummary = interfaceScaleSummary(currentScale);
    if (scaleCurrent) scaleCurrent.textContent = `${st('scaleCurrent')}: ${currentScaleSummary.label}`;
    const scaleOptions = backdrop.querySelector('.v10-motion-scale-options');
    if (scaleOptions) scaleOptions.innerHTML = SCALE_CHOICES.map((item)=>{
      const active = item.value === currentScale;
      return `<button type="button" data-v10-scale-choice="${item.value}" role="option" aria-selected="${active}" class="${active ? 'active' : ''}" tabindex="0"><span class="v10-motion-scale-a" aria-hidden="true">Aa</span><span class="v10-motion-scale-copy"><b>${st(item.labelKey)}</b><small>${st(item.descKey)}</small></span><em>${item.short}</em></button>`;
    }).join('');
    const scaleNote = backdrop.querySelector('.v10-motion-scale-note');
    if (scaleNote) scaleNote.textContent = st('scaleNote');
    renderDeviceDetail();
    const options = backdrop.querySelector('.v10-motion-options');
    if (options) options.innerHTML = MODES.map((mode) => {
      const active = state.requested === mode;
      const system = mode === 'auto' ? `<em>${t('detected')}: ${modeLabel(state.resolved)}</em>` : `<em>${modeIntensity(mode)}</em>`;
      const perks = modePerks(mode).map((item) => `<i>${item}</i>`).join('');
      return `<button type="button" role="radio" data-v10-panel-choice="${mode}" data-mode="${mode}" class="${active ? 'active' : ''}" aria-checked="${active}" aria-pressed="${active}" tabindex="${active ? '0' : '-1'}"><span class="v10-mode-icon mode-${mode}" aria-hidden="true">${modeIcon(mode)}</span><span class="v10-motion-option-body"><span class="v10-motion-option-title"><strong>${modeLabel(mode)}</strong><b>${modeBadge(mode)}</b></span><small>${t(`${mode}Desc`)}</small>${system}<span class="v10-motion-perks">${perks}</span></span><i class="v10-option-check" aria-hidden="true"><span>✓</span></i></button>`;
    }).join('');
    const live = backdrop.querySelector('.v10-motion-live b');
    if (live) live.textContent = `${t('active')}: ${modeLabel(effective)} · ${modeIntensity(effective)}`;
    backdrop.querySelectorAll('[data-v10-motion-close]').forEach((button) => {
      if (!button.textContent.trim()) button.textContent = t('close');
      button.setAttribute('aria-label', t('close'));
    });
  }
  function isCompactPanel() {
    return matchMedia('(max-width: 820px)').matches;
  }
  function positionPanel(trigger = state.panelTrigger) {
    const backdrop = document.getElementById('v10MotionBackdrop');
    const panel = backdrop?.querySelector('.v10-motion-panel');
    if (!backdrop || !panel || isCompactPanel()) {
      backdrop?.style.removeProperty('--v10-panel-top');
      backdrop?.style.removeProperty('--v10-panel-left');
      backdrop?.style.removeProperty('--v10-panel-width');
      return;
    }
    const target = trigger?.getBoundingClientRect?.();
    if (!target) return;
    const gap = 10;
    const margin = 12;
    const width = Math.min(520, Math.max(360, window.innerWidth - margin * 2));
    const estimatedHeight = Math.min(760, Math.max(520, panel.scrollHeight || 680));
    let left = Math.min(window.innerWidth - width - margin, Math.max(margin, target.right - width));
    let top = target.bottom + gap;
    if (top + estimatedHeight > window.innerHeight - margin) top = Math.max(margin, target.top - estimatedHeight - gap);
    backdrop.style.setProperty('--v10-panel-top', `${Math.round(top)}px`);
    backdrop.style.setProperty('--v10-panel-left', `${Math.round(left)}px`);
    backdrop.style.setProperty('--v10-panel-width', `${Math.round(width)}px`);
  }
  function lockPageScroll() {
    if (!body) { root.classList.add('v10-motion-panel-open'); return; }
    if (state.scrollLockStyles) return;
    state.scrollLockY = Math.max(window.scrollY || window.pageYOffset || 0, 0);
    const scrollbarWidth = Math.max(window.innerWidth - root.clientWidth, 0);
    state.scrollLockStyles = {
      rootOverflow: root.style.overflow,
      rootOverscroll: root.style.overscrollBehavior,
      bodyOverflow: body.style.overflow,
      bodyOverscroll: body.style.overscrollBehavior,
      bodyPaddingRight: body.style.paddingRight,
    };
    root.classList.add('v10-motion-panel-open');
    body.classList.add('v10-motion-panel-open-body');
    root.style.overflow = 'hidden';
    root.style.overscrollBehavior = 'none';
    body.style.overflow = 'hidden';
    body.style.overscrollBehavior = 'none';
    if (scrollbarWidth > 0) {
      const currentPadding = parseFloat(getComputedStyle(body).paddingRight) || 0;
      body.style.paddingRight = `${currentPadding + scrollbarWidth}px`;
    }
  }
  function unlockPageScroll() {
    root.classList.remove('v10-motion-panel-open');
    body?.classList.remove('v10-motion-panel-open-body');
    const previous = state.scrollLockStyles;
    if (previous && body) {
      root.style.overflow = previous.rootOverflow;
      root.style.overscrollBehavior = previous.rootOverscroll;
      body.style.overflow = previous.bodyOverflow;
      body.style.overscrollBehavior = previous.bodyOverscroll;
      body.style.paddingRight = previous.bodyPaddingRight;
    }
    state.scrollLockStyles = null;
    const y = Math.max(Number(state.scrollLockY) || 0, 0);
    state.scrollLockY = 0;
    requestAnimationFrame(() => window.scrollTo({ top:y, left:0, behavior:'auto' }));
  }
  function recoverStaleMotionPanelState() {
    root.classList.remove('v10-motion-panel-open');
    body?.classList.remove('v10-motion-panel-open-body');
    const backdrop = document.getElementById('v10MotionBackdrop');
    if (backdrop && !state.panelOpen) {
      backdrop.classList.add('hidden');
      backdrop.classList.remove('is-open', 'is-closing');
      backdrop.setAttribute('aria-hidden', 'true');
    }
  }

  function openPanel(eventOrTrigger) {
    const trigger = eventOrTrigger?.currentTarget || eventOrTrigger?.target?.closest?.('[data-v10-motion-trigger]') || eventOrTrigger || document.querySelector('[data-v10-motion-trigger]');
    const backdrop = panelElement();
    clearTimeout(state.closeTimer);
    if (state.panelOpen) {
      if (state.panelTrigger === trigger) {
        closePanel({ restoreFocus:false });
        return;
      }
      state.panelTrigger?.setAttribute('aria-expanded', 'false');
      state.panelTrigger = trigger instanceof HTMLElement ? trigger : null;
      state.panelTrigger?.setAttribute('aria-expanded', 'true');
      positionPanel(state.panelTrigger);
      return;
    }
    state.panelOpen = true;
    state.panelTrigger = trigger instanceof HTMLElement ? trigger : null;
    state.panelTrigger?.setAttribute('aria-expanded', 'true');
    state.lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : state.panelTrigger;
    renderPanel();
    backdrop.classList.remove('hidden', 'is-closing');
    backdrop.setAttribute('aria-hidden', 'false');
    backdrop.setAttribute('aria-modal', String(isCompactPanel()));
    lockPageScroll();
    positionPanel(state.panelTrigger);
    void backdrop.offsetWidth;
    requestAnimationFrame(() => backdrop.classList.add('is-open'));
    setTimeout(() => backdrop.querySelector('[data-v10-panel-choice].active')?.focus({ preventScroll:true }), 60);
  }
  function closePanel({ restoreFocus = true } = {}) {
    const backdrop = document.getElementById('v10MotionBackdrop');
    if (!backdrop || !state.panelOpen || backdrop.classList.contains('is-closing')) return;
    state.panelOpen = false;
    state.detailOpen = false;
    state.panelTrigger?.setAttribute('aria-expanded', 'false');
    clearTimeout(state.closeTimer);
    backdrop.classList.remove('is-open');
    backdrop.classList.add('is-closing');
    backdrop.setAttribute('aria-hidden', 'true');
    const panel = backdrop.querySelector('.v10-motion-panel');
    let finished = false;
    const finish = () => {
      if (finished || state.panelOpen) return;
      finished = true;
      panel?.removeEventListener('transitionend', onEnd);
      clearTimeout(state.closeTimer);
      backdrop.classList.add('hidden');
      backdrop.classList.remove('is-closing');
      unlockPageScroll();
      if (restoreFocus) requestAnimationFrame(() => state.lastFocused?.focus?.({ preventScroll:true }));
      state.lastFocused = null;
      state.panelTrigger = null;
    };
    const onEnd = (event) => {
      if (event.target !== panel || event.propertyName !== 'transform') return;
      finish();
    };
    panel?.addEventListener('transitionend', onEnd);
    state.closeTimer = setTimeout(finish, 300);
  }

  function bindMotionControls() {
    document.querySelectorAll('[data-v10-motion-trigger]').forEach((button) => {
      if (button.dataset.v10MotionBound === '1') return;
      button.dataset.v10MotionBound = '1';
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        openPanel(event);
      });
    });
    document.querySelectorAll('[data-v10-motion-choice]').forEach((button) => {
      if (button.dataset.v10MotionChoiceBound === '1') return;
      button.dataset.v10MotionChoiceBound = '1';
      button.addEventListener('click', () => applyMode(button.dataset.v10MotionChoice, true));
    });
    if (!state.outsideBound) {
      state.outsideBound = true;
      document.addEventListener('pointerdown', (event) => {
        if (!state.panelOpen) return;
        const backdrop = document.getElementById('v10MotionBackdrop');
        if (backdrop?.querySelector('.v10-motion-panel')?.contains(event.target)) return;
        if (event.target.closest?.('[data-v10-motion-trigger]')) return;
        closePanel({ restoreFocus:false });
      }, true);
    }
  }

  function annotateSurfaces() {
    const selectors = [
      '.modal-card', '.nex-smart-setting-card', '.stats-grid>article', '.motion-surface', '.system-control-card',
      '.chat-header', '.composer', '.auth-card', '.home-feature-card', '.home-tier-card', '.home-experience-chip',
      '.admin-command-strip', '.account-capacity-card', '.admin-security-activity', '.admin-report-center', '.effect-admin-console', '.badge-admin-console',
    ];
    document.querySelectorAll(selectors.join(',')).forEach((node) => node.classList.add('v10-surface'));
  }

  function observeExpensiveElements() {
    if (!('IntersectionObserver' in window)) return;
    state.observer?.disconnect();
    state.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle('v10-offscreen', !entry.isIntersecting));
    }, { rootMargin:'120px 0px', threshold:0.01 });
    document.querySelectorAll('.profile-rank-badge,.premium-rank-symbol,.message-rank-mark,.message-bubble[class*="effect-"],.motion-surface,.home-tier-emblem').forEach((node) => state.observer.observe(node));
  }

  function syncEffectActivator() {
    if (page !== 'chat') return;
    const source = document.getElementById('effectButton');
    const dock = document.getElementById('effectActivationDock');
    const button = document.getElementById('effectActivationButton');
    if (!source || !dock || !button) return;
    const allowed = !source.classList.contains('hidden') && source.getAttribute('aria-hidden') !== 'true';
    dock.classList.toggle('hidden', !allowed);
    button.disabled = !allowed;
    const stateNode = document.getElementById('effectActivationState');
    const selected = String(source.dataset.effect || 'none');
    const selectedLabel = String(source.dataset.effectLabel || selected);
    if (stateNode) {
      const hasSelection = allowed && selected !== 'none';
      stateNode.dataset.runtimeText = hasSelection ? '1' : '';
      stateNode.textContent = hasSelection ? `${t('effectUsing')}: ${selectedLabel}` : t('effectChoose');
      button.classList.toggle('is-active', hasSelection);
    }
    const titleNode = document.getElementById('effectActivationTitle');
    if (titleNode) titleNode.textContent = t('effectReady');
  }
  function bindEffectActivator() {
    if (page !== 'chat') return;
    const source = document.getElementById('effectButton');
    const button = document.getElementById('effectActivationButton');
    if (!source || !button) return;
    state.effectObserver = new MutationObserver(syncEffectActivator);
    state.effectObserver.observe(source, { attributes:true, attributeFilter:['class','aria-hidden','data-effect','data-effect-label'] });
    document.addEventListener('nexchat:effect-selected', (event) => {
      const effect = String(event.detail?.effect || 'none');
      const label = String(event.detail?.label || effect);
      source.dataset.effect = effect;
      source.dataset.effectLabel = label;
      syncEffectActivator();
    });
    syncEffectActivator();
  }

  function updateVisibility() {
    root.dataset.v10Visibility = document.hidden ? 'hidden' : 'visible';
    body?.classList.toggle('v10-page-hidden', document.hidden);
  }
  function scheduleAdaptiveRefresh() {
    if (state.resizeFrame) return;
    state.resizeFrame = requestAnimationFrame(() => {
      state.resizeFrame = 0;
      if (state.requested === 'auto') applyMode('auto');
      if (state.panelOpen) {
        const backdrop = document.getElementById('v10MotionBackdrop');
        backdrop?.setAttribute('aria-modal', String(isCompactPanel()));
        positionPanel(state.panelTrigger);
      }
      observeExpensiveElements();
    });
  }
  async function initBattery() {
    if (typeof navigator.getBattery !== 'function') return;
    try {
      state.battery = await navigator.getBattery();
      const refresh = () => { if (state.requested === 'auto') applyMode('auto'); else renderPanel(); };
      state.battery.addEventListener?.('levelchange', refresh);
      state.battery.addEventListener?.('chargingchange', refresh);
      refresh();
    } catch {}
  }
  function bindEnvironment() {
    const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
    motionQuery.addEventListener?.('change', scheduleAdaptiveRefresh);
    navigator.connection?.addEventListener?.('change', () => { scheduleAdaptiveRefresh(); sampleNetworkPing(true); });
    addEventListener('online', () => { scheduleAdaptiveRefresh(); sampleNetworkPing(true); }, { passive:true });
    addEventListener('offline', () => { scheduleAdaptiveRefresh(); sampleNetworkPing(true); }, { passive:true });
    addEventListener('resize', scheduleAdaptiveRefresh, { passive:true });
    document.addEventListener('visibilitychange', () => { updateVisibility(); if (document.hidden && state.panelOpen) closePanel({ restoreFocus:false }); });
    addEventListener('pagehide', () => { if (state.panelOpen || state.scrollLockStyles) unlockPageScroll(); }, { passive:true });
    document.addEventListener('nexchat:performance-mode', scheduleAdaptiveRefresh);
    document.addEventListener('nexchat:runtime-quality', () => { if (state.requested === 'auto') applyMode('auto'); else renderPanel(); });
    document.addEventListener('nexchat:runtime-environment', () => {
      if (state.requested === 'auto') scheduleAdaptiveRefresh();
      else if (state.panelOpen) renderPanel();
    });
    addEventListener('languagechange', () => { applyMode(state.requested); renderPanel(); syncEffectActivator(); });
    addEventListener('storage', (event) => {
      if ([storageBaseKey, `${storageBaseKey}:mobile`, `${storageBaseKey}:desktop`].includes(event.key)) applyMode(requestedMode());
      if (event.key === 'nexchat-interface-scale' && state.panelOpen) renderPanel();
    });
    document.addEventListener('nexchat:runtime-mobile-change', () => {
      state.requested = requestedMode();
      applyMode(state.requested);
      if (state.panelOpen) renderPanel();
    });
    addEventListener('nexchat:interface-scale', () => { if (state.panelOpen) renderPanel(); });
    addEventListener('nexchat:interface-scale-applied', () => { if (state.panelOpen) renderPanel(); });
  }

  function init() {
    recoverStaleMotionPanelState();
    annotateSurfaces();
    bindMotionControls();
    bindEffectActivator();
    bindEnvironment();
    updateVisibility();
    applyMode(requestedMode());
    startNetworkPingLoop();
    observeExpensiveElements();
    initBattery();
    root.classList.add('v10-ready');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();

  window.NexV10 = Object.freeze({
    version: VERSION,
    openMotionPanel: openPanel,
    setMotionMode: (mode) => applyMode(mode, true),
    refresh: scheduleAdaptiveRefresh,
    text: (key) => t(key),
    get motionMode() { return state.requested; },
    get resolvedMotionMode() { return state.resolved; },
  });
})();

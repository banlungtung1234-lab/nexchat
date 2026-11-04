'use strict';

(() => {
  if (window.NexSmart?.version) return;

  const VERSION = '10.0.0';
  const STORAGE = Object.freeze({
    performance: 'nexchat-smart-performance',
    privacy: 'nexchat-smart-privacy',
    privacyReturn: 'nexchat-smart-privacy-return',
    notePrefix: 'nexchat-private-note:',
  });
  const $ = (id) => document.getElementById(id);
  const root = document.documentElement;
  const page = document.body?.classList.contains('admin-page') ? 'admin'
    : document.body?.classList.contains('app-page') ? 'chat'
      : document.body?.classList.contains('support-page') ? 'support'
        : document.body?.classList.contains('auth-page') ? 'login' : 'home';

  const TEXT = {
    vi: {
      smartTools:'Thiết bị & tiện ích', smartKicker:'TỐI ƯU THÔNG MINH', smartTitle:'Trải nghiệm nhẹ và riêng tư', smartDesc:'Các tiện ích hoạt động độc lập, không thay đổi dữ liệu hay luồng chat hiện tại.',
      performance:'Hiệu năng', performanceDesc:'Tự cân bằng hiệu ứng theo thiết bị và kết nối.', auto:'Tự động', economy:'Tiết kiệm', full:'Đầy đủ',
      privacy:'Màn che riêng tư', privacyDesc:'Tự che nội dung khi quay lại tab và cho phép khóa nhanh bằng Ctrl/⌘ + Shift + L.', enabled:'Đã bật', disabled:'Đã tắt',
      install:'Cài NexChat', installDesc:'Mở nhanh như ứng dụng, không cần tải thêm gói nặng.', installButton:'Cài ứng dụng', installed:'Đã cài', unavailable:'Chưa khả dụng', iosHint:'Trên iPhone/iPad: Chia sẻ → Thêm vào Màn hình chính.',
      shortcuts:'Thao tác nhanh', shortcutsDesc:'Ctrl/⌘ + K mở bảng lệnh. Alt + S tìm kiếm. Alt + M nhập tin nhắn.', openPalette:'Mở bảng lệnh',
      notes:'Ghi chú riêng', notesDesc:'Ghi chú chỉ lưu trên thiết bị này, không gửi lên máy chủ.', notePlaceholder:'Viết ghi chú cho cuộc trò chuyện này…', save:'Lưu ghi chú', clear:'Xóa ghi chú', close:'Đóng', noteSaved:'Đã lưu ghi chú trên thiết bị này.', noteCleared:'Đã xóa ghi chú.', noteUnavailable:'Hãy mở một cuộc trò chuyện riêng hoặc nhóm trước.',
      palette:'Thao tác nhanh', palettePlaceholder:'Tìm thao tác…', noActions:'Không có thao tác phù hợp.',
      focusSearch:'Tìm người và tin nhắn', focusMessage:'Đặt con trỏ vào ô nhắn tin', addFriend:'Thêm bạn', createGroup:'Tạo nhóm', savedMessages:'Tin nhắn đã lưu', accountSettings:'Cài đặt tài khoản', lockNow:'Khóa màn hình riêng tư', conversationNote:'Ghi chú cuộc trò chuyện',
      adminSearch:'Tìm người dùng', adminExport:'Xuất danh sách đang lọc', adminReports:'Mở trung tâm tố cáo', adminAudit:'Mở nhật ký quản trị',
      lockedTitle:'Nội dung đang được che', lockedDesc:'Nhấn tiếp tục để hiển thị lại NexChat.', continue:'Tiếp tục', offline:'Bạn đang ngoại tuyến', onlineAgain:'Đã kết nối lại',
      exportEmpty:'Không có người dùng trong bộ lọc hiện tại.', exportDone:'Đã xuất danh sách người dùng.', smartModeChanged:'Đã áp dụng chế độ hiệu năng.',
    },
    en: {
      smartTools:'Device & tools', smartKicker:'SMART OPTIMIZATION', smartTitle:'Lightweight and private experience', smartDesc:'These utilities run independently without changing existing chat flows or data.',
      performance:'Performance', performanceDesc:'Balance visual effects for the current device and connection.', auto:'Automatic', economy:'Data saver', full:'Full',
      privacy:'Privacy screen', privacyDesc:'Cover content when returning to the tab and lock quickly with Ctrl/⌘ + Shift + L.', enabled:'Enabled', disabled:'Disabled',
      install:'Install NexChat', installDesc:'Open like an app without downloading a heavy package.', installButton:'Install app', installed:'Installed', unavailable:'Not available', iosHint:'On iPhone/iPad: Share → Add to Home Screen.',
      shortcuts:'Quick actions', shortcutsDesc:'Ctrl/⌘ + K opens commands. Alt + S searches. Alt + M focuses the composer.', openPalette:'Open command palette',
      notes:'Private note', notesDesc:'Stored only on this device and never sent to the server.', notePlaceholder:'Write a note for this conversation…', save:'Save note', clear:'Clear note', close:'Close', noteSaved:'Note saved on this device.', noteCleared:'Note cleared.', noteUnavailable:'Open a private or group conversation first.',
      palette:'Quick actions', palettePlaceholder:'Search actions…', noActions:'No matching actions.',
      focusSearch:'Search people and messages', focusMessage:'Focus message composer', addFriend:'Add friend', createGroup:'Create group', savedMessages:'Saved messages', accountSettings:'Account settings', lockNow:'Lock privacy screen', conversationNote:'Conversation note',
      adminSearch:'Search users', adminExport:'Export filtered users', adminReports:'Open report center', adminAudit:'Open admin audit',
      lockedTitle:'Content is covered', lockedDesc:'Continue to reveal NexChat.', continue:'Continue', offline:'You are offline', onlineAgain:'Connection restored',
      exportEmpty:'No users match the current filter.', exportDone:'User list exported.', smartModeChanged:'Performance mode applied.',
    },
    zh: { smartTools:'设备与工具',smartKicker:'智能优化',smartTitle:'轻量且私密的体验',smartDesc:'这些工具独立运行，不会改变现有聊天流程或数据。',performance:'性能',performanceDesc:'根据设备和网络自动平衡视觉效果。',auto:'自动',economy:'省流量',full:'完整',privacy:'隐私遮罩',privacyDesc:'返回标签页时遮住内容，并可用 Ctrl/⌘ + Shift + L 快速锁定。',enabled:'已开启',disabled:'已关闭',install:'安装 NexChat',installDesc:'像应用一样快速打开，无需下载大型安装包。',installButton:'安装应用',installed:'已安装',unavailable:'暂不可用',iosHint:'iPhone/iPad：分享 → 添加到主屏幕。',shortcuts:'快捷操作',shortcutsDesc:'Ctrl/⌘ + K 打开命令，Alt + S 搜索，Alt + M 输入消息。',openPalette:'打开命令面板',notes:'私人笔记',notesDesc:'仅保存在此设备，不会上传服务器。',notePlaceholder:'为当前会话写笔记…',save:'保存笔记',clear:'清除笔记',close:'关闭',noteSaved:'笔记已保存在此设备。',noteCleared:'笔记已清除。',noteUnavailable:'请先打开私聊或群聊。',palette:'快捷操作',palettePlaceholder:'搜索操作…',noActions:'没有匹配的操作。',focusSearch:'搜索用户和消息',focusMessage:'定位到消息输入框',addFriend:'添加好友',createGroup:'创建群聊',savedMessages:'已保存消息',accountSettings:'账户设置',lockNow:'锁定隐私屏幕',conversationNote:'会话笔记',adminSearch:'搜索用户',adminExport:'导出筛选用户',adminReports:'打开举报中心',adminAudit:'打开管理日志',lockedTitle:'内容已遮盖',lockedDesc:'继续以显示 NexChat。',continue:'继续',offline:'当前离线',onlineAgain:'连接已恢复',exportEmpty:'当前筛选没有用户。',exportDone:'用户列表已导出。',smartModeChanged:'性能模式已应用。' },
    ru: { smartTools:'Устройство и инструменты',smartKicker:'УМНАЯ ОПТИМИЗАЦИЯ',smartTitle:'Лёгкий и приватный режим',smartDesc:'Инструменты работают отдельно и не меняют текущие данные и чаты.',performance:'Производительность',performanceDesc:'Баланс эффектов под устройство и сеть.',auto:'Авто',economy:'Экономия',full:'Полный',privacy:'Экран приватности',privacyDesc:'Скрывает содержимое после возврата во вкладку; Ctrl/⌘ + Shift + L — быстрая блокировка.',enabled:'Включено',disabled:'Выключено',install:'Установить NexChat',installDesc:'Открывайте как приложение без тяжёлой загрузки.',installButton:'Установить',installed:'Установлено',unavailable:'Недоступно',iosHint:'На iPhone/iPad: Поделиться → На экран «Домой».',shortcuts:'Быстрые действия',shortcutsDesc:'Ctrl/⌘ + K — команды, Alt + S — поиск, Alt + M — сообщение.',openPalette:'Открыть команды',notes:'Личная заметка',notesDesc:'Хранится только на этом устройстве и не отправляется на сервер.',notePlaceholder:'Заметка для этого диалога…',save:'Сохранить',clear:'Очистить',close:'Закрыть',noteSaved:'Заметка сохранена на устройстве.',noteCleared:'Заметка удалена.',noteUnavailable:'Сначала откройте личный или групповой чат.',palette:'Быстрые действия',palettePlaceholder:'Найти действие…',noActions:'Подходящих действий нет.',focusSearch:'Поиск людей и сообщений',focusMessage:'Перейти к полю сообщения',addFriend:'Добавить друга',createGroup:'Создать группу',savedMessages:'Сохранённые сообщения',accountSettings:'Настройки аккаунта',lockNow:'Закрыть экран приватности',conversationNote:'Заметка диалога',adminSearch:'Поиск пользователей',adminExport:'Экспорт списка',adminReports:'Открыть жалобы',adminAudit:'Открыть журнал',lockedTitle:'Содержимое скрыто',lockedDesc:'Продолжите, чтобы показать NexChat.',continue:'Продолжить',offline:'Нет подключения',onlineAgain:'Подключение восстановлено',exportEmpty:'В текущем фильтре нет пользователей.',exportDone:'Список пользователей экспортирован.',smartModeChanged:'Режим производительности применён.' },
    de: { smartTools:'Gerät & Werkzeuge',smartKicker:'INTELLIGENTE OPTIMIERUNG',smartTitle:'Leicht und privat',smartDesc:'Diese Werkzeuge laufen unabhängig und ändern keine bestehenden Chat-Abläufe oder Daten.',performance:'Leistung',performanceDesc:'Effekte passend zu Gerät und Verbindung ausgleichen.',auto:'Automatisch',economy:'Datensparend',full:'Voll',privacy:'Privatsphäre-Bildschirm',privacyDesc:'Blendet Inhalte beim Zurückkehren aus; Ctrl/⌘ + Shift + L sperrt sofort.',enabled:'Aktiv',disabled:'Inaktiv',install:'NexChat installieren',installDesc:'Wie eine App öffnen, ohne ein großes Paket zu laden.',installButton:'App installieren',installed:'Installiert',unavailable:'Nicht verfügbar',iosHint:'Auf iPhone/iPad: Teilen → Zum Home-Bildschirm.',shortcuts:'Schnellaktionen',shortcutsDesc:'Ctrl/⌘ + K öffnet Befehle. Alt + S sucht. Alt + M fokussiert die Nachricht.',openPalette:'Befehle öffnen',notes:'Private Notiz',notesDesc:'Nur auf diesem Gerät gespeichert und nie an den Server gesendet.',notePlaceholder:'Notiz für diese Unterhaltung…',save:'Notiz speichern',clear:'Notiz löschen',close:'Schließen',noteSaved:'Notiz auf diesem Gerät gespeichert.',noteCleared:'Notiz gelöscht.',noteUnavailable:'Öffne zuerst einen privaten Chat oder eine Gruppe.',palette:'Schnellaktionen',palettePlaceholder:'Aktionen suchen…',noActions:'Keine passende Aktion.',focusSearch:'Personen und Nachrichten suchen',focusMessage:'Nachrichtenfeld fokussieren',addFriend:'Freund hinzufügen',createGroup:'Gruppe erstellen',savedMessages:'Gespeicherte Nachrichten',accountSettings:'Kontoeinstellungen',lockNow:'Privatsphäre sperren',conversationNote:'Unterhaltungsnotiz',adminSearch:'Benutzer suchen',adminExport:'Gefilterte Benutzer exportieren',adminReports:'Meldezentrum öffnen',adminAudit:'Admin-Protokoll öffnen',lockedTitle:'Inhalt ist verdeckt',lockedDesc:'Fortfahren, um NexChat wieder anzuzeigen.',continue:'Fortfahren',offline:'Du bist offline',onlineAgain:'Verbindung wiederhergestellt',exportEmpty:'Keine Benutzer im aktuellen Filter.',exportDone:'Benutzerliste exportiert.',smartModeChanged:'Leistungsmodus angewendet.' },
    th: { smartTools:'อุปกรณ์และเครื่องมือ',smartKicker:'ปรับแต่งอัจฉริยะ',smartTitle:'เบาและเป็นส่วนตัว',smartDesc:'เครื่องมือเหล่านี้ทำงานแยกและไม่เปลี่ยนข้อมูลหรือขั้นตอนแชทเดิม',performance:'ประสิทธิภาพ',performanceDesc:'ปรับเอฟเฟกต์ให้เหมาะกับอุปกรณ์และเครือข่าย',auto:'อัตโนมัติ',economy:'ประหยัดข้อมูล',full:'เต็มรูปแบบ',privacy:'หน้าจอความเป็นส่วนตัว',privacyDesc:'ปิดบังเนื้อหาเมื่อกลับมาที่แท็บ และล็อกด้วย Ctrl/⌘ + Shift + L',enabled:'เปิด',disabled:'ปิด',install:'ติดตั้ง NexChat',installDesc:'เปิดเหมือนแอปโดยไม่ต้องดาวน์โหลดไฟล์ขนาดใหญ่',installButton:'ติดตั้งแอป',installed:'ติดตั้งแล้ว',unavailable:'ยังไม่พร้อม',iosHint:'บน iPhone/iPad: แชร์ → เพิ่มไปยังหน้าจอโฮม',shortcuts:'คำสั่งด่วน',shortcutsDesc:'Ctrl/⌘ + K เปิดคำสั่ง, Alt + S ค้นหา, Alt + M พิมพ์ข้อความ',openPalette:'เปิดแผงคำสั่ง',notes:'บันทึกส่วนตัว',notesDesc:'เก็บเฉพาะอุปกรณ์นี้และไม่ส่งขึ้นเซิร์ฟเวอร์',notePlaceholder:'เขียนบันทึกสำหรับแชทนี้…',save:'บันทึก',clear:'ล้าง',close:'ปิด',noteSaved:'บันทึกไว้ในอุปกรณ์นี้แล้ว',noteCleared:'ล้างบันทึกแล้ว',noteUnavailable:'เปิดแชทส่วนตัวหรือกลุ่มก่อน',palette:'คำสั่งด่วน',palettePlaceholder:'ค้นหาคำสั่ง…',noActions:'ไม่พบคำสั่ง',focusSearch:'ค้นหาคนและข้อความ',focusMessage:'ไปที่ช่องข้อความ',addFriend:'เพิ่มเพื่อน',createGroup:'สร้างกลุ่ม',savedMessages:'ข้อความที่บันทึก',accountSettings:'ตั้งค่าบัญชี',lockNow:'ล็อกหน้าจอส่วนตัว',conversationNote:'บันทึกการสนทนา',adminSearch:'ค้นหาผู้ใช้',adminExport:'ส่งออกรายชื่อที่กรอง',adminReports:'เปิดศูนย์รายงาน',adminAudit:'เปิดบันทึกผู้ดูแล',lockedTitle:'เนื้อหาถูกปิดบัง',lockedDesc:'กดดำเนินการต่อเพื่อแสดง NexChat',continue:'ดำเนินการต่อ',offline:'คุณออฟไลน์',onlineAgain:'เชื่อมต่ออีกครั้งแล้ว',exportEmpty:'ไม่มีผู้ใช้ในตัวกรองปัจจุบัน',exportDone:'ส่งออกรายชื่อผู้ใช้แล้ว',smartModeChanged:'ใช้โหมดประสิทธิภาพแล้ว' },
    es: { smartTools:'Dispositivo y herramientas',smartKicker:'OPTIMIZACIÓN INTELIGENTE',smartTitle:'Experiencia ligera y privada',smartDesc:'Estas utilidades funcionan por separado y no cambian los datos ni los flujos actuales.',performance:'Rendimiento',performanceDesc:'Equilibra los efectos según el dispositivo y la conexión.',auto:'Automático',economy:'Ahorro de datos',full:'Completo',privacy:'Pantalla de privacidad',privacyDesc:'Oculta el contenido al volver a la pestaña; Ctrl/⌘ + Shift + L bloquea al instante.',enabled:'Activado',disabled:'Desactivado',install:'Instalar NexChat',installDesc:'Ábrelo como una aplicación sin descargar un paquete pesado.',installButton:'Instalar aplicación',installed:'Instalada',unavailable:'No disponible',iosHint:'En iPhone/iPad: Compartir → Añadir a pantalla de inicio.',shortcuts:'Acciones rápidas',shortcutsDesc:'Ctrl/⌘ + K abre comandos. Alt + S busca. Alt + M enfoca el mensaje.',openPalette:'Abrir comandos',notes:'Nota privada',notesDesc:'Solo se guarda en este dispositivo y nunca se envía al servidor.',notePlaceholder:'Escribe una nota para esta conversación…',save:'Guardar nota',clear:'Borrar nota',close:'Cerrar',noteSaved:'Nota guardada en este dispositivo.',noteCleared:'Nota borrada.',noteUnavailable:'Abre primero un chat privado o de grupo.',palette:'Acciones rápidas',palettePlaceholder:'Buscar acciones…',noActions:'No hay acciones coincidentes.',focusSearch:'Buscar personas y mensajes',focusMessage:'Enfocar el cuadro de mensaje',addFriend:'Añadir amigo',createGroup:'Crear grupo',savedMessages:'Mensajes guardados',accountSettings:'Ajustes de cuenta',lockNow:'Bloquear privacidad',conversationNote:'Nota de conversación',adminSearch:'Buscar usuarios',adminExport:'Exportar usuarios filtrados',adminReports:'Abrir centro de reportes',adminAudit:'Abrir registro de administración',lockedTitle:'Contenido oculto',lockedDesc:'Continúa para mostrar NexChat.',continue:'Continuar',offline:'Estás sin conexión',onlineAgain:'Conexión restablecida',exportEmpty:'No hay usuarios en el filtro actual.',exportDone:'Lista de usuarios exportada.',smartModeChanged:'Modo de rendimiento aplicado.' },
    fr: { smartTools:'Appareil et outils',smartKicker:'OPTIMISATION INTELLIGENTE',smartTitle:'Une expérience légère et privée',smartDesc:'Ces outils restent indépendants et ne modifient ni les données ni les flux existants.',performance:'Performances',performanceDesc:'Équilibre les effets selon l’appareil et la connexion.',auto:'Automatique',economy:'Économie de données',full:'Complet',privacy:'Écran de confidentialité',privacyDesc:'Masque le contenu au retour dans l’onglet ; Ctrl/⌘ + Shift + L verrouille rapidement.',enabled:'Activé',disabled:'Désactivé',install:'Installer NexChat',installDesc:'Ouvrez-le comme une application sans paquet lourd.',installButton:'Installer l’application',installed:'Installée',unavailable:'Indisponible',iosHint:'Sur iPhone/iPad : Partager → Sur l’écran d’accueil.',shortcuts:'Actions rapides',shortcutsDesc:'Ctrl/⌘ + K ouvre les commandes. Alt + S recherche. Alt + M cible le message.',openPalette:'Ouvrir les commandes',notes:'Note privée',notesDesc:'Stockée uniquement sur cet appareil, jamais envoyée au serveur.',notePlaceholder:'Écrire une note pour cette conversation…',save:'Enregistrer',clear:'Effacer',close:'Fermer',noteSaved:'Note enregistrée sur cet appareil.',noteCleared:'Note effacée.',noteUnavailable:'Ouvrez d’abord une discussion privée ou de groupe.',palette:'Actions rapides',palettePlaceholder:'Rechercher une action…',noActions:'Aucune action correspondante.',focusSearch:'Rechercher des personnes et messages',focusMessage:'Cibler la zone de message',addFriend:'Ajouter un ami',createGroup:'Créer un groupe',savedMessages:'Messages enregistrés',accountSettings:'Paramètres du compte',lockNow:'Verrouiller la confidentialité',conversationNote:'Note de conversation',adminSearch:'Rechercher des utilisateurs',adminExport:'Exporter les utilisateurs filtrés',adminReports:'Ouvrir les signalements',adminAudit:'Ouvrir le journal admin',lockedTitle:'Contenu masqué',lockedDesc:'Continuez pour réafficher NexChat.',continue:'Continuer',offline:'Vous êtes hors ligne',onlineAgain:'Connexion rétablie',exportEmpty:'Aucun utilisateur dans le filtre actuel.',exportDone:'Liste des utilisateurs exportée.',smartModeChanged:'Mode de performance appliqué.' },
    ja: { smartTools:'デバイスとツール',smartKicker:'スマート最適化',smartTitle:'軽量でプライベートな体験',smartDesc:'既存のチャット機能やデータを変更せず、独立して動作します。',performance:'パフォーマンス',performanceDesc:'端末と接続状況に合わせて表示効果を調整します。',auto:'自動',economy:'データ節約',full:'フル',privacy:'プライバシー画面',privacyDesc:'タブに戻った時に内容を隠し、Ctrl/⌘ + Shift + L ですぐにロックできます。',enabled:'有効',disabled:'無効',install:'NexChat をインストール',installDesc:'大きなパッケージを追加せずアプリのように開けます。',installButton:'アプリをインストール',installed:'インストール済み',unavailable:'利用不可',iosHint:'iPhone/iPad：共有 → ホーム画面に追加。',shortcuts:'クイック操作',shortcutsDesc:'Ctrl/⌘ + K でコマンド、Alt + S で検索、Alt + M で入力欄へ移動。',openPalette:'コマンドを開く',notes:'個人メモ',notesDesc:'この端末だけに保存され、サーバーには送信されません。',notePlaceholder:'この会話のメモを書く…',save:'メモを保存',clear:'メモを削除',close:'閉じる',noteSaved:'この端末にメモを保存しました。',noteCleared:'メモを削除しました。',noteUnavailable:'先に個人またはグループチャットを開いてください。',palette:'クイック操作',palettePlaceholder:'操作を検索…',noActions:'一致する操作はありません。',focusSearch:'ユーザーとメッセージを検索',focusMessage:'メッセージ入力欄へ移動',addFriend:'友だちを追加',createGroup:'グループを作成',savedMessages:'保存したメッセージ',accountSettings:'アカウント設定',lockNow:'プライバシー画面をロック',conversationNote:'会話メモ',adminSearch:'ユーザーを検索',adminExport:'絞り込み結果を出力',adminReports:'通報センターを開く',adminAudit:'管理ログを開く',lockedTitle:'内容を非表示にしています',lockedDesc:'続行すると NexChat を表示します。',continue:'続行',offline:'オフラインです',onlineAgain:'接続が復旧しました',exportEmpty:'現在の条件に一致するユーザーはいません。',exportDone:'ユーザー一覧を出力しました。',smartModeChanged:'パフォーマンスモードを適用しました。' },
  };

  function language() {
    const code = String(document.documentElement.lang || 'vi').toLowerCase().split('-')[0];
    return TEXT[code] ? code : 'en';
  }
  function t(key) { return TEXT[language()]?.[key] || TEXT.en[key] || key; }
  function safeGet(storage, key, fallback = '') { try { return storage.getItem(key) ?? fallback; } catch { return fallback; } }
  function safeSet(storage, key, value) { try { storage.setItem(key, value); return true; } catch { return false; } }
  function toast(message, type = 'info') {
    if (window.UI?.toast) return window.UI.toast(message, type);
    const node = document.createElement('div');
    node.className = `nex-smart-toast is-${type}`;
    node.textContent = message;
    document.body.append(node);
    requestAnimationFrame(() => node.classList.add('visible'));
    setTimeout(() => { node.classList.remove('visible'); setTimeout(() => node.remove(), 220); }, 2600);
  }

  function applyTranslations() {
    document.querySelectorAll('[data-smart-key]').forEach((node) => {
      const value = t(node.dataset.smartKey);
      if (node.matches('input,textarea')) node.placeholder = value;
      else node.textContent = value;
    });
    document.querySelectorAll('[data-smart-title]').forEach((node) => { node.title = t(node.dataset.smartTitle); });
    syncControls();
    renderPalette();
  }

  function performanceMode() {
    const value = safeGet(localStorage, STORAGE.performance, 'auto');
    return ['auto', 'economy', 'full'].includes(value) ? value : 'auto';
  }
  function setPerformanceMode(mode, announce = true) {
    const value = ['economy', 'full'].includes(mode) ? mode : 'auto';
    safeSet(localStorage, STORAGE.performance, value);
    root.dataset.performanceMode = value;
    window.NexRuntime?.refresh?.();
    document.dispatchEvent(new CustomEvent('nexchat:performance-mode', { detail: { mode:value } }));
    syncControls();
    if (announce) toast(t('smartModeChanged'), 'success');
  }
  function privacyEnabled() { return safeGet(localStorage, STORAGE.privacy, '0') === '1'; }
  function setPrivacyEnabled(enabled) {
    safeSet(localStorage, STORAGE.privacy, enabled ? '1' : '0');
    root.dataset.privacyShield = enabled ? 'on' : 'off';
    syncControls();
  }

  function syncControls() {
    const mode = performanceMode();
    document.querySelectorAll('[data-smart-performance]').forEach((button) => {
      const active = button.dataset.smartPerformance === mode;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    const privacy = privacyEnabled();
    const toggle = $('smartPrivacyToggle');
    if (toggle) toggle.checked = privacy;
    const status = $('smartPrivacyStatus');
    if (status) status.textContent = privacy ? t('enabled') : t('disabled');
    root.dataset.privacyShield = privacy ? 'on' : 'off';
  }

  function privacyScreen() {
    let screen = $('nexSmartPrivacyScreen');
    if (screen) return screen;
    screen = document.createElement('div');
    screen.id = 'nexSmartPrivacyScreen';
    screen.className = 'nex-smart-privacy-screen hidden';
    screen.setAttribute('role', 'dialog');
    screen.setAttribute('aria-modal', 'true');
    screen.innerHTML = `<div class="nex-smart-lock-card"><span class="nex-smart-lock-mark" aria-hidden="true">N</span><h2 data-smart-key="lockedTitle"></h2><p data-smart-key="lockedDesc"></p><button type="button" class="primary-button" data-smart-unlock><span data-smart-key="continue"></span></button></div>`;
    document.body.append(screen);
    screen.querySelector('[data-smart-unlock]').addEventListener('click', unlockPrivacy);
    applyTranslations();
    return screen;
  }
  function lockPrivacy() {
    const screen = privacyScreen();
    screen.classList.remove('hidden');
    root.classList.add('nex-smart-locked');
    screen.querySelector('button')?.focus({ preventScroll:true });
  }
  function unlockPrivacy() {
    $('nexSmartPrivacyScreen')?.classList.add('hidden');
    root.classList.remove('nex-smart-locked');
    try { sessionStorage.removeItem(STORAGE.privacyReturn); } catch {}
  }

  let installPrompt = null;
  function standalone() {
    return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  }
  function syncInstallButton() {
    const button = $('smartInstallButton');
    const state = $('smartInstallState');
    const hint = $('smartInstallHint');
    if (!button || !state) return;
    if (standalone()) {
      button.disabled = true;
      button.textContent = t('installed');
      state.textContent = t('installed');
      hint?.classList.add('hidden');
      return;
    }
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    button.disabled = !installPrompt && !ios;
    button.textContent = t('installButton');
    state.textContent = installPrompt || ios ? t('installButton') : t('unavailable');
    if (hint) {
      hint.textContent = ios ? t('iosHint') : '';
      hint.classList.toggle('hidden', !ios);
    }
  }
  async function installApp() {
    if (standalone()) return;
    if (!installPrompt) {
      const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      if (ios) toast(t('iosHint'), 'info');
      return;
    }
    const event = installPrompt;
    installPrompt = null;
    event.prompt();
    try { await event.userChoice; } catch {}
    syncInstallButton();
  }

  function activeConversation() {
    const scope = document.body.dataset.activeScope || '';
    const target = document.body.dataset.activeTarget || '';
    if (!['private', 'group'].includes(scope) || !target) return null;
    return { scope, target, key:`${STORAGE.notePrefix}${scope}:${target}` };
  }
  function openNote() {
    const active = activeConversation();
    if (!active) return toast(t('noteUnavailable'), 'info');
    const modal = $('conversationNoteModal');
    const input = $('conversationNoteInput');
    if (!modal || !input) return;
    input.value = safeGet(localStorage, active.key, '');
    input.dataset.noteKey = active.key;
    const count = $('conversationNoteCount');
    if (count) count.textContent = `${input.value.length}/2000`;
    if (window.UI?.openModal) window.UI.openModal('conversationNoteModal');
    else modal.classList.remove('hidden');
    setTimeout(() => input.focus(), 80);
  }
  function closeNote() {
    if (window.UI?.closeModal) window.UI.closeModal('conversationNoteModal');
    else $('conversationNoteModal')?.classList.add('hidden');
  }
  function saveNote() {
    const input = $('conversationNoteInput');
    if (!input?.dataset.noteKey) return;
    safeSet(localStorage, input.dataset.noteKey, input.value.slice(0, 2000));
    toast(t('noteSaved'), 'success');
    closeNote();
  }
  function clearNote() {
    const input = $('conversationNoteInput');
    if (!input?.dataset.noteKey) return;
    try { localStorage.removeItem(input.dataset.noteKey); } catch {}
    input.value = '';
    const count = $('conversationNoteCount');
    if (count) count.textContent = '0/2000';
    toast(t('noteCleared'), 'success');
  }

  function smartActions() {
    const actions = [];
    const action = (key, icon, run, keywords = '') => actions.push({ key, icon, run, keywords:`${key} ${keywords}`.toLowerCase() });
    if (page === 'chat') {
      action('focusSearch', '⌕', () => { $('chatSearch')?.focus(); $('chatSearch')?.select(); }, 'search people message');
      action('focusMessage', '✎', () => $('messageInput')?.focus(), 'message composer');
      action('addFriend', '+', () => $('addFriendButton')?.click(), 'friend');
      action('createGroup', '◉', () => $('createGroupButton')?.click(), 'group');
      action('savedMessages', '◆', () => document.querySelector('[data-open-scope="saved"]')?.click(), 'saved bookmark');
      action('accountSettings', '⚙', () => $('accountSettingsButton')?.click(), 'settings security');
      action('conversationNote', '▤', openNote, 'note private local');
      action('lockNow', '▣', lockPrivacy, 'privacy lock');
    } else if (page === 'admin') {
      action('adminSearch', '⌕', () => { $('userSearch')?.focus(); $('userSearch')?.select(); }, 'search user');
      action('adminExport', '⇩', () => $('exportUsersButton')?.click(), 'export csv');
      action('adminReports', '!', () => $('adminReportCenterTitle')?.scrollIntoView({ behavior:'smooth', block:'start' }), 'reports moderation');
      action('adminAudit', '≡', () => $('adminSecurityActivityTitle')?.scrollIntoView({ behavior:'smooth', block:'start' }), 'audit log');
      action('lockNow', '▣', lockPrivacy, 'privacy lock');
    } else if (page === 'support') {
      action('focusMessage', '✎', () => $('messageInput')?.focus(), 'message support');
      action('lockNow', '▣', lockPrivacy, 'privacy lock');
    }
    return actions;
  }

  let paletteQuery = '';
  function paletteElement() {
    let modal = $('nexSmartPalette');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'nexSmartPalette';
    modal.className = 'nex-smart-palette-backdrop hidden';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = `<section class="nex-smart-palette"><header><div><small data-smart-key="smartKicker"></small><h2 data-smart-key="palette"></h2></div><button type="button" data-smart-palette-close aria-label="Close">×</button></header><label><span aria-hidden="true">⌕</span><input id="nexSmartPaletteInput" type="search" autocomplete="off" data-smart-key="palettePlaceholder"></label><div id="nexSmartPaletteList" class="nex-smart-palette-list"></div><footer><kbd>↑</kbd><kbd>↓</kbd><span>Enter</span><kbd>Esc</kbd></footer></section>`;
    document.body.append(modal);
    modal.addEventListener('click', (event) => { if (event.target === modal) closePalette(); });
    modal.querySelector('[data-smart-palette-close]').addEventListener('click', closePalette);
    modal.querySelector('input').addEventListener('input', (event) => { paletteQuery = event.target.value.trim().toLowerCase(); renderPalette(); });
    modal.querySelector('input').addEventListener('keydown', paletteKeydown);
    modal.querySelector('.nex-smart-palette-list').addEventListener('click', (event) => {
      const button = event.target.closest('[data-smart-action-index]');
      if (!button) return;
      runPaletteAction(Number(button.dataset.smartActionIndex));
    });
    applyTranslations();
    return modal;
  }
  function filteredActions() {
    const query = paletteQuery;
    return smartActions().filter((item) => !query || `${t(item.key)} ${item.keywords}`.toLowerCase().includes(query));
  }
  function renderPalette() {
    const list = $('nexSmartPaletteList');
    if (!list) return;
    const items = filteredActions();
    list.innerHTML = items.length ? items.map((item, index) => `<button type="button" data-smart-action-index="${index}" ${index === 0 ? 'class="active"' : ''}><span aria-hidden="true">${item.icon}</span><strong>${escapeHTML(t(item.key))}</strong><kbd>↵</kbd></button>`).join('') : `<p>${escapeHTML(t('noActions'))}</p>`;
  }
  let paletteCloseTimer = 0;
  function openPalette() {
    const modal = paletteElement();
    clearTimeout(paletteCloseTimer);
    paletteQuery = '';
    const input = $('nexSmartPaletteInput');
    if (input) input.value = '';
    renderPalette();
    modal.classList.remove('hidden', 'is-closing', 'is-open');
    root.classList.add('nex-smart-palette-open');
    void modal.offsetWidth;
    requestAnimationFrame(() => modal.classList.add('is-open'));
    setTimeout(() => { if (modal.classList.contains('is-open')) input?.focus({ preventScroll:true }); }, 80);
  }
  function closePalette(afterClose = null) {
    const modal = $('nexSmartPalette');
    if (!modal || modal.classList.contains('hidden') || modal.classList.contains('is-closing')) return;
    clearTimeout(paletteCloseTimer);
    modal.classList.remove('is-open');
    modal.classList.add('is-closing');
    root.classList.remove('nex-smart-palette-open');
    const panel = modal.querySelector('.nex-smart-palette');
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      panel?.removeEventListener('transitionend', onEnd);
      clearTimeout(paletteCloseTimer);
      modal.classList.add('hidden');
      modal.classList.remove('is-closing');
      afterClose?.();
    };
    const onEnd = (event) => {
      if (event.target !== panel || event.propertyName !== 'transform') return;
      finish();
    };
    panel?.addEventListener('transitionend', onEnd);
    paletteCloseTimer = setTimeout(finish, 320);
  }
  function runPaletteAction(index) {
    const item = filteredActions()[index];
    if (!item) return;
    closePalette(() => item.run());
  }
  function paletteKeydown(event) {
    const buttons = [...$('nexSmartPaletteList')?.querySelectorAll('button') || []];
    const current = Math.max(0, buttons.findIndex((button) => button.classList.contains('active')));
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!buttons.length) return;
      buttons[current]?.classList.remove('active');
      const next = event.key === 'ArrowDown' ? (current + 1) % buttons.length : (current - 1 + buttons.length) % buttons.length;
      buttons[next].classList.add('active');
      buttons[next].scrollIntoView({ block:'nearest' });
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const active = buttons.find((button) => button.classList.contains('active')) || buttons[0];
      active?.click();
    } else if (event.key === 'Escape') {
      event.preventDefault(); closePalette();
    }
  }
  function escapeHTML(value) {
    return String(value).replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
  }

  let networkTimer = 0;
  function networkBar() {
    let bar = $('nexSmartNetworkBar');
    if (bar) return bar;
    bar = document.createElement('div');
    bar.id = 'nexSmartNetworkBar';
    bar.className = 'nex-smart-network hidden';
    bar.setAttribute('role', 'status');
    bar.setAttribute('aria-live', 'polite');
    document.body.append(bar);
    return bar;
  }
  function updateNetwork(online = navigator.onLine, initial = false) {
    const bar = networkBar();
    clearTimeout(networkTimer);
    if (!online) {
      bar.textContent = t('offline');
      bar.className = 'nex-smart-network is-offline';
      return;
    }
    if (initial) { bar.className = 'nex-smart-network hidden'; return; }
    bar.textContent = t('onlineAgain');
    bar.className = 'nex-smart-network is-online';
    networkTimer = setTimeout(() => bar.classList.add('hidden'), 2200);
  }

  async function exportAdminUsers() {
    if (page !== 'admin') return;
    try {
      const data = window.UI?.fetchJSON ? await window.UI.fetchJSON('/api/admin/users') : await fetch('/api/admin/users').then((response) => response.json());
      const query = String($('userSearch')?.value || '').trim().toLowerCase();
      const status = $('statusFilter')?.value || 'all';
      const users = (data.users || []).filter((user) => {
        const userStatus = user.status?.type || 'active';
        const haystack = [user.username,user.nickname,user.phone,user.email].filter(Boolean).join(' ').toLowerCase();
        return (!query || haystack.includes(query)) && (status === 'all' || userStatus === status);
      });
      if (!users.length) return toast(t('exportEmpty'), 'info');
      const quote = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
      const rows = [['username','nickname','phone','email','status','online','registeredAt','sessions']];
      users.forEach((user) => rows.push([user.username,user.nickname,user.phone,user.email,user.status?.type || 'active',user.online ? 'online' : 'offline',user.createdAt || '',user.sessionCount ?? user.sessions?.length ?? 0]));
      const csv = '\ufeff' + rows.map((row) => row.map(quote).join(',')).join('\r\n');
      const url = URL.createObjectURL(new Blob([csv], { type:'text/csv;charset=utf-8' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `nexchat-users-${new Date().toISOString().slice(0,10)}.csv`;
      document.body.append(anchor); anchor.click(); anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast(t('exportDone'), 'success');
    } catch (error) { toast(error.message || 'Export failed', 'error'); }
  }

  function handleKeys(event) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault(); openPalette(); return;
    }
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'l') {
      event.preventDefault(); lockPrivacy(); return;
    }
    if (event.altKey && event.key.toLowerCase() === 's') {
      const target = page === 'admin' ? $('userSearch') : $('chatSearch');
      if (target) { event.preventDefault(); target.focus(); target.select?.(); }
    }
    if (event.altKey && event.key.toLowerCase() === 'm') {
      const target = $('messageInput') || $('adminMessageInput');
      if (target) { event.preventDefault(); target.focus(); }
    }
    if (event.key === 'Escape' && !$('nexSmartPalette')?.classList.contains('hidden')) closePalette();
  }

  function bindStaticControls() {
    document.querySelectorAll('[data-smart-performance]').forEach((button) => button.addEventListener('click', () => setPerformanceMode(button.dataset.smartPerformance)));
    $('smartPrivacyToggle')?.addEventListener('change', (event) => setPrivacyEnabled(event.currentTarget.checked));
    const installButton = $('smartInstallButton');
    installButton?.addEventListener('click', installApp);
    $('smartOpenPaletteButton')?.addEventListener('click', openPalette);
    $('smartNotePaletteButton')?.addEventListener('click', openPalette);
    $('exportUsersButton')?.addEventListener('click', exportAdminUsers);
    $('conversationNoteAction')?.addEventListener('click', () => { window.UI?.closeModal?.('conversationMenu'); openNote(); });
    $('saveConversationNote')?.addEventListener('click', saveNote);
    $('clearConversationNote')?.addEventListener('click', clearNote);
    $('conversationNoteInput')?.addEventListener('input', (event) => {
      const count = $('conversationNoteCount');
      if (count) count.textContent = `${event.currentTarget.value.length}/2000`;
    });
    document.querySelectorAll('[data-close-smart-note]').forEach((button) => button.addEventListener('click', closeNote));
    document.addEventListener('keydown', handleKeys, true);
    // Only defer the browser install prompt on pages that actually expose the
    // custom install button. Other pages keep Chrome's normal install flow and
    // no longer emit a misleading "preventDefault without prompt" warning.
    if (installButton) {
      window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        installPrompt = event;
        syncInstallButton();
      });
      window.addEventListener('appinstalled', () => {
        installPrompt = null;
        syncInstallButton();
        toast(t('installed'), 'success');
      });
    }
    window.addEventListener('online', () => updateNetwork(true));
    window.addEventListener('offline', () => updateNetwork(false));
    document.addEventListener('nexchat:network', (event) => updateNetwork(Boolean(event.detail?.online)));
    document.addEventListener('visibilitychange', () => {
      if (!privacyEnabled()) return;
      if (document.hidden) safeSet(sessionStorage, STORAGE.privacyReturn, '1');
      else if (safeGet(sessionStorage, STORAGE.privacyReturn, '0') === '1') lockPrivacy();
    });
    window.addEventListener('languagechange', applyTranslations);
  }

  function init() {
    root.dataset.smartTools = 'ready';
    root.dataset.performanceMode = performanceMode();
    setPerformanceMode(performanceMode(), false);
    setPrivacyEnabled(privacyEnabled());
    bindStaticControls();
    applyTranslations();
    syncInstallButton();
    updateNetwork(navigator.onLine, true);
    if (safeGet(sessionStorage, STORAGE.privacyReturn, '0') === '1' && privacyEnabled()) lockPrivacy();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();

  window.NexSmart = Object.freeze({
    version: VERSION,
    openPalette,
    lock: lockPrivacy,
    unlock: unlockPrivacy,
    setPerformanceMode,
    get performanceMode() { return performanceMode(); },
  });
})();

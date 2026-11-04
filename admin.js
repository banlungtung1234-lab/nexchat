(() => {
  const socket = io({reconnection:true,reconnectionAttempts:Infinity,reconnectionDelay:500,reconnectionDelayMax:8000,randomizationFactor:0.35,timeout:15000,transports:['websocket','polling']});
  UI.bindSystemSocket?.(socket);
  const icon = (name, cls="") => UI.iconHTML(name, cls);
  const state = {
    users: [],
    selectedUser: null,
    selectedFile: null,
    selectedFileUrl: null,
    reports: [],
    reportCounts: {pending:0,investigating:0,actioned:0,dismissed:0},
    selectedReport: null,
    supportMessages: [],
    remoteTyping: null,
    typingTimer: null,
    typingActive: false,
    lastTypingSignalAt: 0,
    composerComposing: false,
    composerResizeFrame: 0,
    connectionState: 'connecting',
    system: { worldChatEnabled: true, worldChat:{mode:'open',lockedUntil:null,slowModeSeconds:0,antiSpamEnabled:true,enabled:true}, activeAnnouncement: null, activeAnnouncements: [], maxAccounts:1000, accountCapacity:{used:0,max:1000,unlimited:false,remaining:1000,full:false} },
  };

  const ADMIN_TEXT = {
    vi:{administrator:"Quản trị viên",securityVerified:"Bảo mật mức 2 đã xác minh",searchUsers:"Tìm tên, số điện thoại...",allStatuses:"Tất cả trạng thái",activeStatus:"Đang hoạt động",lockedStatus:"Đang khóa",bannedStatus:"Đang bị cấm",users:"Người dùng",adminLogout:"Đăng xuất quản trị",adminCenter:"TRUNG TÂM QUẢN TRỊ",systemManagement:"Quản lý hệ thống",connecting:"Đang kết nối",connected:"Đã kết nối",disconnected:"Mất kết nối",userProfile:"HỒ SƠ NGƯỜI DÙNG",information:"Thông tin",supportChat:"Hỗ trợ",username:"Tên đăng nhập",phone:"Số điện thoại",email:"Email",registeredDate:"Ngày đăng ký",lastActive:"Lần cuối hoạt động",friends:"Bạn bè",sessions:"Phiên đăng nhập",specialEffects:"Hiệu ứng đặc biệt",profileBadges:"Biểu tượng hồ sơ",changePassword:"Đổi mật khẩu",grantEffects:"Cấp quyền hiệu ứng",revokeEffects:"Thu hồi quyền hiệu ứng",managePrivileges:"Quản lý VIP / LEGEND",lockBan:"Khóa / Ban",unlock:"Mở khóa",liveSupport:"HỖ TRỢ TRỰC TIẾP",messageUser:"Nhập tin nhắn cho người dùng...",noUsers:"Không tìm thấy người dùng",online:"Đang online",offline:"Ngoại tuyến",active:"Đang hoạt động",locked:"Đang bị khóa",banned:"Đang bị cấm",notProvided:"Chưa cung cấp",people:"người",devices:"thiết bị",granted:"Đã cấp",notGranted:"Chưa cấp",noPrivileges:"Chưa cấp",accountInfo:"Thông tin tài khoản",supportFor:"Hỗ trợ {name}",conversation:"Cuộc trò chuyện",noSupport:"Chưa có tin hỗ trợ",startSupport:"Gửi tin nhắn để bắt đầu hỗ trợ người dùng.",admin:"Quản trị viên",seen:"Đã xem",sent:"Đã gửi",permanent:"Vĩnh viễn",noReason:"Không có lý do",accountBan:"Cấm tài khoản",accountLock:"Khóa tài khoản",duration:"Thời hạn",reason:"Lý do"},
    en:{administrator:"Administrator",securityVerified:"Level 2 security verified",searchUsers:"Search name, phone or email...",allStatuses:"All statuses",activeStatus:"Active",lockedStatus:"Locked",bannedStatus:"Banned",users:"Users",adminLogout:"Admin sign out",adminCenter:"ADMIN CENTER",systemManagement:"System management",connecting:"Connecting",connected:"Connected",disconnected:"Disconnected",userProfile:"USER PROFILE",information:"Information",supportChat:"Support",username:"Username",phone:"Phone number",email:"Email",registeredDate:"Registered",lastActive:"Last active",friends:"Friends",sessions:"Login sessions",specialEffects:"Special effects",profileBadges:"Profile badges",changePassword:"Change password",grantEffects:"Grant effects",revokeEffects:"Revoke effects",managePrivileges:"Manage VIP / LEGEND",lockBan:"Lock / Ban",unlock:"Unlock",liveSupport:"LIVE SUPPORT",messageUser:"Message this user...",noUsers:"No users found",online:"Online",offline:"Offline",active:"Active",locked:"Locked",banned:"Banned",notProvided:"Not provided",people:"people",devices:"devices",granted:"Granted",notGranted:"Not granted",noPrivileges:"None",accountInfo:"Account information",supportFor:"Support {name}",conversation:"Conversation",noSupport:"No support messages",startSupport:"Send a message to start supporting this user.",admin:"Administrator",seen:"Seen",sent:"Sent",permanent:"Permanent",noReason:"No reason",accountBan:"Account ban",accountLock:"Account lock",duration:"Duration",reason:"Reason"},
    zh:{administrator:"管理员",securityVerified:"二级安全验证已完成",searchUsers:"搜索姓名、手机号或邮箱...",allStatuses:"全部状态",activeStatus:"正常",lockedStatus:"已锁定",bannedStatus:"已封禁",users:"用户",adminLogout:"退出管理端",adminCenter:"管理中心",systemManagement:"系统管理",connecting:"连接中",connected:"已连接",disconnected:"连接已断开",userProfile:"用户资料",information:"资料",supportChat:"客服",username:"用户名",phone:"手机号",email:"邮箱",registeredDate:"注册日期",lastActive:"最后活动",friends:"好友",sessions:"登录设备",specialEffects:"特殊效果",profileBadges:"资料徽章",changePassword:"修改密码",grantEffects:"授予特效",revokeEffects:"撤销特效",managePrivileges:"管理 VIP / LEGEND",lockBan:"锁定 / 封禁",unlock:"解除限制",liveSupport:"在线客服",messageUser:"给该用户发送消息...",noUsers:"未找到用户",online:"在线",offline:"离线",active:"正常",locked:"已锁定",banned:"已封禁",notProvided:"未提供",people:"人",devices:"台设备",granted:"已授予",notGranted:"未授予",noPrivileges:"无",accountInfo:"账户信息",supportFor:"支持 {name}",conversation:"会话",noSupport:"暂无客服消息",startSupport:"发送消息以开始支持该用户。",admin:"管理员",seen:"已读",sent:"已发送",permanent:"永久",noReason:"无原因",accountBan:"封禁账户",accountLock:"锁定账户",duration:"期限",reason:"原因"},
    ru:{administrator:"Администратор",securityVerified:"Защита уровня 2 подтверждена",searchUsers:"Поиск по имени, телефону или email...",allStatuses:"Все статусы",activeStatus:"Активные",lockedStatus:"Заблокированные",bannedStatus:"Забаненные",users:"Пользователи",adminLogout:"Выйти из админки",adminCenter:"ЦЕНТР УПРАВЛЕНИЯ",systemManagement:"Управление системой",connecting:"Подключение",connected:"Подключено",disconnected:"Нет соединения",userProfile:"ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ",information:"Информация",supportChat:"Поддержка",username:"Имя пользователя",phone:"Телефон",email:"Email",registeredDate:"Регистрация",lastActive:"Последняя активность",friends:"Друзья",sessions:"Сеансы входа",specialEffects:"Спецэффекты",profileBadges:"Значки профиля",changePassword:"Сменить пароль",grantEffects:"Выдать эффекты",revokeEffects:"Отозвать эффекты",managePrivileges:"Управление VIP / LEGEND",lockBan:"Блок / Бан",unlock:"Разблокировать",liveSupport:"ПОДДЕРЖКА",messageUser:"Сообщение пользователю...",noUsers:"Пользователи не найдены",online:"Онлайн",offline:"Не в сети",active:"Активен",locked:"Заблокирован",banned:"Забанен",notProvided:"Не указано",people:"чел.",devices:"устройств",granted:"Выдано",notGranted:"Не выдано",noPrivileges:"Нет",accountInfo:"Данные аккаунта",supportFor:"Поддержка {name}",conversation:"Диалог",noSupport:"Сообщений поддержки нет",startSupport:"Отправьте сообщение, чтобы начать поддержку.",admin:"Администратор",seen:"Прочитано",sent:"Отправлено",permanent:"Навсегда",noReason:"Причина не указана",accountBan:"Бан аккаунта",accountLock:"Блокировка аккаунта",duration:"Срок",reason:"Причина"},
    de:{administrator:"Administrator",securityVerified:"Sicherheitsstufe 2 bestätigt",searchUsers:"Name, Telefonnummer oder E-Mail suchen...",allStatuses:"Alle Status",activeStatus:"Aktiv",lockedStatus:"Gesperrt",bannedStatus:"Gebannt",users:"Benutzer",adminLogout:"Admin abmelden",adminCenter:"ADMIN-ZENTRALE",systemManagement:"Systemverwaltung",connecting:"Verbindung wird hergestellt",connected:"Verbunden",disconnected:"Verbindung getrennt",userProfile:"BENUTZERPROFIL",information:"Informationen",supportChat:"Support",username:"Benutzername",phone:"Telefonnummer",email:"E-Mail",registeredDate:"Registriert",lastActive:"Zuletzt aktiv",friends:"Freunde",sessions:"Anmeldesitzungen",specialEffects:"Spezialeffekte",profileBadges:"Profilabzeichen",changePassword:"Passwort ändern",grantEffects:"Effekte freigeben",revokeEffects:"Effekte entziehen",managePrivileges:"VIP / LEGEND verwalten",lockBan:"Sperren / Bannen",unlock:"Entsperren",liveSupport:"LIVE-SUPPORT",messageUser:"Nachricht an den Benutzer...",noUsers:"Keine Benutzer gefunden",online:"Online",offline:"Offline",active:"Aktiv",locked:"Gesperrt",banned:"Gebannt",notProvided:"Nicht angegeben",people:"Personen",devices:"Geräte",granted:"Freigegeben",notGranted:"Nicht freigegeben",noPrivileges:"Keine",accountInfo:"Kontoinformationen",supportFor:"Support für {name}",conversation:"Unterhaltung",noSupport:"Keine Support-Nachrichten",startSupport:"Sende eine Nachricht, um den Support zu starten.",admin:"Administrator",seen:"Gesehen",sent:"Gesendet",permanent:"Dauerhaft",noReason:"Kein Grund",accountBan:"Konto bannen",accountLock:"Konto sperren",duration:"Dauer",reason:"Grund"},
    th:{administrator:"ผู้ดูแลระบบ",securityVerified:"ยืนยันความปลอดภัยระดับ 2 แล้ว",searchUsers:"ค้นหาชื่อ เบอร์โทร หรืออีเมล...",allStatuses:"ทุกสถานะ",activeStatus:"ใช้งานอยู่",lockedStatus:"ถูกล็อก",bannedStatus:"ถูกแบน",users:"ผู้ใช้",adminLogout:"ออกจากระบบผู้ดูแล",adminCenter:"ศูนย์ผู้ดูแล",systemManagement:"จัดการระบบ",connecting:"กำลังเชื่อมต่อ",connected:"เชื่อมต่อแล้ว",disconnected:"ขาดการเชื่อมต่อ",userProfile:"โปรไฟล์ผู้ใช้",information:"ข้อมูล",supportChat:"ช่วยเหลือ",username:"ชื่อผู้ใช้",phone:"เบอร์โทร",email:"อีเมล",registeredDate:"วันที่สมัคร",lastActive:"ใช้งานล่าสุด",friends:"เพื่อน",sessions:"เซสชันเข้าสู่ระบบ",specialEffects:"เอฟเฟกต์พิเศษ",profileBadges:"ตราโปรไฟล์",changePassword:"เปลี่ยนรหัสผ่าน",grantEffects:"ให้สิทธิ์เอฟเฟกต์",revokeEffects:"ถอนสิทธิ์เอฟเฟกต์",managePrivileges:"จัดการ VIP / LEGEND",lockBan:"ล็อก / แบน",unlock:"ปลดล็อก",liveSupport:"ช่วยเหลือแบบสด",messageUser:"พิมพ์ข้อความถึงผู้ใช้...",noUsers:"ไม่พบผู้ใช้",online:"ออนไลน์",offline:"ออฟไลน์",active:"ใช้งานอยู่",locked:"ถูกล็อก",banned:"ถูกแบน",notProvided:"ไม่ได้ระบุ",people:"คน",devices:"อุปกรณ์",granted:"ให้สิทธิ์แล้ว",notGranted:"ยังไม่ได้ให้สิทธิ์",noPrivileges:"ไม่มี",accountInfo:"ข้อมูลบัญชี",supportFor:"ช่วยเหลือ {name}",conversation:"การสนทนา",noSupport:"ยังไม่มีข้อความช่วยเหลือ",startSupport:"ส่งข้อความเพื่อเริ่มช่วยเหลือผู้ใช้คนนี้",admin:"ผู้ดูแลระบบ",seen:"อ่านแล้ว",sent:"ส่งแล้ว",permanent:"ถาวร",noReason:"ไม่มีเหตุผล",accountBan:"แบนบัญชี",accountLock:"ล็อกบัญชี",duration:"ระยะเวลา",reason:"เหตุผล"}
  };
  const ADMIN_EXTRA_TEXT={
    vi:{allUsers:"Tất cả người dùng",registeredAccounts:"Tài khoản đã đăng ký",onlineUsers:"Đang hoạt động",realtimeConnections:"Kết nối realtime",offlineUsers:"Ngoại tuyến",notConnected:"Không kết nối",restrictedAccounts:"Đã khóa / ban",restrictedHint:"Tài khoản bị hạn chế",effectAccess:"Có thể dùng hiệu ứng",effectAccessHint:"Admin hoặc VIP/LEGEND",vipMembers:"Thành viên VIP",vipActive:"Biểu tượng V đang hoạt động",legendMembers:"Thành viên LEGEND",legendActive:"Biểu tượng L đang hoạt động",unreadSupport:"Tin hỗ trợ chưa đọc",needsHandling:"Cần xử lý",globalControls:"ĐIỀU KHIỂN TOÀN HỆ THỐNG",worldServerTitle:"Chat thế giới & thông báo server",worldServerDesc:"Các thay đổi được áp dụng realtime tới mọi thiết bị đang mở NexChat.",worldChatOpen:"Chat thế giới đang mở",worldCoordination:"Điều phối chat thế giới",worldCoordinationDesc:"Quản lý quyền gửi, tốc độ trò chuyện và chống spam. Tin nhắn cũ luôn được giữ nguyên.",operatingMode:"Chế độ hoạt động",everyoneCanChat:"Mọi thành viên được nhắn",adminOnlyChat:"Chỉ quản trị viên được nhắn",readOnlyChat:"Chỉ đọc · không ai được nhắn",slowMode:"Slow mode",off:"Tắt",smartAntiSpam:"Chống spam thông minh",applyConfig:"Áp dụng cấu hình",adminFeaturedMessage:"Tin nổi bật từ quản trị viên",sendWorldChat:"Gửi vào chat thế giới",serverAnnouncement:"Thông báo chạy ngang toàn server",serverAnnouncementDesc:"Thông báo xuất hiện ngay trên đầu tất cả trang và tự biến mất khi hết thời gian.",announcementContent:"Nội dung thông báo",announcementDuration:"Thời gian hiển thị",sendAnnouncement:"Gửi thông báo",effectCenter:"Trung tâm hiệu ứng bóng chat",profilePrivilegeCenter:"Trung tâm VIP & LEGEND",activePrivileges:"Đặc quyền đang hoạt động",chooseUser:"Chọn một người dùng",chooseUserDesc:"Xem thông tin chi tiết, trò chuyện hoặc quản lý trạng thái tài khoản."},
    en:{allUsers:"All users",registeredAccounts:"Registered accounts",onlineUsers:"Online",realtimeConnections:"Realtime connections",offlineUsers:"Offline",notConnected:"Not connected",restrictedAccounts:"Locked / banned",restrictedHint:"Restricted accounts",effectAccess:"Effect access",effectAccessHint:"Admin or VIP/LEGEND",vipMembers:"VIP members",vipActive:"Active V badge",legendMembers:"LEGEND members",legendActive:"Active L badge",unreadSupport:"Unread support",needsHandling:"Needs attention",globalControls:"SYSTEM-WIDE CONTROLS",worldServerTitle:"World chat & server announcements",worldServerDesc:"Changes are applied in realtime to every open NexChat device.",worldChatOpen:"World chat is open",worldCoordination:"World chat controls",worldCoordinationDesc:"Manage sending permissions, chat speed and anti-spam while keeping old messages.",operatingMode:"Operating mode",everyoneCanChat:"Everyone can send",adminOnlyChat:"Admins only",readOnlyChat:"Read only · nobody can send",slowMode:"Slow mode",off:"Off",smartAntiSpam:"Smart anti-spam",applyConfig:"Apply settings",adminFeaturedMessage:"Featured admin message",sendWorldChat:"Send to world chat",serverAnnouncement:"Server announcement carousel",serverAnnouncementDesc:"Appears instantly at the top of every page and expires automatically.",announcementContent:"Announcement content",announcementDuration:"Display duration",sendAnnouncement:"Send announcement",effectCenter:"Chat bubble effects center",profilePrivilegeCenter:"VIP & LEGEND center",activePrivileges:"Active privileges",chooseUser:"Choose a user",chooseUserDesc:"View full details, chat or manage account restrictions."},
    zh:{allUsers:"全部用户",registeredAccounts:"已注册账户",onlineUsers:"在线",realtimeConnections:"实时连接",offlineUsers:"离线",notConnected:"未连接",restrictedAccounts:"锁定 / 封禁",restrictedHint:"受限账户",effectAccess:"可使用特效",effectAccessHint:"管理员或 VIP/LEGEND",vipMembers:"VIP 成员",vipActive:"V 徽章生效中",legendMembers:"LEGEND 成员",legendActive:"L 徽章生效中",unreadSupport:"未读客服消息",needsHandling:"需要处理",globalControls:"全局控制",worldServerTitle:"世界聊天与服务器通知",worldServerDesc:"更改会实时应用到所有已打开 NexChat 的设备。",worldChatOpen:"世界聊天已开启",worldCoordination:"世界聊天控制",worldCoordinationDesc:"管理发送权限、聊天速度和防刷屏，并保留历史消息。",operatingMode:"运行模式",everyoneCanChat:"所有成员可发送",adminOnlyChat:"仅管理员可发送",readOnlyChat:"只读 · 无人可发送",slowMode:"慢速模式",off:"关闭",smartAntiSpam:"智能防刷屏",applyConfig:"应用设置",adminFeaturedMessage:"管理员置顶消息",sendWorldChat:"发送到世界聊天",serverAnnouncement:"全站滚动通知",serverAnnouncementDesc:"立即显示在所有页面顶部，并在到期后自动消失。",announcementContent:"通知内容",announcementDuration:"显示时间",sendAnnouncement:"发送通知",effectCenter:"聊天气泡特效中心",profilePrivilegeCenter:"VIP 与 LEGEND 中心",activePrivileges:"当前特权",chooseUser:"选择用户",chooseUserDesc:"查看完整资料、聊天或管理账户限制。"},
    ru:{allUsers:"Все пользователи",registeredAccounts:"Зарегистрированные аккаунты",onlineUsers:"Онлайн",realtimeConnections:"Realtime-подключения",offlineUsers:"Не в сети",notConnected:"Нет подключения",restrictedAccounts:"Блок / бан",restrictedHint:"Ограниченные аккаунты",effectAccess:"Доступ к эффектам",effectAccessHint:"Админ или VIP/LEGEND",vipMembers:"VIP-участники",vipActive:"Значок V активен",legendMembers:"LEGEND-участники",legendActive:"Значок L активен",unreadSupport:"Непрочитанная поддержка",needsHandling:"Требует обработки",globalControls:"ОБЩЕСИСТЕМНОЕ УПРАВЛЕНИЕ",worldServerTitle:"Мировой чат и объявления",worldServerDesc:"Изменения применяются в реальном времени на всех открытых устройствах NexChat.",worldChatOpen:"Мировой чат открыт",worldCoordination:"Управление мировым чатом",worldCoordinationDesc:"Права отправки, скорость и антиспам без удаления старых сообщений.",operatingMode:"Режим работы",everyoneCanChat:"Все могут писать",adminOnlyChat:"Только администраторы",readOnlyChat:"Только чтение",slowMode:"Медленный режим",off:"Выкл.",smartAntiSpam:"Умный антиспам",applyConfig:"Применить",adminFeaturedMessage:"Сообщение администратора",sendWorldChat:"Отправить в мировой чат",serverAnnouncement:"Бегущие объявления сервера",serverAnnouncementDesc:"Сразу появляются сверху всех страниц и исчезают по таймеру.",announcementContent:"Текст объявления",announcementDuration:"Время показа",sendAnnouncement:"Отправить объявление",effectCenter:"Центр эффектов чата",profilePrivilegeCenter:"Центр VIP & LEGEND",activePrivileges:"Активные привилегии",chooseUser:"Выберите пользователя",chooseUserDesc:"Просмотр данных, чат и управление ограничениями."},
    de:{allUsers:"Alle Benutzer",registeredAccounts:"Registrierte Konten",onlineUsers:"Online",realtimeConnections:"Realtime-Verbindungen",offlineUsers:"Offline",notConnected:"Nicht verbunden",restrictedAccounts:"Gesperrt / gebannt",restrictedHint:"Eingeschränkte Konten",effectAccess:"Effektzugriff",effectAccessHint:"Admin oder VIP/LEGEND",vipMembers:"VIP-Mitglieder",vipActive:"V-Abzeichen aktiv",legendMembers:"LEGEND-Mitglieder",legendActive:"L-Abzeichen aktiv",unreadSupport:"Ungelesener Support",needsHandling:"Muss bearbeitet werden",globalControls:"SYSTEMWEITE STEUERUNG",worldServerTitle:"Weltchat & Servermeldungen",worldServerDesc:"Änderungen werden in Echtzeit auf allen geöffneten NexChat-Geräten angewendet.",worldChatOpen:"Weltchat ist geöffnet",worldCoordination:"Weltchat steuern",worldCoordinationDesc:"Sende-Rechte, Geschwindigkeit und Anti-Spam verwalten, ohne alte Nachrichten zu verlieren.",operatingMode:"Betriebsmodus",everyoneCanChat:"Alle dürfen schreiben",adminOnlyChat:"Nur Administratoren",readOnlyChat:"Nur lesen",slowMode:"Slow Mode",off:"Aus",smartAntiSpam:"Intelligenter Spam-Schutz",applyConfig:"Einstellungen anwenden",adminFeaturedMessage:"Hervorgehobene Admin-Nachricht",sendWorldChat:"In den Weltchat senden",serverAnnouncement:"Laufende Servermeldung",serverAnnouncementDesc:"Wird sofort oben auf allen Seiten angezeigt und läuft automatisch ab.",announcementContent:"Inhalt",announcementDuration:"Anzeigedauer",sendAnnouncement:"Meldung senden",effectCenter:"Zentrum für Chat-Effekte",profilePrivilegeCenter:"VIP & LEGEND-Zentrum",activePrivileges:"Aktive Privilegien",chooseUser:"Benutzer auswählen",chooseUserDesc:"Vollständige Daten ansehen, chatten oder Einschränkungen verwalten."},
    th:{allUsers:"ผู้ใช้ทั้งหมด",registeredAccounts:"บัญชีที่ลงทะเบียน",onlineUsers:"ออนไลน์",realtimeConnections:"การเชื่อมต่อเรียลไทม์",offlineUsers:"ออฟไลน์",notConnected:"ไม่ได้เชื่อมต่อ",restrictedAccounts:"ล็อก / แบน",restrictedHint:"บัญชีที่ถูกจำกัด",effectAccess:"ใช้เอฟเฟกต์ได้",effectAccessHint:"ผู้ดูแลหรือ VIP/LEGEND",vipMembers:"สมาชิก VIP",vipActive:"ตรา V กำลังใช้งาน",legendMembers:"สมาชิก LEGEND",legendActive:"ตรา L กำลังใช้งาน",unreadSupport:"ข้อความช่วยเหลือที่ยังไม่อ่าน",needsHandling:"ต้องจัดการ",globalControls:"ควบคุมทั้งระบบ",worldServerTitle:"แชทโลกและประกาศเซิร์ฟเวอร์",worldServerDesc:"การเปลี่ยนแปลงจะมีผลแบบเรียลไทม์กับทุกอุปกรณ์ที่เปิด NexChat",worldChatOpen:"แชทโลกเปิดอยู่",worldCoordination:"ควบคุมแชทโลก",worldCoordinationDesc:"จัดการสิทธิ์ส่ง ความเร็ว และป้องกันสแปม โดยเก็บข้อความเดิมไว้",operatingMode:"โหมดการทำงาน",everyoneCanChat:"ทุกคนส่งได้",adminOnlyChat:"เฉพาะผู้ดูแล",readOnlyChat:"อ่านอย่างเดียว",slowMode:"โหมดช้า",off:"ปิด",smartAntiSpam:"ป้องกันสแปมอัจฉริยะ",applyConfig:"ใช้การตั้งค่า",adminFeaturedMessage:"ข้อความเด่นจากผู้ดูแล",sendWorldChat:"ส่งไปแชทโลก",serverAnnouncement:"ประกาศวิ่งทั้งเซิร์ฟเวอร์",serverAnnouncementDesc:"แสดงทันทีด้านบนทุกหน้าและหายไปอัตโนมัติเมื่อหมดเวลา",announcementContent:"เนื้อหาประกาศ",announcementDuration:"ระยะเวลาแสดง",sendAnnouncement:"ส่งประกาศ",effectCenter:"ศูนย์เอฟเฟกต์บอลลูนแชท",profilePrivilegeCenter:"ศูนย์ VIP & LEGEND",activePrivileges:"สิทธิพิเศษที่ใช้งาน",chooseUser:"เลือกผู้ใช้",chooseUserDesc:"ดูข้อมูลทั้งหมด แชท หรือจัดการข้อจำกัดบัญชี"}
  };
  const ADMIN_MORE_TEXT={
    vi:{stopAllAnnouncements:"Kết thúc tất cả",specialEffectsKicker:"HIỆU ỨNG ĐẶC BIỆT",effectDescription:"Nhập đúng tên đăng nhập để cấp hoặc thu hồi 10 hiệu ứng. Thay đổi được gửi tới người dùng ngay lập tức.",currentlyAllowed:"Đang có quyền",accounts:"tài khoản",grantPermission:"Cấp quyền",revokePermission:"Thu hồi quyền",peopleWithPermission:"Người đang có quyền",accessSourceHint:"Admin cấp hoặc VIP/LEGEND còn hạn",profilePrivilegesKicker:"ĐẶC QUYỀN HỒ SƠ",badgeDescription:"Cấp biểu tượng nổi bật cạnh ảnh đại diện theo thời hạn hoặc vĩnh viễn. Hệ thống tự ẩn ngay khi hết hạn.",badge:"Biểu tượng",expiry:"Thời hạn",minutes:"Số phút",grantBadge:"Cấp biểu tượng",revoke:"Thu hồi",remainingAuto:"Thời gian còn lại được cập nhật tự động",accountInformation:"Thông tin tài khoản",conversation:"Cuộc trò chuyện",changePasswordTitle:"Đổi mật khẩu người dùng",changePasswordDescription:"Mật khẩu mới phải có 8–72 ký tự, gồm ít nhất một chữ và một số. Mật khẩu hiện tại không được hiển thị.",newPassword:"Mật khẩu mới",show:"Hiện",cancel:"Hủy",savePassword:"Lưu mật khẩu",restrictTitle:"Khóa hoặc cấm tài khoản",restrictDescription:"Người dùng sẽ nhận thông báo ngay lập tức và tự động đăng xuất.",lockAccount:"Khóa tài khoản",suspendAccess:"Tạm ngừng truy cập",banAccount:"Cấm tài khoản",severeViolation:"Áp dụng với vi phạm nghiêm trọng",applyNow:"Áp dụng ngay",manageBadgeTitle:"Quản lý biểu tượng hồ sơ",manageBadgeDescription:"Chọn loại biểu tượng và thời gian hiển thị cho người dùng.",vipDescription:"V Vitality xanh ngọc viền vàng, phản sáng chuyển động",legendDescription:"L Luxe đỏ ruby viền vàng, ánh kim chuyển động",revokeSelected:"Thu hồi loại đã chọn",grantExtend:"Cấp / gia hạn",confirm:"Xác nhận",fullUserInfo:"Thông tin đầy đủ",profilePublic:"Hồ sơ công khai",joined:"Tham gia",relationship:"Mối quan hệ",birthday:"Sinh nhật",onlineNow:"Đang hoạt động",offlineNow:"Ngoại tuyến"},
    en:{stopAllAnnouncements:"Stop all",specialEffectsKicker:"SPECIAL EFFECTS",effectDescription:"Enter the exact username to grant or revoke all 10 effects. Changes reach the user immediately.",currentlyAllowed:"Currently allowed",accounts:"accounts",grantPermission:"Grant access",revokePermission:"Revoke access",peopleWithPermission:"Users with access",accessSourceHint:"Granted by admin or active VIP/LEGEND",profilePrivilegesKicker:"PROFILE PRIVILEGES",badgeDescription:"Grant a profile badge for a limited time or permanently. It hides automatically when expired.",badge:"Badge",expiry:"Duration",minutes:"Minutes",grantBadge:"Grant badge",revoke:"Revoke",remainingAuto:"Remaining time updates automatically",accountInformation:"Account information",conversation:"Conversation",changePasswordTitle:"Change user password",changePasswordDescription:"The new password must contain 8–72 characters with at least one letter and one number. The current password is never displayed.",newPassword:"New password",show:"Show",cancel:"Cancel",savePassword:"Save password",restrictTitle:"Lock or ban account",restrictDescription:"The user is notified immediately and signed out automatically.",lockAccount:"Lock account",suspendAccess:"Temporarily suspend access",banAccount:"Ban account",severeViolation:"For serious violations",applyNow:"Apply now",manageBadgeTitle:"Manage profile badge",manageBadgeDescription:"Choose a badge and how long it remains visible.",vipDescription:"Subtle color-shifting V badge",legendDescription:"Premium animated red L badge",revokeSelected:"Revoke selected badge",grantExtend:"Grant / extend",confirm:"Confirm",fullUserInfo:"Full information",profilePublic:"Public profile",joined:"Joined",relationship:"Relationship",birthday:"Birthday",onlineNow:"Active now",offlineNow:"Offline"},
    zh:{stopAllAnnouncements:"结束全部",specialEffectsKicker:"特殊效果",effectDescription:"输入准确用户名以授予或撤销 10 种效果。更改会立即同步给用户。",currentlyAllowed:"当前有权限",accounts:"个账户",grantPermission:"授予权限",revokePermission:"撤销权限",peopleWithPermission:"拥有权限的用户",accessSourceHint:"管理员授予或 VIP/LEGEND 有效期内",profilePrivilegesKicker:"资料特权",badgeDescription:"按期限或永久授予资料徽章，到期后自动隐藏。",badge:"徽章",expiry:"期限",minutes:"分钟数",grantBadge:"授予徽章",revoke:"撤销",remainingAuto:"剩余时间自动更新",accountInformation:"账户信息",conversation:"会话",changePasswordTitle:"修改用户密码",changePasswordDescription:"新密码需为 8–72 个字符，并至少包含一个字母和一个数字。当前密码不会显示。",newPassword:"新密码",show:"显示",cancel:"取消",savePassword:"保存密码",restrictTitle:"锁定或封禁账户",restrictDescription:"用户会立即收到通知并自动退出。",lockAccount:"锁定账户",suspendAccess:"暂时停止访问",banAccount:"封禁账户",severeViolation:"适用于严重违规",applyNow:"立即应用",manageBadgeTitle:"管理资料徽章",manageBadgeDescription:"选择徽章类型和显示期限。",vipDescription:"轻微变色的 V 徽章",legendDescription:"高级动态红色 L 徽章",revokeSelected:"撤销所选类型",grantExtend:"授予 / 延长",confirm:"确认",fullUserInfo:"完整信息",profilePublic:"公开资料",joined:"加入时间",relationship:"关系状态",birthday:"生日",onlineNow:"当前在线",offlineNow:"离线"},
    ru:{stopAllAnnouncements:"Завершить все",specialEffectsKicker:"ОСОБЫЕ ЭФФЕКТЫ",effectDescription:"Введите точное имя пользователя, чтобы выдать или отозвать 10 эффектов. Изменения применяются сразу.",currentlyAllowed:"Доступ активен",accounts:"аккаунтов",grantPermission:"Выдать доступ",revokePermission:"Отозвать доступ",peopleWithPermission:"Пользователи с доступом",accessSourceHint:"Выдано админом или активный VIP/LEGEND",profilePrivilegesKicker:"ПРИВИЛЕГИИ ПРОФИЛЯ",badgeDescription:"Выдайте значок на срок или навсегда. После окончания он скроется автоматически.",badge:"Значок",expiry:"Срок",minutes:"Минуты",grantBadge:"Выдать значок",revoke:"Отозвать",remainingAuto:"Оставшееся время обновляется автоматически",accountInformation:"Данные аккаунта",conversation:"Диалог",changePasswordTitle:"Сменить пароль пользователя",changePasswordDescription:"Новый пароль должен содержать 8–72 символа, минимум одну букву и одну цифру. Текущий пароль не показывается.",newPassword:"Новый пароль",show:"Показать",cancel:"Отмена",savePassword:"Сохранить пароль",restrictTitle:"Заблокировать или забанить",restrictDescription:"Пользователь сразу получит уведомление и будет автоматически выведен из аккаунта.",lockAccount:"Заблокировать аккаунт",suspendAccess:"Временно закрыть доступ",banAccount:"Забанить аккаунт",severeViolation:"Для серьёзных нарушений",applyNow:"Применить",manageBadgeTitle:"Управление значком профиля",manageBadgeDescription:"Выберите тип значка и срок отображения.",vipDescription:"Мягко переливающийся значок V",legendDescription:"Премиальный анимированный красный L",revokeSelected:"Отозвать выбранный",grantExtend:"Выдать / продлить",confirm:"Подтвердить",fullUserInfo:"Полная информация",profilePublic:"Публичный профиль",joined:"Дата регистрации",relationship:"Отношения",birthday:"Дата рождения",onlineNow:"Сейчас онлайн",offlineNow:"Не в сети"},
    de:{stopAllAnnouncements:"Alle beenden",specialEffectsKicker:"SPEZIALEFFEKTE",effectDescription:"Gib den exakten Benutzernamen ein, um alle 10 Effekte freizugeben oder zu entziehen. Änderungen gelten sofort.",currentlyAllowed:"Aktuell berechtigt",accounts:"Konten",grantPermission:"Zugriff geben",revokePermission:"Zugriff entziehen",peopleWithPermission:"Benutzer mit Zugriff",accessSourceHint:"Vom Admin oder durch aktives VIP/LEGEND",profilePrivilegesKicker:"PROFILPRIVILEGIEN",badgeDescription:"Vergib ein Profilabzeichen befristet oder dauerhaft. Nach Ablauf wird es automatisch ausgeblendet.",badge:"Abzeichen",expiry:"Dauer",minutes:"Minuten",grantBadge:"Abzeichen vergeben",revoke:"Entziehen",remainingAuto:"Restzeit wird automatisch aktualisiert",accountInformation:"Kontoinformationen",conversation:"Unterhaltung",changePasswordTitle:"Benutzerpasswort ändern",changePasswordDescription:"Das neue Passwort muss 8–72 Zeichen sowie mindestens einen Buchstaben und eine Zahl enthalten. Das aktuelle Passwort wird nicht angezeigt.",newPassword:"Neues Passwort",show:"Anzeigen",cancel:"Abbrechen",savePassword:"Passwort speichern",restrictTitle:"Konto sperren oder bannen",restrictDescription:"Der Benutzer wird sofort benachrichtigt und automatisch abgemeldet.",lockAccount:"Konto sperren",suspendAccess:"Zugriff vorübergehend sperren",banAccount:"Konto bannen",severeViolation:"Für schwere Verstöße",applyNow:"Jetzt anwenden",manageBadgeTitle:"Profilabzeichen verwalten",manageBadgeDescription:"Wähle Abzeichen und Anzeigedauer.",vipDescription:"Dezent farbwechselndes V",legendDescription:"Hochwertig animiertes rotes L",revokeSelected:"Ausgewähltes entziehen",grantExtend:"Vergeben / verlängern",confirm:"Bestätigen",fullUserInfo:"Vollständige Informationen",profilePublic:"Öffentliches Profil",joined:"Beigetreten",relationship:"Beziehungsstatus",birthday:"Geburtstag",onlineNow:"Jetzt online",offlineNow:"Offline"},
    th:{stopAllAnnouncements:"จบทั้งหมด",specialEffectsKicker:"เอฟเฟกต์พิเศษ",effectDescription:"กรอกชื่อผู้ใช้ให้ถูกต้องเพื่อให้หรือถอนสิทธิ์เอฟเฟกต์ทั้ง 10 แบบ การเปลี่ยนแปลงมีผลทันที",currentlyAllowed:"มีสิทธิ์อยู่",accounts:"บัญชี",grantPermission:"ให้สิทธิ์",revokePermission:"ถอนสิทธิ์",peopleWithPermission:"ผู้ที่มีสิทธิ์",accessSourceHint:"ผู้ดูแลให้สิทธิ์หรือ VIP/LEGEND ยังไม่หมดอายุ",profilePrivilegesKicker:"สิทธิพิเศษโปรไฟล์",badgeDescription:"ให้ตราโปรไฟล์แบบกำหนดเวลาหรือถาวร ระบบจะซ่อนอัตโนมัติเมื่อหมดอายุ",badge:"ตรา",expiry:"ระยะเวลา",minutes:"จำนวนนาที",grantBadge:"ให้ตรา",revoke:"ถอน",remainingAuto:"เวลาคงเหลืออัปเดตอัตโนมัติ",accountInformation:"ข้อมูลบัญชี",conversation:"การสนทนา",changePasswordTitle:"เปลี่ยนรหัสผ่านผู้ใช้",changePasswordDescription:"รหัสผ่านใหม่ต้องมี 8–72 ตัวอักษร โดยมีตัวอักษรและตัวเลขอย่างน้อยอย่างละหนึ่งตัว และจะไม่แสดงรหัสผ่านปัจจุบัน",newPassword:"รหัสผ่านใหม่",show:"แสดง",cancel:"ยกเลิก",savePassword:"บันทึกรหัสผ่าน",restrictTitle:"ล็อกหรือแบนบัญชี",restrictDescription:"ผู้ใช้จะได้รับแจ้งทันทีและออกจากระบบอัตโนมัติ",lockAccount:"ล็อกบัญชี",suspendAccess:"ระงับการเข้าถึงชั่วคราว",banAccount:"แบนบัญชี",severeViolation:"ใช้กับการละเมิดร้ายแรง",applyNow:"ใช้ทันที",manageBadgeTitle:"จัดการตราโปรไฟล์",manageBadgeDescription:"เลือกประเภทตราและระยะเวลาที่แสดง",vipDescription:"ตรา V เปลี่ยนสีแบบนุ่มนวล",legendDescription:"ตรา L สีแดงแบบเคลื่อนไหวพรีเมียม",revokeSelected:"ถอนตราที่เลือก",grantExtend:"ให้ / ต่ออายุ",confirm:"ยืนยัน",fullUserInfo:"ข้อมูลทั้งหมด",profilePublic:"โปรไฟล์สาธารณะ",joined:"เข้าร่วม",relationship:"ความสัมพันธ์",birthday:"วันเกิด",onlineNow:"ออนไลน์อยู่",offlineNow:"ออฟไลน์"}
  };
  const ADMIN_PROFILE_TEXT={
    vi:{nickname:"Tên hiển thị",bio:"Giới thiệu",location:"Khu vực",work:"Công việc",school:"Trường học",messagePrivacy:"Quyền nhắn tin",blockedUsers:"Đã chặn",archivedChats:"Đã lưu trữ",notSet:"Chưa thiết lập"},
    en:{nickname:"Display name",bio:"Bio",location:"Location",work:"Work",school:"School",messagePrivacy:"Messaging privacy",blockedUsers:"Blocked users",archivedChats:"Archived chats",notSet:"Not set"},
    zh:{nickname:"显示名称",bio:"简介",location:"地区",work:"工作",school:"学校",messagePrivacy:"消息隐私",blockedUsers:"已屏蔽",archivedChats:"已归档聊天",notSet:"未设置"},
    ru:{nickname:"Отображаемое имя",bio:"О себе",location:"Местоположение",work:"Работа",school:"Учёба",messagePrivacy:"Настройки сообщений",blockedUsers:"Заблокировано",archivedChats:"Архивные чаты",notSet:"Не указано"},
    de:{nickname:"Anzeigename",bio:"Über mich",location:"Ort",work:"Arbeit",school:"Schule",messagePrivacy:"Nachrichten-Datenschutz",blockedUsers:"Blockierte Benutzer",archivedChats:"Archivierte Chats",notSet:"Nicht festgelegt"},
    th:{nickname:"ชื่อที่แสดง",bio:"แนะนำตัว",location:"ที่อยู่",work:"งาน",school:"สถานศึกษา",messagePrivacy:"ความเป็นส่วนตัวข้อความ",blockedUsers:"ผู้ใช้ที่บล็อก",archivedChats:"แชทที่เก็บถาวร",notSet:"ยังไม่ได้ตั้งค่า"}
  };
  const ADMIN_DYNAMIC_TEXT={
    vi:{worldCanSend:"Mọi thành viên được gửi tin",worldAdminsOnly:"Chỉ quản trị viên được gửi tin",worldReadOnlyHistory:"Kênh chỉ đọc, lịch sử vẫn hiển thị",noRateLimit:"không giới hạn tốc độ",waitBetweenMessages:"chờ {seconds} giây giữa các tin",antiSpamOn:"chống spam đang bật",antiSpamOff:"chống spam đang tắt",autoOpenAfter:"tự mở sau {minutes} phút",ended:"Đã kết thúc",readOnly:"Chỉ đọc",autoOpenIn:"Tự mở lại sau khoảng {minutes} phút.",reopening:"Đang tự mở lại..."},
    en:{worldCanSend:"Everyone can send",worldAdminsOnly:"Only administrators can send",worldReadOnlyHistory:"Read-only channel; history remains visible",noRateLimit:"no rate limit",waitBetweenMessages:"wait {seconds} seconds between messages",antiSpamOn:"anti-spam is on",antiSpamOff:"anti-spam is off",autoOpenAfter:"reopens after {minutes} minutes",ended:"Ended",readOnly:"Read only",autoOpenIn:"Reopens in about {minutes} minutes.",reopening:"Reopening..."},
    zh:{worldCanSend:"所有成员可发送",worldAdminsOnly:"仅管理员可发送",worldReadOnlyHistory:"频道只读，历史消息仍可查看",noRateLimit:"无速度限制",waitBetweenMessages:"每条消息间隔 {seconds} 秒",antiSpamOn:"防刷屏已开启",antiSpamOff:"防刷屏已关闭",autoOpenAfter:"{minutes} 分钟后自动开启",ended:"已结束",readOnly:"只读",autoOpenIn:"约 {minutes} 分钟后重新开启。",reopening:"正在重新开启..."},
    ru:{worldCanSend:"Все участники могут писать",worldAdminsOnly:"Писать могут только администраторы",worldReadOnlyHistory:"Канал только для чтения; история доступна",noRateLimit:"без ограничения скорости",waitBetweenMessages:"пауза {seconds} сек. между сообщениями",antiSpamOn:"антиспам включён",antiSpamOff:"антиспам выключен",autoOpenAfter:"откроется через {minutes} мин.",ended:"Завершено",readOnly:"Только чтение",autoOpenIn:"Откроется примерно через {minutes} мин.",reopening:"Повторное открытие..."},
    de:{worldCanSend:"Alle Mitglieder dürfen schreiben",worldAdminsOnly:"Nur Administratoren dürfen schreiben",worldReadOnlyHistory:"Nur lesen; Verlauf bleibt sichtbar",noRateLimit:"keine Geschwindigkeitsbegrenzung",waitBetweenMessages:"{seconds} Sekunden zwischen Nachrichten",antiSpamOn:"Spam-Schutz ist aktiv",antiSpamOff:"Spam-Schutz ist aus",autoOpenAfter:"öffnet nach {minutes} Minuten",ended:"Beendet",readOnly:"Nur lesen",autoOpenIn:"Öffnet in etwa {minutes} Minuten wieder.",reopening:"Wird wieder geöffnet..."},
    th:{worldCanSend:"สมาชิกทุกคนส่งข้อความได้",worldAdminsOnly:"เฉพาะผู้ดูแลส่งข้อความได้",worldReadOnlyHistory:"ช่องอ่านอย่างเดียวและยังดูประวัติได้",noRateLimit:"ไม่จำกัดความเร็ว",waitBetweenMessages:"รอ {seconds} วินาทีระหว่างข้อความ",antiSpamOn:"เปิดป้องกันสแปม",antiSpamOff:"ปิดป้องกันสแปม",autoOpenAfter:"เปิดอีกครั้งหลัง {minutes} นาที",ended:"สิ้นสุดแล้ว",readOnly:"อ่านอย่างเดียว",autoOpenIn:"จะเปิดอีกครั้งในประมาณ {minutes} นาที",reopening:"กำลังเปิดอีกครั้ง..."}
  };
  const V9_ADMIN_LANG = {"es":{"administrator":"Administrador","securityVerified":"Seguridad de nivel 2 verificada","searchUsers":"Buscar nombre, teléfono o correo...","allStatuses":"Todos los estados","activeStatus":"Activos","lockedStatus":"Bloqueados","bannedStatus":"Suspendidos","users":"Usuarios","adminLogout":"Cerrar sesión de admin","adminCenter":"CENTRO DE ADMINISTRACIÓN","systemManagement":"Gestión del sistema","connecting":"Conectando","connected":"Conectado","disconnected":"Desconectado","userProfile":"PERFIL DE USUARIO","information":"Información","supportChat":"Soporte","username":"Usuario","phone":"Teléfono","email":"Correo","registeredDate":"Registro","lastActive":"Última actividad","friends":"Amigos","sessions":"Sesiones","specialEffects":"Efectos especiales","profileBadges":"Insignias de perfil","changePassword":"Cambiar contraseña","grantEffects":"Conceder efectos","revokeEffects":"Retirar efectos","managePrivileges":"Gestionar VIP / LEGEND","lockBan":"Bloquear / Suspender","unlock":"Desbloquear","liveSupport":"SOPORTE EN VIVO","messageUser":"Escribe al usuario...","noUsers":"No se encontraron usuarios","online":"En línea","offline":"Desconectado","active":"Activo","locked":"Bloqueado","banned":"Suspendido","notProvided":"No proporcionado","people":"personas","devices":"dispositivos","granted":"Concedido","notGranted":"No concedido","noPrivileges":"Ninguno","accountInfo":"Información de cuenta","supportFor":"Soporte para {name}","conversation":"Conversación","noSupport":"No hay mensajes de soporte","startSupport":"Envía un mensaje para comenzar el soporte.","admin":"Administrador","seen":"Visto","sent":"Enviado","permanent":"Permanente","noReason":"Sin motivo","accountBan":"Suspender cuenta","accountLock":"Bloquear cuenta","duration":"Duración","reason":"Motivo"},"fr":{"administrator":"Administrateur","securityVerified":"Sécurité niveau 2 vérifiée","searchUsers":"Rechercher un nom, téléphone ou e-mail...","allStatuses":"Tous les statuts","activeStatus":"Actifs","lockedStatus":"Verrouillés","bannedStatus":"Bannis","users":"Utilisateurs","adminLogout":"Déconnexion admin","adminCenter":"CENTRE D’ADMINISTRATION","systemManagement":"Gestion du système","connecting":"Connexion","connected":"Connecté","disconnected":"Déconnecté","userProfile":"PROFIL UTILISATEUR","information":"Informations","supportChat":"Assistance","username":"Nom d’utilisateur","phone":"Téléphone","email":"E-mail","registeredDate":"Inscription","lastActive":"Dernière activité","friends":"Amis","sessions":"Sessions","specialEffects":"Effets spéciaux","profileBadges":"Badges de profil","changePassword":"Changer le mot de passe","grantEffects":"Accorder les effets","revokeEffects":"Retirer les effets","managePrivileges":"Gérer VIP / LEGEND","lockBan":"Verrouiller / Bannir","unlock":"Déverrouiller","liveSupport":"ASSISTANCE EN DIRECT","messageUser":"Écrire à l’utilisateur...","noUsers":"Aucun utilisateur trouvé","online":"En ligne","offline":"Hors ligne","active":"Actif","locked":"Verrouillé","banned":"Banni","notProvided":"Non renseigné","people":"personnes","devices":"appareils","granted":"Accordé","notGranted":"Non accordé","noPrivileges":"Aucun","accountInfo":"Informations du compte","supportFor":"Assistance pour {name}","conversation":"Conversation","noSupport":"Aucun message d’assistance","startSupport":"Envoyez un message pour commencer l’assistance.","admin":"Administrateur","seen":"Vu","sent":"Envoyé","permanent":"Permanent","noReason":"Aucune raison","accountBan":"Bannir le compte","accountLock":"Verrouiller le compte","duration":"Durée","reason":"Raison"},"ja":{"administrator":"管理者","securityVerified":"レベル2セキュリティ確認済み","searchUsers":"名前・電話番号・メールを検索...","allStatuses":"すべての状態","activeStatus":"有効","lockedStatus":"ロック中","bannedStatus":"停止中","users":"ユーザー","adminLogout":"管理者ログアウト","adminCenter":"管理センター","systemManagement":"システム管理","connecting":"接続中","connected":"接続済み","disconnected":"切断","userProfile":"ユーザープロフィール","information":"情報","supportChat":"サポート","username":"ユーザー名","phone":"電話番号","email":"メール","registeredDate":"登録日","lastActive":"最終アクティブ","friends":"友達","sessions":"ログインセッション","specialEffects":"特殊エフェクト","profileBadges":"プロフィールバッジ","changePassword":"パスワード変更","grantEffects":"エフェクトを付与","revokeEffects":"エフェクトを解除","managePrivileges":"VIP / LEGEND 管理","lockBan":"ロック / 停止","unlock":"解除","liveSupport":"ライブサポート","messageUser":"ユーザーにメッセージ...","noUsers":"ユーザーが見つかりません","online":"オンライン","offline":"オフライン","active":"有効","locked":"ロック中","banned":"停止中","notProvided":"未設定","people":"人","devices":"台","granted":"付与済み","notGranted":"未付与","noPrivileges":"なし","accountInfo":"アカウント情報","supportFor":"{name} のサポート","conversation":"会話","noSupport":"サポートメッセージはありません","startSupport":"メッセージを送ってサポートを開始してください。","admin":"管理者","seen":"既読","sent":"送信済み","permanent":"無期限","noReason":"理由なし","accountBan":"アカウント停止","accountLock":"アカウントロック","duration":"期間","reason":"理由"}};
  for (const code of Object.keys(V9_ADMIN_LANG)) {
    ADMIN_TEXT[code] = { ...ADMIN_TEXT.en, ...V9_ADMIN_LANG[code] };
    ADMIN_EXTRA_TEXT[code] = { ...ADMIN_EXTRA_TEXT.en };
    ADMIN_MORE_TEXT[code] = { ...ADMIN_MORE_TEXT.en };
    ADMIN_PROFILE_TEXT[code] = { ...ADMIN_PROFILE_TEXT.en };
    ADMIN_DYNAMIC_TEXT[code] = { ...ADMIN_DYNAMIC_TEXT.en };
  }
  for(const lang of Object.keys(ADMIN_TEXT))Object.assign(ADMIN_TEXT[lang],ADMIN_EXTRA_TEXT[lang]||ADMIN_EXTRA_TEXT.en,ADMIN_MORE_TEXT[lang]||ADMIN_MORE_TEXT.en,ADMIN_PROFILE_TEXT[lang]||ADMIN_PROFILE_TEXT.en,ADMIN_DYNAMIC_TEXT[lang]||ADMIN_DYNAMIC_TEXT.en);
  const V9_SECURITY_TEXT={
    vi:{securityActivityEyebrow:"BẢO MẬT & NHẬT KÝ",securityActivityTitle:"Hoạt động quản trị gần đây",securityActivityDesc:"Các thao tác quan trọng được ghi lại mà không lưu mật khẩu hoặc nội dung bí mật.",refresh:"Làm mới",loadingAudit:"Đang tải nhật ký...",noAudit:"Chưa có thao tác quản trị nào được ghi nhận."},
    en:{securityActivityEyebrow:"SECURITY & AUDIT",securityActivityTitle:"Recent admin activity",securityActivityDesc:"Important actions are logged without storing passwords or secret content.",refresh:"Refresh",loadingAudit:"Loading activity...",noAudit:"No administrative activity has been recorded yet."},
    zh:{securityActivityEyebrow:"安全与审计",securityActivityTitle:"最近的管理活动",securityActivityDesc:"系统会记录重要操作，但不会保存密码或机密内容。",refresh:"刷新",loadingAudit:"正在加载活动...",noAudit:"尚未记录管理操作。"},
    ru:{securityActivityEyebrow:"БЕЗОПАСНОСТЬ И АУДИТ",securityActivityTitle:"Последние действия администратора",securityActivityDesc:"Важные действия записываются без паролей и секретных данных.",refresh:"Обновить",loadingAudit:"Загрузка журнала...",noAudit:"Действия администратора пока не зафиксированы."},
    de:{securityActivityEyebrow:"SICHERHEIT & PROTOKOLL",securityActivityTitle:"Letzte Admin-Aktivitäten",securityActivityDesc:"Wichtige Aktionen werden ohne Passwörter oder geheime Inhalte protokolliert.",refresh:"Aktualisieren",loadingAudit:"Aktivitäten werden geladen...",noAudit:"Noch keine Admin-Aktivitäten protokolliert."},
    th:{securityActivityEyebrow:"ความปลอดภัยและบันทึก",securityActivityTitle:"กิจกรรมผู้ดูแลล่าสุด",securityActivityDesc:"ระบบบันทึกการทำงานสำคัญโดยไม่เก็บรหัสผ่านหรือข้อมูลลับ",refresh:"รีเฟรช",loadingAudit:"กำลังโหลดบันทึก...",noAudit:"ยังไม่มีกิจกรรมผู้ดูแลที่บันทึกไว้"},
    es:{securityActivityEyebrow:"SEGURIDAD Y AUDITORÍA",securityActivityTitle:"Actividad reciente de administración",securityActivityDesc:"Las acciones importantes se registran sin guardar contraseñas ni contenido secreto.",refresh:"Actualizar",loadingAudit:"Cargando actividad...",noAudit:"Todavía no hay actividad administrativa registrada."},
    fr:{securityActivityEyebrow:"SÉCURITÉ ET AUDIT",securityActivityTitle:"Activité administrative récente",securityActivityDesc:"Les actions importantes sont journalisées sans conserver de mots de passe ni de contenu secret.",refresh:"Actualiser",loadingAudit:"Chargement de l’activité...",noAudit:"Aucune activité administrative n’a encore été enregistrée."},
    ja:{securityActivityEyebrow:"セキュリティと監査",securityActivityTitle:"最近の管理操作",securityActivityDesc:"パスワードや機密内容を保存せず、重要な操作のみを記録します。",refresh:"更新",loadingAudit:"履歴を読み込み中...",noAudit:"管理操作の履歴はまだありません。"}
  };
  for(const [code,items] of Object.entries(V9_SECURITY_TEXT))Object.assign(ADMIN_TEXT[code]||(ADMIN_TEXT[code]={...ADMIN_TEXT.en}),items);
  const ADMIN_V1138_TEXT = window.NEXCHAT_ADMIN_TRANSLATIONS || {};
  for (const code of Object.keys(window.I18N?.languages || ADMIN_TEXT)) {
    ADMIN_TEXT[code] = { ...ADMIN_TEXT.en, ...(ADMIN_TEXT[code] || {}), ...(ADMIN_V1138_TEXT[code] || ADMIN_V1138_TEXT.en || {}) };
  }
  function adminLanguage(){const lang=window.I18N?.language||'vi';return ADMIN_TEXT[lang]?lang:'vi';}
  function at(key,vars={}){let value=ADMIN_TEXT[adminLanguage()]?.[key]??ADMIN_TEXT.vi[key]??key;for(const [name,replacement] of Object.entries(vars))value=value.replaceAll(`{${name}}`,String(replacement));return value;}
  function localNumber(value){return Number(value||0).toLocaleString(window.I18N?.locale||'vi-VN');}
  function localMessage(message,fallbackKey=''){const raw=String(message||'');const translated=window.I18N?.serverMessage?.(raw);return translated&&translated!==raw?translated:(fallbackKey?at(fallbackKey):raw);}
  const ADMIN_EFFECT_KEYS={neon:'effectNeon',glass:'effectGlass',aurora:'effectAurora',fire:'effectFire',ice:'effectIce',galaxy:'effectGalaxy',pulse:'effectPulse',rainbow:'effectRainbow',shadow:'effectShadow',sparkle:'effectSparkle'};
  function adminEffectLabel(effect){
    const value=String(effect||'none');
    return value==='none'?at('noEffectSelected'):at(ADMIN_EFFECT_KEYS[value]||'noEffectSelected');
  }
  function adminConnectionKey(){
    return state.connectionState==='connected'?'connected':state.connectionState==='disconnected'?'disconnected':'connecting';
  }
  function renderAdminConnection(){
    const node=document.getElementById('adminConnection');
    if(!node)return;
    const key=adminConnectionKey();
    node.dataset.connectionState=state.connectionState;
    node.classList.toggle('offline',state.connectionState==='disconnected');
    const dot=node.querySelector('span');
    if(dot)dot.style.background=state.connectionState==='disconnected'?'#ef4444':'';
    const label=node.querySelector('[data-admin-connection-label]')||node.querySelector('b');
    if(label){label.dataset.adminI18n=key;label.textContent=at(key);}
    node.setAttribute('aria-label',at(key));
  }
  function setAdminConnectionState(nextState){
    state.connectionState=['connecting','connected','disconnected'].includes(nextState)?nextState:'connecting';
    renderAdminConnection();
  }
  function applyAdminLanguage(){
    const language=adminLanguage();
    document.documentElement.lang=window.I18N?.languages?.[language]?.locale||language;
    document.querySelectorAll('[data-admin-i18n]').forEach((node)=>{node.textContent=at(node.dataset.adminI18n);});
    document.querySelectorAll('[data-admin-i18n-placeholder]').forEach((node)=>{node.placeholder=at(node.dataset.adminI18nPlaceholder);});
    document.querySelectorAll('[data-admin-i18n-title]').forEach((node)=>{const value=at(node.dataset.adminI18nTitle);node.title=value;node.setAttribute('aria-label',value);});
    document.querySelectorAll('[data-admin-i18n-aria-label]').forEach((node)=>{node.setAttribute('aria-label',at(node.dataset.adminI18nAriaLabel));});
    const languageBadge=document.getElementById('adminLanguageBadge');
    if(languageBadge)languageBadge.textContent=window.I18N?.languages?.[language]?.flag||language.toUpperCase();
    renderAdminConnection();
    document.title=`${at('systemManagement')} · NexChat`;
  }

  const list = document.getElementById("adminUserList");
  const messages = document.getElementById("adminMessages");
  const messageInput = document.getElementById("adminMessageInput");
  const messageForm = document.getElementById("adminMessageForm");
  const fileInput = document.getElementById("adminFileInput");
  const preview = document.getElementById("adminAttachmentPreview");
  let adminRefreshTimer = null;
  let adminRefreshRunning = false;
  let adminRefreshQueued = false;
  const adminMobileQuery = window.matchMedia('(max-width: 1024px)');
  function isMobileAdmin(){return adminMobileQuery.matches;}
  function syncAdminViewport(){
    if(!isMobileAdmin()){document.documentElement.style.removeProperty('--mobile-admin-height');document.body.classList.remove('mobile-admin-keyboard-open');return;}
    const viewport=window.visualViewport;
    const height=Math.max(320,Math.round(viewport?.height||window.innerHeight));
    document.documentElement.style.setProperty('--mobile-admin-height',`${height}px`);
    document.body.classList.toggle('mobile-admin-keyboard-open',Boolean(viewport&&window.innerHeight-viewport.height>140));
  }
  let adminViewportFrame=0;
  function queueAdminViewportSync(){if(adminViewportFrame)return;adminViewportFrame=requestAnimationFrame(()=>{adminViewportFrame=0;syncAdminViewport();});}
  function promoteUserWorkspace(){
    const stats=document.getElementById('statsGrid');
    const empty=document.getElementById('adminEmpty');
    const workspace=document.getElementById('adminWorkspace');
    if(!stats||!empty||!workspace||stats.dataset.workspacePromoted==='1')return;
    stats.insertAdjacentElement('afterend',empty);
    empty.insertAdjacentElement('afterend',workspace);
    stats.dataset.workspacePromoted='1';
  }
  function setAdminWorkspaceTab(tab='info'){
    const chosen=tab==='chat'?'chat':'info';
    document.querySelectorAll('[data-admin-workspace-tab]').forEach((button)=>button.classList.toggle('active',button.dataset.adminWorkspaceTab===chosen));
    document.querySelectorAll('[data-admin-workspace-panel]').forEach((panel)=>panel.classList.toggle('mobile-panel-hidden',isMobileAdmin()&&panel.dataset.adminWorkspacePanel!==chosen));
    document.getElementById('adminWorkspace')?.setAttribute('data-mobile-tab',chosen);
    if(chosen==='chat')setTimeout(()=>{messages.scrollTop=messages.scrollHeight;messageInput?.focus({preventScroll:true});},80);
  }
  function openMobileAdminWorkspace(tab='info'){
    if(!isMobileAdmin())return;
    document.getElementById('adminEmpty')?.classList.add('hidden');
    document.getElementById('adminWorkspace')?.classList.remove('hidden');
    document.body.classList.add('mobile-admin-user-open');
    setAdminWorkspaceTab(tab);
    syncAdminViewport();
  }
  function closeMobileAdminWorkspace(){
    document.body.classList.remove('mobile-admin-user-open','mobile-admin-keyboard-open');
    document.querySelectorAll('[data-admin-workspace-panel]').forEach((panel)=>panel.classList.remove('mobile-panel-hidden'));
    if(isMobileAdmin()){
      document.getElementById('adminWorkspace')?.classList.add('hidden');
      document.getElementById('adminEmpty')?.classList.remove('hidden');
    }
  }


  function queueAdminRefresh(delay = 320) {
    adminRefreshQueued = true;
    clearTimeout(adminRefreshTimer);
    adminRefreshTimer = setTimeout(async () => {
      adminRefreshTimer = null;
      if (adminRefreshRunning) return;
      adminRefreshRunning = true;
      adminRefreshQueued = false;
      try { await Promise.all([loadUsers(false), loadDashboard()]); }
      finally {
        adminRefreshRunning = false;
        if (adminRefreshQueued) queueAdminRefresh(180);
      }
    }, delay);
  }

  const AUDIT_ACTION_KEYS={
    "world-chat.update":"auditWorldChatUpdate", "announcement.create":"auditAnnouncementCreate", "announcement.clear":"auditAnnouncementClear",
    "user.password-reset":"auditPasswordReset", "user.lock":"auditUserLock", "user.ban":"auditUserBan", "user.unlock":"auditUserUnlock",
    "effects.grant":"auditEffectsGrant", "effects.revoke":"auditEffectsRevoke", "badge.grant":"auditBadgeGrant", "badge.revoke":"auditBadgeRevoke", "support.block":"auditSupportBlock", "support.unblock":"auditSupportUnblock", "report.review":"auditReportReview"
  };
  function auditItemHTML(entry){
    const label=at(AUDIT_ACTION_KEYS[entry.action]||"auditActivity");
    return `<article class="admin-audit-item"><span class="admin-audit-icon">${icon(entry.action?.includes('password')?'lock':entry.action?.includes('announcement')?'bell':entry.action?.includes('world')?'globe':entry.action?.includes('badge')||entry.action?.includes('effects')?'sparkles':'shield')}</span><div><strong>${UI.escapeHTML(label)}</strong><p>${UI.escapeHTML([entry.target,entry.detail].filter(Boolean).join(' · ')||'—')}</p><small>${UI.escapeHTML(UI.formatDate(entry.at))} · #${UI.escapeHTML(entry.source||'local')}</small></div></article>`;
  }
  function renderAudit(entries=[]){
    const node=document.getElementById('adminAuditList');
    if(!node)return;
    node.innerHTML=entries.length?entries.map(auditItemHTML).join(''):`<div class="empty-compact">${UI.escapeHTML(at('noAudit'))}</div>`;
  }
  async function loadAudit(){
    const button=document.getElementById('refreshAuditButton');
    try{
      UI.setLoading(button,true);
      const data=await UI.fetchJSON('/api/admin/audit?limit=60');
      state.auditEntries=data.entries||[];
      renderAudit(state.auditEntries);
    }catch(error){handleAuthError(error);}
    finally{UI.setLoading(button,false);}
  }

  async function loadDashboard() {
    try {
      const data = await UI.fetchJSON("/api/admin/dashboard");
      document.getElementById("statUsers").textContent = data.stats.users;
      document.getElementById("statOnline").textContent = data.stats.online;
      document.getElementById("statOffline").textContent = data.stats.offline;
      document.getElementById("statRestricted").textContent = data.stats.restricted;
      document.getElementById("statEffects").textContent = data.stats.effects;
      document.getElementById("statVip").textContent = data.stats.vip || 0;
      document.getElementById("statLegend").textContent = data.stats.legend || 0;
      document.getElementById("statSupport").textContent = data.stats.supportUnread;
      document.getElementById("statSupportWarnings").textContent = data.stats.supportWarnings || 0;
      document.getElementById("statSupportBlocked").textContent = data.stats.supportBlocked || 0;
      document.getElementById("statReportsPending").textContent = data.stats.reportPending || 0;
      document.getElementById("statReportsInvestigating").textContent = data.stats.reportInvestigating || 0;
      document.getElementById("statReportsHighRisk").textContent = data.stats.reportHighRisk || 0;
      document.getElementById("vipGrantedCount").textContent = data.stats.vip || 0;
      document.getElementById("legendGrantedCount").textContent = data.stats.legend || 0;
      state.system = data.system || state.system;
      const announcements = state.system.activeAnnouncements || (state.system.activeAnnouncement ? [state.system.activeAnnouncement] : []);
      if (announcements.length) UI.showServerAnnouncement?.(announcements);
      renderSystemControls();
    } catch (error) {
      handleAuthError(error);
    }
  }


  const REPORT_STATUS_KEYS={pending:'reportPending',investigating:'reportInvestigating',actioned:'reportActioned',dismissed:'reportDismissed'};
  const REPORT_ACTION_KEYS={none:'reportActionNone',warn:'reportActionWarn',world_mute:'reportActionWorldMute',lock:'reportActionLock',ban:'reportActionBan',dismiss:'reportActionDismiss'};
  const REPORT_REASON_KEYS={spam:'reasonSpam',harassment:'reasonHarassment',hate:'reasonHate',sexual:'reasonSexual',violence:'reasonViolence',scam:'reasonScam',impersonation:'reasonImpersonation',privacy:'reasonPrivacy',other:'reasonOther'};
  function reportReasonText(report){return at(REPORT_REASON_KEYS[report?.reason]||'reasonOther');}
  function reportSignalText(signal=''){const value=String(signal||'');const exact={'Có liên kết ngoài':'signalExternalLink','Lặp ký tự bất thường':'signalRepeatedChars','Mẫu nội dung lặp':'signalRepeatedPattern','Viết hoa dày đặc':'signalUppercase','Có dấu hiệu yêu cầu thông tin nhạy cảm':'signalSensitiveInfo','Từ khóa đe dọa':'signalThreatKeyword'};if(exact[value])return at(exact[value]);let match=value.match(/^(\d+) người dùng khác nhau đã tố cáo trong 7 ngày$/);if(match)return at('signalDistinctReporters',{count:match[1]});match=value.match(/^(\d+) tố cáo gần đây liên quan tài khoản$/);if(match)return at('signalRecentReports',{count:match[1]});return value;}
  function reportRiskLevel(score){return score>=70?'high':score>=40?'medium':'normal';}
  function reportItemHTML(report){
    const level=reportRiskLevel(Number(report.riskScore)||0),target=report.target||{},reporter=report.reporter||{};
    const evidence=report.scope==='message'?(report.evidence?.text||at('messageNoText')):at('reportAccount');
    return `<article class="admin-report-item risk-${level}" data-report-id="${UI.escapeHTML(report.id)}">
      <button type="button" class="admin-report-open" data-open-report="${UI.escapeHTML(report.id)}">
        <span class="admin-report-risk-meter"><b>${Math.max(0,Math.min(100,Number(report.riskScore)||0))}</b><small>${at('priority')}</small></span>
        <span class="admin-report-main"><span class="admin-report-item-top"><em>${report.scope==='message'?at('worldMessageUpper'):at('userUpper')}</em><i class="report-status status-${UI.escapeHTML(report.status)}">${at(REPORT_STATUS_KEYS[report.status]||report.status)}</i></span><strong>@${UI.escapeHTML(target.username||target.nickname||at('deletedUser'))} · ${UI.escapeHTML(reportReasonText(report))}</strong><p>${UI.escapeHTML(evidence)}</p><small>${at('reporterPrefix')} @${UI.escapeHTML(reporter.username||at('deletedUser'))} · ${UI.escapeHTML(UI.formatDate(report.createdAt))}</small></span>
        <span class="admin-report-chevron">${icon('chevron-right')}</span>
      </button>
    </article>`;
  }
  function renderReports(){
    const list=document.getElementById('adminReportList');if(!list)return;
    list.innerHTML=state.reports.length?state.reports.map(reportItemHTML).join(''):`<div class="admin-report-empty"><span>${icon('shield')}</span><strong>${UI.escapeHTML(at('noReportsInStatus'))}</strong><small>${UI.escapeHTML(at('reportsAutoUpdate'))}</small></div>`;
    const counts=state.reportCounts||{};
    for(const key of ['Pending','Investigating','Actioned','Dismissed'])document.getElementById(`reportCount${key}`).textContent=counts[key.toLowerCase()]||0;
  }
  async function loadReports({quiet=false}={}){
    const button=document.getElementById('refreshReportsButton'),filter=document.getElementById('reportStatusFilter')?.value||'pending';
    try{if(!quiet)UI.setLoading(button,true);const data=await UI.fetchJSON(`/api/admin/reports?status=${encodeURIComponent(filter)}&limit=120`);state.reports=data.reports||[];state.reportCounts=data.counts||state.reportCounts;renderReports();}
    catch(error){handleAuthError(error);}finally{if(!quiet)UI.setLoading(button,false);}
  }
  function openReportReview(report){
    if(!report)return;state.selectedReport=report;
    const target=report.target||{},reporter=report.reporter||{},score=Math.max(0,Math.min(100,Number(report.riskScore)||0));
    document.getElementById('adminReportId').value=report.id;
    document.getElementById('adminReportTitle').textContent=at('investigateUser',{name:target.username||target.nickname||at('deletedUser')});
    document.getElementById('adminReportSubtitle').textContent=`${reportReasonText(report)} · ${at('priorityLevel',{score})}`;
    document.getElementById('adminReportIdentity').innerHTML=`<article><span>${UI.avatarHTML(target,'avatar',{presence:false})}</span><div><small>${at('reportedAccountUpper')}</small><strong>${UI.escapeHTML(target.nickname||target.username||at('deletedAccount'))}</strong><p>@${UI.escapeHTML(target.username||at('deletedUser'))} · ${target.status?.type&&target.status.type!=='active'?at('restrictedState'):at('active')}</p></div><button type="button" data-report-user="${UI.escapeHTML(target.id||'')}">${at('openProfile')}</button></article><article class="reporter"><span>${UI.avatarHTML(reporter,'avatar',{presence:false})}</span><div><small>${at('reporterUpper')}</small><strong>${UI.escapeHTML(reporter.nickname||reporter.username||at('deletedAccount'))}</strong><p>@${UI.escapeHTML(reporter.username||at('deletedUser'))}</p></div></article>`;
    const evidence=report.evidence||{};
    document.getElementById('adminReportEvidence').innerHTML=`<div class="admin-report-evidence-head"><span>${icon(report.scope==='message'?'message-circle':'user')}</span><div><small>${at('frozenEvidenceUpper')}</small><strong>${report.scope==='message'?at('worldChannelMessage'):at('accountInformation')}</strong></div><b>${UI.escapeHTML(UI.formatDate(evidence.createdAt||report.createdAt))}</b></div><blockquote>${UI.escapeHTML(evidence.text||report.details||at('noTextEvidence'))}</blockquote>${report.details?`<div class="admin-report-user-note"><strong>${at('reporterDescription')}</strong><p>${UI.escapeHTML(report.details)}</p></div>`:''}`;
    const signals=Array.isArray(report.signals)?report.signals:[];
    document.getElementById('adminReportSignals').innerHTML=`<div class="admin-report-score risk-${reportRiskLevel(score)}"><i style="--risk-score:${score}%"></i><span><small>${at('supportPriorityScoreUpper')}</small><strong>${score}/100</strong><p>${at('notAutomaticConclusion')}</p></span></div><div class="admin-report-signal-list">${signals.length?signals.map((item)=>`<span>${icon('sparkles')} ${UI.escapeHTML(reportSignalText(item))}</span>`).join(''):`<span>${icon('info')} ${at('noAdditionalSignals')}</span>`}</div>`;
    document.getElementById('adminReportStatus').value=report.status==='pending'?'investigating':report.status;
    document.getElementById('adminReportAction').value='none';document.getElementById('adminReportNote').value=report.adminNote||'';syncReportActionFields();
    document.getElementById('adminReportMessage').textContent='';UI.openModal('adminReportModal');
  }
  function syncReportActionFields(){
    const action=document.getElementById('adminReportAction')?.value||'none',timed=['world_mute','lock','ban'].includes(action);
    document.getElementById('adminReportDurationField')?.classList.toggle('hidden',!timed);
    const custom=timed&&document.getElementById('adminReportDuration')?.value==='custom';document.getElementById('adminReportCustomDurationField')?.classList.toggle('hidden',!custom);
    if(action==='dismiss')document.getElementById('adminReportStatus').value='dismissed';else if(action!=='none')document.getElementById('adminReportStatus').value='actioned';
  }
  document.getElementById('refreshReportsButton')?.addEventListener('click',()=>loadReports());
  document.getElementById('reportStatusFilter')?.addEventListener('change',()=>loadReports());
  document.getElementById('adminReportList')?.addEventListener('click',(event)=>{const button=event.target.closest('[data-open-report]');if(button)openReportReview(state.reports.find((report)=>report.id===button.dataset.openReport));});
  document.getElementById('adminReportIdentity')?.addEventListener('click',(event)=>{const button=event.target.closest('[data-report-user]');if(button?.dataset.reportUser){UI.closeModal('adminReportModal');selectUser(button.dataset.reportUser);}});
  document.getElementById('adminReportAction')?.addEventListener('change',syncReportActionFields);document.getElementById('adminReportDuration')?.addEventListener('change',syncReportActionFields);
  document.getElementById('adminReportForm')?.addEventListener('submit',async(event)=>{
    event.preventDefault();const reportId=document.getElementById('adminReportId').value,action=document.getElementById('adminReportAction').value,status=document.getElementById('adminReportStatus').value,note=document.getElementById('adminReportNote').value,button=document.getElementById('saveAdminReportButton'),message=document.getElementById('adminReportMessage');
    let minutes=60,permanent=false;if(['world_mute','lock','ban'].includes(action)){const raw=document.getElementById('adminReportDuration').value;if(raw==='permanent'){minutes=null;permanent=true;}else{minutes=raw==='custom'?Number(document.getElementById('adminReportCustomDuration').value):Number(raw);if(!Number.isFinite(minutes)||minutes<1||minutes>525600){message.textContent=at('durationOneYearError');return;}}}
    message.textContent='';UI.setLoading(button,true);
    try{const data=await UI.fetchJSON(`/api/admin/reports/${encodeURIComponent(reportId)}`,{method:'PATCH',body:{action,status,adminNote:note,minutes,permanent}});UI.closeModal('adminReportModal');UI.toast(localMessage(data.message,'reportUpdated'),'success');await Promise.all([loadReports({quiet:true}),loadDashboard(),loadUsers(false)]);}
    catch(error){message.textContent=localMessage(error.message);}finally{UI.setLoading(button,false);}
  });

  function announcementRemainingText(announcement) {
    const remaining = Number(announcement?.expiresAt || 0) - Date.now();
    if (remaining <= 0) return at("ended");
    const total = Math.ceil(remaining / 1000);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    return hours ? `${hours}:${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}` : `${minutes}:${String(seconds).padStart(2,"0")}`;
  }

  function getWorldSettings() {
    const world = state.system?.worldChat || {};
    const mode = ["open","admin_only","read_only"].includes(world.mode) ? world.mode : (state.system?.worldChatEnabled === false ? "read_only" : "open");
    return { mode, lockedUntil:Number(world.lockedUntil)||null, slowModeSeconds:Number(world.slowModeSeconds)||0, antiSpamEnabled:world.antiSpamEnabled !== false, enabled:mode === "open" };
  }

  function getWorldFormSettings() {
    const fallback = getWorldSettings();
    const mode = document.getElementById("worldChatMode")?.value || fallback.mode;
    const slowModeSeconds = Number(document.getElementById("worldSlowMode")?.value ?? fallback.slowModeSeconds) || 0;
    const antiSpamEnabled = document.getElementById("worldAntiSpam")?.checked ?? fallback.antiSpamEnabled;
    const duration = document.getElementById("worldLockDuration")?.value || "";
    const customMinutes = Math.max(1, Math.min(10080, Number(document.getElementById("worldLockCustomMinutes")?.value) || 30));
    const lockMinutes = mode === "read_only" ? (duration === "custom" ? customMinutes : (Number(duration) || null)) : null;
    return { mode, slowModeSeconds, antiSpamEnabled, lockMinutes };
  }

  function updateWorldConfigPreview() {
    const config = getWorldFormSettings();
    const card = document.getElementById("worldControlCard");
    const preview = document.getElementById("worldConfigPreview");
    if (card) card.dataset.mode = config.mode;
    if (!preview) return;
    const modeText = { open:at("worldCanSend"), admin_only:at("worldAdminsOnly"), read_only:at("worldReadOnlyHistory") }[config.mode];
    const parts = [modeText];
    parts.push(config.slowModeSeconds ? at("waitBetweenMessages",{seconds:config.slowModeSeconds}) : at("noRateLimit"));
    parts.push(config.antiSpamEnabled ? at("antiSpamOn") : at("antiSpamOff"));
    if (config.mode === "read_only" && config.lockMinutes) parts.push(at("autoOpenAfter",{minutes:config.lockMinutes}));
    preview.textContent = parts.join(" · ");
  }

  function updateWorldMessageComposer() {
    const input = document.getElementById("worldChatMessage");
    const counter = document.getElementById("worldChatMessageCounter");
    const button = document.getElementById("sendWorldAdminMessageButton");
    if (!input || !counter || !button) return;
    const length = input.value.length;
    counter.textContent = String(length);
    const counterWrap = counter.closest(".world-message-counter");
    counterWrap?.classList.toggle("is-warning", length >= 850 && length < 1000);
    counterWrap?.classList.toggle("is-limit", length >= 1000);
    button.disabled = !input.value.trim();
  }

  function renderSystemControls() {
    const world = getWorldSettings();
    const labels = { open:at("everyoneCanChat"), admin_only:at("adminOnlyChat"), read_only:at("readOnly") };
    const pill = document.getElementById("worldChatStatusPill");
    if (pill) {
      pill.classList.toggle("is-open", world.mode === "open");
      pill.classList.toggle("is-closed", world.mode === "read_only");
      pill.classList.toggle("is-limited", world.mode === "admin_only");
      pill.querySelector("b").textContent = labels[world.mode];
    }
    const modeSelect = document.getElementById("worldChatMode");
    const slowSelect = document.getElementById("worldSlowMode");
    const antiSpam = document.getElementById("worldAntiSpam");
    if (modeSelect && document.activeElement !== modeSelect) modeSelect.value = world.mode;
    if (slowSelect && document.activeElement !== slowSelect) slowSelect.value = String(world.slowModeSeconds);
    if (antiSpam) antiSpam.checked = world.antiSpamEnabled;
    const lockField = document.getElementById("worldLockDurationField");
    const customLockField = document.getElementById("worldLockCustomField");
    const readOnlySelected = modeSelect?.value === "read_only";
    lockField?.classList.toggle("hidden", !readOnlySelected);
    customLockField?.classList.toggle("hidden", !readOnlySelected || document.getElementById("worldLockDuration")?.value !== "custom");
    if (world.lockedUntil && world.mode === "read_only") {
      const left = Math.max(0, Math.ceil((world.lockedUntil - Date.now()) / 60000));
      const message = document.getElementById("worldControlMessage");
      if (message && !message.dataset.manual) message.textContent = at("autoOpenIn",{minutes:left});
    }
    updateWorldConfigPreview();
    const announcements = (state.system?.activeAnnouncements || (state.system?.activeAnnouncement ? [state.system.activeAnnouncement] : [])).filter((item) => Number(item.expiresAt) > Date.now());
    const announcement = announcements[0] || null;
    const card = document.getElementById("activeAnnouncementCard");
    const active = Boolean(announcement);
    card?.classList.toggle("hidden", !active);
    document.getElementById("stopAnnouncementButton").disabled = !active;
    if (active) {
      document.getElementById("activeAnnouncementText").textContent = announcements.length > 1 ? `${announcement.message}  •  ${at('rotatingAnnouncements',{count:announcements.length-1})}` : announcement.message;
      document.getElementById("activeAnnouncementTime").textContent = announcementRemainingText(announcement);
    }
    const capacity = state.system?.accountCapacity || { used:state.users.length, max:Number(state.system?.maxAccounts)||0, unlimited:Number(state.system?.maxAccounts)===0 };
    const used = Number(capacity.used ?? state.users.length) || 0;
    const max = Number(capacity.max ?? state.system?.maxAccounts) || 0;
    const unlimited = capacity.unlimited === true || max === 0;
    const maxInput = document.getElementById("maxAccountsInput");
    const unlimitedInput = document.getElementById("unlimitedAccountsInput");
    const capacityForm = document.getElementById("accountCapacityForm");
    if (maxInput && document.activeElement !== maxInput) maxInput.value = String(unlimited ? Math.max(used,1000) : max);
    if (maxInput) {
      maxInput.disabled = unlimited;
      maxInput.setAttribute("aria-disabled", String(unlimited));
    }
    if (unlimitedInput && document.activeElement !== unlimitedInput) unlimitedInput.checked = unlimited;
    capacityForm?.classList.toggle("is-unlimited", unlimited);
    const usedNode = document.getElementById("accountCapacityUsed");
    const remainingNode = document.getElementById("accountCapacityRemaining");
    const bar = document.getElementById("accountCapacityBar");
    if (usedNode) usedNode.textContent = localNumber(used);
    if (remainingNode) remainingNode.textContent = unlimited ? at("unlimitedRegistration") : at("capacityRemaining",{remaining:localNumber(Math.max(0,max-used)),max:localNumber(max)});
    if (bar) bar.style.setProperty("--capacity-progress", unlimited ? "18%" : `${Math.min(100,(used/Math.max(1,max))*100).toFixed(2)}%`);
  }

  function refreshSystemCountdowns() {
    const world = getWorldSettings();
    if (world.lockedUntil && world.mode === "read_only") {
      const left = Math.max(0, Math.ceil((world.lockedUntil - Date.now()) / 60000));
      const message = document.getElementById("worldControlMessage");
      if (message && !message.dataset.manual) message.textContent = left ? at("autoOpenIn",{minutes:left}) : at("reopening");
    }
    const announcements = state.system?.activeAnnouncements || (state.system?.activeAnnouncement ? [state.system.activeAnnouncement] : []);
    const announcement = announcements.find((item) => Number(item.expiresAt) > Date.now());
    const time = document.getElementById("activeAnnouncementTime");
    if (time && announcement) time.textContent = announcementRemainingText(announcement);
  }

  async function loadUsers(preserveSelection = true) {
    try {
      const data = await UI.fetchJSON("/api/admin/users");
      state.users = data.users || [];
      renderUsers();
      renderEffectManager();
      renderBadgeManager();
      if (preserveSelection && state.selectedUser) {
        const exists = state.users.some((user) => user.id === state.selectedUser.id);
        if (exists) await selectUser(state.selectedUser.id, false);
      }
    } catch (error) {
      handleAuthError(error);
    }
  }

  function filteredUsers() {
    const query = document.getElementById("userSearch").value.trim().toLowerCase();
    const status = document.getElementById("statusFilter").value;
    return state.users.filter((user) => {
      const matchText = !query || [user.username, user.phone, user.email].some((value) => String(value || "").toLowerCase().includes(query));
      const type = user.status?.type || "active";
      return matchText && (status === "all" || type === status);
    }).sort((a, b) => {
      if (b.supportUnread !== a.supportUnread) return b.supportUnread - a.supportUnread;
      if (a.online !== b.online) return a.online ? -1 : 1;
      return a.username.localeCompare(b.username, window.I18N?.locale||'vi-VN');
    });
  }

  function renderUsers() {
    const users = filteredUsers();
    document.getElementById("adminUserCount").textContent = users.length;
    if (!users.length) {
      list.innerHTML = `<div class="empty-compact">${at('noUsers')}</div>`;
      return;
    }
    list.innerHTML = users.map((user) => {
      const restricted = user.status?.type && user.status.type !== "active";
      return `<button class="admin-user-item ${state.selectedUser?.id === user.id ? "active" : ""}" data-admin-user-id="${user.id}" type="button">
        ${UI.avatarHTML(user,"avatar",{online:user.online,presence:false})}
        <div class="admin-user-copy"><strong>${UI.escapeHTML(user.username)}</strong><small>${UI.escapeHTML(user.phone)} · ${restricted ? (user.status.type === "ban" ? at('bannedStatus') : at('lockedStatus')) : user.online ? at('online') : at('offline')}</small></div>
        <span class="admin-user-trailing">${user.effectAccess ? `<i class="effect-access-badge" title="${at('effectAccessTitle',{source:user.effectAccessSource && user.effectAccessSource !== 'admin' ? at('effectAccessVia',{source:String(user.effectAccessSource).toUpperCase()}) : at('effectAccessByAdmin')})}">${icon('sparkles')}</i>` : ''}${user.supportUnread ? `<b class="badge">${user.supportUnread}</b>` : user.supportMessaging?.blocked ? `<i class="support-blocked-mini" title="${at('supportBlockedTitle')}">${icon('ban')}</i>` : Number(user.supportMessaging?.strikes||0)>0 ? `<b class="support-warning-mini" title="${at('spamWarningTitle',{count:Number(user.supportMessaging?.strikes||0)})}">${Number(user.supportMessaging?.strikes||0)}</b>` : `<span class="user-state-dot ${restricted ? "restricted" : user.online ? "online" : ""}"></span>`}</span>
      </button>`;
    }).join("");
  }

  function renderEffectManager() {
    const granted = state.users.filter((user) => user.effectAccess).sort((a,b) => a.username.localeCompare(b.username, window.I18N?.locale||'vi-VN'));
    const count = document.getElementById("effectGrantedCount");
    const listNode = document.getElementById("effectGrantedList");
    if (count) count.textContent = granted.length;
    if (!listNode) return;
    listNode.innerHTML = granted.length ? granted.map((user) => {
      const sourceKey = user.specialEffectsAllowed ? "admin" : user.effectAccessSource === "legend" ? "legend" : "vip";
      const source = sourceKey === "admin" ? at("sourceAdmin") : sourceKey === "legend" ? "LEGEND" : "VIP";
      const selected = adminEffectLabel(user.selectedEffect);
      return `<button class="effect-granted-user" type="button" data-effect-user-id="${user.id}">
        <span class="effect-granted-avatar-wrap">${UI.avatarHTML(user,"avatar effect-granted-avatar",{online:user.online,presence:false})}</span>
        <span class="effect-granted-copy">
          <span class="effect-granted-title-row"><strong>${UI.escapeHTML(user.nickname || user.username)}</strong><em class="effect-source-pill source-${sourceKey}">${UI.escapeHTML(source)}</em></span>
          <small>@${UI.escapeHTML(user.username)}</small>
          <span class="effect-granted-meta"><b>${UI.escapeHTML(selected)}</b><span>${user.online ? at("active") : at("offline")}</span></span>
        </span>
        <span class="effect-granted-open" aria-hidden="true">${icon('sparkles')}</span>
      </button>`;
    }).join("") : `<div class="empty-compact">${UI.escapeHTML(at('noEffectUsers'))}</div>`;
  }

  function activeBadge(user, type) {
    const grant = user?.profileBadges?.[type];
    return grant && (!grant.expiresAt || Date.now() < Number(grant.expiresAt)) ? grant : null;
  }

  function badgeTimeText(grant) {
    if (!grant) return "";
    return UI.badgeRemainingText?.(grant,false) || (!grant.expiresAt ? at("permanent") : UI.formatDate(grant.expiresAt));
  }
  function refreshAdminBadgeCountdowns() {
    const now=Date.now();
    let selectedDetailExpired=false;
    document.querySelectorAll('[data-admin-badge-expires]').forEach((node) => {
      const expiresAt=Number(node.dataset.adminBadgeExpires||0);
      if(expiresAt && expiresAt<=now){
        if(node.closest('#detailBadges')) selectedDetailExpired=true;
        else node.textContent=badgeTimeText({expiresAt});
        node.classList.add('is-expired');
        return;
      }
      node.textContent=badgeTimeText({expiresAt:expiresAt||null});
      node.classList.toggle('is-expiring',Boolean(expiresAt&&expiresAt-now<86400000));
      node.classList.remove('is-expired');
    });
    if(selectedDetailExpired && state.selectedUser) renderDetails();
  }

  function renderBadgeManager() {
    const entries = [];
    for (const user of state.users) {
      for (const type of ["legend", "vip"]) {
        const grant = activeBadge(user, type);
        if (grant) entries.push({ user, type, grant });
      }
    }
    entries.sort((a,b) => {
      if (a.type !== b.type) return a.type === "legend" ? -1 : 1;
      return a.user.username.localeCompare(b.user.username, window.I18N?.locale||'vi-VN');
    });
    const listNode = document.getElementById("badgeGrantedList");
    if (!listNode) return;
    listNode.innerHTML = entries.length ? entries.map(({user,type,grant}) => `
      <article class="badge-granted-user" data-badge-user-id="${user.id}">
        <button class="badge-user-main" type="button" data-badge-open-user="${user.id}">
          ${UI.avatarHTML(user,"avatar",{online:user.online,presence:false})}
          <span><strong>${UI.escapeHTML(user.nickname || user.username)}</strong><small>@${UI.escapeHTML(user.username)} · <span data-admin-badge-expires="${grant.expiresAt || ''}">${badgeTimeText(grant)}</span></small></span>
        </button>
        <span class="badge-list-rank profile-rank-badge profile-rank-${type} badge-preview rank-emblem-image-host"><img class="rank-emblem-art" src="/${type === "legend" ? "legend" : "vip"}-emblem.webp?v=1.0.0" alt="" aria-hidden="true" decoding="async"><b>${type === "legend" ? "L" : "V"}</b><i aria-hidden="true"></i></span>
        <button class="badge-list-revoke" type="button" data-badge-revoke-user="${user.id}" data-badge-revoke-type="${type}">${at("revoke")}</button>
      </article>`).join("") : `<div class="empty-compact">${UI.escapeHTML(at('noActiveBadges'))}</div>`;
    refreshAdminBadgeCountdowns();
  }

  function findUserByUsername(username) {
    const normalized = String(username || "").trim().toLowerCase();
    return state.users.find((user) => user.username.toLowerCase() === normalized);
  }

  async function setEffectPermissionForUser(user, grant) {
    if (!user) throw new Error(at("usernameNotFound"));
    const title = grant ? at("grantEffects") : at("revokeEffects");
    const text = grant
      ? at("grantEffectsConfirm",{username:user.username})
      : at("revokeEffectsConfirm",{username:user.username});
    const accepted = await confirmAction(title, text);
    if (!accepted) return false;
    const data = await UI.fetchJSON(`/api/admin/users/${user.id}/effects`, { method: "POST", body: { grant } });
    UI.toast(localMessage(data.message), "success");
    await Promise.all([loadDashboard(), loadUsers(false)]);
    if (state.selectedUser?.id === user.id) await selectUser(user.id, false);
    return true;
  }

  async function setEffectPermissionByInput(grant) {
    const input = document.getElementById("effectUsername");
    const message = document.getElementById("effectManagerMessage");
    const user = findUserByUsername(input?.value);
    message.textContent = "";
    if (!user) { message.textContent = at("usernameNotFound"); input?.focus(); return; }
    if (grant && user.specialEffectsAllowed) { message.textContent = at("effectAlreadyGranted"); return; }
    if (!grant && !user.specialEffectsAllowed) { message.textContent = at("effectNotGranted"); return; }
    try {
      const changed = await setEffectPermissionForUser(user, grant);
      if (changed) { input.value = ""; message.textContent = grant ? at("effectsGrantedSuccess") : at("effectsRevokedSuccess"); }
    } catch (error) { message.textContent = localMessage(error.message); }
  }

  function durationPayload(selectId, customId) {
    const value = document.getElementById(selectId).value;
    if (value === "permanent") return { permanent: true, minutes: null, label: at("permanent") };
    const minutes = value === "custom" ? Number(document.getElementById(customId).value) : Number(value);
    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 2628000) throw new Error(at("durationFiveYearsError"));
    return { permanent: false, minutes, label: minutes < 1440 ? at("minutesCount",{count:minutes}) : at("daysCount",{count:Math.round(minutes / 1440)}) };
  }

  async function changeProfileBadge(user, type, grant, duration = { permanent: true, minutes: null, label: at("permanent") }) {
    if (!user) throw new Error(at("usernameNotFound"));
    const label = type === "legend" ? "LEGEND" : "VIP";
    const accepted = await confirmAction(
      grant ? at("grantBadgeTitle",{badge:label}) : at("revokeBadgeTitle",{badge:label}),
      grant
        ? at("grantBadgeConfirm",{badge:label,username:user.username,duration:duration.label})
        : at("revokeBadgeConfirm",{badge:label,username:user.username})
    );
    if (!accepted) return false;
    const data = await UI.fetchJSON(`/api/admin/users/${user.id}/badges`, {
      method: "POST",
      body: { type, grant, permanent: duration.permanent, minutes: duration.minutes },
    });
    UI.toast(localMessage(data.message), "success");
    await Promise.all([loadDashboard(), loadUsers(false)]);
    if (state.selectedUser?.id === user.id) await selectUser(user.id, false);
    return true;
  }

  async function setBadgeByInput(grant) {
    const input = document.getElementById("badgeUsername");
    const message = document.getElementById("badgeManagerMessage");
    const user = findUserByUsername(input.value);
    const type = document.getElementById("badgeType").value;
    message.textContent = "";
    if (!user) { message.textContent = at("usernameNotFound"); input.focus(); return; }
    try {
      const duration = grant ? durationPayload("badgeDuration", "badgeCustomDuration") : { permanent: true, minutes: null, label: "" };
      const changed = await changeProfileBadge(user, type, grant, duration);
      if (changed) { input.value = ""; message.textContent = grant ? at("badgeGrantedSuccess") : at("badgeRevokedSuccess"); }
    } catch (error) { message.textContent = localMessage(error.message); }
  }

  function selectedBadgeType() {
    return document.querySelector('input[name="profileBadgeType"]:checked')?.value || "vip";
  }

  async function selectUser(userId, showLoading = true) {
    const previousUserId = state.selectedUser?.id;
    if (state.typingActive && previousUserId && previousUserId !== userId) { socket.emit('chat:typing',{scope:'support',targetId:previousUserId,isTyping:false}); state.typingActive=false; clearTimeout(state.typingTimer); }
    if (previousUserId !== userId) {
      state.supportMessages = [];
      state.remoteTyping = null;
      const typingNode=document.getElementById('adminTyping');
      if(typingNode)typingNode.textContent='';
    }
    if (showLoading) {
      document.getElementById("adminEmpty").classList.add("hidden");
      document.getElementById("adminWorkspace").classList.remove("hidden");
      messages.innerHTML = `<div class="conversation-loading"><span class="spinner"></span><p>${UI.escapeHTML(at('loading'))}</p></div>`;
    }
    try {
      const data = await UI.fetchJSON(`/api/admin/users/${encodeURIComponent(userId)}`);
      state.selectedUser = data.user;
      state.supportMessages = Array.isArray(data.messages) ? data.messages.map((item)=>({...item,receiptBy:Array.isArray(item.receiptBy)?[...item.receiptBy]:[]})) : [];
      renderUsers();
      renderDetails();
      renderMessages(state.supportMessages,{cache:false});
      closeAdminSidebar();
      loadDashboard();
      if (isMobileAdmin()) openMobileAdminWorkspace('info');
      else if(showLoading){
        const workspace=document.getElementById('adminWorkspace');
        requestAnimationFrame(()=>workspace?.scrollIntoView({behavior:'smooth',block:'start'}));
      }
    } catch (error) {
      UI.toast(localMessage(error.message), "error");
    }
  }

  function renderDetails() {
    const user = state.selectedUser;
    if (!user) return;
    const displayName = user.nickname || user.username;
    const rank = UI.profileRank?.(user) || "standard";
    const workspace = document.getElementById("adminWorkspace");
    workspace.classList.remove("profile-tier-standard", "profile-tier-vip", "profile-tier-legend");
    workspace.classList.add(`profile-tier-${rank}`);
    workspace.dataset.profileRank = rank;
    const detailAvatar=document.getElementById("detailAvatar");
    detailAvatar.innerHTML = UI.avatarHTML(user, "avatar avatar-xl detail-smart-avatar", { online: user.online, presence: false });
    const detailAvatarUrl=String(user.profile?.avatarUrl||'');
    const detailAvatarPerson=String(user.nickname||user.username||'');
    detailAvatar.dataset.avatarPreview=detailAvatarUrl;
    detailAvatar.dataset.avatarPerson=detailAvatarPerson;
    detailAvatar.dataset.avatarName=UI.avatarViewerText(detailAvatarPerson,'title');
    detailAvatar.dataset.avatarHint=UI.avatarViewerText(detailAvatarPerson,'hint');
    detailAvatar.classList.toggle('is-viewable',Boolean(detailAvatarUrl));
    if(detailAvatarUrl){detailAvatar.setAttribute('role','button');detailAvatar.setAttribute('tabindex','0');detailAvatar.setAttribute('aria-label',UI.avatarViewerText(detailAvatarPerson,'view'));}
    else{detailAvatar.removeAttribute('role');detailAvatar.removeAttribute('tabindex');detailAvatar.removeAttribute('aria-label');}
    document.getElementById("detailUsername").textContent = displayName;
    const rankNode = document.getElementById("detailRankPresentation");
    if (rankNode) {
      rankNode.classList.toggle("hidden", rank === "standard");
      rankNode.innerHTML = rank === "legend"
        ? `<span class="elite-tier-chip tier-legend is-admin"><i>L</i><span><b>LEGEND</b><small>${at('legendPriority')}</small></span></span>`
        : rank === "vip"
          ? `<span class="elite-tier-chip tier-vip is-admin"><i>V</i><span><b>VIP</b><small>${at('vipPriority')}</small></span></span>`
          : '';
    }
    const profile=user.profile||{},settings=user.settings||{};
    const empty=at('notSet');
    const privacyLabels={everyone:'privacyEveryone',friends:'privacyFriends',friends_of_friends:'privacyFriendsOfFriends',none:'privacyNobody'};
    document.getElementById("detailLogin").textContent = user.username;
    document.getElementById("detailNickname").textContent = displayName;
    document.getElementById("detailPhone").textContent = user.phone || at('notProvided');
    document.getElementById("detailEmail").textContent = user.email || at('notProvided');
    document.getElementById("detailSecurityLevel2").textContent = user.security?.level2Enabled ? at("enabled") : at("disabled");
    document.getElementById("detailSecurityLevel3").textContent = user.security?.level3Enabled ? at("enabled") : at("disabled");
    document.getElementById("detailBio").textContent = profile.bio || empty;
    document.getElementById("detailLocation").textContent = profile.location || empty;
    document.getElementById("detailWork").textContent = profile.work || empty;
    document.getElementById("detailSchool").textContent = profile.school || empty;
    document.getElementById("detailBirthday").textContent = profile.birthday || empty;
    document.getElementById("detailRelationship").textContent = profile.relationship || empty;
    document.getElementById("detailMessagePrivacy").textContent = at(privacyLabels[settings.whoCanMessage]||privacyLabels.friends);
    document.getElementById("detailCreated").textContent = UI.formatDate(user.createdAt);
    document.getElementById("detailLastSeen").textContent = user.online ? at('online') : (user.lastSeenAt?UI.formatDate(user.lastSeenAt):at('notProvided'));
    document.getElementById("detailFriends").textContent = `${user.friendCount || 0} ${at('people')}`;
    document.getElementById("detailSessions").textContent = `${user.sessionCount || 0}/5 ${at('devices')}`;
    document.getElementById("detailBlocked").textContent = String(user.blockedCount || 0);
    document.getElementById("detailArchived").textContent = String(user.archivedCount || 0);
    document.getElementById("detailEffects").textContent = user.effectAccess ? `${at('granted')} · ${adminEffectLabel(user.selectedEffect)}` : at('notGranted');
    const badgeDescriptions = [];
    const legend = activeBadge(user, "legend");
    const vip = activeBadge(user, "vip");
    if (legend) badgeDescriptions.push(`<span class="admin-detail-badge admin-detail-badge-legend" data-admin-detail-badge="legend"><b>LEGEND</b><i aria-hidden="true">·</i><span class="admin-detail-badge-countdown" data-admin-badge-expires="${legend.expiresAt || ''}">${UI.escapeHTML(badgeTimeText(legend))}</span></span>`);
    if (vip) badgeDescriptions.push(`<span class="admin-detail-badge admin-detail-badge-vip" data-admin-detail-badge="vip"><b>VIP</b><i aria-hidden="true">·</i><span class="admin-detail-badge-countdown" data-admin-badge-expires="${vip.expiresAt || ''}">${UI.escapeHTML(badgeTimeText(vip))}</span></span>`);
    const detailBadges=document.getElementById("detailBadges");
    detailBadges.innerHTML=badgeDescriptions.length?badgeDescriptions.join('<span class="admin-detail-badge-separator" aria-hidden="true">|</span>'):UI.escapeHTML(at('noPrivileges'));
    refreshAdminBadgeCountdowns();
    const effectButton = document.getElementById("effectPermissionButton");
    effectButton.textContent = user.specialEffectsAllowed ? at('revokeEffects') : at('grantEffects');
    effectButton.classList.toggle("danger-button", user.specialEffectsAllowed);
    document.getElementById("adminChatTitle").textContent = at('supportFor',{name:displayName});

    const supportAccess=user.supportMessaging||{};
    const supportStrikes=Math.max(0,Number(supportAccess.strikes)||0);
    const supportBlocked=Boolean(supportAccess.blocked);
    document.getElementById('detailSupportAccess').textContent=supportBlocked?at('supportBlockedState'):supportStrikes?at('supportAllowedWarnings',{count:supportStrikes}):at('supportAllowedState');
    document.getElementById('detailSupportAccess').classList.toggle('is-blocked',supportBlocked);
    document.getElementById('detailSupportReason').textContent=supportBlocked?(supportAccess.reason||at('supportBlockedDesc')):at('supportResetDesc');
    const supportStrikeValue=document.getElementById('detailSupportStrike');
    const supportStrikeBadge=supportStrikeValue?.closest('.support-admin-strike');
    supportStrikeValue.textContent=`${Math.min(5,supportStrikes)}/5`;
    supportStrikeBadge?.classList.toggle('is-warning',supportStrikes>0);
    supportStrikeBadge?.classList.toggle('is-danger',supportStrikes>=3||supportBlocked);
    document.getElementById('detailSupportReset').textContent=supportAccess.resetAt?UI.formatDate(supportAccess.resetAt):at('noViolation');
    const supportCard=document.getElementById('supportModerationCard');
    supportCard?.classList.toggle('is-warning',supportStrikes>0&&!supportBlocked);
    supportCard?.classList.toggle('is-danger',supportStrikes>=3&&!supportBlocked);
    supportCard?.classList.toggle('is-blocked',supportBlocked);
    supportCard?.setAttribute('data-strikes',String(Math.min(5,supportStrikes)));
    document.querySelectorAll('.support-penalty-ladder [data-step]').forEach((node)=>{
      const step=Number(node.dataset.step);
      const active=step<=supportStrikes;
      const current=step===Math.min(5,supportStrikes)&&supportStrikes>0;
      node.classList.toggle('active',active);
      node.classList.toggle('is-current',current);
      if(current) node.setAttribute('aria-current','step'); else node.removeAttribute('aria-current');
    });
    const supportButton=document.getElementById('supportBlockButton');
    const supportButtonLabel=supportButton?.querySelector('.support-block-button-label');
    if(supportButtonLabel) supportButtonLabel.textContent=supportBlocked?at('reopenAdminContact'):at('blockAdminContact');
    else if(supportButton) supportButton.textContent=supportBlocked?at('reopenAdminContact'):at('blockAdminContact');
    supportButton.classList.toggle('danger-button',!supportBlocked);
    supportButton.classList.toggle('success-button',supportBlocked);

    const status = user.status || { type: "active" };
    const chip = document.getElementById("detailStatus");
    chip.className = `status-chip ${status.type === "active" ? "" : status.type}`;
    chip.textContent = status.type === "active" ? (user.online ? at('online') : at('active')) : status.type === "ban" ? at('banned') : at('locked');
    const mobileTitle = document.getElementById("mobileAdminWorkspaceTitle");
    if (mobileTitle) mobileTitle.textContent = displayName || at('accountInfo');
    const mobileState = document.getElementById("mobileAdminWorkspaceState");
    if (mobileState) { mobileState.textContent = chip.textContent; mobileState.className = `mobile-admin-user-state ${status.type === "active" ? (user.online ? "online" : "") : status.type}`; }

    const summary = document.getElementById("restrictionSummary");
    const unlock = document.getElementById("unlockButton");
    if (status.type !== "active") {
      summary.classList.remove("hidden");
      summary.innerHTML = `<strong>${status.type === "ban" ? at('accountBan') : at('accountLock')}</strong><br>${at('duration')}: ${status.until ? UI.formatDate(status.until) : at('permanent')}<br>${at('reason')}: ${UI.escapeHTML(status.reason || at('noReason'))}`;
      unlock.classList.remove("hidden");
    } else {
      summary.classList.add("hidden");
      summary.innerHTML = "";
      unlock.classList.add("hidden");
    }
  }

  function renderMessages(items=state.supportMessages,{cache=true,preserveScroll=false}={}) {
    const source=Array.isArray(items)?items:[];
    const previousTop=messages.scrollTop;
    const previousHeight=messages.scrollHeight;
    const wasNearBottom=previousHeight-messages.clientHeight-previousTop<72;
    if(cache) state.supportMessages=source.map((item)=>({...item,receiptBy:Array.isArray(item.receiptBy)?[...item.receiptBy]:[]}));
    messages.innerHTML = "";
    messages.classList.toggle('is-empty',!source.length);
    if (!source.length) {
      messages.innerHTML = `<div class="empty-conversation"><div class="empty-illustration">◆</div><h3>${UI.escapeHTML(at('noSupport'))}</h3><p>${UI.escapeHTML(at('startSupport'))}</p></div>`;
      return;
    }
    source.forEach((message) => appendMessage(message, false,{cache:false}));
    if(preserveScroll){
      requestAnimationFrame(()=>{
        if(wasNearBottom) messages.scrollTop=messages.scrollHeight;
        else messages.scrollTop=Math.max(0,previousTop+(messages.scrollHeight-previousHeight));
      });
    }else scrollBottom();
  }

  function appendMessage(message, scroll = true,{cache=true}={}) {
    if (!state.selectedUser || message.supportUserId !== state.selectedUser.id) return;
    if(cache){
      const index=state.supportMessages.findIndex((item)=>item.id===message.id);
      const normalized={...message,receiptBy:Array.isArray(message.receiptBy)?[...message.receiptBy]:[]};
      if(index>=0)state.supportMessages[index]={...state.supportMessages[index],...normalized};
      else state.supportMessages.push(normalized);
    }
    if (messages.querySelector(`[data-message-id="${CSS.escape(message.id)}"]`)) return;
    messages.querySelector(".empty-conversation")?.remove();
    messages.classList.remove('is-empty');
    const mine = message.senderRole === "admin";
    const sender = mine ? at('admin') : message.senderName;
    const row = document.createElement("article");
    row.className = `message-row ${mine ? "mine" : "other"}`;
    row.dataset.messageId = message.id;
    const seen = mine && (message.receiptBy || []).includes(state.selectedUser.id);
    row.innerHTML = `${mine ? "" : UI.avatarHTML(state.selectedUser,"avatar",{presence:false})}<div class="message-column"><div class="message-bubble"><div class="message-meta"><strong>${UI.escapeHTML(sender)}</strong><time>${UI.formatTime(message.createdAt)}</time></div>${message.text ? `<div class="message-text">${UI.escapeHTML(message.text)}</div>` : ""}${UI.attachmentHTML(message.attachment)}</div>${mine ? `<span class="delivery-status ${seen ? "seen" : ""}" data-message-status>${seen ? `<span class="receipt-icons">${icon("check")}${icon("check")}</span> ${at('seen')}` : `${icon("check","receipt-single")} ${at('sent')}`}</span>` : ""}</div>`;
    messages.appendChild(row);
    if (scroll) scrollBottom();
  }

  function scrollBottom() {
    requestAnimationFrame(() => { messages.scrollTop = messages.scrollHeight; });
  }

  list.addEventListener("click", (event) => {
    const item = event.target.closest("[data-admin-user-id]");
    if (item) selectUser(item.dataset.adminUserId);
  });
  document.getElementById("userSearch").addEventListener("input", renderUsers);
  document.getElementById("statusFilter").addEventListener("change", renderUsers);

  document.getElementById("worldChatMode").addEventListener("change", (event) => {
    const isReadOnly = event.target.value === "read_only";
    const customSelected = document.getElementById("worldLockDuration").value === "custom";
    document.getElementById("worldLockDurationField").classList.toggle("hidden", !isReadOnly);
    document.getElementById("worldLockCustomField").classList.toggle("hidden", !isReadOnly || !customSelected);
    updateWorldConfigPreview();
  });
  document.getElementById("worldSlowMode").addEventListener("change", updateWorldConfigPreview);
  document.getElementById("worldAntiSpam").addEventListener("change", updateWorldConfigPreview);
  document.getElementById("worldLockDuration").addEventListener("change", (event) => {
    document.getElementById("worldLockCustomField").classList.toggle("hidden", event.target.value !== "custom");
    updateWorldConfigPreview();
  });
  document.getElementById("worldLockCustomMinutes").addEventListener("input", updateWorldConfigPreview);
  document.getElementById("applyWorldChatButton").addEventListener("click", async () => {
    const { mode, lockMinutes, slowModeSeconds, antiSpamEnabled } = getWorldFormSettings();
    const labels = { open:at("everyoneCanChat"), admin_only:at("adminOnlyChat"), read_only:at("readOnly") };
    const accepted = await confirmAction(at("applyWorldConfigTitle"), at("applyWorldConfigConfirm",{mode:labels[mode],duration:lockMinutes?at("forMinutes",{count:lockMinutes}):""}));
    if (!accepted) return;
    const button = document.getElementById("applyWorldChatButton");
    const message = document.getElementById("worldControlMessage");
    message.dataset.manual = "1"; message.textContent = ""; message.classList.remove("success");
    UI.setLoading(button, true);
    try {
      const data = await UI.fetchJSON("/api/admin/world-chat", { method:"POST", body:{ mode, lockMinutes, slowModeSeconds, antiSpamEnabled } });
      state.system.worldChat = data.worldChat;
      state.system.worldChatEnabled = data.worldChat.enabled;
      message.textContent = localMessage(data.message); message.classList.add("success");
      renderSystemControls(); UI.toast(localMessage(data.message),"success");
    } catch (error) { message.textContent = localMessage(error.message); message.classList.remove("success"); }
    finally { UI.setLoading(button,false); }
  });
  document.getElementById("worldChatMessage").addEventListener("input", updateWorldMessageComposer);
  document.getElementById("worldChatMessage").addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      if (event.currentTarget.value.trim()) document.getElementById("worldAdminMessageForm").requestSubmit();
    }
  });
  document.getElementById("worldAdminMessageForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = document.getElementById("worldChatMessage");
    const text = input.value.trim();
    if (!text) return UI.toast(at("enterMessage"),"error");
    const button = document.getElementById("sendWorldAdminMessageButton");
    UI.setLoading(button,true);
    socket.emit("chat:send",{scope:"world",text},(result)=>{
      UI.setLoading(button,false);
      if (!result?.ok) return UI.toast(localMessage(result?.message,"worldSendFailed"),"error");
      input.value = "";
      updateWorldMessageComposer();
      UI.toast(at("worldFeaturedSent"),"success");
    });
  });

  document.getElementById("unlimitedAccountsInput")?.addEventListener("change", (event) => {
    const input = document.getElementById("maxAccountsInput");
    if (input) {
      input.disabled = event.target.checked;
      input.setAttribute("aria-disabled", String(event.target.checked));
    }
    document.getElementById("accountCapacityForm")?.classList.toggle("is-unlimited", event.target.checked);
  });
  document.getElementById("accountCapacityForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = document.getElementById("saveAccountCapacityButton");
    const message = document.getElementById("accountCapacityMessage");
    const unlimited = document.getElementById("unlimitedAccountsInput").checked;
    const maxAccounts = Number(document.getElementById("maxAccountsInput").value);
    if (message) message.textContent = "";
    UI.setLoading(button,true);
    try {
      const data = await UI.fetchJSON("/api/admin/system-capacity", { method:"POST", body:{ unlimited, maxAccounts } });
      state.system = data.system || state.system;
      if (message) { message.textContent = localMessage(data.message); message.className = "form-message success"; }
      renderSystemControls();
    } catch (error) {
      if (message) { message.textContent = localMessage(error.message); message.className = "form-message error"; }
    } finally { UI.setLoading(button,false); }
  });

  document.getElementById("announcementMessage").addEventListener("input", (event) => {
    document.getElementById("announcementCounter").textContent = event.target.value.length;
  });
  document.getElementById("announcementDuration").addEventListener("change", (event) => {
    document.getElementById("announcementCustomField").classList.toggle("hidden", event.target.value !== "custom");
  });
  document.getElementById("announcementForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const messageNode = document.getElementById("announcementMessageState");
    const select = document.getElementById("announcementDuration");
    const durationSeconds = select.value === "custom" ? Number(document.getElementById("announcementCustomSeconds").value) : Number(select.value);
    const message = document.getElementById("announcementMessage").value.trim();
    const button = document.getElementById("sendAnnouncementButton");
    messageNode.textContent = "";
    messageNode.classList.remove("success");
    UI.setLoading(button, true);
    try {
      const data = await UI.fetchJSON("/api/admin/announcements", { method: "POST", body: { message, durationSeconds } });
      state.system.activeAnnouncements = data.announcements || [data.announcement];
      state.system.activeAnnouncement = state.system.activeAnnouncements[0] || null;
      renderSystemControls();
      UI.showServerAnnouncement?.(state.system.activeAnnouncements);
      messageNode.textContent = at("announcementSent");
      messageNode.classList.add("success");
      UI.toast(localMessage(data.message), "success");
    } catch (error) { messageNode.textContent = localMessage(error.message); messageNode.classList.remove("success"); }
    finally { UI.setLoading(button, false); }
  });
  document.getElementById("stopAnnouncementButton").addEventListener("click", async () => {
    const accepted = await confirmAction(at("endAnnouncementTitle"), at("endAnnouncementConfirm"));
    if (!accepted) return;
    const button = document.getElementById("stopAnnouncementButton");
    UI.setLoading(button, true);
    try {
      const data = await UI.fetchJSON("/api/admin/announcements", { method: "DELETE" });
      state.system.activeAnnouncement = null;
      state.system.activeAnnouncements = [];
      renderSystemControls();
      UI.hideServerAnnouncement?.();
      UI.toast(localMessage(data.message), "success");
    } catch (error) { UI.toast(localMessage(error.message), "error"); }
    finally { UI.setLoading(button, false); }
  });

  async function uploadFile() {
    if (!state.selectedFile) return null;
    if (state.selectedFile.size > 30 * 1024 * 1024) throw new Error(at("fileTooLarge30"));
    const formData = new FormData();
    formData.append("file", state.selectedFile);
    const data = await UI.fetchJSON("/api/upload", { method: "POST", body: formData });
    return data.attachment;
  }

  const resizeAdminComposer = () => {
    if (state.composerResizeFrame) return;
    state.composerResizeFrame = requestAnimationFrame(() => {
      state.composerResizeFrame = 0;
      UI.autoResize(messageInput);
    });
  };

  messageForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (state.composerComposing) return;
    if (!state.selectedUser) return UI.toast(at("selectUserFirst"), "error");
    const text = messageInput.value.trim();
    if (!text && !state.selectedFile) return;
    const button = messageForm.querySelector("button[type='submit']");
    button.disabled = true;
    try {
      const attachment = await uploadFile();
      socket.emit("chat:send", { scope: "support", targetId: state.selectedUser.id, text, attachmentId: attachment?.id || null }, (result) => {
        button.disabled = false;
        if (!result?.ok) return UI.toast(localMessage(result?.message,"sendMessageFailed"), "error");
        messageInput.value = "";
        resizeAdminComposer();
        clearTimeout(state.typingTimer);
        if (state.typingActive) socket.emit("chat:typing", { scope: "support", targetId: state.selectedUser.id, isTyping: false });
        state.typingActive = false;
        clearAttachment();
      });
    } catch (error) {
      button.disabled = false;
      UI.toast(localMessage(error.message), "error");
    }
  });

  messageInput.addEventListener("compositionstart", () => { state.composerComposing = true; });
  messageInput.addEventListener("compositionend", () => { state.composerComposing = false; messageInput.dispatchEvent(new Event("input", { bubbles: true })); });
  messageInput.addEventListener("input", () => {
    resizeAdminComposer();
    if (state.composerComposing || !state.selectedUser) return;
    const typingTargetId = state.selectedUser.id;
    const now = Date.now();
    if (!state.typingActive || now - state.lastTypingSignalAt > 2500) {
      state.typingActive = true;
      state.lastTypingSignalAt = now;
      socket.emit("chat:typing", { scope: "support", targetId: typingTargetId, isTyping: true });
    }
    clearTimeout(state.typingTimer);
    state.typingTimer = setTimeout(() => { if (state.typingActive) socket.emit("chat:typing", { scope: "support", targetId: typingTargetId, isTyping: false }); state.typingActive = false; }, 1600);
  });
  messageInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing && !state.composerComposing) {
      event.preventDefault();
      messageForm.requestSubmit();
    }
  });

  document.getElementById("adminAttachButton").addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;
    if (file.size > 30 * 1024 * 1024) {
      UI.toast(at("fileTooLarge30"), "error");
      fileInput.value = "";
      return;
    }
    if (state.selectedFileUrl) URL.revokeObjectURL(state.selectedFileUrl);
    state.selectedFile = file;
    state.selectedFileUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
    renderAdminAttachmentPreview();
  });
  preview.addEventListener("click", (event) => { if (event.target.closest("[data-remove]")) clearAttachment(); });
  function renderAdminAttachmentPreview(){
    const file=state.selectedFile;
    if(!file){preview.classList.add('hidden');preview.innerHTML='';return;}
    preview.classList.remove("hidden");
    preview.innerHTML = `${state.selectedFileUrl ? `<img class="attachment-preview-image" src="${state.selectedFileUrl}" alt="">` : `<span class="file-icon">↑</span>`}<div class="preview-copy"><strong>${UI.escapeHTML(file.name)}</strong><small>${UI.formatBytes(file.size)}${state.selectedFileUrl ? ` · ${at("originalQuality")}` : ""}</small></div><button type="button" data-remove aria-label="${UI.escapeHTML(at('close'))}">×</button>`;
  }
  function clearAttachment() {
    if (state.selectedFileUrl) URL.revokeObjectURL(state.selectedFileUrl);
    state.selectedFileUrl = null;
    state.selectedFile = null;
    fileInput.value = "";
    preview.classList.add("hidden");
    preview.innerHTML = "";
  }


  document.getElementById("effectPermissionButton").addEventListener("click", async () => {
    if (!state.selectedUser) return;
    try { await setEffectPermissionForUser(state.selectedUser, !state.selectedUser.specialEffectsAllowed); }
    catch (error) { UI.toast(localMessage(error.message), "error"); }
  });

  document.getElementById("grantEffectByUsername").addEventListener("click", () => setEffectPermissionByInput(true));
  document.getElementById("revokeEffectByUsername").addEventListener("click", () => setEffectPermissionByInput(false));
  document.getElementById("effectUsername").addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); setEffectPermissionByInput(true); } });
  document.getElementById("effectGrantedList").addEventListener("click", (event) => {
    const item = event.target.closest("[data-effect-user-id]");
    if (item) selectUser(item.dataset.effectUserId);
  });

  document.getElementById("badgeDuration").addEventListener("change", (event) => {
    document.getElementById("badgeCustomDurationField").classList.toggle("hidden", event.target.value !== "custom");
  });
  document.getElementById("grantBadgeByUsername").addEventListener("click", () => setBadgeByInput(true));
  document.getElementById("revokeBadgeByUsername").addEventListener("click", () => setBadgeByInput(false));
  document.getElementById("badgeUsername").addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); setBadgeByInput(true); } });
  document.getElementById("badgeGrantedList").addEventListener("click", async (event) => {
    const open = event.target.closest("[data-badge-open-user]");
    if (open) return selectUser(open.dataset.badgeOpenUser);
    const revoke = event.target.closest("[data-badge-revoke-user]");
    if (!revoke) return;
    const user = state.users.find((item) => item.id === revoke.dataset.badgeRevokeUser);
    try { await changeProfileBadge(user, revoke.dataset.badgeRevokeType, false); }
    catch (error) { UI.toast(localMessage(error.message), "error"); }
  });

  document.getElementById("manageBadgeButton").addEventListener("click", () => {
    if (!state.selectedUser) return;
    document.getElementById("badgeModalUser").textContent = at("manageBadgesFor",{username:state.selectedUser.username});
    document.getElementById("badgeModalMessage").textContent = "";
    document.getElementById("badgeModalDuration").value = "1440";
    document.getElementById("badgeModalCustomField").classList.add("hidden");
    UI.openModal("badgeModal");
  });
  document.getElementById("badgeModalDuration").addEventListener("change", (event) => {
    document.getElementById("badgeModalCustomField").classList.toggle("hidden", event.target.value !== "custom");
  });
  document.getElementById("badgeForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!state.selectedUser) return;
    const button = event.currentTarget.querySelector('button[type="submit"]');
    const message = document.getElementById("badgeModalMessage");
    UI.setLoading(button, true);
    message.textContent = "";
    try {
      const duration = durationPayload("badgeModalDuration", "badgeModalCustom");
      const changed = await changeProfileBadge(state.selectedUser, selectedBadgeType(), true, duration);
      if (changed) UI.closeModal("badgeModal");
    } catch (error) { message.textContent = localMessage(error.message); }
    finally { UI.setLoading(button, false); }
  });
  document.getElementById("revokeSelectedBadge").addEventListener("click", async () => {
    if (!state.selectedUser) return;
    const message = document.getElementById("badgeModalMessage");
    message.textContent = "";
    try {
      const changed = await changeProfileBadge(state.selectedUser, selectedBadgeType(), false);
      if (changed) UI.closeModal("badgeModal");
    } catch (error) { message.textContent = localMessage(error.message); }
  });

  document.getElementById("changePasswordButton").addEventListener("click", () => {
    if (!state.selectedUser) return;
    document.getElementById("passwordForm").reset();
    document.getElementById("passwordMessage").textContent = "";
    UI.openModal("passwordModal");
  });

  document.getElementById("passwordForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!state.selectedUser) return;
    const button = event.currentTarget.querySelector("button[type='submit']");
    const message = document.getElementById("passwordMessage");
    const newPassword = document.getElementById("newUserPassword").value;
    if (newPassword.length < 8 || newPassword.length > 72 || !/[A-Za-zÀ-ỹ]/u.test(newPassword) || !/[0-9]/.test(newPassword)) {
      message.textContent = at("changePasswordDescription");
      message.classList.add("error");
      return;
    }
    UI.setLoading(button, true);
    message.textContent = "";
    try {
      const data = await UI.fetchJSON(`/api/admin/users/${state.selectedUser.id}/password`, { method: "POST", body: { newPassword } });
      UI.closeModal("passwordModal");
      UI.toast(localMessage(data.message), "success");
    } catch (error) { message.textContent = localMessage(error.message); }
    finally { UI.setLoading(button, false); }
  });

  document.getElementById("restrictButton").addEventListener("click", () => {
    if (!state.selectedUser) return;
    document.getElementById("restrictForm").reset();
    document.getElementById("customDurationField").classList.add("hidden");
    document.getElementById("restrictMessage").textContent = "";
    UI.openModal("restrictModal");
  });
  document.getElementById('supportBlockButton')?.addEventListener('click',async()=>{
    if(!state.selectedUser)return;
    const access=state.selectedUser.supportMessaging||{};
    if(access.blocked){
      const accepted=await confirmAction(at('unblockSupportTitle'),at('unblockSupportConfirm',{username:state.selectedUser.username}));
      if(!accepted)return;
      try{const data=await UI.fetchJSON(`/api/admin/users/${state.selectedUser.id}/support-block`,{method:'POST',body:{block:false}});state.selectedUser.supportMessaging=data.supportMessaging;UI.toast(localMessage(data.message),'success');renderDetails();await Promise.all([loadUsers(false),loadDashboard()]);}catch(error){UI.toast(localMessage(error.message),'error');}
      return;
    }
    document.getElementById('supportBlockForm').reset();
    document.getElementById('supportBlockCustomField').classList.add('hidden');
    document.getElementById('supportBlockMessage').textContent='';
    UI.openModal('supportBlockModal');
  });
  document.getElementById('supportBlockDuration')?.addEventListener('change',(event)=>document.getElementById('supportBlockCustomField').classList.toggle('hidden',event.target.value!=='custom'));
  document.getElementById('supportBlockForm')?.addEventListener('submit',async(event)=>{
    event.preventDefault();if(!state.selectedUser)return;
    const form=event.currentTarget,button=form.querySelector('button[type="submit"]'),select=document.getElementById('supportBlockDuration');
    const permanent=select.value==='permanent';const minutes=select.value==='custom'?Number(document.getElementById('supportBlockCustomMinutes').value):Number(select.value);
    const reason=document.getElementById('supportBlockReason').value.trim();const message=document.getElementById('supportBlockMessage');message.textContent='';
    if(!permanent&&(!Number.isFinite(minutes)||minutes<1||minutes>525600)){message.textContent=at('durationOneYearError');return;}
    UI.setLoading(button,true);
    try{const data=await UI.fetchJSON(`/api/admin/users/${state.selectedUser.id}/support-block`,{method:'POST',body:{block:true,permanent,minutes,reason}});state.selectedUser.supportMessaging=data.supportMessaging;UI.closeModal('supportBlockModal');renderDetails();UI.toast(localMessage(data.message),'success');await Promise.all([loadUsers(false),loadDashboard()]);}catch(error){message.textContent=localMessage(error.message);}finally{UI.setLoading(button,false);}
  });

  document.getElementById("restrictionDuration").addEventListener("change", (event) => {
    document.getElementById("customDurationField").classList.toggle("hidden", event.target.value !== "custom");
  });

  document.getElementById("restrictForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!state.selectedUser) return;
    const button = event.currentTarget.querySelector("button[type='submit']");
    const message = document.getElementById("restrictMessage");
    const duration = document.getElementById("restrictionDuration").value;
    const body = {
      type: document.querySelector("input[name='restrictionType']:checked").value,
      permanent: duration === "permanent",
      minutes: duration === "custom" ? Number(document.getElementById("customDuration").value) : Number(duration),
      reason: document.getElementById("restrictionReason").value.trim(),
    };
    UI.setLoading(button, true);
    message.textContent = "";
    try {
      const data = await UI.fetchJSON(`/api/admin/users/${state.selectedUser.id}/restrict`, { method: "POST", body });
      UI.closeModal("restrictModal");
      UI.toast(localMessage(data.message), "success");
      queueAdminRefresh();
      await selectUser(state.selectedUser.id, false);
    } catch (error) { message.textContent = localMessage(error.message); }
    finally { UI.setLoading(button, false); }
  });

  document.getElementById("unlockButton").addEventListener("click", async () => {
    if (!state.selectedUser) return;
    const accepted = await confirmAction(at("unlockAccountTitle"), at("unlockAccountConfirm",{username:state.selectedUser.username}));
    if (!accepted) return;
    try {
      const data = await UI.fetchJSON(`/api/admin/users/${state.selectedUser.id}/unlock`, { method: "POST" });
      UI.toast(localMessage(data.message), "success");
      await loadUsers(false);
      await selectUser(state.selectedUser.id, false);
      loadDashboard();
    } catch (error) { UI.toast(localMessage(error.message), "error"); }
  });

  function confirmAction(title, text) {
    // Use the global top-layer confirmation portal instead of the legacy Admin
    // modal. The old modal could render only its blur backdrop while its card
    // stayed transparent, leaving the entire dashboard unclickable.
    return UI.confirmDialog({
      title,
      message: text,
      confirmText: at("confirm"),
      cancelText: at("cancel"),
      danger: false,
      keepOpenOnConfirm: false,
    });
  }

  document.getElementById("refreshAuditButton")?.addEventListener("click", loadAudit);
  document.getElementById("clearAuditButton")?.addEventListener("click",()=>{
    const input=document.getElementById("clearAuditPassword");
    const message=document.getElementById("clearAuditMessage");
    if(input)input.value="";
    if(message){message.textContent="";message.classList.remove("success");}
    UI.openModal("clearAuditModal");
  });
  document.getElementById("clearAuditForm")?.addEventListener("submit",async(event)=>{
    event.preventDefault();
    const button=document.getElementById("confirmClearAuditButton");
    const password=document.getElementById("clearAuditPassword")?.value||"";
    const message=document.getElementById("clearAuditMessage");
    if(!password){if(message)message.textContent=at("enterConfirmationPassword");return;}
    UI.setLoading(button,true);
    if(message){message.textContent="";message.classList.remove("success");}
    try{
      const data=await UI.fetchJSON("/api/admin/audit",{method:"DELETE",body:{password}});
      state.auditEntries=[];
      renderAudit([]);
      UI.closeModal("clearAuditModal");
      window.NexPolish?.showActionSuccess?.(at("historyClearedTitle"), localMessage(data.message,"historyClearedDesc")) || UI.toast(localMessage(data.message,"historyClearedDesc"),"success");
    }catch(error){if(message)message.textContent=localMessage(error.message);}
    finally{UI.setLoading(button,false);}
  });
  socket.on("admin:audit-cleared",()=>{state.auditEntries=[];renderAudit([]);});
  socket.on("admin:audit", (entry) => {
    state.auditEntries=[entry,...(state.auditEntries||[]).filter((item)=>item.id!==entry.id)].slice(0,60);
    renderAudit(state.auditEntries);
  });

  socket.on("connect", () => setAdminConnectionState('connected'));
  socket.io?.on?.("reconnect_attempt", () => setAdminConnectionState('connecting'));
  socket.on("disconnect", () => setAdminConnectionState('disconnected'));
  setAdminConnectionState(socket.connected?'connected':'connecting');
  socket.on('admin:report:new',(report)=>{state.reports=[report,...state.reports.filter((item)=>item.id!==report.id)];UI.toast(at('newReportToast',{username:report.target?.username||at('genericUser'),reason:reportReasonText(report)}),'warning');loadReports({quiet:true});loadDashboard();});
  socket.on('admin:report:update',(report)=>{state.reports=state.reports.map((item)=>item.id===report.id?report:item);renderReports();loadDashboard();});
  socket.on('support:access',(payload={})=>{
    if(state.selectedUser&&payload.userId&&state.selectedUser.id!==payload.userId)return;
    if(state.selectedUser){state.selectedUser.supportMessaging={...state.selectedUser.supportMessaging,...payload};renderDetails();}
    queueAdminRefresh(120);
  });
  socket.on('support:moderation',(payload={})=>{
    const listed=state.users.find((user)=>user.id===payload.userId);if(listed)listed.supportMessaging={...listed.supportMessaging,...(payload.supportMessaging||{}),strikes:payload.strike??payload.supportMessaging?.strikes};
    if(state.selectedUser?.id===payload.userId){state.selectedUser.supportMessaging={...state.selectedUser.supportMessaging,...(payload.supportMessaging||{}),strikes:payload.strike??payload.supportMessaging?.strikes};renderDetails();}
    renderUsers();loadDashboard();
    if(payload.message)UI.toast(at('moderationToast',{username:payload.username||at('genericUser'),message:localMessage(payload.message)}),Number(payload.strike)>=3?'error':'warning');
  });
  socket.on("chat:message", async (message) => {
    if (message.scope !== "support") return;
    if (state.selectedUser?.id === message.supportUserId) {
      appendMessage(message);
      if (message.senderRole !== "admin") socket.emit("chat:read", { scope: "support", targetId: state.selectedUser.id });
    }
    if (message.senderRole !== "admin") UI.toast(at("newSupportMessage",{name:message.senderName}), "info");
    queueAdminRefresh();
  });
  socket.on("chat:read", (payload) => {
    if (payload.scope !== "support" || payload.supportUserId !== state.selectedUser?.id || !Array.isArray(payload.messageIds)) return;
    const ids=new Set(payload.messageIds);
    state.supportMessages=state.supportMessages.map((message)=>ids.has(message.id)?{...message,receiptBy:[...new Set([...(message.receiptBy||[]),state.selectedUser.id])]}:message);
    payload.messageIds.forEach((messageId) => {
      const status = messages.querySelector(`[data-message-id="${CSS.escape(messageId)}"] [data-message-status]`);
      if (status) { status.classList.add("seen"); status.innerHTML = `<span class="receipt-icons">${icon("check")}${icon("check")}</span> ${at("seen")}`; }
    });
  });
  function renderRemoteTyping(){
    const node=document.getElementById('adminTyping');
    if(!node)return;
    const payload=state.remoteTyping;
    node.textContent=payload?.isTyping?at('typingStatus',{username:payload.username||state.selectedUser?.username||at('genericUser')}):'';
  }
  socket.on("chat:typing", (payload) => {
    if (payload.scope !== "support" || payload.userId !== state.selectedUser?.id) return;
    state.remoteTyping={...payload};
    renderRemoteTyping();
  });
  let presenceRenderFrame = 0;
  socket.on("presence:update", ({ userId, online }) => {
    const user = state.users.find((item) => item.id === userId);
    if (user) user.online = online;
    if (state.selectedUser?.id === userId) { state.selectedUser.online = online; renderDetails(); }
    if (presenceRenderFrame) return;
    presenceRenderFrame = requestAnimationFrame(() => {
      presenceRenderFrame = 0;
      renderUsers();
      queueAdminRefresh(650);
    });
  });
  socket.on("admin:effects:update", async () => {
    await Promise.all([loadDashboard(), loadUsers(false)]);
    if (state.selectedUser) await selectUser(state.selectedUser.id, false);
  });
  socket.on("admin:badges:update", async () => {
    await Promise.all([loadDashboard(), loadUsers(false)]);
    if (state.selectedUser) await selectUser(state.selectedUser.id, false);
  });
  socket.on("world:state", (payload = {}) => {
    state.system.worldChat = payload;
    state.system.worldChatEnabled = payload.enabled !== false;
    const message = document.getElementById("worldControlMessage");
    if (message) { delete message.dataset.manual; message.textContent = ""; }
    renderSystemControls();
  });
  socket.on("system:capacity", (capacity = {}) => {
    state.system.accountCapacity = capacity;
    state.system.maxAccounts = Number(capacity.max) || 0;
    renderSystemControls();
  });
  socket.on("server:announcements", (announcements = []) => {
    state.system.activeAnnouncements = Array.isArray(announcements) ? announcements : [];
    state.system.activeAnnouncement = state.system.activeAnnouncements[0] || null;
    renderSystemControls();
  });
  socket.on("server:announcement", (announcement) => {
    const current = state.system.activeAnnouncements || [];
    if (!current.some((item) => item.id === announcement?.id)) current.push(announcement);
    state.system.activeAnnouncements = current.filter(Boolean);
    state.system.activeAnnouncement = state.system.activeAnnouncements[0] || null;
    renderSystemControls();
  });
  socket.on("server:announcement:clear", (payload = {}) => {
    if (payload.all) state.system.activeAnnouncements = [];
    else state.system.activeAnnouncements = (state.system.activeAnnouncements || []).filter((item) => item.id !== payload.id);
    state.system.activeAnnouncement = state.system.activeAnnouncements[0] || null;
    renderSystemControls();
  });

  function setupAdminCyberEffects() {
    const body = document.body;
    if (!body.classList.contains("admin-cyberpunk")) return () => {};

    const finePointer = window.matchMedia("(hover:hover) and (pointer:fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion:reduce)");
    let frame = 0;
    let pointerX = Math.round(window.innerWidth * 0.72);
    let pointerY = Math.round(window.innerHeight * 0.18);

    const paintPointer = () => {
      frame = 0;
      const width = Math.max(window.innerWidth, 1);
      const height = Math.max(window.innerHeight, 1);
      const normalizedX = (pointerX / width - 0.5) * 2;
      const normalizedY = (pointerY / height - 0.5) * 2;
      body.style.setProperty("--admin-pointer-x", `${pointerX}px`);
      body.style.setProperty("--admin-pointer-y", `${pointerY}px`);
      body.style.setProperty("--admin-space-x", `${(normalizedX * 18).toFixed(2)}px`);
      body.style.setProperty("--admin-space-y", `${(normalizedY * 14).toFixed(2)}px`);
      body.style.setProperty("--admin-space-x-soft", `${(normalizedX * 10).toFixed(2)}px`);
      body.style.setProperty("--admin-space-y-soft", `${(normalizedY * 8).toFixed(2)}px`);
      body.style.setProperty("--admin-space-x-reverse", `${(normalizedX * -18).toFixed(2)}px`);
      body.style.setProperty("--admin-space-y-reverse", `${(normalizedY * -14).toFixed(2)}px`);
      body.style.setProperty("--admin-space-x-soft-reverse", `${(normalizedX * -10).toFixed(2)}px`);
      body.style.setProperty("--admin-space-y-soft-reverse", `${(normalizedY * -8).toFixed(2)}px`);
    };
    const onPointerMove = (event) => {
      if (!finePointer.matches || reducedMotion.matches || body.classList.contains("performance-lite")) return;
      pointerX = Math.round(event.clientX);
      pointerY = Math.round(event.clientY);
      if (!frame) frame = requestAnimationFrame(paintPointer);
    };
    const onVisibilityChange = () => body.classList.toggle("admin-effects-paused", document.hidden);

    paintPointer();
    onVisibilityChange();
    window.addEventListener("pointermove", onPointerMove, { passive:true });
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }

  function setupAdminBigUpdate() {
    const body = document.body;
    const main = document.getElementById("adminMain");
    const atmosphere = document.querySelector(".admin-cyber-atmosphere");
    if (!body.classList.contains("admin-page") || !main || !atmosphere) return () => {};

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileMotion = window.matchMedia("(max-width: 820px)");
    const lowHardware = Number(navigator.deviceMemory || 8) <= 4 || Number(navigator.hardwareConcurrency || 8) <= 4;
    let resizeTimer = 0;
    let scrollFrame = 0;
    let previousScrollTop = 0;
    let scrollDownDistance = 0;
    let scrollUpDistance = 0;
    let revealObserver = null;
    let statObserver = null;
    const desktopTopbar = window.matchMedia("(min-width: 981px)");
    const topbar = main.querySelector(".admin-topbar");

    body.classList.toggle("admin-low-power", lowHardware);
    body.classList.add("admin-big-update-ready");

    const seeded = (seed) => {
      const value = Math.sin(seed * 997.31) * 43758.5453;
      return value - Math.floor(value);
    };

    const buildAtmosphere = () => {
      const particles = atmosphere.querySelector(".admin-atmosphere-particles");
      const meteors = atmosphere.querySelector(".admin-atmosphere-meteors");
      if (!particles || !meteors) return;
      particles.replaceChildren();
      meteors.replaceChildren();

      const mobile = mobileMotion.matches;
      const resolvedMotion = document.documentElement.dataset.v10MotionResolved || "balanced";
      const minimal = reducedMotion.matches || body.classList.contains("performance-lite") || body.classList.contains("motion-minimal") || resolvedMotion === "static";
      const cinematic = resolvedMotion === "cinematic";
      const economy = resolvedMotion === "economy";
      const strongHardware = Number(navigator.deviceMemory || 8) >= 8 && Number(navigator.hardwareConcurrency || 8) >= 8;
      const cinematicMax = cinematic && !mobile && !lowHardware && strongHardware;
      const particleCount = minimal ? 0 : economy ? (mobile ? 8 : 14) : mobile ? (cinematic ? 34 : 20) : lowHardware ? (cinematic ? 44 : 30) : (cinematic ? (cinematicMax ? 128 : 104) : 56);
      const meteorCount = minimal || economy ? 0 : mobile ? (cinematic ? 4 : 2) : lowHardware ? (cinematic ? 5 : 3) : (cinematic ? (cinematicMax ? 12 : 9) : 5);
      const particleFragment = document.createDocumentFragment();
      for (let index = 0; index < particleCount; index += 1) {
        const particle = document.createElement("i");
        particle.className = "admin-atmosphere-particle";
        particle.style.setProperty("--x", `${Math.round(seeded(index + 1) * 100)}%`);
        particle.style.setProperty("--y", `${Math.round(seeded(index + 41) * 100)}%`);
        particle.style.setProperty("--size", `${(0.8 + seeded(index + 83) * 2.3).toFixed(2)}px`);
        particle.style.setProperty("--alpha", `${(0.22 + seeded(index + 127) * 0.68).toFixed(2)}`);
        particle.style.setProperty("--delay", `${(-seeded(index + 167) * 18).toFixed(2)}s`);
        particle.style.setProperty("--duration", `${(10 + seeded(index + 211) * 20).toFixed(2)}s`);
        particle.style.setProperty("--drift", `${Math.round(-18 + seeded(index + 251) * 36)}px`);
        particleFragment.appendChild(particle);
      }
      particles.appendChild(particleFragment);

      const meteorFragment = document.createDocumentFragment();
      for (let index = 0; index < meteorCount; index += 1) {
        const meteor = document.createElement("i");
        meteor.className = `admin-atmosphere-meteor meteor-${index + 1}`;
        meteor.style.setProperty("--meteor-x", `${Math.round(-12 + seeded(index + 301) * 96)}%`);
        meteor.style.setProperty("--meteor-y", `${Math.round(4 + seeded(index + 337) * 76)}%`);
        meteor.style.setProperty("--meteor-delay", `${(index * 2.3 + seeded(index + 373) * 2.4).toFixed(2)}s`);
        meteor.style.setProperty("--meteor-duration", `${(cinematic ? 8.8 : 11) + seeded(index + 401) * (cinematic ? 6.2 : 7)}s`);
        meteor.style.setProperty("--meteor-length", `${Math.round((cinematic ? 118 : 92) + seeded(index + 443) * (cinematic ? 94 : 56))}px`);
        meteor.style.setProperty("--meteor-tilt", `${(-17 - seeded(index + 479) * (cinematic ? 18 : 10)).toFixed(2)}deg`);
        meteor.style.setProperty("--meteor-opacity", `${(cinematic ? 0.96 : 0.82).toFixed(2)}`);
        meteorFragment.appendChild(meteor);
      }
      meteors.appendChild(meteorFragment);
    };

    const topButton = document.createElement("button");
    topButton.type = "button";
    topButton.className = "admin-back-to-top";
    topButton.setAttribute("aria-label", at("backToTopAdmin"));
    topButton.innerHTML = '<span aria-hidden="true">↑</span>';
    body.appendChild(topButton);

    topButton.addEventListener("click", () => {
      const mainScrollable = main.scrollHeight > main.clientHeight + 24 && ["auto", "scroll"].includes(getComputedStyle(main).overflowY);
      if (mainScrollable) main.scrollTo({ top: 0, behavior: reducedMotion.matches ? "auto" : "smooth" });
      else window.scrollTo({ top: 0, behavior: reducedMotion.matches ? "auto" : "smooth" });
    });

    const getScrollState = () => {
      const mainScrollable = main.scrollHeight > main.clientHeight + 24 && ["auto", "scroll"].includes(getComputedStyle(main).overflowY);
      const target = mainScrollable ? main : document.scrollingElement;
      const top = mainScrollable ? main.scrollTop : window.scrollY;
      const max = Math.max(1, target.scrollHeight - (mainScrollable ? main.clientHeight : window.innerHeight));
      return { target, top, max };
    };
    const revealAdminTopbar = () => {
      body.classList.remove("admin-topbar-hidden");
      scrollDownDistance = 0;
    };
    const updateScrollUi = () => {
      scrollFrame = 0;
      const { top } = getScrollState();
      const delta = top - previousScrollTop;
      topButton.classList.toggle("is-visible", top > 520);
      body.classList.toggle("admin-has-scrolled", top > 20);

      const keepVisible = !desktopTopbar.matches || top <= 54 || topbar?.matches(":focus-within");
      if (keepVisible) {
        revealAdminTopbar();
        scrollUpDistance = 0;
      } else if (delta > 1) {
        scrollDownDistance += delta;
        scrollUpDistance = 0;
        if (top > 150 && scrollDownDistance >= 34) body.classList.add("admin-topbar-hidden");
      } else if (delta < -1) {
        scrollUpDistance += Math.abs(delta);
        scrollDownDistance = 0;
        if (scrollUpDistance >= 18) revealAdminTopbar();
      }
      previousScrollTop = top;
    };
    const queueScrollUi = () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScrollUi); };
    main.addEventListener("scroll", queueScrollUi, { passive: true });
    window.addEventListener("scroll", queueScrollUi, { passive: true });

    if ("IntersectionObserver" in window) {
      revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("admin-section-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      }, { rootMargin: "80px 0px -8%", threshold: 0.05 });
      document.querySelectorAll(".motion-surface,.stats-grid article,.admin-workspace,.admin-empty").forEach((element, index) => {
        element.classList.add("admin-reveal-ready");
        element.style.setProperty("--admin-reveal-order", String(index % 8));
        revealObserver.observe(element);
      });

    } else {
      document.querySelectorAll(".motion-surface,.stats-grid article,.admin-workspace,.admin-empty").forEach((element) => element.classList.add("admin-section-visible"));
    }

    const stats = [...document.querySelectorAll("#statsGrid strong")];
    statObserver = new MutationObserver((records) => {
      records.forEach((record) => {
        const strong = record.target.nodeType === Node.TEXT_NODE ? record.target.parentElement : record.target.closest?.("strong") || record.target;
        const card = strong?.closest?.("article");
        if (!card) return;
        card.classList.remove("admin-stat-updated");
        void card.offsetWidth;
        card.classList.add("admin-stat-updated");
        setTimeout(() => card.classList.remove("admin-stat-updated"), 560);
      });
    });
    stats.forEach((strong) => statObserver.observe(strong, { childList: true, characterData: true, subtree: true }));

    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        revealAdminTopbar();
        previousScrollTop = getScrollState().top;
        buildAtmosphere();
        updateScrollUi();
      }, 180);
    };
    const onTopbarFocus = (event) => { if (topbar?.contains(event.target)) revealAdminTopbar(); };
    const onMotionChange = () => buildAtmosphere();
    const onExperienceMotionChange = () => buildAtmosphere();
    window.addEventListener("resize", onResize, { passive: true });
    document.addEventListener("focusin", onTopbarFocus);
    document.addEventListener("nexchat:v10-motion", onExperienceMotionChange);
    reducedMotion.addEventListener?.("change", onMotionChange);
    mobileMotion.addEventListener?.("change", onMotionChange);
    buildAtmosphere();
    updateScrollUi();

    return () => {
      clearTimeout(resizeTimer);
      if (scrollFrame) cancelAnimationFrame(scrollFrame);
      revealObserver?.disconnect();
      statObserver?.disconnect();
      main.removeEventListener("scroll", queueScrollUi);
      window.removeEventListener("scroll", queueScrollUi);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("focusin", onTopbarFocus);
      document.removeEventListener("nexchat:v10-motion", onExperienceMotionChange);
      reducedMotion.removeEventListener?.("change", onMotionChange);
      mobileMotion.removeEventListener?.("change", onMotionChange);
      topButton.remove();
      body.classList.remove("admin-big-update-ready", "admin-has-scrolled", "admin-topbar-hidden");
    };
  }

  const cleanupAdminCyberEffects = setupAdminCyberEffects();
  const cleanupAdminBigUpdate = setupAdminBigUpdate();

  let adminSidebarReturnFocus = null;
  let adminSidebarCloseTimer = 0;
  function openAdminSidebar() {
    const sidebar = document.getElementById("adminSidebar");
    const overlay = document.getElementById("adminSidebarOverlay");
    const trigger = document.getElementById("openAdminSidebar");
    if (!sidebar || !overlay || !isMobileAdmin()) return;
    clearTimeout(adminSidebarCloseTimer);
    adminSidebarReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : trigger;
    overlay.classList.remove("hidden", "is-closing");
    sidebar.classList.add("open");
    document.body.classList.add("admin-sidebar-open");
    trigger?.setAttribute("aria-expanded", "true");
    sidebar.setAttribute("aria-hidden", "false");
    void overlay.offsetWidth;
    requestAnimationFrame(() => {
      overlay.classList.add("is-visible");
      document.getElementById("closeAdminSidebar")?.focus({ preventScroll:true });
    });
  }
  function closeAdminSidebar({ restoreFocus = false } = {}) {
    const sidebar = document.getElementById("adminSidebar");
    const overlay = document.getElementById("adminSidebarOverlay");
    const trigger = document.getElementById("openAdminSidebar");
    if (!sidebar || !overlay || (!sidebar.classList.contains("open") && overlay.classList.contains("hidden"))) return;
    clearTimeout(adminSidebarCloseTimer);
    sidebar.classList.remove("open");
    overlay.classList.remove("is-visible");
    overlay.classList.add("is-closing");
    document.body.classList.remove("admin-sidebar-open");
    trigger?.setAttribute("aria-expanded", "false");
    const closeImmediately = !isMobileAdmin();
    let finished = false;
    const finish = () => {
      if (finished || sidebar.classList.contains("open")) return;
      finished = true;
      sidebar.removeEventListener("transitionend", onEnd);
      overlay.removeEventListener("transitionend", onOverlayEnd);
      clearTimeout(adminSidebarCloseTimer);
      overlay.classList.add("hidden");
      overlay.classList.remove("is-closing", "is-visible");
      if (isMobileAdmin()) sidebar.setAttribute("aria-hidden", "true");
      else sidebar.removeAttribute("aria-hidden");
      if (restoreFocus) requestAnimationFrame(() => (adminSidebarReturnFocus || trigger)?.focus?.({ preventScroll:true }));
    };
    const onEnd = (event) => { if (event.target === sidebar && event.propertyName === "transform") finish(); };
    const onOverlayEnd = (event) => { if (event.target === overlay && event.propertyName === "opacity") finish(); };
    sidebar.addEventListener("transitionend", onEnd);
    overlay.addEventListener("transitionend", onOverlayEnd);
    if (closeImmediately) finish();
    else adminSidebarCloseTimer = setTimeout(finish, 290);
  }
  document.getElementById("openAdminSidebar").addEventListener("click", openAdminSidebar);
  document.getElementById("closeAdminSidebar").addEventListener("click", () => closeAdminSidebar({ restoreFocus:true }));
  document.getElementById("adminSidebarOverlay").addEventListener("click", () => closeAdminSidebar({ restoreFocus:true }));
  document.getElementById('mobileAdminWorkspaceClose')?.addEventListener('click',closeMobileAdminWorkspace);
  document.querySelectorAll('[data-admin-workspace-tab]').forEach((button)=>button.addEventListener('click',()=>setAdminWorkspaceTab(button.dataset.adminWorkspaceTab)));
  window.addEventListener('resize',queueAdminViewportSync,{passive:true});
  window.addEventListener('orientationchange',()=>setTimeout(syncAdminViewport,120),{passive:true});
  window.visualViewport?.addEventListener('resize',queueAdminViewportSync,{passive:true});
  window.visualViewport?.addEventListener('scroll',queueAdminViewportSync,{passive:true});
  adminMobileQuery.addEventListener?.('change',()=>{closeAdminSidebar();syncAdminViewport();if(!isMobileAdmin()){document.body.classList.remove('mobile-admin-user-open');if(state.selectedUser){document.getElementById('adminEmpty')?.classList.add('hidden');document.getElementById('adminWorkspace')?.classList.remove('hidden');document.querySelectorAll('[data-admin-workspace-panel]').forEach((panel)=>panel.classList.remove('mobile-panel-hidden'));}}else if(!state.selectedUser){document.getElementById('adminWorkspace')?.classList.add('hidden');document.getElementById('adminEmpty')?.classList.remove('hidden');}});
  document.addEventListener('keydown',(event)=>{if(event.key!=='Escape')return;if(document.body.classList.contains('admin-sidebar-open')){closeAdminSidebar({restoreFocus:true});return;}if(document.body.classList.contains('mobile-admin-user-open'))closeMobileAdminWorkspace();});
  syncAdminViewport();
  if (isMobileAdmin()) document.getElementById("adminSidebar")?.setAttribute("aria-hidden", "true");

  function handleAuthError(error) {
    if ([401, 403].includes(error.status)) location.href = "/login";
    else UI.toast(localMessage(error.message), "error");
  }

  const badgeRefreshTimer = setInterval(()=>{if(!document.hidden)renderBadgeManager();}, 60000);
  const systemRefreshTimer = setInterval(()=>{if(!document.hidden){refreshAdminBadgeCountdowns();refreshSystemCountdowns();}},1000);
  window.addEventListener("beforeunload", () => {
    clearInterval(badgeRefreshTimer);
    clearInterval(systemRefreshTimer);
    clearTimeout(adminRefreshTimer);
    clearTimeout(state.typingTimer);
    cleanupAdminCyberEffects();
    cleanupAdminBigUpdate();
  }, { once: true });
  function refreshAdminLanguageRuntime(){
    applyAdminLanguage();
    renderUsers();
    renderEffectManager();
    renderBadgeManager();
    renderAudit(state.auditEntries||[]);
    renderReports();
    if(state.selectedReport&&document.getElementById('adminReportModal')?.classList.contains('show'))openReportReview(state.selectedReport);
    if(state.selectedUser){
      renderDetails();
      renderMessages(state.supportMessages,{cache:false,preserveScroll:true});
      renderRemoteTyping();
      if(!document.getElementById('badgeModal')?.classList.contains('hidden'))document.getElementById('badgeModalUser').textContent=at('manageBadgesFor',{username:state.selectedUser.username});
    }
    renderAdminAttachmentPreview();
    renderSystemControls();
    document.querySelector('.admin-back-to-top')?.setAttribute('aria-label',at('backToTopAdmin'));
  }
  window.addEventListener('languagechange',refreshAdminLanguageRuntime);
  promoteUserWorkspace();
  applyAdminLanguage();
  updateWorldConfigPreview();
  updateWorldMessageComposer();
  Promise.all([loadDashboard(), loadUsers(false), loadAudit(), loadReports()]);
})();

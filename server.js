const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const express = require('express');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const bcrypt = require('bcryptjs');
const multer = require('multer');
const compression = require('compression');
const webpush = require('web-push');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  pingTimeout: 20000,
  pingInterval: 25000,
  maxHttpBufferSize: 1024 * 1024,
  perMessageDeflate: { threshold: 1024 },
  allowRequest: (req, callback) => callback(null, isAllowedSocketOrigin(req)),
});

const VERSION = '1.0.0';
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
// DATA_DIR can point to a Render persistent disk (for example /var/data/nexchat).
// Static application assets remain read-only in ROOT while mutable state is isolated here.
const DATA_DIR = path.resolve(process.env.DATA_DIR || ROOT);
if (process.env.NODE_ENV === 'production' && !process.env.DATA_DIR) {
  throw new Error('DATA_DIR phải được cấu hình riêng trong production để tránh mất dữ liệu khi triển khai lại.');
}
const SESSION_DIR = path.join(DATA_DIR, '.sessions');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const BUNDLED_STORE_FILE = path.join(ROOT, 'store.seed.json');
const STORE_FILE = path.join(DATA_DIR, 'store.json');
const STORE_BACKUP_FILE = path.join(DATA_DIR, 'store.json.bak');
const STORE_BACKUP_INTERVAL_MS = 60 * 1000;
const ORPHAN_UPLOAD_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const SESSION_SECRET_FILE = path.join(DATA_DIR, '.session-secret');
const VAPID_KEYS_FILE = path.join(DATA_DIR, '.vapid-keys.json');
const MAX_UPLOAD_SIZE = 30 * 1024 * 1024;
const MAX_USER_UPLOAD_BYTES = Math.max(0, Number(process.env.MAX_USER_UPLOAD_BYTES) || 500 * 1024 * 1024);
const MAX_TOTAL_UPLOAD_BYTES = Math.max(0, Number(process.env.MAX_TOTAL_UPLOAD_BYTES) || 5 * 1024 * 1024 * 1024);
const MAX_MESSAGE_LENGTH = 4000;
const MAX_SESSIONS = 5;
const SESSION_TOUCH_INTERVAL_MS = 60 * 1000;
const REMEMBER_LOGIN_MS = 30 * 24 * 60 * 60 * 1000;
const CSRF_TOKEN_BYTES = 32;
const MAX_SECURITY_BUCKETS = 20000;
const MAX_RATE_LIMIT_BUCKETS = 30000;
const RECOVERY_CODE_TTL_MS = 10 * 60 * 1000;
const RECOVERY_CODE_MAX_ATTEMPTS = 6;
const SUPPORT_PENALTY_WINDOW_MS = 15 * 24 * 60 * 60 * 1000;
const SUPPORT_INCIDENT_COOLDOWN_MS = 60 * 1000;
const ADMIN_CREDENTIALS_FILE = path.join(DATA_DIR, '.admin-credentials.json');
const TWILIO_ACCOUNT_SID = String(process.env.TWILIO_ACCOUNT_SID || '').trim();
const TWILIO_AUTH_TOKEN = String(process.env.TWILIO_AUTH_TOKEN || '').trim();
const TWILIO_VERIFY_SERVICE_SID = String(process.env.TWILIO_VERIFY_SERVICE_SID || '').trim();
const TWILIO_VERIFY_CONFIGURED = /^AC[a-f0-9]{32}$/i.test(TWILIO_ACCOUNT_SID)
  && TWILIO_AUTH_TOKEN.length >= 16
  && /^VA[a-f0-9]{32}$/i.test(TWILIO_VERIFY_SERVICE_SID);

fs.mkdirSync(DATA_DIR, { recursive: true });

function randomAdminSecret() {
  return `${crypto.randomBytes(12).toString('base64url')}!9Aa`;
}
function loadAdminCredentials() {
  const env = {
    username: normalizeUsername(process.env.ADMIN_USERNAME || ''),
    password: String(process.env.ADMIN_PASSWORD || ''),
    secondPassword: String(process.env.ADMIN_SECOND_PASSWORD || ''),
    auditDeletePassword: String(process.env.ADMIN_AUDIT_DELETE_PASSWORD || ''),
  };
  if (env.username && env.password.length >= 12 && env.secondPassword.length >= 12 && env.auditDeletePassword.length >= 12) return env;
  if (process.env.NODE_ENV !== 'production') {
    return {
      username: normalizeUsername(process.env.ADMIN_USERNAME || 'admin'),
      password: process.env.ADMIN_PASSWORD || 'admin12',
      secondPassword: process.env.ADMIN_SECOND_PASSWORD || 'admin36',
      auditDeletePassword: process.env.ADMIN_AUDIT_DELETE_PASSWORD || 'admin23',
    };
  }
  try {
    if (fs.existsSync(ADMIN_CREDENTIALS_FILE)) {
      const saved = JSON.parse(fs.readFileSync(ADMIN_CREDENTIALS_FILE, 'utf8'));
      if (saved?.username && saved?.password && saved?.secondPassword && saved?.auditDeletePassword) return saved;
    }
    const generated = {
      username: normalizeUsername(process.env.ADMIN_USERNAME || 'admin'),
      password: randomAdminSecret(),
      secondPassword: randomAdminSecret(),
      auditDeletePassword: randomAdminSecret(),
    };
    fs.writeFileSync(ADMIN_CREDENTIALS_FILE, JSON.stringify(generated, null, 2), { encoding:'utf8', mode:0o600 });
    console.warn('[SECURITY] Đã tạo thông tin Admin ngẫu nhiên tại DATA_DIR/.admin-credentials.json. Hãy cấu hình biến môi trường cố định trên Render.');
    return generated;
  } catch (error) {
    throw new Error(`Không thể tạo thông tin Admin an toàn: ${error.message}`);
  }
}
const ADMIN_CREDENTIALS = loadAdminCredentials();
const ADMIN_USERNAME = ADMIN_CREDENTIALS.username;
const ADMIN_PASSWORD = ADMIN_CREDENTIALS.password;
const ADMIN_SECOND_PASSWORD = ADMIN_CREDENTIALS.secondPassword;
const ADMIN_AUDIT_DELETE_PASSWORD = ADMIN_CREDENTIALS.auditDeletePassword;
const DUMMY_PASSWORD_HASH = bcrypt.hashSync(crypto.randomBytes(24).toString('hex'), 11);
const EFFECTS = ['neon','glass','aurora','fire','ice','galaxy','pulse','rainbow','shadow','sparkle'];
const PROFILE_BADGES = ['vip','legend'];
const MAX_BADGE_MINUTES = 2628000; // 5 năm
const MAX_ANNOUNCEMENT_SECONDS = 7 * 24 * 60 * 60;
const WORLD_CHAT_MODES = ['open','admin_only','read_only'];
const MAX_WORLD_SLOW_MODE_SECONDS = 120;
const MAX_WORLD_LOCK_MINUTES = 7 * 24 * 60;
const REPORT_REASONS = ['spam','harassment','hate','sexual','violence','scam','impersonation','privacy','other'];
const REPORT_STATUSES = ['pending','investigating','actioned','dismissed'];
const REPORT_ACTIONS = ['none','warn','world_mute','lock','ban','dismiss'];
const REPORT_DEDUP_WINDOW_MS = 6 * 60 * 60 * 1000;
const MAX_REPORTS = 3000;
const rawDefaultMaxAccounts = process.env.MAX_ACCOUNTS;
const DEFAULT_MAX_ACCOUNTS = rawDefaultMaxAccounts === undefined || rawDefaultMaxAccounts === ''
  ? 1000
  : Math.max(0, Math.min(1000000, Math.floor(Number(rawDefaultMaxAccounts) || 0)));

function loadSessionSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  try {
    if (fs.existsSync(SESSION_SECRET_FILE)) {
      const existing = fs.readFileSync(SESSION_SECRET_FILE, 'utf8').trim();
      if (existing.length >= 32) return existing;
    }
    const generated = crypto.randomBytes(48).toString('hex');
    fs.writeFileSync(SESSION_SECRET_FILE, generated, { encoding: 'utf8', mode: 0o600 });
    return generated;
  } catch {
    return crypto.randomBytes(48).toString('hex');
  }
}
const SESSION_SECRET = loadSessionSecret();

function loadVapidKeys() {
  const envPublic = cleanText(process.env.VAPID_PUBLIC_KEY, 512);
  const envPrivate = cleanText(process.env.VAPID_PRIVATE_KEY, 512);
  if (envPublic && envPrivate) return { publicKey:envPublic, privateKey:envPrivate, generated:false };
  try {
    if (fs.existsSync(VAPID_KEYS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(VAPID_KEYS_FILE, 'utf8'));
      if (parsed?.publicKey && parsed?.privateKey) return { publicKey:parsed.publicKey, privateKey:parsed.privateKey, generated:true };
    }
    const generated = webpush.generateVAPIDKeys();
    fs.writeFileSync(VAPID_KEYS_FILE, JSON.stringify(generated), { encoding:'utf8', mode:0o600 });
    return { ...generated, generated:true };
  } catch (error) {
    console.warn('[PUSH] Không thể tạo khóa VAPID:', error.message);
    return { publicKey:'', privateKey:'', generated:false };
  }
}
const VAPID_KEYS = loadVapidKeys();
const VAPID_SUBJECT = cleanText(process.env.VAPID_SUBJECT || 'mailto:admin@nexchat.local', 240);
if (VAPID_KEYS.publicKey && VAPID_KEYS.privateKey) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_KEYS.publicKey, VAPID_KEYS.privateKey);
}

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(SESSION_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
for (const page of ['home.html','login.html','index.html','admin.html','support.html','sw.js','system.css','app-runtime.js','site.webmanifest']) {
  const full = path.join(ROOT, page);
  if (!fs.existsSync(full)) throw new Error(`Thiếu tệp giao diện bắt buộc: ${full}`);
}

function nowISO() { return new Date().toISOString(); }
function id(prefix) { return `${prefix}_${Date.now().toString(36)}_${crypto.randomBytes(5).toString('hex')}`; }
function cleanText(value, maxLength = 200) {
  return String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, maxLength);
}
function normalizeUsername(value) { return cleanText(value, 24).toLowerCase(); }
function normalizePhone(value) {
  let phone = String(value ?? '').trim().replace(/[\s.()\-]/g, '');
  if (phone.startsWith('+84')) phone = `0${phone.slice(3)}`;
  else if (phone.startsWith('84') && phone.length === 11) phone = `0${phone.slice(2)}`;
  return phone.replace(/\D/g, '').slice(0, 10);
}
function validUsername(value) { return /^[a-zA-Z0-9._]{3,24}$/.test(value); }
function validPhone(value) { return /^(03|05|07|08|09)\d{8}$/.test(value); }
function validEmail(value) { return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
function safeEqualSecret(value, expected) {
  const left = crypto.createHash('sha256').update(String(value ?? '')).digest();
  const right = crypto.createHash('sha256').update(String(expected ?? '')).digest();
  return crypto.timingSafeEqual(left, right);
}
function safeTokenEqual(value, expected) {
  const left = Buffer.from(String(value || ''), 'utf8');
  const right = Buffer.from(String(expected || ''), 'utf8');
  if (!left.length || left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}
function newCsrfToken() { return crypto.randomBytes(CSRF_TOKEN_BYTES).toString('base64url'); }
function ensureCsrfToken(req) {
  if (!req.session) return '';
  if (!req.session.csrfToken || typeof req.session.csrfToken !== 'string') req.session.csrfToken = newCsrfToken();
  return req.session.csrfToken;
}
function rotateCsrfToken(req, res) {
  if (!req.session) return '';
  req.session.csrfToken = newCsrfToken();
  res?.setHeader?.('X-CSRF-Token', req.session.csrfToken);
  return req.session.csrfToken;
}
function conversationKey(scope, targetId) { return `${scope}:${targetId || ''}`; }
function pairKey(a, b) { return [a, b].sort().join(':'); }

function defaultStore() {
  return {
    users: [], friendRequests: [], messages: [], uploads: [], groups: [], conversationDeletes: [], reports: [],
    system: {
      worldChatEnabled: true,
      worldChatMode: 'open',
      worldChatLockedUntil: null,
      worldSlowModeSeconds: 0,
      worldAntiSpamEnabled: true,
      activeAnnouncement: null,
      activeAnnouncements: [],
      adminAuditLog: [],
      maxAccounts: DEFAULT_MAX_ACCOUNTS,
    },
  };
}

function normalizeAnnouncement(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const message = cleanText(value.message, 500);
  const expiresAt = Number(value.expiresAt);
  if (!message || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) return null;
  return {
    id: cleanText(value.id, 100) || id('notice'),
    message,
    createdAt: value.createdAt || nowISO(),
    expiresAt,
  };
}

function normalizeAnnouncements(values, legacyValue = null) {
  const source = Array.isArray(values) ? values : (legacyValue ? [legacyValue] : []);
  const seen = new Set();
  const announcements = [];
  for (const value of source) {
    const item = normalizeAnnouncement(value);
    if (!item || seen.has(item.id)) continue;
    seen.add(item.id);
    announcements.push(item);
  }
  return announcements.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0,1);
}

function normalizeWorldChatSettings(raw = {}) {
  const legacyEnabled = raw.worldChatEnabled !== false;
  let mode = WORLD_CHAT_MODES.includes(raw.worldChatMode) ? raw.worldChatMode : (legacyEnabled ? 'open' : 'read_only');
  let lockedUntil = Number(raw.worldChatLockedUntil);
  lockedUntil = Number.isFinite(lockedUntil) && lockedUntil > Date.now() ? lockedUntil : null;
  if (mode === 'read_only' && raw.worldChatLockedUntil && !lockedUntil) mode = 'open';
  const slowModeSeconds = Math.max(0, Math.min(MAX_WORLD_SLOW_MODE_SECONDS, Math.floor(Number(raw.worldSlowModeSeconds) || 0)));
  return {
    mode,
    lockedUntil,
    slowModeSeconds,
    antiSpamEnabled: raw.worldAntiSpamEnabled !== false,
  };
}

function worldChatPayload() {
  const settings = normalizeWorldChatSettings(store.system || {});
  if (store.system) {
    store.system.worldChatMode = settings.mode;
    store.system.worldChatLockedUntil = settings.lockedUntil;
    store.system.worldSlowModeSeconds = settings.slowModeSeconds;
    store.system.worldAntiSpamEnabled = settings.antiSpamEnabled;
    store.system.worldChatEnabled = settings.mode === 'open';
  }
  return {
    mode: settings.mode,
    lockedUntil: settings.lockedUntil,
    slowModeSeconds: settings.slowModeSeconds,
    antiSpamEnabled: settings.antiSpamEnabled,
    enabled: settings.mode === 'open',
    updatedAt: nowISO(),
  };
}

function normalizeMaxAccounts(value) {
  if (value === null || value === undefined || value === '') return DEFAULT_MAX_ACCOUNTS;
  if (Number(value) === 0) return 0;
  const parsed = Math.floor(Number(value));
  if (!Number.isFinite(parsed)) return DEFAULT_MAX_ACCOUNTS;
  return Math.max(1, Math.min(1000000, parsed));
}

function systemState() {
  if (!store.system || typeof store.system !== 'object' || Array.isArray(store.system)) {
    store.system = defaultStore().system;
  }
  const hadAnnouncementArray = Array.isArray(store.system.activeAnnouncements);
  const activeAnnouncements = normalizeAnnouncements(store.system.activeAnnouncements, store.system.activeAnnouncement);
  if (!hadAnnouncementArray) store.system.activeAnnouncements = activeAnnouncements; // nâng dữ liệu cũ một lần
  store.system.activeAnnouncement = activeAnnouncements[0] || null; // tương thích dữ liệu/bản cũ
  const worldChat = worldChatPayload();
  const maxAccounts = normalizeMaxAccounts(store.system.maxAccounts);
  store.system.maxAccounts = maxAccounts;
  return {
    worldChatEnabled: worldChat.enabled,
    worldChat,
    activeAnnouncement: activeAnnouncements[0] || null,
    activeAnnouncements,
    maxAccounts,
    accountCapacity: {
      used: store.users.length,
      max: maxAccounts,
      unlimited: maxAccounts === 0,
      remaining: maxAccounts === 0 ? null : Math.max(0, maxAccounts - store.users.length),
      full: maxAccounts > 0 && store.users.length >= maxAccounts,
    },
  };
}
function ensureUserDefaults(user) {
  if (typeof user.nickname !== 'string') user.nickname = user.username || '';
  user.status = user.status || { type: 'active', until: null, reason: '' };
  user.blockedUserIds = Array.isArray(user.blockedUserIds) ? user.blockedUserIds : [];
  user.archivedUserIds = Array.isArray(user.archivedUserIds) ? user.archivedUserIds : [];
  user.acceptedMessageUserIds = Array.isArray(user.acceptedMessageUserIds) ? user.acceptedMessageUserIds : [];
  user.aliases = user.aliases && typeof user.aliases === 'object' ? user.aliases : {};
  user.mutes = user.mutes && typeof user.mutes === 'object' ? user.mutes : {};
  const rawNotifications = user.notificationSettings && typeof user.notificationSettings === 'object' ? user.notificationSettings : {};
  const rawQuietHours = rawNotifications.quietHours && typeof rawNotifications.quietHours === 'object' ? rawNotifications.quietHours : {};
  const permanentGlobalMute = rawNotifications.globalMutePermanent === true;
  const numericGlobalMute = Number(rawNotifications.globalMutedUntil);
  user.notificationSettings = {
    enabled: rawNotifications.enabled !== false,
    pushEnabled: Boolean(rawNotifications.pushEnabled),
    showPreview: rawNotifications.showPreview !== false,
    soundEnabled: rawNotifications.soundEnabled !== false,
    globalMutedUntil: permanentGlobalMute ? null : (Number.isFinite(numericGlobalMute) && numericGlobalMute > Date.now() ? numericGlobalMute : 0),
    globalMutePermanent: permanentGlobalMute,
    timezoneOffset: Math.max(-840, Math.min(840, Math.floor(Number(rawNotifications.timezoneOffset) || 0))),
    quietHours: {
      enabled: Boolean(rawQuietHours.enabled),
      start: /^([01]\d|2[0-3]):[0-5]\d$/.test(rawQuietHours.start || '') ? rawQuietHours.start : '22:00',
      end: /^([01]\d|2[0-3]):[0-5]\d$/.test(rawQuietHours.end || '') ? rawQuietHours.end : '07:00',
    },
  };
  user.pushSubscriptions = Array.isArray(user.pushSubscriptions)
    ? user.pushSubscriptions.filter((item) => item && typeof item === 'object' && typeof item.endpoint === 'string' && item.keys?.p256dh && item.keys?.auth).slice(-8)
    : [];
  const rawWorldMessaging = user.worldMessaging && typeof user.worldMessaging === 'object' ? user.worldMessaging : {};
  user.worldMessaging = {
    mutedUntil: rawWorldMessaging.mutedUntil === null ? null : (Number.isFinite(Number(rawWorldMessaging.mutedUntil)) ? Number(rawWorldMessaging.mutedUntil) : 0),
    reason: cleanText(rawWorldMessaging.reason, 300),
    updatedAt: rawWorldMessaging.updatedAt || null,
  };
  user.moderationNotices = Array.isArray(user.moderationNotices)
    ? user.moderationNotices.filter((item) => item && typeof item === 'object').slice(-50)
    : [];
  user.pinnedConversations = Array.isArray(user.pinnedConversations) ? user.pinnedConversations : [];
  user.savedMessageIds = Array.isArray(user.savedMessageIds) ? user.savedMessageIds : [];
  user.searchHistory = Array.isArray(user.searchHistory) ? user.searchHistory : [];
  user.specialEffectsAllowed = Boolean(user.specialEffectsAllowed);
  // Giữ lựa chọn để VIP/LEGEND có thể dùng hiệu ứng mà không phụ thuộc quyền admin.
  user.selectedEffect = EFFECTS.includes(user.selectedEffect) ? user.selectedEffect : 'none';
  const rawBadges = user.profileBadges && typeof user.profileBadges === 'object' ? user.profileBadges : {};
  user.profileBadges = {};
  for (const type of PROFILE_BADGES) {
    const grant = rawBadges[type];
    if (!grant || typeof grant !== 'object') { user.profileBadges[type] = null; continue; }
    const expiresAt = grant.expiresAt === null || grant.expiresAt === undefined || grant.expiresAt === ''
      ? null
      : Number(grant.expiresAt);
    user.profileBadges[type] = {
      grantedAt: grant.grantedAt || nowISO(),
      expiresAt: Number.isFinite(expiresAt) ? expiresAt : null,
    };
  }
  user.sessions = Array.isArray(user.sessions) ? user.sessions : [];
  const rawSecurity = user.security && typeof user.security === 'object' ? user.security : {};
  user.security = {
    level2Enabled: Boolean(rawSecurity.level2Enabled && rawSecurity.level2PasswordHash),
    level2PasswordHash: typeof rawSecurity.level2PasswordHash === 'string' ? rawSecurity.level2PasswordHash : '',
    level3Enabled: Boolean(rawSecurity.level3Enabled && rawSecurity.level3PinHash),
    level3PinHash: typeof rawSecurity.level3PinHash === 'string' ? rawSecurity.level3PinHash : '',
    updatedAt: rawSecurity.updatedAt || null,
  };
  const rawSupportMessaging = user.supportMessaging && typeof user.supportMessaging === 'object' ? user.supportMessaging : {};
  user.supportMessaging = {
    blocked: Boolean(rawSupportMessaging.blocked),
    blockedUntil: Number.isFinite(Number(rawSupportMessaging.blockedUntil)) ? Number(rawSupportMessaging.blockedUntil) : null,
    reason: cleanText(rawSupportMessaging.reason, 300),
    updatedAt: rawSupportMessaging.updatedAt || null,
  };
  const rawSupportModeration = user.supportModeration && typeof user.supportModeration === 'object' ? user.supportModeration : {};
  user.supportModeration = {
    strikes: Math.max(0, Math.min(5, Math.floor(Number(rawSupportModeration.strikes) || 0))),
    windowStartedAt: Number.isFinite(Number(rawSupportModeration.windowStartedAt)) ? Number(rawSupportModeration.windowStartedAt) : null,
    lastIncidentAt: Number.isFinite(Number(rawSupportModeration.lastIncidentAt)) ? Number(rawSupportModeration.lastIncidentAt) : null,
    messageTimes: Array.isArray(rawSupportModeration.messageTimes) ? rawSupportModeration.messageTimes.map(Number).filter(Number.isFinite).slice(-20) : [],
    textHistory: Array.isArray(rawSupportModeration.textHistory) ? rawSupportModeration.textHistory.filter((item) => item && typeof item === 'object').slice(-20) : [],
  };
  user.settings = {
    whoCanMessage: 'friends',
    notifyRequests: true,
    showTyping: true,
    showReadReceipts: true,
    showMessageTime: true,
    showMessageDate: true,
    showDeliveryStatus: true,
    compactMessageMotion: true,
    visualQuality: 'auto',
    interfaceScale: 'auto',
    ...user.settings,
  };
  user.profile = {
    bio: '', location: '', work: '', school: '', birthday: '', relationship: '',
    avatarUrl: '', coverUrl: '', isPublic: true, showInSuggestions: true, showAvatarInWorld: true,
    ...user.profile,
  };
  return user;
}


function configureSessionPersistence(req, remember) {
  req.session.remember = Boolean(remember);
  req.session.cookie.maxAge = remember ? REMEMBER_LOGIN_MS : 7 * 24 * 60 * 60 * 1000;
}

function resetSupportPenaltyIfExpired(user, persist = true) {
  ensureUserDefaults(user);
  const moderation = user.supportModeration;
  if (moderation.windowStartedAt && Date.now() - moderation.windowStartedAt >= SUPPORT_PENALTY_WINDOW_MS) {
    user.supportModeration = { strikes:0, windowStartedAt:null, lastIncidentAt:null, messageTimes:[], textHistory:[] };
    if (persist) saveStore();
    return true;
  }
  return false;
}

function supportMessagingPayload(user, persist = true) {
  ensureUserDefaults(user);
  resetSupportPenaltyIfExpired(user, persist);
  const messaging = user.supportMessaging;
  if (messaging.blocked && messaging.blockedUntil && Date.now() >= messaging.blockedUntil) {
    user.supportMessaging = { blocked:false, blockedUntil:null, reason:'', updatedAt:nowISO() };
    if (persist) saveStore();
  }
  const current = user.supportMessaging;
  const moderation = user.supportModeration;
  const resetAt = moderation.windowStartedAt ? moderation.windowStartedAt + SUPPORT_PENALTY_WINDOW_MS : null;
  return {
    blocked: Boolean(current.blocked),
    permanent: Boolean(current.blocked && !current.blockedUntil),
    blockedUntil: current.blockedUntil ? new Date(current.blockedUntil).toISOString() : null,
    reason: current.reason || '',
    strikes: moderation.strikes || 0,
    resetAt: resetAt ? new Date(resetAt).toISOString() : null,
  };
}

function supportSpamDetected(user, text) {
  ensureUserDefaults(user);
  resetSupportPenaltyIfExpired(user);
  const moderation = user.supportModeration;
  const now = Date.now();

  // Chỉ ghi nhận vi phạm sau 10 tin nhắn có dấu hiệu spam trong một khoảng ngắn.
  // Một tin nhắn dài, lặp ký tự hoặc vài lần gửi liên tiếp sẽ không còn bị cảnh cáo ngay.
  moderation.messageTimes = moderation.messageTimes.filter((time) => now - time < 30000);
  moderation.textHistory = moderation.textHistory.filter((item) => now - Number(item.time) < 90000);

  const normalized = normalizeModerationText(text).replace(/\s+/g, ' ').trim();
  const compact = normalized.replace(/\s/g, '');
  const spamLike = Boolean(
    normalized && (
      (compact.length > 12 && /(.)\1{10,}/u.test(compact)) ||
      (compact.length > 28 && new Set([...compact]).size <= 3)
    )
  );
  const repeatedCount = normalized
    ? moderation.textHistory.filter((item) => item.text === normalized).length
    : 0;
  const spamLikeCount = moderation.textHistory.filter((item) => item.spamLike).length;

  // Dữ liệu hiện tại được thêm sau khi tính để ngưỡng 9 nghĩa là tin thứ 10.
  const tooFast = moderation.messageTimes.length >= 9;
  const repeated = repeatedCount >= 9;
  const repeatedPattern = spamLike && spamLikeCount >= 9;

  moderation.messageTimes.push(now);
  if (normalized) moderation.textHistory.push({ text:normalized, time:now, spamLike });
  saveStore();

  return tooFast || repeated || repeatedPattern;
}

function registerSupportSpamIncident(user) {
  ensureUserDefaults(user);
  resetSupportPenaltyIfExpired(user);
  const moderation = user.supportModeration;
  const now = Date.now();
  if (moderation.lastIncidentAt && now - moderation.lastIncidentAt < SUPPORT_INCIDENT_COOLDOWN_MS) {
    return { counted:false, ...supportMessagingPayload(user, false), message:'Bạn đang gửi quá nhanh. Hãy chờ ít nhất 1 phút trước khi thử lại.' };
  }
  if (!moderation.windowStartedAt) moderation.windowStartedAt = now;
  moderation.lastIncidentAt = now;
  moderation.strikes = Math.min(5, (moderation.strikes || 0) + 1);
  moderation.messageTimes = [];
  moderation.textHistory = [];
  const strike = moderation.strikes;
  const resetAt = moderation.windowStartedAt + SUPPORT_PENALTY_WINDOW_MS;
  let lockMinutes = 0;
  if (strike === 3) lockMinutes = 3;
  else if (strike === 4) lockMinutes = 24 * 60;
  else if (strike >= 5) lockMinutes = 7 * 24 * 60;
  let restriction = null;
  let message = strike === 1
    ? 'Cảnh cáo lần 1: bạn đang gửi quá nhiều tin cho Admin. Hãy dừng spam.'
    : 'Cảnh cáo lần 2: tiếp tục spam sẽ khiến tài khoản bị khóa 3 phút.';
  if (lockMinutes) {
    user.status = {
      type:'lock',
      until: now + lockMinutes * 60000,
      reason:`Tự động khóa do spam Hỗ trợ Admin lần ${strike} trong vòng 15 ngày.`,
    };
    restriction = restrictionPayload(user);
    message = strike === 3
      ? 'Vi phạm lần 3: tài khoản bị khóa 3 phút.'
      : strike === 4
        ? 'Vi phạm lần 4: tài khoản bị khóa 1 ngày.'
        : 'Vi phạm lần 5: tài khoản bị khóa 7 ngày.';
  }
  saveStore({ immediate:true });
  return { counted:true, strike, resetAt:new Date(resetAt).toISOString(), lockMinutes, restriction, message };
}

async function verifySensitiveAccountAction(req, user, { requireLevel3 = true } = {}) {
  const currentPassword = String(req.body.currentPassword ?? '');
  if (!currentPassword || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    return { ok:false, status:401, message:'Mật khẩu hiện tại không đúng.' };
  }
  if (requireLevel3 && user.security.level3Enabled) {
    const pin = String(req.body.level3Pin ?? '');
    if (!/^\d{6}$/.test(pin) || !(await bcrypt.compare(pin, user.security.level3PinHash))) {
      return { ok:false, status:401, message:'Mã bảo mật cấp 3 không đúng.' };
    }
  }
  return { ok:true };
}

function activeProfileBadges(user) {
  ensureUserDefaults(user);
  const now = Date.now();
  const result = {};
  for (const type of PROFILE_BADGES) {
    const grant = user.profileBadges[type];
    if (!grant) continue;
    if (grant.expiresAt && now >= Number(grant.expiresAt)) continue;
    result[type] = {
      grantedAt: grant.grantedAt,
      expiresAt: grant.expiresAt || null,
      permanent: !grant.expiresAt,
    };
  }
  return result;
}

function publicProfileBadges(user) {
  const active = activeProfileBadges(user);
  const result = {};
  for (const type of PROFILE_BADGES) {
    if (active[type]) result[type] = { active: true, timingHidden: true };
  }
  return result;
}

function specialEffectEntitlement(user) {
  ensureUserDefaults(user);
  if (user.specialEffectsAllowed) return { allowed: true, source: 'admin', expiresAt: null };
  const active = activeProfileBadges(user);
  const grants = PROFILE_BADGES
    .filter((type) => active[type])
    .map((type) => ({ type, expiresAt: active[type].expiresAt || null }));
  if (!grants.length) return { allowed: false, source: 'none', expiresAt: null };
  const permanent = grants.find((item) => !item.expiresAt && item.type === 'legend') || grants.find((item) => !item.expiresAt);
  if (permanent) return { allowed: true, source: permanent.type, expiresAt: null };
  grants.sort((a, b) => Number(b.expiresAt) - Number(a.expiresAt));
  return { allowed: true, source: grants[0].type, expiresAt: Number(grants[0].expiresAt) };
}

function effectEntitlementCount() {
  return store.users.reduce((count, user) => count + (specialEffectEntitlement(user).allowed ? 1 : 0), 0);
}

function messageEffectForUser(user, requestedEffect = '') {
  const entitlement = specialEffectEntitlement(user);
  const requested = requestedEffect === 'none' || EFFECTS.includes(requestedEffect) ? requestedEffect : null;
  /* The currently selected effect is also carried by the realtime send payload.
     This prevents an HTTP/socket timing split from falling back to the normal
     bubble after the picker has already confirmed a new effect. The server
     still validates entitlement and the allow-list before accepting it. */
  if (entitlement.allowed && requested !== null && user.selectedEffect !== requested) {
    user.selectedEffect = requested;
    saveStore();
  }
  const selected = requested !== null ? requested : user.selectedEffect;
  const effect = entitlement.allowed && EFFECTS.includes(selected) ? selected : 'none';
  return {
    effect,
    effectSource: effect === 'none' ? 'none' : entitlement.source,
    effectExpiresAt: effect === 'none' ? null : entitlement.expiresAt,
    effectDisabledAt: null,
  };
}

function disableStoredEffects(userId, reason = 'access-ended') {
  const disabledAt = nowISO();
  let changed = 0;
  for (const message of store.messages) {
    if (message.fromId !== userId || !message.effect || message.effect === 'none' || message.effectDisabledAt) continue;
    message.effectDisabledAt = disabledAt;
    message.effectDisabledReason = reason;
    changed += 1;
  }
  return changed;
}

function effectPermissionPayload(user) {
  const entitlement = specialEffectEntitlement(user);
  return {
    granted: Boolean(user.specialEffectsAllowed),
    allowed: entitlement.allowed,
    source: entitlement.source,
    expiresAt: entitlement.expiresAt,
    effect: entitlement.allowed ? user.selectedEffect : 'none',
  };
}

function emitEffectAccessUpdate(user, message = '') {
  const privatePayload = { ...effectPermissionPayload(user), userId: user.id, message };
  io.to(`user:${user.id}`).emit('effects:permission', privatePayload);
  const publicPayload = {
    userId: user.id,
    allowed: privatePayload.allowed,
    effect: privatePayload.effect,
  };
  io.except(`user:${user.id}`).emit('effects:style-changed', publicPayload);
  return privatePayload;
}

function profileBadgeCounts() {
  const counts = { total: 0, vip: 0, legend: 0 };
  for (const user of store.users) {
    const active = activeProfileBadges(user);
    if (active.vip) counts.vip += 1;
    if (active.legend) counts.legend += 1;
    if (active.vip || active.legend) counts.total += 1;
  }
  return counts;
}

function normalizeStoredReport(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const scope = value.scope === 'message' ? 'message' : 'user';
  const reason = REPORT_REASONS.includes(value.reason) ? value.reason : 'other';
  const status = REPORT_STATUSES.includes(value.status) ? value.status : 'pending';
  const action = REPORT_ACTIONS.includes(value.action) ? value.action : 'none';
  const evidence = value.evidence && typeof value.evidence === 'object' ? value.evidence : {};
  const reporterId = cleanText(value.reporterId, 100);
  const reportedUserId = cleanText(value.reportedUserId, 100);
  if (!reporterId || !reportedUserId || reporterId === reportedUserId) return null;
  return {
    id: cleanText(value.id, 120) || id('rpt'),
    scope,
    reporterId,
    reportedUserId,
    messageId: scope === 'message' ? cleanText(value.messageId, 120) : '',
    reason,
    details: cleanText(value.details, 500),
    status,
    riskScore: Math.max(0, Math.min(100, Math.floor(Number(value.riskScore) || 0))),
    signals: Array.isArray(value.signals) ? value.signals.map((item) => cleanText(item, 120)).filter(Boolean).slice(0, 12) : [],
    evidence: {
      text: cleanText(evidence.text, 1000),
      senderName: cleanText(evidence.senderName, 100),
      createdAt: evidence.createdAt || null,
      scope: cleanText(evidence.scope, 30),
      attachmentKind: cleanText(evidence.attachmentKind, 30),
    },
    action,
    actionDetail: cleanText(value.actionDetail, 300),
    adminNote: cleanText(value.adminNote, 500),
    createdAt: value.createdAt || nowISO(),
    updatedAt: value.updatedAt || value.createdAt || nowISO(),
    resolvedAt: value.resolvedAt || null,
  };
}

function readStoreCandidate(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const source = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(source);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Dữ liệu gốc không phải object.');
  return parsed;
}
function quarantineCorruptStore() {
  if (!fs.existsSync(STORE_FILE)) return;
  try {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    fs.renameSync(STORE_FILE, path.join(DATA_DIR, `store.corrupt-${stamp}.json`));
    const corruptFiles = fs.readdirSync(DATA_DIR)
      .filter((name) => /^store\.corrupt-.*\.json$/.test(name))
      .sort()
      .reverse();
    for (const fileName of corruptFiles.slice(3)) {
      try { fs.unlinkSync(path.join(DATA_DIR, fileName)); } catch {}
    }
  } catch (error) {
    console.error('Không thể cách ly store.json bị lỗi:', error.message);
  }
}
function loadStore() {
  let raw = null;
  let recoveredFromBackup = false;
  let migratedFromBundle = false;
  let migratedFromLegacyRoot = false;
  try {
    raw = readStoreCandidate(STORE_FILE);
  } catch (error) {
    console.error('store.json không đọc được, đang thử bản sao lưu:', error.message);
    quarantineCorruptStore();
  }
  if (!raw) {
    try {
      raw = readStoreCandidate(STORE_BACKUP_FILE);
      recoveredFromBackup = Boolean(raw);
    } catch (error) {
      console.error('Bản sao lưu store.json cũng không đọc được:', error.message);
    }
  }
  // Preserve data from older deployments that stored the live database beside the app.
  // The legacy path is read-only during migration; new runtime writes always target DATA_DIR.
  if (!raw && DATA_DIR !== ROOT) {
    try {
      raw = readStoreCandidate(path.join(ROOT, 'store.json'));
      migratedFromLegacyRoot = Boolean(raw);
    } catch (error) {
      console.error('Không thể đọc dữ liệu store.json cũ để di chuyển:', error.message);
    }
  }
  // The bundled seed contains no private/runtime user data and is safe to ship.
  if (!raw) {
    try {
      raw = readStoreCandidate(BUNDLED_STORE_FILE);
      migratedFromBundle = Boolean(raw);
    } catch (error) {
      console.error('Không thể đọc dữ liệu seed để khởi tạo DATA_DIR:', error.message);
    }
  }
  if (!raw) raw = defaultStore();

  try {
    const result = defaultStore();
    for (const key of ['users','friendRequests','messages','uploads','groups','conversationDeletes','reports']) {
      result[key] = Array.isArray(raw[key]) ? raw[key] : [];
    }
    const rawSystem = raw.system && typeof raw.system === 'object' && !Array.isArray(raw.system) ? raw.system : {};
    const worldSettings = normalizeWorldChatSettings(rawSystem);
    result.system = {
      worldChatEnabled: worldSettings.mode === 'open',
      worldChatMode: worldSettings.mode,
      worldChatLockedUntil: worldSettings.lockedUntil,
      worldSlowModeSeconds: worldSettings.slowModeSeconds,
      worldAntiSpamEnabled: worldSettings.antiSpamEnabled,
      activeAnnouncements: normalizeAnnouncements(rawSystem.activeAnnouncements, rawSystem.activeAnnouncement),
      activeAnnouncement: null,
      adminAuditLog: Array.isArray(rawSystem.adminAuditLog)
        ? rawSystem.adminAuditLog.filter((item) => item && typeof item === 'object').slice(-500)
        : [],
      maxAccounts: normalizeMaxAccounts(rawSystem.maxAccounts),
    };
    result.system.activeAnnouncement = result.system.activeAnnouncements[0] || null;
    result.users.forEach(ensureUserDefaults);
    result.messages.forEach((m) => {
      m.readBy = Array.isArray(m.readBy) ? m.readBy : [];
      m.receiptBy = Array.isArray(m.receiptBy) ? m.receiptBy : [...m.readBy];
      m.deletedFor = Array.isArray(m.deletedFor) ? m.deletedFor : [];
      m.pinnedBy = Array.isArray(m.pinnedBy) ? m.pinnedBy : [];
      m.reactions = m.reactions && typeof m.reactions === 'object' ? m.reactions : {};
      m.effect = EFFECTS.includes(m.effect) ? m.effect : 'none';
      m.effectSource = typeof m.effectSource === 'string' ? m.effectSource : (m.effect === 'none' ? 'none' : 'legacy');
      m.effectExpiresAt = m.effectExpiresAt !== null && m.effectExpiresAt !== undefined && m.effectExpiresAt !== '' && Number.isFinite(Number(m.effectExpiresAt)) ? Number(m.effectExpiresAt) : null;
      m.effectDisabledAt = m.effectDisabledAt || null;
      const sender = result.users.find((user) => user.id === m.fromId);
      if (sender) m.senderProfileBadges = publicProfileBadges(sender);
    });
    result.reports = result.reports.map(normalizeStoredReport).filter(Boolean);
    if (recoveredFromBackup || migratedFromBundle || migratedFromLegacyRoot || !fs.existsSync(STORE_FILE)) {
      try {
        const temp = `${STORE_FILE}.recovered`;
        fs.writeFileSync(temp, JSON.stringify(result), { encoding:'utf8', mode:0o600 });
        fs.renameSync(temp, STORE_FILE);
        if (recoveredFromBackup) console.warn('[DATA] Đã phục hồi store.json từ bản sao lưu gần nhất.');
        else if (migratedFromLegacyRoot) console.warn('[DATA] Đã di chuyển store.json cũ từ thư mục ứng dụng sang DATA_DIR.');
        else if (migratedFromBundle) console.warn('[DATA] Đã khởi tạo DATA_DIR từ seed sạch.');
      } catch (error) {
        console.error('Không thể ghi dữ liệu khởi tạo/phục hồi:', error.message);
      }
    }
    return result;
  } catch (error) {
    console.error('Không thể chuẩn hóa dữ liệu:', error.message);
    return defaultStore();
  }
}
let store = loadStore();
let storeSaveTimer = null;
let storeDirty = false;
let storeWriteInFlight = false;
let storeWriteQueued = false;
let lastStoreBackupAt = 0;
function shouldBackupStore() { return fs.existsSync(STORE_FILE) && Date.now() - lastStoreBackupAt >= STORE_BACKUP_INTERVAL_MS; }
function backupStoreSync() {
  if (!shouldBackupStore()) return;
  fs.copyFileSync(STORE_FILE, STORE_BACKUP_FILE);
  lastStoreBackupAt = Date.now();
}
async function backupStoreAsync() {
  if (!shouldBackupStore()) return;
  await fs.promises.copyFile(STORE_FILE, STORE_BACKUP_FILE);
  lastStoreBackupAt = Date.now();
}
function trimStoreForSave() {
  // Preserve user messages, upload metadata and reports. Silent truncation caused permanent data loss.
}
function flushStoreSync() {
  if (!storeDirty && fs.existsSync(STORE_FILE)) return;
  trimStoreForSave();
  const tempFile = `${STORE_FILE}.tmp.sync`;
  try { backupStoreSync(); } catch (error) { console.error('Không thể tạo bản sao lưu dữ liệu:', error.message); }
  fs.writeFileSync(tempFile, JSON.stringify(store), { encoding:'utf8', mode:0o600 });
  fs.renameSync(tempFile, STORE_FILE);
  storeDirty = false;
}
async function flushStoreAsync() {
  if (storeWriteInFlight) { storeWriteQueued = true; return; }
  if (!storeDirty && fs.existsSync(STORE_FILE)) return;
  trimStoreForSave();
  /* JSON.stringify vẫn cần một nhịp CPU, nhưng ghi file/đổi tên được đưa ra khỏi
     luồng realtime để gửi tin nhắn không bị đứng theo dung lượng store.json. */
  const snapshot = JSON.stringify(store);
  const tempFile = `${STORE_FILE}.tmp.async`;
  storeDirty = false;
  storeWriteQueued = false;
  storeWriteInFlight = true;
  try {
    try { await backupStoreAsync(); } catch (error) { console.error('Không thể tạo bản sao lưu dữ liệu:', error.message); }
    await fs.promises.writeFile(tempFile, snapshot, { encoding:'utf8', mode:0o600 });
    await fs.promises.rename(tempFile, STORE_FILE);
  } catch (error) {
    storeDirty = true;
    console.error('Không thể lưu dữ liệu:', error.message);
  } finally {
    storeWriteInFlight = false;
    if (storeDirty || storeWriteQueued) {
      if (storeSaveTimer) clearTimeout(storeSaveTimer);
      storeSaveTimer = setTimeout(() => { storeSaveTimer = null; void flushStoreAsync(); }, 80);
      storeSaveTimer.unref?.();
    }
  }
}
function saveStore(options = {}) {
  storeDirty = true;
  if (options === true || options.immediate) {
    if (storeSaveTimer) clearTimeout(storeSaveTimer);
    storeSaveTimer = null;
    void flushStoreAsync();
    return;
  }
  if (storeSaveTimer || storeWriteInFlight) { storeWriteQueued = storeWriteInFlight; return; }
  /* Gộp nhiều sự kiện gửi/đã xem thành một lần ghi thay vì ghi liên tục. */
  storeSaveTimer = setTimeout(() => {
    storeSaveTimer = null;
    void flushStoreAsync();
  }, 450);
  storeSaveTimer.unref?.();
}
for (const signal of ['SIGINT','SIGTERM']) process.once(signal, () => {
  if (storeSaveTimer) clearTimeout(storeSaveTimer);
  storeDirty = true;
  try { flushStoreSync(); } finally { process.exit(0); }
});
process.once('beforeExit', () => { if (storeDirty) { try { flushStoreSync(); } catch {} } });

function normalizeModerationText(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/đ/g, 'd')
    .replace(/[013457@$]/g, (char) => ({'0':'o','1':'i','3':'e','4':'a','5':'s','7':'t','@':'a','$':'s'}[char]))
    .replace(/[^a-z0-9]+/g, ' ').trim();
}
function nicknameModerationError(value) {
  const nickname = cleanText(value, 24).replace(/\s+/g, ' ');
  if (!/^[\p{L}\p{N} ._-]{2,24}$/u.test(nickname)) return 'Biệt danh không hợp lệ.';
  const normalized = normalizeModerationText(nickname);
  const tokens = normalized.split(/\s+/).filter(Boolean);
  const blocked = new Set([
    'dmm','dcm','dkm','dm','clgt','vcl','vl','loz','lolz','cac','cu','dit','du',
    'fuck','fucker','fucking','shit','bitch','asshole','cunt','nigger','nazi',
    'sex','porn','xxx','rape','pedo','terrorist'
  ]);
  const phrases = [
    'dit me','dit ma','du ma','duma','con cu','con cac','cai lon','loz me',
    'fuck you','mother fucker','son of a bitch','kill yourself'
  ];
  const compact = normalized.replace(/\s+/g, '');
  const compactBlocked = ['ditme','ditma','dume','duma','concac','concu','cailon','fuckyou','motherfucker'];
  if (tokens.some((t) => blocked.has(t)) || phrases.some((p) => normalized.includes(p)) || compactBlocked.some((p) => compact.includes(p))) return 'Biệt danh chứa nội dung không phù hợp.';
  if (/(.)\1{5,}/u.test(nickname)) return 'Biệt danh không hợp lệ.';
  return null;
}

function getUser(userId) { const user = store.users.find((u) => u.id === userId) || null; return user ? ensureUserDefaults(user) : null; }
function getUserByUsername(username) { return store.users.find((u) => u.usernameKey === normalizeUsername(username)) || null; }
function getUserByPhone(phone) { return store.users.find((u) => u.phone === normalizePhone(phone)) || null; }
function getUserByEmail(email) { const key = cleanText(email,120).toLowerCase(); return key ? store.users.find((u) => String(u.email || '').toLowerCase() === key) || null : null; }
function getGroup(groupId) { return store.groups.find((g) => g.id === groupId) || null; }

const onlineUsers = new Map();
const visibleUserSockets = new Map();
function normalizeRestriction(user, persist = true) {
  if (!user.status) user.status = { type: 'active', until: null, reason: '' };
  if (user.status.type !== 'active' && user.status.until && Date.now() >= user.status.until) {
    user.status = { type: 'active', until: null, reason: '' };
    if (persist) saveStore();
  }
  return user.status;
}
function restrictionPayload(user) {
  const status = normalizeRestriction(user);
  if (status.type === 'active') return null;
  return {
    type: status.type,
    permanent: !status.until,
    until: status.until ? new Date(status.until).toISOString() : null,
    reason: status.reason || 'Không có lý do cụ thể.',
    message: status.type === 'ban'
      ? (status.until ? 'Tài khoản đã bị cấm có thời hạn.' : 'Tài khoản đã bị cấm vĩnh viễn.')
      : (status.until ? 'Tài khoản đang bị khóa có thời hạn.' : 'Tài khoản đã bị khóa vĩnh viễn.'),
  };
}
function safeUser(user, includePrivate = false, viewerId = null) {
  ensureUserDefaults(user);
  const own = viewerId === user.id;
  const publicStatus = normalizeRestriction(user, false);
  const effectAccess = specialEffectEntitlement(user);
  const base = {
    id: user.id, username: user.username, nickname: user.nickname || user.username,
    createdAt: user.createdAt, online: onlineUsers.has(user.id),
    status: { type: publicStatus.type, until: publicStatus.until || null },
    profile: {
      avatarUrl: user.profile.avatarUrl || '',
      coverUrl: user.profile.isPublic ? (user.profile.coverUrl || '') : '',
      isPublic: Boolean(user.profile.isPublic), showAvatarInWorld: Boolean(user.profile.showAvatarInWorld),
    },
    effectAccess: effectAccess.allowed,
    profileBadges: (includePrivate || own) ? activeProfileBadges(user) : publicProfileBadges(user),
  };
  if (includePrivate || own) {
    base.status = { ...normalizeRestriction(user, false) };
    base.specialEffectsAllowed = Boolean(user.specialEffectsAllowed);
    base.effectAccessSource = effectAccess.source;
    base.selectedEffect = effectAccess.allowed ? user.selectedEffect : 'none';
    base.effectAccessExpiresAt = effectAccess.expiresAt;
    base.phone = user.phone; base.email = user.email || ''; base.lastSeenAt = user.lastSeenAt || null;
    base.security = { level2Enabled:Boolean(user.security.level2Enabled), level3Enabled:Boolean(user.security.level3Enabled), updatedAt:user.security.updatedAt || null };
    base.supportMessaging = supportMessagingPayload(user, false);
    base.settings = { ...user.settings }; base.profile = { ...user.profile };
    base.notificationSettings = JSON.parse(JSON.stringify(user.notificationSettings));
    base.worldMessaging = { ...user.worldMessaging };
    base.pinnedConversations = [...user.pinnedConversations]; base.searchHistory = [...user.searchHistory];
    base.aliases = { ...user.aliases }; base.mutes = { ...user.mutes }; base.savedMessageIds = [...user.savedMessageIds];
  } else if (user.profile.isPublic) {
    base.profile = { ...user.profile, birthday: user.profile.birthday ? user.profile.birthday.slice(0, 7) : '' };
  }
  return base;
}
function reportReasonLabel(reason) {
  return ({
    spam:'Spam hoặc quảng cáo', harassment:'Quấy rối, xúc phạm', hate:'Thù ghét hoặc phân biệt',
    sexual:'Nội dung tình dục', violence:'Bạo lực hoặc đe dọa', scam:'Lừa đảo hoặc liên kết nguy hiểm',
    impersonation:'Giả mạo danh tính', privacy:'Tiết lộ thông tin riêng tư', other:'Lý do khác',
  })[reason] || 'Lý do khác';
}
function reportTextSignals(text = '', reason = 'other') {
  const normalized = normalizeModerationText(text);
  const compact = normalized.replace(/\s+/g, '');
  const signals = [];
  let score = ({spam:28,harassment:30,hate:42,sexual:38,violence:45,scam:48,impersonation:34,privacy:44,other:18})[reason] || 18;
  if (/https?:\/\/|www\.|t\.me\/|bit\.ly|tinyurl/i.test(text)) { signals.push('Có liên kết ngoài'); score += reason === 'scam' ? 18 : 6; }
  if (compact.length > 12 && /(.)\1{9,}/u.test(compact)) { signals.push('Lặp ký tự bất thường'); score += 12; }
  if (text.length > 35 && new Set([...compact]).size <= 5) { signals.push('Mẫu nội dung lặp'); score += 10; }
  if ((text.match(/[A-ZÀ-Ỹ]/g) || []).length > Math.max(12, text.length * .65)) { signals.push('Viết hoa dày đặc'); score += 5; }
  if (/\b(password|mật khẩu|otp|ma otp|mã otp|chuyển khoản|stk|số tài khoản)\b/i.test(text)) { signals.push('Có dấu hiệu yêu cầu thông tin nhạy cảm'); score += 14; }
  if (/\b(kill|die|rape|giết|đánh chết|đe dọa)\b/i.test(normalized)) { signals.push('Từ khóa đe dọa'); score += 16; }
  return { score, signals };
}
function buildReportRisk(reportedUserId, reason, evidenceText = '') {
  const now = Date.now();
  const recent = store.reports.filter((report) => report.reportedUserId === reportedUserId && now - new Date(report.createdAt).getTime() < 7 * 86400000);
  const distinctReporters = new Set(recent.map((report) => report.reporterId)).size;
  const analysis = reportTextSignals(evidenceText, reason);
  let score = analysis.score + Math.min(24, distinctReporters * 6) + Math.min(12, recent.length * 2);
  const signals = [...analysis.signals];
  if (distinctReporters >= 2) signals.push(`${distinctReporters} người dùng khác nhau đã tố cáo trong 7 ngày`);
  if (recent.length >= 3) signals.push(`${recent.length} tố cáo gần đây liên quan tài khoản`);
  return { riskScore:Math.max(0,Math.min(100,Math.round(score))), signals:[...new Set(signals)].slice(0,12) };
}
function reportAdminPayload(report) {
  const reporter = getUser(report.reporterId);
  const target = getUser(report.reportedUserId);
  return {
    ...report,
    reasonLabel: reportReasonLabel(report.reason),
    reporter: reporter ? safeUser(reporter, false) : { id:report.reporterId, username:'đã xóa', nickname:'Tài khoản đã xóa' },
    target: target ? safeUser(target, true) : { id:report.reportedUserId, username:'đã xóa', nickname:'Tài khoản đã xóa' },
  };
}
function reportUserPayload(report) {
  return {
    id:report.id, scope:report.scope, reason:report.reason, reasonLabel:reportReasonLabel(report.reason),
    status:report.status, action:report.action, adminNote:report.adminNote || '', createdAt:report.createdAt,
    updatedAt:report.updatedAt, resolvedAt:report.resolvedAt,
  };
}
function worldMessagingPayload(user) {
  ensureUserDefaults(user);
  const value = user.worldMessaging?.mutedUntil;
  const active = value === null || (Number(value) > Date.now());
  if (!active && value) {
    user.worldMessaging = { mutedUntil:0, reason:'', updatedAt:nowISO() };
    saveStore();
  }
  return {
    muted:active,
    permanent:active && value === null,
    mutedUntil:active && value ? Number(value) : null,
    reason:active ? (user.worldMessaging.reason || 'Tài khoản đang bị hạn chế gửi ở chat thế giới.') : '',
  };
}
function minutesOfDayAtUser(user, at = Date.now()) {
  const offset = Number(user.notificationSettings?.timezoneOffset) || 0;
  const local = new Date(at - offset * 60000);
  return local.getUTCHours() * 60 + local.getUTCMinutes();
}
function parseClockMinutes(value) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(value || ''));
  return match ? Number(match[1]) * 60 + Number(match[2]) : 0;
}
function inQuietHours(user, at = Date.now()) {
  const quiet = user.notificationSettings?.quietHours;
  if (!quiet?.enabled) return false;
  const current = minutesOfDayAtUser(user, at);
  const start = parseClockMinutes(quiet.start), end = parseClockMinutes(quiet.end);
  if (start === end) return true;
  return start < end ? current >= start && current < end : current >= start || current < end;
}
function globalNotificationMuted(user, { priority = false } = {}) {
  ensureUserDefaults(user);
  const settings = user.notificationSettings;
  if (!settings.enabled || !settings.pushEnabled) return true;
  if (settings.globalMutePermanent || settings.globalMutedUntil === null) return true;
  if (Number(settings.globalMutedUntil) > Date.now()) return true;
  if (!priority && inQuietHours(user)) return true;
  return false;
}
function conversationNotificationKey(message, recipientId) {
  if (message.scope === 'group') return `group:${message.groupId}`;
  if (message.scope === 'support') return 'support:admin';
  if (['private','request'].includes(message.scope)) return `private:${message.fromId === recipientId ? message.toId : message.fromId}`;
  return '';
}
function conversationNotificationMuted(user, key) {
  if (!key) return false;
  const value = user.mutes?.[key];
  return value === null || Number(value) > Date.now();
}
function hasVisibleUserPage(userId) { return (visibleUserSockets.get(userId) || 0) > 0; }
async function sendPushToUser(user, payload = {}, options = {}) {
  if (!user || globalNotificationMuted(user, options) || hasVisibleUserPage(user.id)) return { sent:0, skipped:true };
  const subscriptions = Array.isArray(user.pushSubscriptions) ? [...user.pushSubscriptions] : [];
  if (!subscriptions.length || !VAPID_KEYS.publicKey) return { sent:0, skipped:true };
  const message = JSON.stringify({
    title:cleanText(payload.title || 'NexChat',120),
    body:cleanText(payload.body || 'Bạn có thông báo mới.',300),
    tag:cleanText(payload.tag || 'nexchat',120),
    url:cleanText(payload.url || '/chat',300),
    icon:'/nexchat-logo.svg?v=1.0.0',
    badge:'/nexchat-logo.svg?v=1.0.0',
    data:payload.data && typeof payload.data === 'object' ? payload.data : {},
  });
  let sent = 0, changed = false;
  const valid = [];
  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(subscription, message, { TTL:Math.max(60,Math.min(86400,Number(options.ttl)||3600)), urgency:options.priority?'high':'normal' });
      valid.push(subscription); sent += 1;
    } catch (error) {
      if (![404,410].includes(Number(error.statusCode))) valid.push(subscription);
      else changed = true;
    }
  }
  if (changed) { user.pushSubscriptions = valid.slice(-8); saveStore(); }
  return { sent, skipped:false };
}
function messageNotificationPayload(message, recipient) {
  const preview = recipient.notificationSettings?.showPreview !== false;
  const senderName = cleanText(message.senderName || 'NexChat',80);
  let title = senderName, body = preview ? cleanText(message.text || (message.attachment ? `Đã gửi ${message.attachment.name || 'một tệp'}` : 'Bạn có tin nhắn mới.'),220) : 'Bạn có tin nhắn mới.';
  let url = '/chat', tag = `message:${message.scope}`;
  if (message.scope === 'group') { const group=getGroup(message.groupId); title=group?`${senderName} · ${group.name}`:senderName; url=`/chat?scope=group&id=${encodeURIComponent(message.groupId)}`; tag=`group:${message.groupId}`; }
  else if (message.scope === 'support') { title='Hỗ trợ Admin · NexChat'; body=preview?cleanText(message.text || 'Admin đã phản hồi bạn.',220):'Bạn có phản hồi hỗ trợ mới.'; url='/chat?scope=support'; tag='support:admin'; }
  else { url=`/chat?scope=private&id=${encodeURIComponent(message.fromId)}`; tag=`private:${message.fromId}`; }
  return { title, body, url, tag };
}
function queueMessagePush(message) {
  setImmediate(async () => {
    const recipients = messageRecipientUserIds(message).filter((userId) => userId && userId !== message.fromId && userId !== 'admin');
    for (const userId of recipients) {
      const user = getUser(userId); if (!user) continue;
      const key = conversationNotificationKey(message, user.id);
      if (conversationNotificationMuted(user, key)) continue;
      await sendPushToUser(user, messageNotificationPayload(message,user), { ttl:7200 });
    }
  });
}
function pushModerationNotice(user, title, body, url = '/chat') {
  if (!user) return;
  io.to(`user:${user.id}`).emit('moderation:notice',{title,body,at:nowISO()});
  setImmediate(()=>sendPushToUser(user,{title,body: user.notificationSettings?.showPreview === false ? 'Có cập nhật mới từ quản trị viên.' : body,tag:'nexchat-moderation',url},{priority:true,ttl:86400}));
}

function isFriend(a, b) {
  return store.friendRequests.some((r) => r.status === 'accepted' && ((r.fromId === a && r.toId === b) || (r.fromId === b && r.toId === a)));
}
function blockStateFor(viewerId, targetId) {
  const viewer = getUser(viewerId), target = getUser(targetId);
  const blockedByMe = Boolean(viewer?.blockedUserIds.includes(targetId));
  const blockedByOther = Boolean(target?.blockedUserIds.includes(viewerId));
  return {
    blocked: !viewer || !target || blockedByMe || blockedByOther,
    blockedByMe,
    blockedByOther,
    canSend: Boolean(viewer && target && !blockedByMe && !blockedByOther),
  };
}
function isBlockedBetween(a, b) { return blockStateFor(a, b).blocked; }
function hasAcceptedMessageAccess(a, b) {
  const ua = getUser(a), ub = getUser(b);
  return Boolean(ua && ub && ua.acceptedMessageUserIds.includes(b) && ub.acceptedMessageUserIds.includes(a));
}
function privateConversationAllowed(a, b) {
  return Boolean(getUser(a) && getUser(b) && !isBlockedBetween(a, b) && (isFriend(a, b) || hasAcceptedMessageAccess(a, b)));
}
function hasPrivateHistory(a, b) {
  return store.messages.some((m) => ['private','request'].includes(m.scope) && pairKey(m.fromId, m.toId) === pairKey(a, b));
}
function privateConversationViewable(a, b) {
  return Boolean(getUser(a) && getUser(b) && (isFriend(a, b) || hasAcceptedMessageAccess(a, b) || isBlockedBetween(a, b) || hasPrivateHistory(a, b)));
}
function canStrangerRequest(senderId, targetId) {
  const sender = getUser(senderId), target = getUser(targetId);
  if (!sender || !target || isBlockedBetween(senderId, targetId)) return false;
  const mode = target.settings.whoCanMessage;
  if (mode === 'everyone') return true;
  if (mode === 'friends') return isFriend(senderId, targetId);
  if (mode === 'friends_of_friends') {
    if (isFriend(senderId, targetId)) return true;
    const senderFriends = new Set(friendIdsFor(senderId));
    return friendIdsFor(targetId).some((id) => senderFriends.has(id));
  }
  return false;
}
function friendIdsFor(userId) {
  return store.friendRequests.filter((r) => r.status === 'accepted' && [r.fromId, r.toId].includes(userId)).map((r) => r.fromId === userId ? r.toId : r.fromId);
}
function pendingConversationDelete(userId, scope, targetId) {
  return store.conversationDeletes.find((d) => d.userId === userId && d.scope === scope && d.targetId === targetId) || null;
}
function canUseConversation(userId, scope, targetId) { return !pendingConversationDelete(userId, scope, targetId); }
function messageVisibleTo(message, auth) {
  if (message.deletedFor?.includes(auth.userId || auth.role)) return false;
  if (message.scope === 'world') return ['user','admin'].includes(auth.role);
  if (['private','request'].includes(message.scope)) return auth.role === 'user' && [message.fromId, message.toId].includes(auth.userId);
  if (message.scope === 'support') return auth.role === 'admin' || auth.userId === message.supportUserId;
  if (message.scope === 'group') {
    const group = getGroup(message.groupId); return auth.role === 'user' && group?.memberIds.includes(auth.userId);
  }
  return false;
}
function createMessage({ scope, senderRole, senderId, senderName, text, toId = null, supportUserId = null, groupId = null, attachment = null, special = null, effect = 'none', effectSource = 'none', effectExpiresAt = null, effectDisabledAt = null, senderAvatarUrl = '', senderProfilePublic = true, senderProfileBadges = {}, clientMessageId = null }) {
  return {
    id: id('msg'), scope, senderRole, fromId: senderId, senderName, toId, supportUserId, groupId,
    text: cleanText(text, MAX_MESSAGE_LENGTH), attachment, special, effect, effectSource, effectExpiresAt, effectDisabledAt, senderAvatarUrl, senderProfilePublic, senderProfileBadges,
    clientMessageId: cleanText(clientMessageId, 80) || null,
    readBy: senderRole === 'user' ? [senderId] : ['admin'], receiptBy: senderRole === 'user' ? [senderId] : ['admin'], reactions: {}, pinnedBy: [], deletedFor: [],
    editedAt: null, recalledAt: null, createdAt: nowISO(),
  };
}
function pushMessage(message) { store.messages.push(message); saveStore(); return message; }
function clientMessage(message) {
  const result = { ...message };
  delete result.effectExpiresAt;
  delete result.effectDisabledReason;
  delete result.effectSource;
  result.effectDisabledAt = result.effectDisabledAt ? true : null;
  return result;
}
function clientMessages(messages) { return messages.map(clientMessage); }
function markMessagesRead(messages, readerId, exposeReceipt = true) {
  const readIds = [], receiptIds = [];
  for (const m of messages) {
    if (!Array.isArray(m.readBy)) m.readBy = [];
    if (!Array.isArray(m.receiptBy)) m.receiptBy = [...m.readBy];
    const alreadyRead = m.readBy.includes(readerId);
    if (!alreadyRead) { m.readBy.push(readerId); readIds.push(m.id); }
    /* Không công khai hồi tố những tin đã đọc trong lúc người dùng tắt
       biên nhận. Chỉ lần đọc mới khi quyền riêng tư đang bật mới phát Đã xem. */
    if (exposeReceipt && !alreadyRead && !m.receiptBy.includes(readerId)) {
      m.receiptBy.push(readerId); receiptIds.push(m.id);
    }
  }
  if (readIds.length || receiptIds.length) saveStore();
  return { readIds, receiptIds };
}
function messageRecipients(message) {
  if (message.scope === 'world') return ['world'];
  if (['private','request'].includes(message.scope)) return [`user:${message.fromId}`, `user:${message.toId}`];
  if (message.scope === 'support') return [`support:${message.supportUserId}`, 'admin'];
  if (message.scope === 'group') return [`group:${message.groupId}`];
  return [];
}
function messageRecipientUserIds(message) {
  if (['private','request'].includes(message.scope)) return [message.fromId, message.toId].filter(Boolean);
  if (message.scope === 'support') return [message.supportUserId].filter(Boolean);
  if (message.scope === 'group') return [...(getGroup(message.groupId)?.memberIds || [])];
  return [];
}
function emitMessageUpdate(message, event = 'chat:message:update') {
  for (const room of messageRecipients(message)) io.to(room).emit(event, clientMessage(message));
}
function getAttachmentForSender(attachmentId, auth) {
  if (!attachmentId) return null;
  const upload = store.uploads.find((u) => u.id === attachmentId);
  if (!upload) return null;
  const ownerId = auth.role === 'admin' ? 'admin' : auth.userId;
  if (upload.ownerRole !== auth.role || upload.ownerId !== ownerId) return null;
  return { id: upload.id, name: upload.originalName, mime: upload.mime, size: upload.size, url: `/uploads/${encodeURIComponent(upload.fileName)}`, kind: upload.kind };
}

function uploadUrl(upload) { return `/uploads/${encodeURIComponent(upload.fileName)}`; }
function ownedImageUpload(user, url) {
  const value = cleanText(url, 240);
  return store.uploads.find((upload) => upload.ownerRole === 'user' && upload.ownerId === user.id && upload.kind === 'image' && uploadUrl(upload) === value) || null;
}
function sanitizeSpecial(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  if (value.type !== 'location') return null;
  const lat = Number(value.lat), lng = Number(value.lng), expiresAtMs = Date.parse(value.expiresAt);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) return null;
  if (!Number.isFinite(expiresAtMs)) return null;
  const now = Date.now();
  if (expiresAtMs < now - 5 * 60 * 1000 || expiresAtMs > now + 24 * 60 * 60 * 1000) return null;
  return { type:'location', lat:Number(lat.toFixed(6)), lng:Number(lng.toFixed(6)), expiresAt:new Date(expiresAtMs).toISOString() };
}
function canAccessUpload(upload, auth) {
  if (!upload || !auth) return false;
  const ownerId = auth.role === 'admin' ? 'admin' : auth.userId;
  if (upload.ownerRole === auth.role && upload.ownerId === ownerId) return true;
  if (auth.role === 'admin') return true;
  const profileUrl = uploadUrl(upload);
  for (const user of store.users) {
    ensureUserDefaults(user);
    if (user.profile.avatarUrl === profileUrl) return true;
    if (user.profile.coverUrl === profileUrl && (user.id === auth.userId || user.profile.isPublic)) return true;
  }
  if (auth.role === 'user') {
    for (const group of store.groups) if (group.avatarUrl === profileUrl && group.memberIds.includes(auth.userId)) return true;
  }
  return store.messages.some((message) => message.attachment?.id === upload.id && messageVisibleTo(message, auth));
}

function cleanupOrphanUploads() {
  const now = Date.now();
  const referencedIds = new Set();
  const referencedUrls = new Set();
  for (const message of store.messages) {
    if (message?.attachment?.id) referencedIds.add(message.attachment.id);
    if (message?.attachment?.url) referencedUrls.add(message.attachment.url);
  }
  for (const user of store.users) {
    ensureUserDefaults(user);
    if (user.profile.avatarUrl) referencedUrls.add(user.profile.avatarUrl);
    if (user.profile.coverUrl) referencedUrls.add(user.profile.coverUrl);
  }
  for (const group of store.groups) if (group?.avatarUrl) referencedUrls.add(group.avatarUrl);

  let changed = false;
  const retained = [];
  for (const upload of store.uploads) {
    const age = now - new Date(upload.createdAt || 0).getTime();
    const referenced = referencedIds.has(upload.id) || referencedUrls.has(uploadUrl(upload));
    if (referenced || !Number.isFinite(age) || age < ORPHAN_UPLOAD_MAX_AGE_MS) {
      retained.push(upload);
      continue;
    }
    try { fs.unlinkSync(path.join(UPLOAD_DIR, upload.fileName)); } catch (error) { if (error.code !== 'ENOENT') console.error('Không thể dọn tệp tải lên:', error.message); }
    changed = true;
  }
  if (retained.length !== store.uploads.length) store.uploads = retained;

  const knownFiles = new Set(store.uploads.map((upload) => upload.fileName));
  try {
    for (const entry of fs.readdirSync(UPLOAD_DIR, { withFileTypes:true })) {
      if (!entry.isFile() || entry.name === '.gitkeep' || knownFiles.has(entry.name)) continue;
      const fullPath = path.join(UPLOAD_DIR, entry.name);
      const stat = fs.statSync(fullPath);
      if (now - stat.mtimeMs < ORPHAN_UPLOAD_MAX_AGE_MS) continue;
      fs.unlinkSync(fullPath);
      changed = true;
    }
  } catch (error) {
    console.error('Không thể quét thư mục tải lên:', error.message);
  }
  if (changed) saveStore({ immediate:true });
}
setTimeout(cleanupOrphanUploads, 30 * 1000).unref();
setInterval(cleanupOrphanUploads, 6 * 60 * 60 * 1000).unref();

function finalisePendingDeletes() {
  const due = store.conversationDeletes.filter((d) => Date.now() >= d.deleteAfter);
  if (!due.length) return;
  for (const d of due) {
    for (const m of store.messages) {
      const match = d.scope === 'private'
        ? ['private','request'].includes(m.scope) && ((m.fromId === d.userId && m.toId === d.targetId) || (m.fromId === d.targetId && m.toId === d.userId))
        : d.scope === 'group' ? m.scope === 'group' && m.groupId === d.targetId : false;
      if (match && !m.deletedFor.includes(d.userId)) m.deletedFor.push(d.userId);
    }
  }
  store.conversationDeletes = store.conversationDeletes.filter((d) => Date.now() < d.deleteAfter);
  saveStore();
}
setInterval(finalisePendingDeletes, 30000).unref();


function requestHost(req) {
  // Dùng Host thực tế thay vì tin trực tiếp X-Forwarded-Host do phía khách có thể giả mạo.
  return cleanText(String(req.headers.host || '').split(',')[0], 255).toLowerCase();
}

function allowedOriginValue(origin, host) {
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    return ['http:', 'https:'].includes(parsed.protocol) && parsed.host.toLowerCase() === host;
  } catch { return false; }
}
function isAllowedSocketOrigin(req) {
  const origin = req.headers.origin;
  return allowedOriginValue(origin, requestHost(req));
}
function requireSameOrigin(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const host = requestHost(req);
  const origin = req.get('origin');
  if (origin && !allowedOriginValue(origin, host)) return res.status(403).json({ ok:false, message:'Yêu cầu không cùng nguồn đã bị chặn.' });
  const fetchSite = String(req.get('sec-fetch-site') || '').toLowerCase();
  if (fetchSite && !['same-origin','same-site','none'].includes(fetchSite)) return res.status(403).json({ ok:false, message:'Yêu cầu không an toàn đã bị chặn.' });
  next();
}
function safeDownloadName(value) {
  return cleanText(path.basename(value || 'tep-dinh-kem'), 160).replace(/["\\\r\n]/g, '_') || 'tep-dinh-kem';
}
const blockedUploadExtensions = new Set(['.exe','.dll','.com','.scr','.msi','.bat','.cmd','.ps1','.sh','.php','.asp','.aspx','.jsp','.html','.htm','.svg','.js','.mjs','.cjs','.jar','.apk','.ipa']);
function hasPrefix(buffer, values) { return values.every((value, index) => buffer[index] === value); }
function validUploadSignature(file) {
  let buffer;
  let fileSize = Number(file.size) || 0;
  try {
    const stat = fs.statSync(file.path);
    fileSize = stat.size;
    // Chỉ đọc phần đầu tệp để xác minh magic bytes, tránh chặn event loop khi tệp lớn 30 MB.
    const sampleSize = Math.min(Math.max(fileSize, 1), 8192);
    buffer = Buffer.alloc(sampleSize);
    const fd = fs.openSync(file.path, 'r');
    try { fs.readSync(fd, buffer, 0, sampleSize, 0); } finally { fs.closeSync(fd); }
  } catch { return false; }
  const mime = file.mimetype || 'application/octet-stream';
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (blockedUploadExtensions.has(ext)) return false;
  const ascii = buffer.subarray(0, 16).toString('ascii');
  const isZip = hasPrefix(buffer,[0x50,0x4b,0x03,0x04]) || hasPrefix(buffer,[0x50,0x4b,0x05,0x06]) || hasPrefix(buffer,[0x50,0x4b,0x07,0x08]);
  const tests = {
    'image/jpeg': () => hasPrefix(buffer,[0xff,0xd8,0xff]),
    'image/png': () => hasPrefix(buffer,[0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]),
    'image/gif': () => ascii.startsWith('GIF87a') || ascii.startsWith('GIF89a'),
    'image/webp': () => ascii.startsWith('RIFF') && buffer.subarray(8,12).toString('ascii') === 'WEBP',
    'application/pdf': () => ascii.startsWith('%PDF-'),
    'application/zip': () => isZip,
    'application/x-zip-compressed': () => isZip,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': () => isZip,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': () => isZip,
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': () => isZip,
    'video/mp4': () => buffer.length >= 12 && buffer.subarray(4,8).toString('ascii') === 'ftyp',
    'video/quicktime': () => buffer.length >= 12 && buffer.subarray(4,8).toString('ascii') === 'ftyp',
    'video/webm': () => hasPrefix(buffer,[0x1a,0x45,0xdf,0xa3]),
    'audio/webm': () => hasPrefix(buffer,[0x1a,0x45,0xdf,0xa3]),
    'audio/ogg': () => ascii.startsWith('OggS'),
    'audio/wav': () => ascii.startsWith('RIFF') && buffer.subarray(8,12).toString('ascii') === 'WAVE',
    'audio/mpeg': () => ascii.startsWith('ID3') || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0),
    'audio/mp4': () => buffer.length >= 12 && buffer.subarray(4,8).toString('ascii') === 'ftyp',
  };
  if (tests[mime]) return Boolean(tests[mime]());
  if (['text/plain','text/csv'].includes(mime)) return !buffer.subarray(0,4096).includes(0);
  if (['application/msword','application/vnd.ms-excel','application/vnd.ms-powerpoint'].includes(mime)) return fileSize > 8;
  if (mime === 'application/octet-stream' || !mime) {
    const executable = ascii.startsWith('MZ') || hasPrefix(buffer,[0x7f,0x45,0x4c,0x46]) || ascii.startsWith('#!');
    return fileSize > 0 && !blockedUploadExtensions.has(ext) && !executable;
  }
  return false;
}
function verifyUpload(req, res, next) {
  if (!req.file) return next();
  if (validUploadSignature(req.file)) return next();
  try { fs.unlinkSync(req.file.path); } catch {}
  req.file = null;
  return res.status(415).json({ ok:false, message:'Định dạng hoặc nội dung tệp không hợp lệ.' });
}
function enforceUploadQuota(req,res,next) {
  if (!req.file) return next();
  const auth=getAuth(req);
  const ownerId=auth?.role==='admin'?'admin':auth?.userId;
  const totalBytes=store.uploads.reduce((sum,item)=>sum+Math.max(0,Number(item.size)||0),0);
  const ownerBytes=store.uploads.filter((item)=>item.ownerId===ownerId).reduce((sum,item)=>sum+Math.max(0,Number(item.size)||0),0);
  const exceedsTotal=MAX_TOTAL_UPLOAD_BYTES>0 && totalBytes+req.file.size>MAX_TOTAL_UPLOAD_BYTES;
  const exceedsOwner=auth?.role!=='admin' && MAX_USER_UPLOAD_BYTES>0 && ownerBytes+req.file.size>MAX_USER_UPLOAD_BYTES;
  if (!exceedsTotal && !exceedsOwner) return next();
  try { fs.unlinkSync(req.file.path); } catch {}
  req.file=null;
  return res.status(413).json({ok:false,code:'UPLOAD_QUOTA_EXCEEDED',message:exceedsOwner?'Tài khoản đã đạt giới hạn dung lượng tải lên.':'Máy chủ đã đạt giới hạn dung lượng lưu trữ tệp.'});
}

const sessionMiddleware = session({
  store: new FileStore({ path: SESSION_DIR, ttl: 30 * 24 * 60 * 60, retries: 1, logFn: () => {} }),
  name: 'chat.sid', secret: SESSION_SECRET,
  resave: false, saveUninitialized: false, rolling: true,
  cookie: { httpOnly: true, sameSite: 'lax', secure: 'auto', priority: 'high', path:'/' },
});
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use((req, res, next) => {
  const requestId = crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Origin-Agent-Cluster', '?1');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=(self), payment=(), usb=(), serial=(), bluetooth=(), hid=(), browsing-topics=()');
  const upgrade = (process.env.NODE_ENV === 'production' || String(req.get('x-forwarded-proto')).includes('https')) ? '; upgrade-insecure-requests' : '';
  res.setHeader('Content-Security-Policy', `default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self'; script-src-attr 'none'; script-src-elem 'self' blob:; style-src 'self' 'unsafe-inline'; style-src-attr 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self' ws: wss: https://www.google-analytics.com https://region1.google-analytics.com; font-src 'self' data:; worker-src 'self' blob:; manifest-src 'self'${upgrade}`);
  if (process.env.NODE_ENV === 'production' || String(req.get('x-forwarded-proto')).includes('https')) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});
app.use(compression({ threshold: 1024 }));
app.use(requireSameOrigin);
app.use(express.json({ limit: '2mb', strict: true }));
app.use(express.urlencoded({ extended: false, limit: '256kb', parameterLimit: 80 }));
app.use(sessionMiddleware);
app.use('/api', (req, res, next) => {
  const token = ensureCsrfToken(req);
  if (token) res.setHeader('X-CSRF-Token', token);
  res.setHeader('Cache-Control', 'no-store, private, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  next();
});
app.use('/api', (req, res, next) => {
  if (['GET','HEAD','OPTIONS'].includes(req.method)) return next();
  const auth = getAuth(req);
  if (!auth || ['admin-pending','user-level2-pending'].includes(auth.role)) return next();
  const token = req.get('x-csrf-token');
  if (!safeTokenEqual(token, req.session?.csrfToken)) return res.status(403).json({ ok:false, code:'CSRF_INVALID', message:'Phiên bảo mật đã thay đổi. Hãy tải lại trang và thử lại.' });
  next();
});


const LOCALE_COUNTRY_LANGUAGE = Object.freeze({
  VN:'vi',
  CN:'zh',TW:'zh',HK:'zh',MO:'zh',
  RU:'ru',BY:'ru',KZ:'ru',KG:'ru',
  DE:'de',AT:'de',LI:'de',
  TH:'th',
  ES:'es',MX:'es',AR:'es',BO:'es',CL:'es',CO:'es',CR:'es',CU:'es',DO:'es',EC:'es',GT:'es',HN:'es',NI:'es',PA:'es',PE:'es',PR:'es',PY:'es',SV:'es',UY:'es',VE:'es',
  FR:'fr',MC:'fr',LU:'fr',SN:'fr',CI:'fr',CM:'fr',ML:'fr',NE:'fr',BF:'fr',TG:'fr',BJ:'fr',GA:'fr',CG:'fr',CD:'fr',MG:'fr',
  JP:'ja'
});
const LOCALE_TIMEZONE_LANGUAGE = Object.freeze({
  'Asia/Ho_Chi_Minh':'vi','Asia/Saigon':'vi',
  'Asia/Shanghai':'zh','Asia/Chongqing':'zh','Asia/Harbin':'zh','Asia/Urumqi':'zh','Asia/Taipei':'zh','Asia/Hong_Kong':'zh','Asia/Macau':'zh',
  'Europe/Moscow':'ru','Europe/Kaliningrad':'ru','Europe/Samara':'ru','Europe/Volgograd':'ru','Asia/Yekaterinburg':'ru','Asia/Omsk':'ru','Asia/Novosibirsk':'ru','Asia/Irkutsk':'ru','Asia/Yakutsk':'ru','Asia/Vladivostok':'ru','Asia/Magadan':'ru','Asia/Kamchatka':'ru',
  'Europe/Berlin':'de','Europe/Vienna':'de','Europe/Busingen':'de','Europe/Zurich':'de',
  'Asia/Bangkok':'th',
  'Europe/Madrid':'es','Atlantic/Canary':'es','America/Mexico_City':'es','America/Bogota':'es','America/Lima':'es','America/Santiago':'es','America/Argentina/Buenos_Aires':'es','America/Montevideo':'es','America/Caracas':'es',
  'Europe/Paris':'fr','Europe/Monaco':'fr',
  'Asia/Tokyo':'ja'
});
const SUPPORTED_LOCALES = new Set(['vi','en','zh','ru','de','th','es','fr','ja']);
function normalizeLocaleLanguage(value) {
  const code = String(value || '').trim().toLowerCase().replace('_','-').split('-')[0];
  return SUPPORTED_LOCALES.has(code) ? code : '';
}
function requestCountry(req) {
  const candidates = [
    req.get('cf-ipcountry'),
    req.get('x-vercel-ip-country'),
    req.get('x-country-code'),
    req.get('x-appengine-country'),
    req.get('fastly-client-country'),
    req.get('cloudfront-viewer-country'),
    req.get('x-geo-country')
  ];
  const country = candidates.map((value)=>String(value || '').trim().toUpperCase()).find((value)=>/^[A-Z]{2}$/.test(value) && value !== 'XX');
  return country || '';
}
function requestTimezone(req) {
  const timezone = cleanText(req.query?.timezone, 80);
  return LOCALE_TIMEZONE_LANGUAGE[timezone] || '';
}
function requestLanguage(req) {
  const header = String(req.get('accept-language') || '');
  const candidates = header.split(',').map((entry)=>{
    const [tag, ...params] = entry.trim().split(';');
    const qValue = params.find((part)=>part.trim().startsWith('q='));
    const quality = qValue ? Number(qValue.trim().slice(2)) : 1;
    return { language:normalizeLocaleLanguage(tag), quality:Number.isFinite(quality) ? quality : 0 };
  }).filter((item)=>item.language).sort((a,b)=>b.quality-a.quality);
  return candidates[0]?.language || '';
}
app.get('/api/locale', (req,res) => {
  const country = requestCountry(req);
  const countryLanguage = LOCALE_COUNTRY_LANGUAGE[country] || '';
  const timezoneLanguage = requestTimezone(req);
  const browserLanguage = requestLanguage(req);
  const language = countryLanguage || timezoneLanguage || browserLanguage || 'en';
  const source = countryLanguage ? 'country' : (timezoneLanguage ? 'timezone' : (browserLanguage ? 'browser' : 'fallback'));
  res.setHeader('Vary','Accept-Language, CF-IPCountry, X-Vercel-IP-Country, CloudFront-Viewer-Country');
  res.json({ ok:true, country, language, source });
});

app.get('/api/public/system-state', (_req,res) => {
  const state = systemState();
  res.setHeader('Cache-Control','no-store');
  res.json({ok:true,system:state});
});

const allowedMime = new Map([
  ['image/jpeg','image'],['image/png','image'],['image/gif','image'],['image/webp','image'],
  ['video/mp4','video'],['video/webm','video'],['video/quicktime','video'],
  ['audio/mpeg','audio'],['audio/wav','audio'],['audio/ogg','audio'],['audio/webm','audio'],['audio/mp4','audio'],
  ['application/pdf','file'],['application/zip','file'],['application/x-zip-compressed','file'],
  ['application/msword','file'],['application/vnd.openxmlformats-officedocument.wordprocessingml.document','file'],
  ['application/vnd.ms-excel','file'],['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','file'],
  ['application/vnd.ms-powerpoint','file'],['application/vnd.openxmlformats-officedocument.presentationml.presentation','file'],
  ['text/plain','file'],['text/csv','file'],['application/octet-stream','file'],
]);
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req,_file,cb) => cb(null, UPLOAD_DIR),
    filename: (_req,file,cb) => {
      const ext = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g,'').slice(0,10);
      cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: MAX_UPLOAD_SIZE, files: 1, fields: 20, fieldNameSize: 100, fieldSize: 16 * 1024, parts: 24 },
  fileFilter: (_req,file,cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    cb(null, !blockedUploadExtensions.has(ext) && (allowedMime.has(file.mimetype) || file.mimetype === ''));
  },
});

function getAuth(req) { return req.session?.auth || null; }
function userHasActiveSession(user, sessionId) {
  return Boolean(user?.sessions?.some((item) => item.id === sessionId && (!Number.isFinite(Number(item.expiresAt)) || Number(item.expiresAt) > Date.now())));
}
function sessionRoom(sessionId) { return `session:${String(sessionId || '')}`; }
function disconnectSessionSockets(sessionId) {
  if (!sessionId) return;
  io.in(sessionRoom(sessionId)).disconnectSockets(true);
}
function sessionFilePath(sessionId) { return path.join(SESSION_DIR, `${String(sessionId || '')}.json`); }
function readPersistedSession(sessionId) {
  if (!sessionId) return null;
  try {
    const parsed = JSON.parse(fs.readFileSync(sessionFilePath(sessionId), 'utf8'));
    const expiresValue = parsed?.cookie?.expires;
    if (expiresValue) {
      const expiresAt = Date.parse(expiresValue);
      if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return null;
    }
    return parsed;
  } catch { return null; }
}
function isPersistedSessionActive(sessionId) { return Boolean(readPersistedSession(sessionId)); }
function isSocketSessionActive(socket) {
  const auth = socket.data.auth;
  const sessionId = socket.data.sessionId || socket.request.sessionID;
  const persisted = readPersistedSession(sessionId);
  const persistedAuth = persisted?.auth;
  if (!auth || !persistedAuth || persistedAuth.role !== auth.role || (persistedAuth.userId || null) !== (auth.userId || null)) return false;
  if (auth.role === 'user') {
    const user = getUser(auth.userId);
    if (!user || restrictionPayload(user)) return false;
    return userHasActiveSession(user, sessionId);
  }
  return ['admin', 'recovery'].includes(auth.role);
}
function pruneSessions(user) {
  const now = Date.now();
  const fallbackCutoff = now - REMEMBER_LOGIN_MS;
  const before = user.sessions.length;
  user.sessions = user.sessions.filter((s) => {
    const lastSeen = new Date(s.lastSeenAt || s.createdAt).getTime();
    const expiresAt = Number(s.expiresAt);
    return lastSeen >= fallbackCutoff && (!Number.isFinite(expiresAt) || expiresAt > now) && fs.existsSync(path.join(SESSION_DIR,s.id+'.json'));
  });
  return user.sessions.length !== before;
}
function trackSession(req, user, { alreadyPruned = false, dirty = false } = {}) {
  ensureUserDefaults(user);
  let changed = dirty || (!alreadyPruned && pruneSessions(user));
  const existing = user.sessions.find((s) => s.id === req.sessionID);
  const now = Date.now();
  const timestamp = new Date(now).toISOString();
  const device = cleanText(req.get('user-agent') || 'Thiết bị không xác định', 180);
  const remembered = Boolean(req.session?.remember);
  const expiresAt = now + (remembered ? REMEMBER_LOGIN_MS : 7 * 24 * 60 * 60 * 1000);
  if (existing) {
    const previousTouch = new Date(existing.lastSeenAt || existing.createdAt || 0).getTime();
    if (!Number.isFinite(previousTouch) || now - previousTouch >= SESSION_TOUCH_INTERVAL_MS) {
      existing.lastSeenAt = timestamp;
      existing.device = device;
      existing.ip = cleanText(req.ip, 80);
      existing.remembered = remembered;
      existing.expiresAt = expiresAt;
      changed = true;
    }
  } else {
    user.sessions.push({ id: req.sessionID, device, ip: cleanText(req.ip, 80), createdAt: timestamp, lastSeenAt: timestamp, remembered, expiresAt });
    changed = true;
  }
  if (changed) saveStore();
}
function requireUser(req,res,next) {
  const auth = getAuth(req);
  if (!auth || auth.role !== 'user') return res.status(401).json({ ok:false, message:'Bạn cần đăng nhập.' });
  const user = getUser(auth.userId);
  if (!user) return res.status(401).json({ ok:false, message:'Tài khoản không tồn tại.' });
  const restriction = restrictionPayload(user);
  if (restriction) { disconnectSessionSockets(req.sessionID); req.session.destroy(() => {}); return res.status(423).json({ ok:false, restriction }); }
  if (!user.nickname) return res.status(428).json({ ok:false, needsNickname:true, message:'Bạn cần tạo biệt danh trước khi tiếp tục.' });
  const sessionsPruned = pruneSessions(user);
  if (!userHasActiveSession(user, req.sessionID)) {
    if (sessionsPruned) saveStore();
    disconnectSessionSockets(req.sessionID);
    req.session.destroy(() => {});
    return res.status(401).json({ ok:false, message:'Phiên đăng nhập này đã bị đăng xuất từ thiết bị khác.' });
  }
  trackSession(req, user, { alreadyPruned:true, dirty:sessionsPruned }); req.user = user; next();
}
function requireAdmin(req,res,next) { if (getAuth(req)?.role !== 'admin') return res.status(403).json({ ok:false, message:'Không có quyền quản trị.' }); next(); }
function recordAdminAction(req, action, target = '', detail = '') {
  store.system = store.system && typeof store.system === 'object' ? store.system : defaultStore().system;
  store.system.adminAuditLog = Array.isArray(store.system.adminAuditLog) ? store.system.adminAuditLog : [];
  const fingerprint = crypto.createHash('sha256').update(String(req.ip || '')).digest('hex').slice(0, 12);
  const entry = {
    id: id('audit'),
    action: cleanText(action, 60),
    target: cleanText(target, 100),
    detail: cleanText(detail, 240),
    at: nowISO(),
    source: fingerprint,
  };
  store.system.adminAuditLog.push(entry);
  if (store.system.adminAuditLog.length > 500) store.system.adminAuditLog = store.system.adminAuditLog.slice(-500);
  saveStore();
  io.to('admin').emit('admin:audit', entry);
  return entry;
}
function requireSupportAccess(req,res,next) {
  const auth = getAuth(req);
  if (!auth || !['user','recovery'].includes(auth.role)) return res.status(401).json({ ok:false, message:'Phiên hỗ trợ không hợp lệ.' });
  const user = getUser(auth.userId);
  if (!user) return res.status(401).json({ ok:false, message:'Tài khoản không tồn tại.' });
  if (auth.role === 'user') {
    const restriction = restrictionPayload(user);
    if (restriction) { disconnectSessionSockets(req.sessionID); req.session.destroy(() => {}); return res.status(423).json({ ok:false, restriction }); }
    const sessionsPruned = pruneSessions(user);
    if (!userHasActiveSession(user, req.sessionID)) {
      if (sessionsPruned) saveStore();
      disconnectSessionSockets(req.sessionID);
      req.session.destroy(() => {});
      return res.status(401).json({ ok:false, message:'Phiên đăng nhập này đã bị đăng xuất từ thiết bị khác.' });
    }
    trackSession(req, user, { alreadyPruned:true, dirty:sessionsPruned });
  } else if (!isPersistedSessionActive(req.sessionID)) {
    return res.status(401).json({ ok:false, message:'Phiên hỗ trợ đã hết hiệu lực.' });
  }
  req.user = user;
  next();
}

function requireUploadAccess(req,res,next) {
  const auth = getAuth(req);
  if (!auth || !['user','recovery','admin'].includes(auth.role)) return res.status(401).json({ok:false,message:'Bạn cần đăng nhập.'});
  if (auth.role === 'user') return requireUser(req,res,next);
  if (auth.role === 'recovery') {
    const user = getUser(auth.userId);
    if (!user) return res.status(401).json({ok:false,message:'Tài khoản không tồn tại.'});
    req.user = user;
  }
  next();
}

const requestBuckets = new Map();
const credentialBuckets = new Map();
function credentialBucketKey(name, req, identifier) {
  const digest = crypto.createHash('sha256').update(String(identifier || '').toLowerCase()).digest('hex').slice(0,24);
  return `${name}:${req.ip}:${digest}`;
}
function credentialThrottleStatus(name, req, identifier, windowMs = 15 * 60 * 1000, maxFailures = 8) {
  const key = credentialBucketKey(name, req, identifier);
  const now = Date.now();
  const failures = (credentialBuckets.get(key) || []).filter((time) => now - time < windowMs);
  if (failures.length) credentialBuckets.set(key, failures); else credentialBuckets.delete(key);
  if (failures.length < maxFailures) return { blocked:false, key, failures };
  return { blocked:true, key, failures, retryAfter:Math.max(1, Math.ceil((windowMs - (now - failures[0])) / 1000)) };
}
function recordCredentialFailure(key) {
  const list = credentialBuckets.get(key) || [];
  list.push(Date.now());
  credentialBuckets.set(key, list.slice(-12));
  if (credentialBuckets.size > MAX_SECURITY_BUCKETS) {
    for (const oldest of credentialBuckets.keys()) { credentialBuckets.delete(oldest); if (credentialBuckets.size <= MAX_SECURITY_BUCKETS * .9) break; }
  }
}
function clearCredentialFailures(key) { credentialBuckets.delete(key); }
function rateLimit(name, windowMs, maxAttempts, keySelector = (req) => req.ip) {
  return (req, res, next) => {
    const key = `${name}:${String(keySelector(req) || req.ip).slice(0, 180)}`;
    const now = Date.now();
    const bucket = (requestBuckets.get(key) || []).filter((time) => now - time < windowMs);
    if (bucket.length >= maxAttempts) {
      const retryAfter = Math.max(1, Math.ceil((windowMs - (now - bucket[0])) / 1000));
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({ ok:false, message:'Bạn thao tác quá nhiều lần. Hãy thử lại sau.' });
    }
    bucket.push(now);
    requestBuckets.set(key, bucket);
    if (requestBuckets.size > MAX_RATE_LIMIT_BUCKETS) {
      for (const oldest of requestBuckets.keys()) { requestBuckets.delete(oldest); if (requestBuckets.size <= MAX_RATE_LIMIT_BUCKETS * 0.9) break; }
    }
    next();
  };
}
setInterval(() => {
  const now = Date.now();
  for (const [key, times] of requestBuckets) {
    const active = times.filter((time) => now - time < 15 * 60 * 1000);
    if (active.length) requestBuckets.set(key, active); else requestBuckets.delete(key);
  }
  for (const [key, times] of credentialBuckets) {
    const active = times.filter((time) => now - time < 15 * 60 * 1000);
    if (active.length) credentialBuckets.set(key, active); else credentialBuckets.delete(key);
  }
}, 10 * 60 * 1000).unref();

app.get('/health', (_req,res) => {
  let storageWritable = true;
  try { fs.accessSync(DATA_DIR, fs.constants.R_OK | fs.constants.W_OK); fs.accessSync(UPLOAD_DIR, fs.constants.R_OK | fs.constants.W_OK); }
  catch { storageWritable = false; }
  const payload = { status:storageWritable?'ok':'degraded', version:VERSION, uptimeSeconds:Math.floor(process.uptime()), storageWritable, persistenceConfigured:DATA_DIR !== ROOT };
  res.status(storageWritable ? 200 : 503).json(payload);
});
app.get('/', (req,res) => {
  const auth = getAuth(req);
  if (auth?.role === 'user') { const user = getUser(auth.userId); if (user?.nickname) return res.redirect('/chat'); }
  if (auth?.role === 'admin') return res.redirect('/admin');
  if (auth?.role === 'recovery') return res.redirect('/support');
  res.setHeader('Cache-Control','no-store');
  res.sendFile(path.join(ROOT,'home.html'));
});
app.get(['/login', '/login.html'], (req,res) => {
  const auth = getAuth(req);
  if (auth?.role === 'user') { const user = getUser(auth.userId); if (user?.nickname) return res.redirect('/chat'); }
  if (auth?.role === 'admin') return res.redirect('/admin');
  if (auth?.role === 'recovery') return res.redirect('/support');
  res.setHeader('Cache-Control','no-store'); res.sendFile(path.join(ROOT,'login.html'));
});
app.get(['/chat','/index.html'], (req,res) => {
  const auth = getAuth(req); if (!auth || auth.role !== 'user') return res.redirect('/login');
  const user = getUser(auth.userId); if (!user || restrictionPayload(user) || !userHasActiveSession(user,req.sessionID)) { disconnectSessionSockets(req.sessionID); req.session.destroy(() => {}); return res.redirect('/login'); }
  if (!user.nickname) return res.redirect('/login?setup=nickname');
  res.setHeader('Cache-Control','no-store, private, max-age=0'); res.setHeader('Pragma','no-cache'); res.sendFile(path.join(ROOT,'index.html'));
});
app.get(['/admin','/admin.html'], (req,res) => { if (getAuth(req)?.role !== 'admin') return res.redirect('/login'); res.setHeader('Cache-Control','no-store, private, max-age=0'); res.setHeader('Pragma','no-cache'); res.sendFile(path.join(ROOT,'admin.html')); });
app.get(['/support','/support.html'], (req,res) => {
  const auth = getAuth(req); if (!auth || !['user','recovery'].includes(auth.role)) return res.redirect('/login');
  if (!getUser(auth.userId)) return res.redirect('/login'); res.setHeader('Cache-Control','no-store, private, max-age=0'); res.setHeader('Pragma','no-cache'); res.sendFile(path.join(ROOT,'support.html'));
});
app.get('/uploads/:fileName', (req,res) => {
  const auth = getAuth(req);
  if (!auth || !['user','recovery','admin'].includes(auth.role)) return res.status(401).end();
  const upload = store.uploads.find((item) => item.fileName === req.params.fileName);
  if (!upload) return res.status(404).end();
  if (!canAccessUpload(upload, auth)) return res.status(403).end();
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Cache-Control','private,max-age=300,must-revalidate');
  const safeName = safeDownloadName(upload.originalName);
  const inline = ['image','video','audio'].includes(upload.kind);
  res.setHeader('Content-Disposition', `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(safeName)}`);
  res.type(upload.mime || 'application/octet-stream').sendFile(path.join(UPLOAD_DIR, upload.fileName));
});
for (const asset of ['style.css','mobile.css','system.css','smart-tools.css','v10-experience.css','v10-polish.css','bubble-effects.css','theme-init.js','i18n.js','admin-i18n.js','ui.js','app-runtime.js','smart-tools.js','v10-experience.js','v10-polish.js','home.js','login.js','script.js','admin.js','support.js']) app.get(`/${asset}`, (req,res) => { res.setHeader('Cache-Control', req.query.v ? 'public,max-age=31536000,immutable' : 'no-cache'); res.sendFile(path.join(ROOT,asset)); });
app.get('/site.webmanifest', (_req,res) => { res.setHeader('Cache-Control','public,max-age=3600'); res.type('application/manifest+json').sendFile(path.join(ROOT,'site.webmanifest')); });
app.get('/sw.js', (_req,res) => { res.setHeader('Cache-Control','no-cache,no-store,must-revalidate'); res.setHeader('Service-Worker-Allowed','/'); res.type('application/javascript').sendFile(path.join(ROOT,'sw.js')); });
for (const asset of ['nexchat-logo.svg','chat-bg-aurora.svg','chat-bg-sunset.svg','chat-bg-ocean.svg','chat-bg-forest.svg','chat-bg-lavender.svg','chat-bg-midnight.svg','chat-bg-rose.svg']) app.get(`/${asset}`, (_req,res) => { res.setHeader('Cache-Control','public,max-age=86400'); res.type('image/svg+xml').sendFile(path.join(ROOT,asset)); });
for (const asset of ['vip-emblem.webp','legend-emblem.webp']) app.get(`/${asset}`, (_req,res) => { res.setHeader('Cache-Control','public,max-age=86400'); res.type('image/webp').sendFile(path.join(ROOT,asset)); });
app.get('/admin-nebula.jpg', (_req,res) => { res.setHeader('Cache-Control','public,max-age=86400'); res.type('image/jpeg').sendFile(path.join(ROOT,'admin-nebula.jpg')); });

app.post('/api/register', rateLimit('register', 15 * 60 * 1000, 12), async (req,res) => {
  try {
    const username = cleanText(req.body.username,24), usernameKey = normalizeUsername(username), phone = normalizePhone(req.body.phone);
    const email = cleanText(req.body.email,120).toLowerCase(), password = String(req.body.password ?? ''), confirm = String(req.body.confirmPassword ?? '');
    if (!validUsername(username)) return res.status(400).json({ok:false,message:'Tên đăng nhập gồm 3–24 ký tự: chữ, số, dấu chấm hoặc gạch dưới.'});
    if (usernameKey === ADMIN_USERNAME) return res.status(409).json({ok:false,message:'Tên đăng nhập này không thể sử dụng.'});
    if (!validPhone(phone)) return res.status(400).json({ok:false,message:'Số điện thoại phải có 10 số và bắt đầu bằng 03, 05, 07, 08 hoặc 09.'});
    if (!validEmail(email)) return res.status(400).json({ok:false,message:'Email không hợp lệ.'});
    if (password.length < 8 || password.length > 72 || !/[A-Za-zÀ-ỹ]/u.test(password) || !/\d/.test(password)) return res.status(400).json({ok:false,message:'Mật khẩu phải có 8–72 ký tự, gồm ít nhất một chữ và một số.'});
    if (password !== confirm) return res.status(400).json({ok:false,message:'Mật khẩu nhập lại không khớp.'});
    const maxAccounts = normalizeMaxAccounts(store.system?.maxAccounts);
    if (maxAccounts > 0 && store.users.length >= maxAccounts) return res.status(503).json({ok:false,code:'ACCOUNT_CAPACITY_FULL',message:`Hệ thống đã đạt giới hạn ${maxAccounts.toLocaleString('vi-VN')} tài khoản. Vui lòng thử lại sau.`});
    if (getUserByUsername(username)) return res.status(409).json({ok:false,message:'Tên đăng nhập đã tồn tại.'});
    if (getUserByPhone(phone)) return res.status(409).json({ok:false,message:'Một số điện thoại chỉ được đăng ký một tài khoản.'});
    if (email && store.users.some((u) => u.email === email)) return res.status(409).json({ok:false,message:'Email đã được sử dụng.'});
    const user = ensureUserDefaults({ id:id('usr'), username, usernameKey, nickname:'', phone, email, passwordHash:await bcrypt.hash(password,11), createdAt:nowISO(), lastSeenAt:null });
    store.users.push(user); saveStore();
    req.session.regenerate((error) => {
      if (error) return res.status(500).json({ok:false,message:'Không thể tạo phiên đăng nhập.'});
      req.session.auth = {role:'user',userId:user.id}; configureSessionPersistence(req,false); trackSession(req,user); rotateCsrfToken(req,res);
      req.session.save(() => res.status(201).json({ok:true,needsNickname:true,suggestedNickname:username}));
    });
  } catch (error) { console.error(error); res.status(500).json({ok:false,message:'Không thể đăng ký lúc này.'}); }
});
app.post('/api/login', rateLimit('login', 10 * 60 * 1000, 18), async (req,res) => {
  try {
    const identifier = cleanText(req.body.identifier ?? req.body.username,120), password = String(req.body.password ?? ''), remember = Boolean(req.body.remember);
    const throttle = credentialThrottleStatus('login-credential', req, identifier);
    if (throttle.blocked) { res.setHeader('Retry-After', String(throttle.retryAfter)); return res.status(429).json({ok:false,message:'Đăng nhập thất bại quá nhiều lần. Hãy thử lại sau.'}); }
    const identifierPhone = normalizePhone(identifier);
    const identifierEmail = identifier.toLowerCase();
    const isPhoneIdentifier = validPhone(identifierPhone);
    const isEmailIdentifier = Boolean(identifierEmail) && validEmail(identifierEmail) && identifierEmail.includes('@');
    if (!isPhoneIdentifier && !isEmailIdentifier && normalizeUsername(identifier) === ADMIN_USERNAME) {
      if (!safeEqualSecret(password, ADMIN_PASSWORD)) { recordCredentialFailure(throttle.key); return res.status(401).json({ok:false,message:'Tên đăng nhập hoặc mật khẩu không đúng.'}); }
      clearCredentialFailures(throttle.key);
      return req.session.regenerate((error) => {
        if (error) return res.status(500).json({ok:false,message:'Không thể tạo phiên đăng nhập.'});
        req.session.auth={role:'admin-pending'}; configureSessionPersistence(req,remember); rotateCsrfToken(req,res);
        req.session.save(() => res.json({ok:true,requiresSecondPassword:true}));
      });
    }
    const user = isPhoneIdentifier ? getUserByPhone(identifierPhone) : (isEmailIdentifier ? getUserByEmail(identifierEmail) : getUserByUsername(identifier));
    const passwordValid = await bcrypt.compare(password, user?.passwordHash || DUMMY_PASSWORD_HASH);
    if (!user || !passwordValid) { recordCredentialFailure(throttle.key); return res.status(401).json({ok:false,message:'Thông tin đăng nhập hoặc mật khẩu không đúng.'}); }
    clearCredentialFailures(throttle.key);
    const restriction = restrictionPayload(user); if (restriction) return res.status(423).json({ok:false,restriction});
    pruneSessions(user);
    if (user.sessions.length >= MAX_SESSIONS) return res.status(429).json({ok:false,message:'Tài khoản đã đăng nhập trên tối đa 5 thiết bị. Hãy đăng xuất một phiên cũ trước.'});
    req.session.regenerate((error) => {
      if (error) return res.status(500).json({ok:false,message:'Không thể tạo phiên đăng nhập.'});
      configureSessionPersistence(req,remember);
      if (user.security.level2Enabled) {
        req.session.auth={role:'user-level2-pending',userId:user.id,remember}; rotateCsrfToken(req,res);
        return req.session.save(() => res.json({ok:true,requiresUserSecondFactor:true,username:user.username}));
      }
      req.session.auth={role:'user',userId:user.id}; trackSession(req,user); rotateCsrfToken(req,res);
      req.session.save(() => res.json({ok:true,redirect:user.nickname?'/chat':'/login?setup=nickname',needsNickname:!user.nickname}));
    });
  } catch (error) { console.error(error); res.status(500).json({ok:false,message:'Không thể đăng nhập lúc này.'}); }
});
app.post('/api/user/verify-level2', rateLimit('user-level2', 10 * 60 * 1000, 15), async (req,res) => {
  const auth=getAuth(req);
  if (!auth || auth.role!=='user-level2-pending') return res.status(403).json({ok:false,message:'Phiên xác minh cấp 2 không hợp lệ.'});
  const user=getUser(auth.userId);
  if (!user || !user.security.level2Enabled) return res.status(403).json({ok:false,message:'Bảo mật cấp 2 không còn được bật.'});
  const password=String(req.body.password??'');
  if (!(await bcrypt.compare(password,user.security.level2PasswordHash))) return res.status(401).json({ok:false,message:'Mật khẩu bảo mật cấp 2 không đúng.'});
  const restriction=restrictionPayload(user); if(restriction)return res.status(423).json({ok:false,restriction});
  req.session.auth={role:'user',userId:user.id}; configureSessionPersistence(req,Boolean(auth.remember)); trackSession(req,user);
  req.session.save(()=>res.json({ok:true,redirect:user.nickname?'/chat':'/login?setup=nickname',needsNickname:!user.nickname,suggestedNickname:user.username}));
});
app.post('/api/admin/verify', rateLimit('admin-verify', 10 * 60 * 1000, 15), (req,res) => {
  if (getAuth(req)?.role !== 'admin-pending') return res.status(403).json({ok:false,message:'Phiên xác minh không hợp lệ.'});
  if (!safeEqualSecret(req.body.password, ADMIN_SECOND_PASSWORD)) return res.status(401).json({ok:false,message:'Mật khẩu bảo mật mức 2 không đúng.'});
  req.session.auth={role:'admin'}; req.session.save(() => res.json({ok:true,redirect:'/admin'}));
});
async function twilioVerifyRequest(action, values) {
  if (!TWILIO_VERIFY_CONFIGURED) throw Object.assign(new Error('Dịch vụ xác minh SMS chưa được cấu hình.'), { code:'SMS_NOT_CONFIGURED' });
  const url = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/${action}`;
  const authorization = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
  const response = await fetch(url, {
    method:'POST',
    headers:{ Authorization:`Basic ${authorization}`, 'Content-Type':'application/x-www-form-urlencoded' },
    body:new URLSearchParams(values),
    signal:AbortSignal.timeout(10000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error(`[RECOVERY] Twilio Verify trả về HTTP ${response.status}, mã ${cleanText(data.code, 24) || 'unknown'}.`);
    throw Object.assign(new Error('Không thể sử dụng dịch vụ xác minh SMS lúc này.'), { code:'SMS_PROVIDER_ERROR' });
  }
  return data;
}
function phoneToE164(phone) { return `+84${String(phone).replace(/^0/, '')}`; }
app.post('/api/recovery/start',
  rateLimit('recovery', 15 * 60 * 1000, 8),
  rateLimit('recovery-phone', 60 * 60 * 1000, 3, (req) => crypto.createHash('sha256').update(normalizePhone(req.body.phone)).digest('hex')),
  async (req,res) => {
    const recoveryType = req.body.recoveryType === 'username' ? 'username' : 'password';
    const phone = normalizePhone(req.body.phone);
    const usernameKey = normalizeUsername(req.body.username);
    if (!validPhone(phone)) return res.status(400).json({ok:false,message:'Số điện thoại không hợp lệ.'});
    if (recoveryType === 'password' && !validUsername(usernameKey)) return res.status(400).json({ok:false,message:'Vui lòng nhập tên đăng nhập hợp lệ.'});
    if (!TWILIO_VERIFY_CONFIGURED) return res.status(503).json({ok:false,code:'RECOVERY_NOT_CONFIGURED',message:'Khôi phục tài khoản đang tạm khóa an toàn vì máy chủ chưa cấu hình dịch vụ xác minh SMS. Vui lòng liên hệ quản trị viên.'});
    const candidate = getUserByPhone(phone);
    const candidateMatches = candidate && (recoveryType === 'username' || candidate.usernameKey === usernameKey || normalizeUsername(candidate.username) === usernameKey);
    // Do not spend SMS credits or send texts to arbitrary numbers for unknown accounts.
    // Return the same outward message so account existence is not disclosed.
    if (!candidateMatches) return res.json({ok:true,needsVerification:true,message:'Nếu thông tin hợp lệ, mã xác minh đã được gửi đến số điện thoại bạn cung cấp.'});
    try {
      await twilioVerifyRequest('Verifications', { To:phoneToE164(phone), Channel:'sms' });
    } catch (error) {
      const status = error.code === 'SMS_NOT_CONFIGURED' ? 503 : 502;
      return res.status(status).json({ok:false,message:error.message || 'Không thể gửi mã xác minh lúc này.'});
    }
    const previousSessionId = req.sessionID;
    req.session.regenerate((error) => {
      disconnectSessionSockets(previousSessionId);
      if (error) return res.status(500).json({ok:false,message:'Không thể tạo phiên xác minh.'});
      req.session.cookie.maxAge = RECOVERY_CODE_TTL_MS;
      req.session.recoveryPending = { phone, usernameKey, recoveryType, createdAt:Date.now(), expiresAt:Date.now()+RECOVERY_CODE_TTL_MS, attempts:0 };
      rotateCsrfToken(req,res);
      req.session.save((saveError) => {
        if (saveError) return res.status(500).json({ok:false,message:'Không thể lưu phiên xác minh.'});
        res.json({ok:true,needsVerification:true,message:'Nếu thông tin hợp lệ, mã xác minh đã được gửi đến số điện thoại bạn cung cấp.'});
      });
    });
  }
);
app.post('/api/recovery/verify', rateLimit('recovery-verify', 10 * 60 * 1000, 12), async (req,res) => {
  const pending = req.session?.recoveryPending;
  if (!pending || !Number.isFinite(Number(pending.expiresAt)) || Number(pending.expiresAt) <= Date.now()) {
    return res.status(401).json({ok:false,message:'Phiên xác minh đã hết hạn. Hãy yêu cầu mã mới.'});
  }
  const code = String(req.body.code || '').trim();
  if (!/^\d{4,10}$/.test(code)) return res.status(400).json({ok:false,message:'Mã xác minh không hợp lệ.'});
  if (pending.attempts >= RECOVERY_CODE_MAX_ATTEMPTS) {
    const sid=req.sessionID; req.session.destroy(()=>{}); disconnectSessionSockets(sid);
    return res.status(429).json({ok:false,message:'Bạn đã nhập sai mã quá nhiều lần. Hãy yêu cầu mã mới.'});
  }
  let verification;
  try {
    verification = await twilioVerifyRequest('VerificationCheck', { To:phoneToE164(pending.phone), Code:code });
  } catch (error) {
    return res.status(502).json({ok:false,message:error.message || 'Không thể xác minh mã lúc này.'});
  }
  if (verification.status !== 'approved') {
    pending.attempts += 1;
    req.session.recoveryPending = pending;
    req.session.save(() => {});
    return res.status(401).json({ok:false,message:'Mã xác minh không đúng hoặc đã hết hạn.'});
  }
  const user = getUserByPhone(pending.phone);
  const accountMatches = user && (pending.recoveryType === 'username' || user.usernameKey === pending.usernameKey || normalizeUsername(user.username) === pending.usernameKey);
  if (!accountMatches) {
    const sid=req.sessionID; req.session.destroy(()=>{}); disconnectSessionSockets(sid);
    return res.status(401).json({ok:false,message:'Không thể xác minh tài khoản với thông tin đã cung cấp.'});
  }
  req.session.auth={role:'recovery',userId:user.id,recoveryType:pending.recoveryType,recoveryStartedAt:Date.now(),recoveryVerifiedAt:Date.now()};
  delete req.session.recoveryPending;
  req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000;
  rotateCsrfToken(req,res);
  req.session.save((saveError) => {
    if (saveError) return res.status(500).json({ok:false,message:'Không thể hoàn tất phiên hỗ trợ.'});
    res.json({ok:true,redirect:'/support'});
  });
});
app.post('/api/logout', (req,res) => {
  const auth = getAuth(req), sid = req.sessionID;
  if (auth?.role === 'user') { const user=getUser(auth.userId); if (user) { user.sessions=user.sessions.filter((s)=>s.id!==sid); saveStore(); } }
  req.session.destroy(() => { disconnectSessionSockets(sid); res.clearCookie('chat.sid',{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/'}); res.json({ok:true,redirect:'/login'}); });
});
app.get('/api/session', (req,res) => {
  const csrfToken=ensureCsrfToken(req);
  const auth=getAuth(req); if (!auth) return res.json({ok:false,role:'guest',csrfToken});
  if (['user','recovery','user-level2-pending'].includes(auth.role)) {
    const user=getUser(auth.userId);
    if (!user) return res.status(401).json({ok:false});
    const restriction=auth.role==='user'?restrictionPayload(user):null;
    if (restriction) { disconnectSessionSockets(req.sessionID); req.session.destroy(()=>{}); return res.status(423).json({ok:false,restriction}); }
    if (auth.role==='user' && !userHasActiveSession(user,req.sessionID)) {
      disconnectSessionSockets(req.sessionID); req.session.destroy(()=>{});
      return res.status(401).json({ok:false,message:'Phiên đăng nhập đã hết hiệu lực.'});
    }
    if (auth.role==='recovery' && !isPersistedSessionActive(req.sessionID)) return res.status(401).json({ok:false});
    return res.json({ok:true,role:auth.role,user:safeUser(user,true,user.id),needsNickname:auth.role==='user'&&!user.nickname,requiresUserSecondFactor:auth.role==='user-level2-pending',csrfToken});
  }
  res.json({ok:true,role:auth.role,csrfToken});
});
app.post('/api/profile/nickname', (req,res) => {
  const auth=getAuth(req); if (!auth||auth.role!=='user') return res.status(401).json({ok:false,message:'Bạn cần đăng nhập.'});
  const user=getUser(auth.userId); if (!user) return res.status(401).json({ok:false,message:'Tài khoản không tồn tại.'});
  const nickname=cleanText(req.body.nickname,24).replace(/\s+/g,' '), error=nicknameModerationError(nickname); if (error) return res.status(400).json({ok:false,message:error});
  user.nickname=nickname; for (const m of store.messages) if (m.fromId===user.id) m.senderName=nickname; saveStore(); io.to(`user:${user.id}`).emit('profile:updated',{user:safeUser(user,true,user.id)}); res.json({ok:true,redirect:'/chat',user:safeUser(user,true,user.id)});
});

app.get('/api/bootstrap', requireUser, (req,res) => {
  finalisePendingDeletes();
  const user=req.user, archived=new Set(user.archivedUserIds);
  const directContactIds=new Set([...friendIdsFor(user.id),...user.acceptedMessageUserIds,...user.blockedUserIds]);
  for(const other of store.users) if(other.id!==user.id&&other.blockedUserIds.includes(user.id)) directContactIds.add(other.id);
  for(const m of store.messages) if(m.scope==='private'&&[m.fromId,m.toId].includes(user.id)) directContactIds.add(m.fromId===user.id?m.toId:m.fromId);
  const friends=[...directContactIds].map(getUser).filter(Boolean).map((f)=>{
    const access=blockStateFor(user.id,f.id);
    return {
      ...safeUser(f,false,user.id), alias:user.aliases[f.id]||'', archived:archived.has(f.id), mutedUntil:user.mutes[f.id]??null,
      pinned:user.pinnedConversations.includes(conversationKey('private',f.id)), friend:isFriend(user.id,f.id),
      blocked:access.blocked, blockedByMe:access.blockedByMe, blockedByOther:access.blockedByOther, canSend:privateConversationAllowed(user.id,f.id),
      unread:store.messages.filter((m)=>['private','request'].includes(m.scope)&&m.toId===user.id&&m.fromId===f.id&&!m.readBy.includes(user.id)&&!m.deletedFor.includes(user.id)).length,
    };
  });
  const incoming=store.friendRequests.filter((r)=>r.toId===user.id&&r.status==='pending').map((r)=>({...r,user:safeUser(getUser(r.fromId),false,user.id)}));
  const outgoing=store.friendRequests.filter((r)=>r.fromId===user.id&&r.status==='pending').map((r)=>({...r,user:safeUser(getUser(r.toId),false,user.id)}));
  const pendingFriendIds=new Set(store.friendRequests.filter((r)=>r.status==='pending'&&[r.fromId,r.toId].includes(user.id)).map((r)=>r.fromId===user.id?r.toId:r.fromId));
  const suggestions=store.users.filter((u)=>u.id!==user.id&&!isBlockedBetween(user.id,u.id)&&u.profile.showInSuggestions&&u.profile.isPublic&&!friendIdsFor(user.id).includes(u.id)&&!pendingFriendIds.has(u.id)).slice(0,20).map((u)=>safeUser(u,false,user.id));
  const requestPairs=new Map();
  for (const m of store.messages.filter((m)=>m.scope==='request'&&m.toId===user.id&&!m.deletedFor.includes(user.id))) {
    if (!user.acceptedMessageUserIds.includes(m.fromId)) requestPairs.set(m.fromId,m);
  }
  const messageRequests=[...requestPairs.entries()].map(([fromId,last])=>({user:safeUser(getUser(fromId),false,user.id),lastMessage:clientMessage(last),unread:store.messages.filter((m)=>m.scope==='request'&&m.fromId===fromId&&m.toId===user.id&&!m.readBy.includes(user.id)).length}));
  const groups=store.groups.filter((g)=>g.memberIds.includes(user.id)).map((g)=>({ ...g, members:g.memberIds.map((id)=>safeUser(getUser(id),false,user.id)), pinned:user.pinnedConversations.includes(conversationKey('group',g.id)), mutedUntil:user.mutes[`group:${g.id}`]??null, unread:store.messages.filter((m)=>m.scope==='group'&&m.groupId===g.id&&m.fromId!==user.id&&!m.readBy.includes(user.id)&&!m.deletedFor.includes(user.id)).length }));
  const pendingDeletes=store.conversationDeletes.filter((d)=>d.userId===user.id);
  res.json({ok:true,me:safeUser(user,true,user.id),friends,incoming,outgoing,blocked:user.blockedUserIds.map(getUser).filter(Boolean).map((u)=>({...safeUser(u,false,user.id),...blockStateFor(user.id,u.id)})),suggestions,messageRequests,groups,pendingDeletes,effects:EFFECTS,system:systemState(),worldUnread:0,supportUnread:store.messages.filter((m)=>m.scope==='support'&&m.supportUserId===user.id&&m.senderRole==='admin'&&!m.readBy.includes(user.id)).length});
});

app.get('/api/profile/me', requireUser, (req,res) => res.json({ok:true,user:safeUser(req.user,true,req.user.id),sessions:req.user.sessions.map((s)=>({...s,current:s.id===req.sessionID}))}));
app.post('/api/profile/me/media-upload', requireUser, rateLimit('profile-media-upload', 60 * 1000, 12), upload.single('file'), verifyUpload, enforceUploadQuota, (req,res) => {
  const u=req.user;
  const kind=req.body.kind==='avatar'?'avatarUrl':req.body.kind==='cover'?'coverUrl':'';
  const cleanup=()=>{if(req.file?.path)try{fs.unlinkSync(req.file.path);}catch{}};
  if(!kind){cleanup();return res.status(400).json({ok:false,message:'Loại ảnh hồ sơ không hợp lệ.'});}
  if(!req.file)return res.status(400).json({ok:false,message:'Chưa chọn ảnh hồ sơ.'});
  const fileKind=allowedMime.get(req.file.mimetype);
  if(fileKind!=='image'){cleanup();return res.status(415).json({ok:false,message:'Tệp đã chọn không phải ảnh hợp lệ.'});}
  const record={id:id('upl'),ownerRole:'user',ownerId:u.id,originalName:safeDownloadName(req.file.originalname),fileName:req.file.filename,mime:req.file.mimetype||'application/octet-stream',size:req.file.size,kind:'image',createdAt:nowISO()};
  store.uploads.push(record);
  u.profile[kind]=uploadUrl(record);
  if(kind==='avatarUrl')for(const m of store.messages)if(m.fromId===u.id){
    if(m.scope==='world')m.senderAvatarUrl=u.profile.showAvatarInWorld?(u.profile.avatarUrl||''):'';
    else if(m.scope==='group')m.senderAvatarUrl=u.profile.avatarUrl||'';
  }
  saveStore({immediate:true});
  io.emit('profile:updated',{user:safeUser(u,false)});
  res.status(201).json({ok:true,user:safeUser(u,true,u.id),attachment:{id:record.id,name:record.originalName,mime:record.mime,size:record.size,kind:record.kind,url:uploadUrl(record)},message:kind==='avatarUrl'?'Đã cập nhật ảnh đại diện.':'Đã cập nhật ảnh bìa.'});
});

app.put('/api/profile/me/media', requireUser, (req,res) => {
  const u=req.user;
  const kind=req.body.kind==='avatar'?'avatarUrl':req.body.kind==='cover'?'coverUrl':'';
  if (!kind) return res.status(400).json({ok:false,message:'Loại ảnh hồ sơ không hợp lệ.'});
  const value=cleanText(req.body.url,240);
  if (!value) u.profile[kind]='';
  else {
    const image=ownedImageUpload(u,value);
    if (!image) return res.status(400).json({ok:false,message:kind==='avatarUrl'?'Ảnh đại diện không hợp lệ.':'Ảnh bìa không hợp lệ.'});
    u.profile[kind]=uploadUrl(image);
  }
  if (kind==='avatarUrl') {
    for (const m of store.messages) if (m.fromId===u.id) {
      if (m.scope==='world') m.senderAvatarUrl=u.profile.showAvatarInWorld ? (u.profile.avatarUrl||'') : '';
      else if (m.scope==='group') m.senderAvatarUrl=u.profile.avatarUrl||'';
    }
  }
  saveStore();
  io.emit('profile:updated',{user:safeUser(u,false)});
  res.json({ok:true,user:safeUser(u,true,u.id),message:kind==='avatarUrl'?'Đã cập nhật ảnh đại diện.':'Đã cập nhật ảnh bìa.'});
});
app.put('/api/profile/me', requireUser, (req,res) => {
  const u=req.user, p=req.body.profile||{}, s=req.body.settings||{};
  const nickname=cleanText(req.body.nickname??u.nickname,24).replace(/\s+/g,' '), error=nicknameModerationError(nickname); if (error) return res.status(400).json({ok:false,message:error});
  u.nickname=nickname;
  u.profile.bio=cleanText(p.bio??u.profile.bio,500); u.profile.location=cleanText(p.location??u.profile.location,80); u.profile.work=cleanText(p.work??u.profile.work,100); u.profile.school=cleanText(p.school??u.profile.school,100); u.profile.birthday=cleanText(p.birthday??u.profile.birthday,10); u.profile.relationship=cleanText(p.relationship??u.profile.relationship,40);
  if (typeof p.isPublic==='boolean') u.profile.isPublic=p.isPublic; if (typeof p.showInSuggestions==='boolean') u.profile.showInSuggestions=p.showInSuggestions; if (typeof p.showAvatarInWorld==='boolean') u.profile.showAvatarInWorld=p.showAvatarInWorld;
  if (Object.prototype.hasOwnProperty.call(p,'avatarUrl')) {
    if (!p.avatarUrl) u.profile.avatarUrl='';
    else { const image=ownedImageUpload(u,p.avatarUrl); if (!image) return res.status(400).json({ok:false,message:'Ảnh đại diện không hợp lệ.'}); u.profile.avatarUrl=uploadUrl(image); }
  }
  if (Object.prototype.hasOwnProperty.call(p,'coverUrl')) {
    if (!p.coverUrl) u.profile.coverUrl='';
    else { const image=ownedImageUpload(u,p.coverUrl); if (!image) return res.status(400).json({ok:false,message:'Ảnh bìa không hợp lệ.'}); u.profile.coverUrl=uploadUrl(image); }
  }
  if (['everyone','friends','friends_of_friends','none'].includes(s.whoCanMessage)) u.settings.whoCanMessage=s.whoCanMessage;
  for (const key of ['notifyRequests','showTyping','showReadReceipts','showMessageTime','showMessageDate','showDeliveryStatus','compactMessageMotion']) if (typeof s[key]==='boolean') u.settings[key]=s[key];
  if (['auto','full','balanced','lite'].includes(s.visualQuality)) u.settings.visualQuality=s.visualQuality;
  if (['auto','0.85','0.95','1','1.1','1.2'].includes(String(s.interfaceScale))) u.settings.interfaceScale=String(s.interfaceScale);
  for (const m of store.messages) if (m.fromId===u.id) {
    m.senderName=u.nickname;
    m.senderProfilePublic=Boolean(u.profile.isPublic);
    if (m.scope==='world') m.senderAvatarUrl=u.profile.showAvatarInWorld ? (u.profile.avatarUrl||'') : '';
    else if (m.scope==='group') m.senderAvatarUrl=u.profile.avatarUrl||'';
  }
  saveStore(); io.emit('profile:updated',{user:safeUser(u,false)}); res.json({ok:true,user:safeUser(u,true,u.id),message:'Đã lưu hồ sơ.'});
});
app.put('/api/account/contact', requireUser, async (req,res) => {
  const verification=await verifySensitiveAccountAction(req,req.user);
  if(!verification.ok)return res.status(verification.status).json({ok:false,message:verification.message});
  const phone=normalizePhone(req.body.phone), email=cleanText(req.body.email,120).toLowerCase();
  if(!validPhone(phone))return res.status(400).json({ok:false,message:'Số điện thoại không hợp lệ.'});
  if(!validEmail(email))return res.status(400).json({ok:false,message:'Email không hợp lệ.'});
  if(store.users.some((u)=>u.id!==req.user.id&&u.phone===phone))return res.status(409).json({ok:false,message:'Số điện thoại đã được tài khoản khác sử dụng.'});
  if(email&&store.users.some((u)=>u.id!==req.user.id&&u.email===email))return res.status(409).json({ok:false,message:'Email đã được tài khoản khác sử dụng.'});
  req.user.phone=phone;req.user.email=email;saveStore();
  res.json({ok:true,message:'Đã cập nhật số điện thoại và email.',user:safeUser(req.user,true,req.user.id)});
});
app.post('/api/account/password', requireUser, async (req,res) => {
  const verification=await verifySensitiveAccountAction(req,req.user);
  if(!verification.ok)return res.status(verification.status).json({ok:false,message:verification.message});
  const password=String(req.body.newPassword??''),confirm=String(req.body.confirmPassword??'');
  if(password.length<8||password.length>72||!/[A-Za-zÀ-ỹ]/u.test(password)||!/[0-9]/.test(password))return res.status(400).json({ok:false,message:'Mật khẩu mới phải có 8–72 ký tự, gồm ít nhất một chữ và một số.'});
  if(password!==confirm)return res.status(400).json({ok:false,message:'Mật khẩu nhập lại không khớp.'});
  if(await bcrypt.compare(password,req.user.passwordHash))return res.status(409).json({ok:false,message:'Mật khẩu mới phải khác mật khẩu hiện tại.'});
  req.user.passwordHash=await bcrypt.hash(password,11);
  const oldSessions=req.user.sessions.filter((item)=>item.id!==req.sessionID);
  req.user.sessions=req.user.sessions.filter((item)=>item.id===req.sessionID);
  for(const item of oldSessions){disconnectSessionSockets(item.id);try{fs.rmSync(sessionFilePath(item.id),{force:true});}catch{}}
  saveStore({immediate:true});
  res.json({ok:true,message:'Đã đổi mật khẩu. Các thiết bị khác đã được đăng xuất.'});
  const sockets=await io.in(`user:${req.user.id}`).fetchSockets();for(const activeSocket of sockets){if(activeSocket.request.sessionID!==req.sessionID)activeSocket.disconnect(true);}
});
app.post('/api/account/security/level2', requireUser, async (req,res) => {
  const verification=await verifySensitiveAccountAction(req,req.user);
  if(!verification.ok)return res.status(verification.status).json({ok:false,message:verification.message});
  const enabled=Boolean(req.body.enabled);
  if(enabled){
    const password=String(req.body.newLevel2Password??'');
    if(password.length<6||password.length>72)return res.status(400).json({ok:false,message:'Mật khẩu cấp 2 phải có 6–72 ký tự.'});
    if(await bcrypt.compare(password,req.user.passwordHash))return res.status(409).json({ok:false,message:'Mật khẩu cấp 2 phải khác mật khẩu đăng nhập.'});
    req.user.security.level2PasswordHash=await bcrypt.hash(password,11);req.user.security.level2Enabled=true;
  }else{
    if(req.user.security.level2Enabled){const current=String(req.body.currentLevel2Password??'');if(!(await bcrypt.compare(current,req.user.security.level2PasswordHash)))return res.status(401).json({ok:false,message:'Mật khẩu cấp 2 hiện tại không đúng.'});}
    req.user.security.level2Enabled=false;req.user.security.level2PasswordHash='';
  }
  req.user.security.updatedAt=nowISO();saveStore({immediate:true});
  res.json({ok:true,message:enabled?'Đã bật bảo mật cấp 2. Lần đăng nhập sau sẽ cần mật khẩu cấp 2.':'Đã tắt bảo mật cấp 2.',security:safeUser(req.user,true,req.user.id).security});
});
app.post('/api/account/security/level3', requireUser, async (req,res) => {
  const verification=await verifySensitiveAccountAction(req,req.user,{requireLevel3:false});
  if(!verification.ok)return res.status(verification.status).json({ok:false,message:verification.message});
  const enabled=Boolean(req.body.enabled);
  if(req.user.security.level3Enabled){const currentPin=String(req.body.currentPin??'');if(!/^\d{6}$/.test(currentPin)||!(await bcrypt.compare(currentPin,req.user.security.level3PinHash)))return res.status(401).json({ok:false,message:'Mã cấp 3 hiện tại không đúng.'});}
  if(enabled){const pin=String(req.body.newPin??'');if(!/^\d{6}$/.test(pin))return res.status(400).json({ok:false,message:'Mã bảo mật cấp 3 phải gồm đúng 6 chữ số.'});req.user.security.level3PinHash=await bcrypt.hash(pin,11);req.user.security.level3Enabled=true;}
  else{req.user.security.level3Enabled=false;req.user.security.level3PinHash='';}
  req.user.security.updatedAt=nowISO();saveStore({immediate:true});
  res.json({ok:true,message:enabled?'Đã bật bảo mật cấp 3 cho các thay đổi nhạy cảm.':'Đã tắt bảo mật cấp 3.',security:safeUser(req.user,true,req.user.id).security});
});

app.post('/api/settings/interface-scale', requireUser, (req,res) => {
  const value=String(req.body?.interfaceScale??'auto');
  if (!['auto','0.85','0.95','1','1.1','1.2'].includes(value)) return res.status(400).json({ok:false,message:'Quy mô giao diện không hợp lệ.'});
  req.user.settings.interfaceScale=value;saveStore();res.json({ok:true,interfaceScale:value,message:'Đã lưu quy mô giao diện.'});
});

app.get('/api/profile/:userId', requireUser, (req,res) => {
  const target=getUser(req.params.userId); if (!target) return res.status(404).json({ok:false,message:'Không tìm thấy người dùng.'});
  if (!target.profile.isPublic && target.id!==req.user.id) return res.status(403).json({ok:false,message:'Người dùng này đã ẩn hồ sơ.'});
  const access=blockStateFor(req.user.id,target.id);
  res.json({ok:true,user:safeUser(target,false,req.user.id),relationship:{friend:isFriend(req.user.id,target.id),blocked:access.blocked,blockedByMe:access.blockedByMe,blockedByOther:access.blockedByOther,canMessage:privateConversationAllowed(req.user.id,target.id),canRequest:canStrangerRequest(req.user.id,target.id),canViewConversation:privateConversationViewable(req.user.id,target.id)}});
});
app.get('/api/sessions', requireUser, (req,res) => res.json({ok:true,sessions:req.user.sessions.map((s)=>({...s,current:s.id===req.sessionID}))}));
app.delete('/api/sessions/:sessionId', requireUser, async (req,res) => {
  const sessionId=cleanText(req.params.sessionId,160);
  if (!/^[A-Za-z0-9_-]{8,160}$/.test(sessionId)) return res.status(400).json({ok:false,message:'Mã phiên không hợp lệ.'});
  if (sessionId===req.sessionID) return res.status(400).json({ok:false,message:'Hãy dùng nút đăng xuất để kết thúc phiên hiện tại.'});
  req.user.sessions=req.user.sessions.filter((s)=>s.id!==sessionId);
  disconnectSessionSockets(sessionId);
  try { fs.rmSync(sessionFilePath(sessionId),{force:true}); } catch {}
  saveStore();
  const sockets=await io.in(`user:${req.user.id}`).fetchSockets();
  for(const activeSocket of sockets){ if(activeSocket.request.sessionID===sessionId) activeSocket.disconnect(true); }
  res.json({ok:true,message:'Đã đăng xuất thiết bị.'});
});

app.post('/api/friends/request', requireUser, (req,res) => {
  const target=getUserByUsername(req.body.username); if (!target) return res.status(404).json({ok:false,message:'Không tìm thấy người dùng.'});
  if (target.id===req.user.id) return res.status(400).json({ok:false,message:'Bạn không thể kết bạn với chính mình.'});
  if (isBlockedBetween(req.user.id,target.id)) return res.status(403).json({ok:false,message:'Không thể gửi lời mời do trạng thái chặn.'});
  if (isFriend(req.user.id,target.id)) return res.status(409).json({ok:false,message:'Hai người đã là bạn bè.'});
  const existing=store.friendRequests.find((r)=>r.status==='pending'&&pairKey(r.fromId,r.toId)===pairKey(req.user.id,target.id)); if (existing) return res.status(409).json({ok:false,message:'Đã có lời mời kết bạn đang chờ xử lý.'});
  const request={id:id('frq'),fromId:req.user.id,toId:target.id,status:'pending',createdAt:nowISO()}; store.friendRequests.push(request); saveStore();
  io.to(`user:${target.id}`).emit('friend:updated',{message:`${req.user.nickname} đã gửi lời mời kết bạn.`});
  setImmediate(()=>sendPushToUser(target,{title:'Lời mời kết bạn mới',body:target.notificationSettings.showPreview===false?'Bạn có một lời mời kết bạn mới.':`${req.user.nickname} đã gửi lời mời kết bạn.`,tag:'friend-request',url:'/chat?scope=requests'},{ttl:86400}));
  res.status(201).json({ok:true,message:'Đã gửi lời mời kết bạn.'});
});
app.post('/api/friends/respond', requireUser, (req,res) => {
  const r=store.friendRequests.find((x)=>x.id===req.body.requestId&&x.toId===req.user.id&&x.status==='pending'); if (!r) return res.status(404).json({ok:false,message:'Lời mời không tồn tại.'});
  r.status=req.body.action==='accept'?'accepted':'declined'; r.respondedAt=nowISO();
  if (r.status==='accepted') {
    if (!req.user.acceptedMessageUserIds.includes(r.fromId)) req.user.acceptedMessageUserIds.push(r.fromId);
    const other=getUser(r.fromId);
    if (other&&!other.acceptedMessageUserIds.includes(req.user.id)) other.acceptedMessageUserIds.push(req.user.id);
  }
  saveStore(); io.to(`user:${r.fromId}`).to(`user:${r.toId}`).emit('friend:updated',{message:r.status==='accepted'?'Lời mời kết bạn đã được chấp nhận.':'Lời mời kết bạn đã bị từ chối.'}); res.json({ok:true,message:r.status==='accepted'?'Đã đồng ý kết bạn.':'Đã từ chối lời mời.'});
});
app.post('/api/friends/block', requireUser, (req,res) => {
  const target=getUser(req.body.userId);
  if (!target) return res.status(404).json({ok:false,message:'Không tìm thấy người dùng.'});
  if (target.id===req.user.id) return res.status(400).json({ok:false,message:'Bạn không thể chặn chính mình.'});
  if (!req.user.blockedUserIds.includes(target.id)) req.user.blockedUserIds.push(target.id);
  saveStore();
  const actorState=blockStateFor(req.user.id,target.id), targetState=blockStateFor(target.id,req.user.id);
  io.to(`user:${req.user.id}`).emit('conversation:access',{userId:target.id,...actorState,message:`Bạn đã chặn ${target.nickname}.`});
  io.to(`user:${target.id}`).emit('conversation:access',{userId:req.user.id,...targetState,message:'Hiện không thể liên lạc với người này.'});
  io.to(`user:${req.user.id}`).to(`user:${target.id}`).emit('chat:typing',{scope:'private',userId:req.user.id,isTyping:false});
  res.json({ok:true,message:`Đã chặn ${target.username}.`,conversationState:actorState});
});
app.post('/api/friends/unblock', requireUser, (req,res) => {
  const target=getUser(req.body.userId);
  if (!target) return res.status(404).json({ok:false,message:'Không tìm thấy người dùng.'});
  req.user.blockedUserIds=req.user.blockedUserIds.filter((id)=>id!==target.id);
  saveStore();
  const actorState=blockStateFor(req.user.id,target.id), targetState=blockStateFor(target.id,req.user.id);
  io.to(`user:${req.user.id}`).emit('conversation:access',{userId:target.id,...actorState,message:actorState.blocked?'Người này vẫn chưa thể liên lạc với bạn.':`Đã bỏ chặn ${target.nickname}.`});
  io.to(`user:${target.id}`).emit('conversation:access',{userId:req.user.id,...targetState,message:targetState.blocked?'Hiện vẫn không thể liên lạc với người này.':'Hai người có thể liên lạc lại.'});
  res.json({ok:true,message:actorState.blocked?'Đã bỏ chặn ở phía bạn, nhưng cuộc trò chuyện vẫn bị hạn chế.':`Đã bỏ chặn ${target.username}.`,conversationState:actorState});
});
app.post('/api/friends/archive', requireUser, (req,res) => { const target=getUser(req.body.userId); if (!target) return res.status(404).json({ok:false,message:'Không tìm thấy người dùng.'}); const archive=req.body.archive!==false; if (archive&&!req.user.archivedUserIds.includes(target.id)) req.user.archivedUserIds.push(target.id); if (!archive) req.user.archivedUserIds=req.user.archivedUserIds.filter((id)=>id!==target.id); saveStore(); res.json({ok:true,message:archive?'Đã lưu trữ cuộc trò chuyện.':'Đã bỏ lưu trữ cuộc trò chuyện.'}); });
app.post('/api/conversations/alias', requireUser, (req,res) => { const target=getUser(req.body.userId); if (!target) return res.status(404).json({ok:false,message:'Không tìm thấy người dùng.'}); const alias=cleanText(req.body.alias,30); if (alias) req.user.aliases[target.id]=alias; else delete req.user.aliases[target.id]; saveStore(); res.json({ok:true,message:'Đã cập nhật biệt danh riêng.'}); });
app.post('/api/conversations/mute', requireUser, (req,res) => {
  const key=cleanText(req.body.key,100);
  if (!key) return res.status(400).json({ok:false,message:'Cuộc trò chuyện không hợp lệ.'});
  if (req.body.unmute) delete req.user.mutes[key];
  else {
    const permanent=req.body.minutes===null;
    const minutes=permanent?null:Number(req.body.minutes);
    if (!permanent && (!Number.isFinite(minutes) || minutes < 1 || minutes > 525600)) return res.status(400).json({ok:false,message:'Thời gian tắt thông báo phải từ 1 phút đến 1 năm.'});
    req.user.mutes[key]=permanent?null:Date.now()+Math.floor(minutes)*60000;
  }
  saveStore();
  res.json({ok:true,message:req.body.unmute?'Đã bật lại thông báo.':'Đã tắt thông báo.'});
});
app.post('/api/conversations/pin', requireUser, (req,res) => { const key=cleanText(req.body.key,100), pin=req.body.pin!==false; if (pin&&!req.user.pinnedConversations.includes(key)) { if (req.user.pinnedConversations.length>=5) return res.status(409).json({ok:false,message:'Chỉ được ghim tối đa 5 đoạn chat.'}); req.user.pinnedConversations.push(key); } if (!pin) req.user.pinnedConversations=req.user.pinnedConversations.filter((k)=>k!==key); saveStore(); res.json({ok:true,message:pin?'Đã ghim đoạn chat.':'Đã bỏ ghim đoạn chat.'}); });
app.post('/api/conversations/mark-unread', requireUser, (req,res) => {
  const scope=cleanText(req.body.scope,20), targetId=cleanText(req.body.targetId,80);
  const messages=store.messages.filter((m)=>{
    if (scope==='group') return m.scope==='group'&&m.groupId===targetId;
    return ['private','request'].includes(m.scope)&&[m.fromId,m.toId].includes(req.user.id)&&[m.fromId,m.toId].includes(targetId);
  });
  const last=[...messages].reverse().find((m)=>m.fromId!==req.user.id&&!m.deletedFor.includes(req.user.id));
  if (last) last.readBy=last.readBy.filter((id)=>id!==req.user.id);
  saveStore();
  res.json({ok:true,message:last?'Đã đánh dấu chưa đọc.':'Chưa có tin nhắn để đánh dấu.'});
});
app.post('/api/message-requests/:userId/respond', requireUser, (req,res) => {
  const target=getUser(req.params.userId); if (!target) return res.status(404).json({ok:false,message:'Không tìm thấy người dùng.'});
  const pending=store.messages.filter((m)=>m.scope==='request'&&m.fromId===target.id&&m.toId===req.user.id&&!m.deletedFor.includes(req.user.id));
  if (!pending.length) return res.status(404).json({ok:false,message:'Không có tin nhắn chờ từ người dùng này.'});
  if (req.body.action==='accept') {
    if (!req.user.acceptedMessageUserIds.includes(target.id)) req.user.acceptedMessageUserIds.push(target.id);
    if (!target.acceptedMessageUserIds.includes(req.user.id)) target.acceptedMessageUserIds.push(req.user.id);
    for (const m of store.messages) if (m.scope==='request'&&pairKey(m.fromId,m.toId)===pairKey(req.user.id,target.id)) m.scope='private';
    saveStore(); io.to(`user:${target.id}`).emit('message-request:accepted',{userId:req.user.id});
    return res.json({ok:true,message:'Đã chấp nhận tin nhắn chờ.'});
  }
  for (const m of pending) if (!m.deletedFor.includes(req.user.id)) m.deletedFor.push(req.user.id);
  saveStore(); res.json({ok:true,message:'Đã xóa tin nhắn chờ.'});
});

function filteredMessagesForUser(userId, predicate, limit=250) { return store.messages.filter((m)=>predicate(m)&&!m.deletedFor.includes(userId)).slice(-limit); }
app.get('/api/messages/world', requireUser, (req,res) => res.json({ok:true,messages:clientMessages(filteredMessagesForUser(req.user.id,(m)=>m.scope==='world',180))}));
app.get('/api/messages/private/:userId', requireUser, (req,res) => {
  const targetId=req.params.userId, target=getUser(targetId);
  if (!target||!privateConversationViewable(req.user.id,targetId)) return res.status(403).json({ok:false,message:'Bạn chưa được phép xem cuộc trò chuyện này.'});
  const messages=filteredMessagesForUser(req.user.id,(m)=>['private','request'].includes(m.scope)&&pairKey(m.fromId,m.toId)===pairKey(req.user.id,targetId),350);
  const conversationState={...blockStateFor(req.user.id,targetId),canSend:privateConversationAllowed(req.user.id,targetId)};
  {
    const { receiptIds }=markMessagesRead(messages.filter((m)=>m.toId===req.user.id),req.user.id,req.user.settings.showReadReceipts);
    if (receiptIds.length) io.to(`user:${targetId}`).emit('chat:read',{scope:'private',readerId:req.user.id,messageIds:receiptIds});
  }
  res.json({ok:true,messages:clientMessages(messages),pendingDelete:pendingConversationDelete(req.user.id,'private',targetId),conversationState});
});
app.get('/api/messages/request/:userId', requireUser, (req,res) => { const targetId=req.params.userId; const messages=filteredMessagesForUser(req.user.id,(m)=>m.scope==='request'&&pairKey(m.fromId,m.toId)===pairKey(req.user.id,targetId),200); res.json({ok:true,messages:clientMessages(messages)}); });
app.get('/api/messages/group/:groupId', requireUser, (req,res) => {
  const g=getGroup(req.params.groupId);
  if (!g||!g.memberIds.includes(req.user.id)) return res.status(403).json({ok:false,message:'Bạn không thuộc nhóm này.'});
  const messages=filteredMessagesForUser(req.user.id,(m)=>m.scope==='group'&&m.groupId===g.id,400);
  const { receiptIds }=markMessagesRead(messages.filter((m)=>m.fromId!==req.user.id),req.user.id,req.user.settings.showReadReceipts);
  if (receiptIds.length) io.to(`group:${g.id}`).emit('chat:read',{scope:'group',readerId:req.user.id,messageIds:receiptIds});
  res.json({ok:true,messages:clientMessages(messages),group:g,pendingDelete:pendingConversationDelete(req.user.id,'group',g.id)});
});
app.get('/api/messages/support', requireSupportAccess, (req,res) => {
  const auth=getAuth(req);
  const recovery=auth.role==='recovery';
  const recoveryStartedAt=Number(auth.recoveryStartedAt || Date.now());
  const messages=filteredMessagesForUser(req.user.id,(m)=>m.scope==='support'&&m.supportUserId===req.user.id&&(!recovery||new Date(m.createdAt).getTime()>=recoveryStartedAt),250);
  const { receiptIds }=markMessagesRead(messages.filter((m)=>m.senderRole==='admin'),req.user.id,true);
  if (receiptIds.length) io.to('admin').emit('chat:read',{scope:'support',readerId:req.user.id,supportUserId:req.user.id,messageIds:receiptIds});
  const recoveryType=recovery ? (auth.recoveryType === 'username' ? 'username' : 'password') : null;
  const user=recovery
    ? { id:req.user.id, username:req.user.username, nickname:req.user.nickname||req.user.username, phone:req.user.phone, profile:{avatarUrl:''} }
    : safeUser(req.user,true,req.user.id);
  res.json({ok:true,messages:clientMessages(messages),user,recovery,recoveryType,supportMessaging:supportMessagingPayload(req.user)});
});
app.get('/api/media/:scope/:targetId', requireUser, (req,res) => {
  const scope=req.params.scope,targetId=req.params.targetId;
  if (scope==='private' && !privateConversationViewable(req.user.id,targetId)) return res.status(403).json({ok:false,message:'Bạn không có quyền xem kho tệp này.'});
  if (scope==='group') { const group=getGroup(targetId); if (!group?.memberIds.includes(req.user.id)) return res.status(403).json({ok:false,message:'Bạn không thuộc nhóm này.'}); }
  if (!['private','group','world'].includes(scope)) return res.status(400).json({ok:false,message:'Loại cuộc trò chuyện không hợp lệ.'});
  const messages=store.messages.filter((m)=>!m.deletedFor.includes(req.user.id)&&m.attachment&&((scope==='private'&&['private','request'].includes(m.scope)&&pairKey(m.fromId,m.toId)===pairKey(req.user.id,targetId))||(scope==='group'&&m.scope==='group'&&m.groupId===targetId)||(scope==='world'&&m.scope==='world'))).slice(-300);
  res.json({ok:true,items:messages.map((m)=>({messageId:m.id,attachment:m.attachment,createdAt:m.createdAt,senderName:m.senderName}))});
});

app.post('/api/upload', requireUploadAccess, rateLimit('upload', 60 * 1000, 30), upload.single('file'), verifyUpload, enforceUploadQuota, (req,res) => {
  if (!req.file) return res.status(400).json({ok:false,message:'Chưa chọn tệp.'}); const auth=getAuth(req);
  const record={id:id('upl'),ownerRole:auth.role,ownerId:auth.role==='admin'?'admin':auth.userId,originalName:safeDownloadName(req.file.originalname),fileName:req.file.filename,mime:req.file.mimetype||'application/octet-stream',size:req.file.size,kind:allowedMime.get(req.file.mimetype)||'file',createdAt:nowISO()};
  store.uploads.push(record); saveStore(); res.status(201).json({ok:true,attachment:{id:record.id,name:record.originalName,mime:record.mime,size:record.size,kind:record.kind,url:`/uploads/${encodeURIComponent(record.fileName)}`}});
});

function findEditableMessage(req) { const auth=getAuth(req); const m=store.messages.find((item)=>item.id===req.params.messageId&&messageVisibleTo(item,auth)); if (!m) return null; const owner=auth.role==='admin'?'admin':auth.userId; return m.fromId===owner?m:null; }
app.patch('/api/messages/:messageId', requireUser, (req,res) => { const m=findEditableMessage(req); if (!m||m.recalledAt) return res.status(404).json({ok:false,message:'Không thể chỉnh sửa tin nhắn.'}); const text=cleanText(req.body.text,MAX_MESSAGE_LENGTH); if (!text) return res.status(400).json({ok:false,message:'Tin nhắn không được để trống.'}); m.text=text;m.editedAt=nowISO();saveStore();emitMessageUpdate(m);res.json({ok:true,message:clientMessage(m)}); });
app.post('/api/messages/:messageId/recall', requireUser, (req,res) => { const m=findEditableMessage(req); if (!m) return res.status(404).json({ok:false,message:'Không thể thu hồi tin nhắn.'}); m.text='';m.attachment=null;m.special=null;m.recalledAt=nowISO();saveStore();emitMessageUpdate(m);res.json({ok:true,message:clientMessage(m)}); });
app.delete('/api/messages/:messageId', requireUser, (req,res) => { const m=store.messages.find((m)=>m.id===req.params.messageId&&messageVisibleTo(m,getAuth(req))); if (!m) return res.status(404).json({ok:false,message:'Không tìm thấy tin nhắn.'}); if (!m.deletedFor.includes(req.user.id)) m.deletedFor.push(req.user.id); saveStore(); io.to(`user:${req.user.id}`).emit('chat:message:deleted',{messageId:m.id}); res.json({ok:true,message:'Đã xóa tin nhắn ở phía bạn.'}); });
app.post('/api/messages/:messageId/pin', requireUser, (req,res) => { const m=store.messages.find((m)=>m.id===req.params.messageId&&messageVisibleTo(m,getAuth(req))); if (!m) return res.status(404).json({ok:false,message:'Không tìm thấy tin nhắn.'}); const pin=req.body.pin!==false; if (pin&&!m.pinnedBy.includes(req.user.id)) m.pinnedBy.push(req.user.id); if (!pin) m.pinnedBy=m.pinnedBy.filter((id)=>id!==req.user.id); saveStore(); res.json({ok:true,message:pin?'Đã ghim tin nhắn.':'Đã bỏ ghim tin nhắn.',item:clientMessage(m)}); });
app.post('/api/messages/:messageId/save', requireUser, (req,res) => { const m=store.messages.find((m)=>m.id===req.params.messageId&&messageVisibleTo(m,getAuth(req))); if (!m) return res.status(404).json({ok:false,message:'Không tìm thấy tin nhắn.'}); const save=req.body.save!==false; if (save&&!req.user.savedMessageIds.includes(m.id)) req.user.savedMessageIds.push(m.id); if (!save) req.user.savedMessageIds=req.user.savedMessageIds.filter((id)=>id!==m.id); saveStore(); res.json({ok:true,message:save?'Đã lưu tin nhắn.':'Đã bỏ lưu tin nhắn.'}); });
app.post('/api/messages/:messageId/react', requireUser, (req,res) => { const m=store.messages.find((m)=>m.id===req.params.messageId&&messageVisibleTo(m,getAuth(req))); if (!m) return res.status(404).json({ok:false,message:'Không tìm thấy tin nhắn.'}); const emoji=cleanText(req.body.emoji,8); if (!emoji) return res.status(400).json({ok:false,message:'Biểu tượng không hợp lệ.'}); for (const key of Object.keys(m.reactions)) m.reactions[key]=m.reactions[key].filter((id)=>id!==req.user.id); m.reactions[emoji]=m.reactions[emoji]||[]; if (req.body.remove!==true) m.reactions[emoji].push(req.user.id); for (const key of Object.keys(m.reactions)) if (!m.reactions[key].length) delete m.reactions[key]; saveStore(); emitMessageUpdate(m,'chat:reaction'); res.json({ok:true,message:clientMessage(m)}); });
app.get('/api/messages/saved/all', requireUser, (req,res) => {
  const auth=getAuth(req);
  const messages=req.user.savedMessageIds
    .map((messageId)=>store.messages.find((m)=>m.id===messageId))
    .filter((m)=>m&&messageVisibleTo(m,auth)&&!m.deletedFor.includes(req.user.id));
  res.json({ok:true,messages:clientMessages(messages)});
});

app.post('/api/conversations/delete', requireUser, (req,res) => {
  const scope=req.body.scope==='group'?'group':'private', targetId=cleanText(req.body.targetId,80); if (!targetId) return res.status(400).json({ok:false,message:'Cuộc trò chuyện không hợp lệ.'});
  let d=pendingConversationDelete(req.user.id,scope,targetId);
  if (d || req.body.immediate) {
    for (const m of store.messages) { const match=scope==='group'?m.scope==='group'&&m.groupId===targetId:['private','request'].includes(m.scope)&&pairKey(m.fromId,m.toId)===pairKey(req.user.id,targetId); if (match&&!m.deletedFor.includes(req.user.id)) m.deletedFor.push(req.user.id); }
    store.conversationDeletes=store.conversationDeletes.filter((x)=>!(x.userId===req.user.id&&x.scope===scope&&x.targetId===targetId)); saveStore(); return res.json({ok:true,permanent:true,message:'Đã xóa vĩnh viễn đoạn chat.'});
  }
  d={id:id('del'),userId:req.user.id,scope,targetId,createdAt:nowISO(),deleteAfter:Date.now()+15*60*1000}; store.conversationDeletes.push(d); saveStore(); res.json({ok:true,pending:d,message:'Đoạn chat sẽ bị xóa sau 15 phút. Bạn có thể khôi phục trong thời gian này.'});
});
app.post('/api/conversations/delete/undo', requireUser, (req,res) => { const scope=req.body.scope==='group'?'group':'private',targetId=cleanText(req.body.targetId,80); const before=store.conversationDeletes.length; store.conversationDeletes=store.conversationDeletes.filter((d)=>!(d.userId===req.user.id&&d.scope===scope&&d.targetId===targetId)); if (before===store.conversationDeletes.length) return res.status(404).json({ok:false,message:'Không có thao tác xóa đang chờ.'}); saveStore(); res.json({ok:true,message:'Đã khôi phục đoạn chat.'}); });

app.post('/api/groups', requireUser, (req,res) => {
  const name=cleanText(req.body.name,50); if (name.length<2) return res.status(400).json({ok:false,message:'Tên nhóm phải có ít nhất 2 ký tự.'});
  const requested=Array.isArray(req.body.memberIds)?req.body.memberIds:[]; const memberIds=[...new Set([req.user.id,...requested.filter((id)=>getUser(id)&&isFriend(req.user.id,id)&&!isBlockedBetween(req.user.id,id))])].slice(0,100);
  const group={id:id('grp'),name,avatarUrl:'',creatorId:req.user.id,adminIds:[req.user.id],memberIds,createdAt:nowISO()}; store.groups.push(group);saveStore(); for(const uid of memberIds) { joinUserToGroupRoom(uid,group.id); io.to(`user:${uid}`).emit('group:updated',{groupId:group.id}); } res.status(201).json({ok:true,group,message:'Đã tạo nhóm chat.'});
});
app.patch('/api/groups/:groupId', requireUser, (req,res) => {
  const g=getGroup(req.params.groupId); if (!g||!g.adminIds.includes(req.user.id)) return res.status(403).json({ok:false,message:'Bạn không có quyền quản trị nhóm.'});
  if (Object.prototype.hasOwnProperty.call(req.body,'name')) { const name=cleanText(req.body.name,50); if (name.length<2) return res.status(400).json({ok:false,message:'Tên nhóm phải có ít nhất 2 ký tự.'}); g.name=name; }
  if (Object.prototype.hasOwnProperty.call(req.body,'avatarUrl')) { if (!req.body.avatarUrl) g.avatarUrl=''; else { const image=ownedImageUpload(req.user,req.body.avatarUrl); if (!image) return res.status(400).json({ok:false,message:'Ảnh nhóm không hợp lệ.'}); g.avatarUrl=uploadUrl(image); } }
  saveStore(); io.to(`group:${g.id}`).emit('group:updated',{group:g}); res.json({ok:true,group:g});
});
app.post('/api/groups/:groupId/members', requireUser, (req,res) => {
  const g=getGroup(req.params.groupId); if (!g||!g.adminIds.includes(req.user.id)) return res.status(403).json({ok:false,message:'Bạn không có quyền quản trị nhóm.'});
  const target=getUser(req.body.userId); if (!target||!isFriend(req.user.id,target.id)||isBlockedBetween(req.user.id,target.id)) return res.status(400).json({ok:false,message:'Chỉ có thể thêm bạn bè không bị chặn vào nhóm.'});
  if (!g.memberIds.includes(target.id) && g.memberIds.length>=100) return res.status(409).json({ok:false,message:'Nhóm đã đạt giới hạn 100 thành viên.'});
  if (!g.memberIds.includes(target.id)) g.memberIds.push(target.id); saveStore(); joinUserToGroupRoom(target.id,g.id); io.to(`user:${target.id}`).emit('group:updated',{groupId:g.id}); res.json({ok:true,message:'Đã thêm thành viên.'});
});
app.post('/api/groups/:groupId/admins', requireUser, (req,res) => { const g=getGroup(req.params.groupId); if (!g||g.creatorId!==req.user.id) return res.status(403).json({ok:false,message:'Chỉ người tạo nhóm có quyền này.'}); const uid=cleanText(req.body.userId,80); if (!g.memberIds.includes(uid)) return res.status(400).json({ok:false,message:'Người dùng không thuộc nhóm.'}); if (req.body.promote!==false&&!g.adminIds.includes(uid)) g.adminIds.push(uid); if (req.body.promote===false&&uid!==g.creatorId) g.adminIds=g.adminIds.filter((id)=>id!==uid); saveStore(); io.to(`group:${g.id}`).emit('group:updated',{group:g}); res.json({ok:true,message:req.body.promote===false?'Đã gỡ quyền quản trị viên.':'Đã bổ nhiệm quản trị viên.'}); });
app.delete('/api/groups/:groupId/members/:userId', requireUser, (req,res) => { const g=getGroup(req.params.groupId); if (!g) return res.status(404).json({ok:false,message:'Không tìm thấy nhóm.'}); const targetId=req.params.userId; if (targetId!==req.user.id&&!g.adminIds.includes(req.user.id)) return res.status(403).json({ok:false,message:'Không có quyền xóa thành viên.'}); if (targetId===g.creatorId) return res.status(400).json({ok:false,message:'Người tạo nhóm không thể rời nhóm.'}); g.memberIds=g.memberIds.filter((id)=>id!==targetId);g.adminIds=g.adminIds.filter((id)=>id!==targetId);saveStore();leaveUserFromGroupRoom(targetId,g.id);io.to(`group:${g.id}`).emit('group:updated',{group:g});res.json({ok:true,message:'Đã cập nhật thành viên nhóm.'}); });

app.get('/api/search', requireUser, (req,res) => {
  const q=cleanText(req.query.q,80).toLowerCase(); if (!q) return res.json({ok:true,users:[],messages:[],groups:[],history:req.user.searchHistory});
  req.user.searchHistory=[q,...req.user.searchHistory.filter((x)=>x!==q)].slice(0,20);saveStore();
  const users=store.users.filter((u)=>u.id!==req.user.id&&[u.username,u.nickname].some((v)=>String(v).toLowerCase().includes(q))).slice(0,20).map((u)=>safeUser(u,false,req.user.id));
  const groups=store.groups.filter((g)=>g.memberIds.includes(req.user.id)&&g.name.toLowerCase().includes(q)).slice(0,20);
  const messages=store.messages.filter((m)=>messageVisibleTo(m,getAuth(req))&&!m.recalledAt&&(m.text||'').toLowerCase().includes(q)).slice(-50);
  res.json({ok:true,users,groups,messages:clientMessages(messages),history:req.user.searchHistory});
});
app.delete('/api/search/history', requireUser, (req,res) => { req.user.searchHistory=[];saveStore();res.json({ok:true}); });

app.get('/api/notifications/vapid-public-key', requireUser, (_req,res) => {
  res.json({ok:true,publicKey:VAPID_KEYS.publicKey || ''});
});
app.get('/api/notifications/settings', requireUser, (req,res) => {
  res.json({ok:true,settings:req.user.notificationSettings,subscribed:req.user.pushSubscriptions.length>0});
});
app.put('/api/notifications/settings', requireUser, (req,res) => {
  const current=req.user.notificationSettings;
  const quiet=req.body.quietHours&&typeof req.body.quietHours==='object'?req.body.quietHours:{};
  const start=/^([01]\d|2[0-3]):[0-5]\d$/.test(quiet.start||'')?quiet.start:current.quietHours.start;
  const end=/^([01]\d|2[0-3]):[0-5]\d$/.test(quiet.end||'')?quiet.end:current.quietHours.end;
  let globalMutedUntil=0,globalMutePermanent=false;
  if(req.body.globalMute==='permanent'){globalMutedUntil=null;globalMutePermanent=true;}
  else{
    const minutes=Math.floor(Number(req.body.globalMuteMinutes)||0);
    if(minutes<0||minutes>525600)return res.status(400).json({ok:false,message:'Thời gian tắt thông báo không hợp lệ.'});
    globalMutedUntil=minutes>0?Date.now()+minutes*60000:0;
  }
  req.user.notificationSettings={
    enabled:req.body.enabled!==false,
    pushEnabled:Boolean(req.body.pushEnabled),
    showPreview:req.body.showPreview!==false,
    soundEnabled:req.body.soundEnabled!==false,
    globalMutedUntil,globalMutePermanent,
    timezoneOffset:Math.max(-840,Math.min(840,Math.floor(Number(req.body.timezoneOffset)||0))),
    quietHours:{enabled:Boolean(quiet.enabled),start,end},
  };
  saveStore();
  res.json({ok:true,settings:req.user.notificationSettings,subscribed:req.user.pushSubscriptions.length>0,message:'Đã lưu cài đặt thông báo.'});
});
app.post('/api/notifications/subscribe', requireUser, (req,res) => {
  const subscription=req.body.subscription;
  if(!subscription||typeof subscription.endpoint!=='string'||!subscription.keys?.p256dh||!subscription.keys?.auth)return res.status(400).json({ok:false,message:'Dữ liệu đăng ký thông báo không hợp lệ.'});
  req.user.pushSubscriptions=req.user.pushSubscriptions.filter((item)=>item.endpoint!==subscription.endpoint);
  req.user.pushSubscriptions.push({endpoint:cleanText(subscription.endpoint,2000),expirationTime:subscription.expirationTime||null,keys:{p256dh:cleanText(subscription.keys.p256dh,512),auth:cleanText(subscription.keys.auth,256)}});
  req.user.pushSubscriptions=req.user.pushSubscriptions.slice(-8);
  req.user.notificationSettings.pushEnabled=true;
  saveStore();
  res.json({ok:true,settings:req.user.notificationSettings,subscribed:true,message:'Đã bật thông báo nền trên thiết bị này.'});
});
app.post('/api/notifications/unsubscribe', requireUser, (req,res) => {
  const endpoint=cleanText(req.body.endpoint,2000);
  if(endpoint)req.user.pushSubscriptions=req.user.pushSubscriptions.filter((item)=>item.endpoint!==endpoint);
  else req.user.pushSubscriptions=[];
  if(!req.user.pushSubscriptions.length)req.user.notificationSettings.pushEnabled=false;
  saveStore();
  res.json({ok:true,settings:req.user.notificationSettings,subscribed:req.user.pushSubscriptions.length>0,message:'Đã tắt thông báo nền trên thiết bị này.'});
});

app.post('/api/reports', requireUser, rateLimit('reports', 15*60*1000, 20), (req,res) => {
  const scope=req.body.scope==='message'?'message':'user';
  const reason=REPORT_REASONS.includes(req.body.reason)?req.body.reason:'';
  if(!reason)return res.status(400).json({ok:false,message:'Vui lòng chọn lý do tố cáo.'});
  const details=cleanText(req.body.details,500);
  let message=null,target=null;
  if(scope==='message'){
    const messageId=cleanText(req.body.messageId,120);
    message=store.messages.find((item)=>item.id===messageId&&item.scope==='world'&&!item.recalledAt);
    if(!message)return res.status(404).json({ok:false,message:'Không tìm thấy tin nhắn thế giới để tố cáo.'});
    if(message.fromId===req.user.id)return res.status(400).json({ok:false,message:'Bạn không thể tố cáo tin nhắn của chính mình.'});
    target=getUser(message.fromId);
  }else{
    target=getUser(cleanText(req.body.userId,100));
    if(target?.id===req.user.id)return res.status(400).json({ok:false,message:'Bạn không thể tố cáo chính mình.'});
  }
  if(!target)return res.status(404).json({ok:false,message:'Không tìm thấy người dùng cần tố cáo.'});
  const now=Date.now();
  const duplicate=store.reports.find((item)=>item.reporterId===req.user.id&&item.reportedUserId===target.id&&item.scope===scope&&(scope!=='message'||item.messageId===message.id)&&now-new Date(item.createdAt).getTime()<REPORT_DEDUP_WINDOW_MS);
  if(duplicate)return res.status(409).json({ok:false,code:'REPORT_DUPLICATE',message:'Tố cáo này đã được gửi. Admin đang có thông tin để kiểm tra.',report:reportUserPayload(duplicate)});
  const evidenceText=message?.text||'';
  const risk=buildReportRisk(target.id,reason,evidenceText);
  const report=normalizeStoredReport({
    id:id('rpt'),scope,reporterId:req.user.id,reportedUserId:target.id,messageId:message?.id||'',reason,details,status:'pending',
    riskScore:risk.riskScore,signals:risk.signals,evidence:message?{text:message.text||'',senderName:message.senderName||target.nickname,createdAt:message.createdAt,scope:message.scope,attachmentKind:message.attachment?.kind||''}:{senderName:target.nickname,scope:'profile'},createdAt:nowISO(),updatedAt:nowISO(),
  });
  store.reports.push(report);saveStore({immediate:true});
  const payload=reportAdminPayload(report);io.to('admin').emit('admin:report:new',payload);
  res.status(201).json({ok:true,report:reportUserPayload(report),priority:report.riskScore>=70?'high':report.riskScore>=40?'medium':'normal',message:'Đã gửi tố cáo riêng tới Admin. Admin sẽ kiểm tra trước khi quyết định hành động.'});
});
app.get('/api/reports/mine', requireUser, (req,res) => {
  const items=store.reports.filter((item)=>item.reporterId===req.user.id).slice(-50).reverse().map(reportUserPayload);
  res.json({ok:true,reports:items});
});
app.get('/api/admin/reports', requireAdmin, (req,res) => {
  const status=REPORT_STATUSES.includes(req.query.status)?req.query.status:'all';
  const limit=Math.max(1,Math.min(200,Math.floor(Number(req.query.limit)||100)));
  let items=[...store.reports];if(status!=='all')items=items.filter((item)=>item.status===status);
  items.sort((a,b)=>{const pendingA=a.status==='pending'?1:0,pendingB=b.status==='pending'?1:0;if(pendingA!==pendingB)return pendingB-pendingA;if(a.riskScore!==b.riskScore)return b.riskScore-a.riskScore;return new Date(b.createdAt)-new Date(a.createdAt);});
  const counts=REPORT_STATUSES.reduce((acc,key)=>({...acc,[key]:store.reports.filter((item)=>item.status===key).length}),{});
  res.json({ok:true,reports:items.slice(0,limit).map(reportAdminPayload),counts,total:store.reports.length});
});
app.patch('/api/admin/reports/:reportId', requireAdmin, async (req,res) => {
  const report=store.reports.find((item)=>item.id===req.params.reportId);if(!report)return res.status(404).json({ok:false,message:'Không tìm thấy tố cáo.'});
  const action=REPORT_ACTIONS.includes(req.body.action)?req.body.action:'none';
  const requestedStatus=REPORT_STATUSES.includes(req.body.status)?req.body.status:null;
  const note=cleanText(req.body.adminNote,500);
  const target=getUser(report.reportedUserId);const reporter=getUser(report.reporterId);
  let actionDetail='';let restriction=null;
  if(action==='warn'){
    if(!target)return res.status(404).json({ok:false,message:'Tài khoản bị tố cáo không còn tồn tại.'});
    const notice={id:id('notice'),type:'warning',title:'Cảnh báo từ quản trị viên',message:note||`Admin đã xem xét một tố cáo liên quan đến ${reportReasonLabel(report.reason).toLowerCase()}.`,createdAt:nowISO()};
    target.moderationNotices.push(notice);actionDetail='Đã gửi cảnh báo riêng tới người dùng.';
    pushModerationNotice(target,notice.title,notice.message,'/chat');
  }else if(action==='world_mute'){
    if(!target)return res.status(404).json({ok:false,message:'Tài khoản bị tố cáo không còn tồn tại.'});
    const permanent=req.body.permanent===true||req.body.minutes===null;
    const minutes=permanent?null:Math.floor(Number(req.body.minutes)||60);
    if(!permanent&&(minutes<1||minutes>525600))return res.status(400).json({ok:false,message:'Thời hạn hạn chế chat thế giới không hợp lệ.'});
    target.worldMessaging={mutedUntil:permanent?null:Date.now()+minutes*60000,reason:note||`Hạn chế sau khi Admin điều tra tố cáo: ${reportReasonLabel(report.reason)}.`,updatedAt:nowISO()};
    actionDetail=permanent?'Đã tắt quyền gửi chat thế giới vĩnh viễn.':`Đã tắt quyền gửi chat thế giới ${minutes} phút.`;
    pushModerationNotice(target,'Quyền gửi chat thế giới bị hạn chế',target.worldMessaging.reason,'/chat?scope=world');
    io.to(`user:${target.id}`).emit('world:moderation',worldMessagingPayload(target));
  }else if(action==='lock'||action==='ban'){
    if(!target)return res.status(404).json({ok:false,message:'Tài khoản bị tố cáo không còn tồn tại.'});
    const permanent=req.body.permanent===true||req.body.minutes===null;
    const minutes=permanent?null:Math.floor(Number(req.body.minutes)||1440);
    if(!permanent&&(minutes<1||minutes>525600))return res.status(400).json({ok:false,message:'Thời hạn khóa hoặc cấm không hợp lệ.'});
    target.status={type:action,until:permanent?null:Date.now()+minutes*60000,reason:note||`Xử lý sau điều tra tố cáo: ${reportReasonLabel(report.reason)}.`};
    restriction=restrictionPayload(target);actionDetail=action==='ban'?'Đã cấm tài khoản.':'Đã khóa tài khoản.';
    io.to(`user:${target.id}`).emit('account:restricted',restriction);
    setTimeout(async()=>{const sockets=await io.in(`user:${target.id}`).fetchSockets();for(const activeSocket of sockets)activeSocket.disconnect(true);},900);
  }else if(action==='dismiss')actionDetail='Đã bác bỏ tố cáo sau khi kiểm tra.';
  report.action=action;
  report.actionDetail=actionDetail;
  report.adminNote=note;
  report.status=action==='dismiss'?'dismissed':action!=='none'?'actioned':(requestedStatus||'investigating');
  report.updatedAt=nowISO();
  report.resolvedAt=['actioned','dismissed'].includes(report.status)?report.updatedAt:null;
  saveStore({immediate:true});
  recordAdminAction(req,'report.review',target?.username||report.reportedUserId,`${report.status} · ${action} · ${reportReasonLabel(report.reason)}`);
  const adminPayload=reportAdminPayload(report);io.to('admin').emit('admin:report:update',adminPayload);
  if(reporter){io.to(`user:${reporter.id}`).emit('report:updated',reportUserPayload(report));setImmediate(()=>sendPushToUser(reporter,{title:'Tố cáo đã được Admin cập nhật',body:report.status==='dismissed'?'Admin đã kiểm tra và đóng tố cáo.':'Admin đã kiểm tra và cập nhật trạng thái tố cáo.',tag:`report:${report.id}`,url:'/chat'},{priority:true,ttl:86400}));}
  res.json({ok:true,report:adminPayload,restriction,message:actionDetail||'Đã cập nhật trạng thái điều tra.'});
});

app.get('/api/admin/audit', requireAdmin, (req,res) => {
  const limit=Math.max(1,Math.min(200,Math.floor(Number(req.query.limit)||50)));
  const entries=Array.isArray(store.system?.adminAuditLog)?store.system.adminAuditLog.slice(-limit).reverse():[];
  res.json({ok:true,entries});
});

app.delete('/api/admin/audit', requireAdmin, (req,res) => {
  const password=String(req.body?.password||'');
  if (!safeEqualSecret(password, ADMIN_AUDIT_DELETE_PASSWORD)) {
    return res.status(403).json({ok:false,message:'Mật khẩu xác nhận không đúng.'});
  }
  store.system.adminAuditLog=[];
  saveStore({ immediate:true });
  io.to('admin').emit('admin:audit-cleared',{at:nowISO()});
  res.json({ok:true,message:'Đã xóa toàn bộ lịch sử hoạt động quản trị.'});
});

app.get('/api/admin/dashboard', requireAdmin, (_req,res) => {
  const restricted=store.users.filter((u)=>restrictionPayload(u)).length, effects=effectEntitlementCount();
  const badgeCounts=profileBadgeCounts();
  const supportUnread=store.messages.filter((m)=>m.scope==='support'&&m.senderRole!=='admin'&&!m.readBy.includes('admin')).length;
  const supportWarnings=store.users.filter((u)=>{resetSupportPenaltyIfExpired(u,false);return Number(u.supportModeration?.strikes||0)>0;}).length;
  const supportBlocked=store.users.filter((u)=>supportMessagingPayload(u,false).blocked).length;
  const reportPending=store.reports.filter((item)=>item.status==='pending').length;
  const reportInvestigating=store.reports.filter((item)=>item.status==='investigating').length;
  const reportHighRisk=store.reports.filter((item)=>['pending','investigating'].includes(item.status)&&item.riskScore>=70).length;
  res.json({ok:true,stats:{users:store.users.length,online:onlineUsers.size,offline:Math.max(0,store.users.length-onlineUsers.size),restricted,effects,supportUnread,supportWarnings,supportBlocked,messages:store.messages.length,groups:store.groups.length,badges:badgeCounts.total,vip:badgeCounts.vip,legend:badgeCounts.legend,reports:store.reports.length,reportPending,reportInvestigating,reportHighRisk},system:systemState()});
});

let worldChatExpiryTimer = null;
function scheduleWorldChatExpiry() {
  if (worldChatExpiryTimer) clearTimeout(worldChatExpiryTimer);
  const settings = normalizeWorldChatSettings(store.system || {});
  if (!settings.lockedUntil) return;
  worldChatExpiryTimer = setTimeout(() => {
    const current = normalizeWorldChatSettings(store.system || {});
    if (current.lockedUntil && current.lockedUntil > Date.now()) return scheduleWorldChatExpiry();
    store.system.worldChatMode = 'open';
    store.system.worldChatLockedUntil = null;
    store.system.worldChatEnabled = true;
    saveStore({ immediate:true });
    worldChatExpiryTimer = null;
    io.emit('world:state', worldChatPayload());
  }, Math.max(250, Math.min(settings.lockedUntil - Date.now() + 80, 2147483647)));
  worldChatExpiryTimer.unref?.();
}

app.post('/api/admin/system-capacity', requireAdmin, (req,res) => {
  store.system = store.system && typeof store.system === 'object' ? store.system : defaultStore().system;
  const unlimited = Boolean(req.body.unlimited);
  const requested = unlimited ? 0 : Math.floor(Number(req.body.maxAccounts));
  if (!unlimited && (!Number.isFinite(requested) || requested < 1 || requested > 1000000)) {
    return res.status(400).json({ok:false,message:'Giới hạn tài khoản phải từ 1 đến 1.000.000.'});
  }
  if (!unlimited && requested < store.users.length) {
    return res.status(409).json({ok:false,message:`Không thể đặt thấp hơn ${store.users.length} tài khoản đang tồn tại.`});
  }
  store.system.maxAccounts = unlimited ? 0 : requested;
  saveStore({ immediate:true });
  const system = systemState();
  recordAdminAction(req,'system.capacity','accounts',unlimited?'không giới hạn':`${requested} tài khoản`);
  io.to('admin').emit('system:capacity', system.accountCapacity);
  res.json({ok:true,message:unlimited?'Đã tắt giới hạn đăng ký tài khoản.':`Đã đặt giới hạn ${requested.toLocaleString('vi-VN')} tài khoản.`,system});
});

app.post('/api/admin/world-chat', requireAdmin, (req,res) => {
  store.system = store.system && typeof store.system === 'object' ? store.system : defaultStore().system;
  let mode = cleanText(req.body.mode,30);
  if (!mode && typeof req.body.enabled === 'boolean') mode = req.body.enabled ? 'open' : 'read_only';
  if (!WORLD_CHAT_MODES.includes(mode)) return res.status(400).json({ok:false,message:'Chế độ chat thế giới không hợp lệ.'});
  const slowModeSeconds = Math.floor(Number(req.body.slowModeSeconds) || 0);
  if (slowModeSeconds < 0 || slowModeSeconds > MAX_WORLD_SLOW_MODE_SECONDS) return res.status(400).json({ok:false,message:'Slow mode phải từ 0 đến 120 giây.'});
  const antiSpamEnabled = req.body.antiSpamEnabled !== false;
  let lockedUntil = null;
  if (mode === 'read_only' && req.body.lockMinutes !== undefined && req.body.lockMinutes !== null && req.body.lockMinutes !== '') {
    const minutes = Number(req.body.lockMinutes);
    if (!Number.isFinite(minutes) || minutes < 1 || minutes > MAX_WORLD_LOCK_MINUTES) return res.status(400).json({ok:false,message:'Thời gian khóa phải từ 1 phút đến 7 ngày.'});
    lockedUntil = Date.now() + Math.floor(minutes * 60000);
  }
  store.system.worldChatMode = mode;
  store.system.worldChatLockedUntil = lockedUntil;
  store.system.worldSlowModeSeconds = slowModeSeconds;
  store.system.worldAntiSpamEnabled = antiSpamEnabled;
  store.system.worldChatEnabled = mode === 'open';
  saveStore({ immediate:true });
  scheduleWorldChatExpiry();
  const payload = worldChatPayload();
  io.emit('world:state', payload);
  const labels = {open:'Mọi thành viên được nhắn',admin_only:'Chỉ quản trị viên được nhắn',read_only:'Chỉ đọc'};
  recordAdminAction(req,'world-chat.update','world',`${labels[mode]} · slow ${slowModeSeconds}s · anti-spam ${antiSpamEnabled?'on':'off'}`);
  res.json({ok:true,message:`Đã chuyển chat thế giới sang chế độ: ${labels[mode]}.`,worldChat:payload});
});

let announcementExpiryTimer = null;
function emitAnnouncementState() {
  const announcements = systemState().activeAnnouncements;
  io.emit('server:announcements', announcements);
  if (announcements[0]) io.emit('server:announcement', announcements[0]); // tương thích tab cũ
  else io.emit('server:announcement:clear', { all:true });
  return announcements;
}
function scheduleAnnouncementExpiry() {
  if (announcementExpiryTimer) clearTimeout(announcementExpiryTimer);
  announcementExpiryTimer = null;
  const announcements = systemState().activeAnnouncements;
  if (!announcements.length) return;
  const nearestExpiry = Math.min(...announcements.map((item) => Number(item.expiresAt)));
  const delay = Math.max(250, nearestExpiry - Date.now() + 80);
  announcementExpiryTimer = setTimeout(() => {
    const raw = Array.isArray(store.system?.activeAnnouncements)
      ? store.system.activeAnnouncements
      : (store.system?.activeAnnouncement ? [store.system.activeAnnouncement] : []);
    const after = normalizeAnnouncements(raw.filter((item) => Number(item?.expiresAt) > Date.now()));
    const changed = after.length !== raw.length || after.some((item, index) => item.id !== raw[index]?.id);
    store.system.activeAnnouncements = after;
    store.system.activeAnnouncement = after[0] || null;
    if (changed) {
      saveStore();
      emitAnnouncementState();
    }
    scheduleAnnouncementExpiry();
  }, Math.min(delay, 2147483647));
  announcementExpiryTimer.unref?.();
}

app.post('/api/admin/announcements', requireAdmin, (req,res) => {
  const message = cleanText(req.body.message,500);
  const durationSeconds = Number(req.body.durationSeconds);
  if (message.length < 2) return res.status(400).json({ok:false,message:'Thông báo phải có ít nhất 2 ký tự.'});
  if (!Number.isFinite(durationSeconds) || durationSeconds < 10 || durationSeconds > MAX_ANNOUNCEMENT_SECONDS) {
    return res.status(400).json({ok:false,message:'Thời gian thông báo phải từ 10 giây đến 7 ngày.'});
  }
  store.system = store.system && typeof store.system === 'object' ? store.system : defaultStore().system;
  const previous = normalizeAnnouncements(store.system.activeAnnouncements, store.system.activeAnnouncement);
  const announcement = { id:id('notice'), message, createdAt:nowISO(), expiresAt:Date.now()+Math.floor(durationSeconds)*1000 };
  const announcements = [announcement];
  store.system.activeAnnouncements = announcements;
  store.system.activeAnnouncement = announcement;
  saveStore();
  scheduleAnnouncementExpiry();
  emitAnnouncementState();
  recordAdminAction(req,'announcement.create',announcement.id,`${durationSeconds}s · ${message.slice(0,120)}`);
  res.status(201).json({ok:true,message:previous.length?'Đã thay thế thông báo cũ và phát thông báo mới.':'Đã phát thông báo tới toàn bộ hệ thống.',announcement,announcements});
});

app.delete('/api/admin/announcements', requireAdmin, (req,res) => {
  const previous = systemState().activeAnnouncements;
  store.system.activeAnnouncements = [];
  store.system.activeAnnouncement = null;
  saveStore();
  if (announcementExpiryTimer) clearTimeout(announcementExpiryTimer);
  announcementExpiryTimer = null;
  emitAnnouncementState();
  if (previous.length) recordAdminAction(req,'announcement.clear','all','1 thông báo');
  res.json({ok:true,message:previous.length?'Đã kết thúc thông báo toàn hệ thống.':'Hiện không có thông báo đang chạy.'});
});
app.get('/api/admin/users', requireAdmin, (_req,res) => { const users=store.users.map((u)=>({...safeUser(u,true),friendCount:friendIdsFor(u.id).length,supportUnread:store.messages.filter((m)=>m.scope==='support'&&m.supportUserId===u.id&&m.senderRole!=='admin'&&!m.readBy.includes('admin')).length,sessionCount:u.sessions.length})); res.json({ok:true,users}); });
app.get('/api/admin/users/:userId', requireAdmin, (req,res) => { const u=getUser(req.params.userId); if (!u) return res.status(404).json({ok:false,message:'Không tìm thấy người dùng.'}); const messages=store.messages.filter((m)=>m.scope==='support'&&m.supportUserId===u.id).slice(-300); const { receiptIds }=markMessagesRead(messages.filter((m)=>m.senderRole!=='admin'),'admin',true); if(receiptIds.length)io.to(`support:${u.id}`).emit('chat:read',{scope:'support',readerId:'admin',supportUserId:u.id,messageIds:receiptIds});res.json({ok:true,user:{...safeUser(u,true),friendCount:friendIdsFor(u.id).length,blockedCount:u.blockedUserIds.length,archivedCount:u.archivedUserIds.length,sessionCount:u.sessions.length},messages}); });
app.post('/api/admin/users/:userId/support-block', requireAdmin, (req,res) => {
  const user=getUser(req.params.userId);if(!user)return res.status(404).json({ok:false,message:'Không tìm thấy người dùng.'});
  const block=req.body.block!==false;
  if(block){
    const permanent=Boolean(req.body.permanent);const minutes=Math.floor(Number(req.body.minutes)||0);
    if(!permanent&&(minutes<1||minutes>525600))return res.status(400).json({ok:false,message:'Thời hạn chặn phải từ 1 phút đến 1 năm.'});
    user.supportMessaging={blocked:true,blockedUntil:permanent?null:Date.now()+minutes*60000,reason:cleanText(req.body.reason,300)||'Admin đã tạm chặn kênh liên hệ hỗ trợ.',updatedAt:nowISO()};
  }else user.supportMessaging={blocked:false,blockedUntil:null,reason:'',updatedAt:nowISO()};
  saveStore({immediate:true});recordAdminAction(req,block?'support.block':'support.unblock',user.username,block?(user.supportMessaging.blockedUntil?`${Math.ceil((user.supportMessaging.blockedUntil-Date.now())/60000)} phút`:'vĩnh viễn'):'');
  const payload=supportMessagingPayload(user,false);io.to(`user:${user.id}`).to(`support:${user.id}`).emit('support:access',payload);
  res.json({ok:true,message:block?'Đã chặn người dùng gửi tin tới Admin.':'Đã mở lại kênh liên hệ Admin.',supportMessaging:payload});
});
app.post('/api/admin/users/:userId/password', requireAdmin, async (req,res) => {
  const u=getUser(req.params.userId); if(!u) return res.status(404).json({ok:false,message:'Không tìm thấy người dùng.'});
  const p=String(req.body.newPassword??''); if(p.length<8||p.length>72||!/[A-Za-zÀ-ỹ]/u.test(p)||!/[0-9]/.test(p)) return res.status(400).json({ok:false,message:'Mật khẩu mới phải có 8–72 ký tự, gồm ít nhất một chữ và một số.'});
  u.passwordHash=await bcrypt.hash(p,11);
  const previousSessions=[...u.sessions]; u.sessions=[];
  for (const item of previousSessions) { try { fs.rmSync(path.join(SESSION_DIR,item.id+'.json'),{force:true}); } catch {} }
  saveStore();
  recordAdminAction(req,'user.password-reset',u.username,`${previousSessions.length} phiên cũ đã kết thúc`);
  io.to(`user:${u.id}`).to(`support:${u.id}`).emit('account:notice',{message:'Quản trị viên vừa thay đổi mật khẩu tài khoản của bạn. Các phiên đăng nhập cũ đã được kết thúc.'});
  res.json({ok:true,message:'Đã thay đổi mật khẩu và đăng xuất các phiên cũ.'});
  setTimeout(async()=>{const sockets=await io.in(`user:${u.id}`).fetchSockets();for(const activeSocket of sockets)activeSocket.disconnect(true);},500);
});
app.post('/api/admin/users/:userId/restrict', requireAdmin, (req,res) => { const u=getUser(req.params.userId);if(!u)return res.status(404).json({ok:false,message:'Không tìm thấy người dùng.'});const type=req.body.type==='ban'?'ban':req.body.type==='lock'?'lock':null;if(!type)return res.status(400).json({ok:false,message:'Hình thức hạn chế không hợp lệ.'});const permanent=Boolean(req.body.permanent),minutes=Number(req.body.minutes);if(!permanent&&(!Number.isFinite(minutes)||minutes<1||minutes>525600))return res.status(400).json({ok:false,message:'Thời gian phải từ 1 phút đến 1 năm.'});u.status={type,until:permanent?null:Date.now()+Math.floor(minutes)*60000,reason:cleanText(req.body.reason,300)||'Vi phạm quy định sử dụng.'};saveStore();recordAdminAction(req,`user.${type}`,u.username,permanent?'vĩnh viễn':`${Math.floor(minutes)} phút`);const restriction=restrictionPayload(u);io.to(`user:${u.id}`).emit('account:restricted',restriction);res.json({ok:true,message:type==='ban'?'Đã cấm tài khoản.':'Đã khóa tài khoản.',restriction});setTimeout(async()=>{const sockets=await io.in(`user:${u.id}`).fetchSockets();for(const s of sockets)s.disconnect(true);},1800); });
app.post('/api/admin/users/:userId/unlock', requireAdmin, (req,res) => { const u=getUser(req.params.userId);if(!u)return res.status(404).json({ok:false,message:'Không tìm thấy người dùng.'});u.status={type:'active',until:null,reason:''};saveStore();recordAdminAction(req,'user.unlock',u.username,'');io.to(`user:${u.id}`).to(`support:${u.id}`).emit('account:notice',{message:'Tài khoản của bạn đã được mở khóa.'});res.json({ok:true,message:'Đã mở khóa tài khoản.'}); });
function setSpecialEffectPermission(user, grant) {
  user.specialEffectsAllowed = Boolean(grant);
  const entitlement = specialEffectEntitlement(user);
  if (!entitlement.allowed) {
    user.selectedEffect = 'none';
    disableStoredEffects(user.id, 'admin-revoked');
  }
  saveStore();
  const effectsCount = effectEntitlementCount();
  const notice = grant
    ? 'Bạn đã được cấp quyền sử dụng 10 hiệu ứng bong bóng đặc biệt.'
    : (entitlement.allowed
      ? 'Quyền hiệu ứng do admin cấp đã được thu hồi, nhưng đặc quyền VIP/LEGEND của bạn vẫn còn hiệu lực.'
      : 'Quyền sử dụng hiệu ứng đã kết thúc. Tin nhắn vẫn được lưu và trở về bong bóng thông thường.');
  emitEffectAccessUpdate(user, notice);
  io.to('admin').emit('admin:effects:update',{userId:user.id,granted:Boolean(grant),effectsCount});
  return effectsCount;
}
app.post('/api/admin/users/:userId/effects', requireAdmin, (req,res) => {
  const user=getUser(req.params.userId);
  if(!user)return res.status(404).json({ok:false,message:'Không tìm thấy người dùng.'});
  const grant=req.body.grant!==false;
  if(user.specialEffectsAllowed===grant)return res.json({ok:true,message:grant?'Tài khoản đã có quyền hiệu ứng.':'Tài khoản chưa có quyền hiệu ứng.',effectsCount:effectEntitlementCount()});
  const effectsCount=setSpecialEffectPermission(user,grant);
  recordAdminAction(req,grant?'effects.grant':'effects.revoke',user.username,'');
  res.json({ok:true,message:grant?'Đã cấp quyền hiệu ứng.':'Đã thu hồi quyền hiệu ứng.',effectsCount});
});
app.post('/api/admin/effects', requireAdmin, (req,res) => {
  const username=normalizeUsername(req.body.username);
  const user=getUserByUsername(username);
  if(!user)return res.status(404).json({ok:false,message:'Không tìm thấy tên đăng nhập.'});
  const grant=req.body.grant!==false;
  if(user.specialEffectsAllowed===grant)return res.json({ok:true,message:grant?'Tài khoản đã có quyền hiệu ứng.':'Tài khoản chưa có quyền hiệu ứng.',user:safeUser(user,true),effectsCount:effectEntitlementCount()});
  const effectsCount=setSpecialEffectPermission(user,grant);
  recordAdminAction(req,grant?'effects.grant':'effects.revoke',user.username,'');
  res.json({ok:true,message:grant?'Đã cấp quyền hiệu ứng.':'Đã thu hồi quyền hiệu ứng.',user:safeUser(user,true),effectsCount});
});
app.post('/api/effects/select', requireUser, (req,res) => {
  const entitlement=specialEffectEntitlement(req.user);
  if(!entitlement.allowed)return res.status(403).json({ok:false,message:'Bạn không còn quyền sử dụng hiệu ứng.'});
  const effect=cleanText(req.body.effect,20);
  if(effect!=='none'&&!EFFECTS.includes(effect))return res.status(400).json({ok:false,message:'Hiệu ứng không hợp lệ.'});
  req.user.selectedEffect=effect;
  saveStore();
  const selectionPayload={effect,allowed:true,source:entitlement.source,expiresAt:entitlement.expiresAt};
  io.to(`user:${req.user.id}`).emit('effects:selected',selectionPayload);
  io.except(`user:${req.user.id}`).emit('effects:style-changed',{userId:req.user.id,allowed:true,effect});
  res.json({ok:true,message:'Đã áp dụng cho các tin nhắn mới.',...selectionPayload});
});

function profileBadgeLabel(type) { return type === 'legend' ? 'LEGEND' : 'VIP'; }
function emitProfileBadgeUpdate(user, message = '', { persist = true } = {}) {
  const badges = activeProfileBadges(user);
  const publicBadges = publicProfileBadges(user);
  for (const item of store.messages) if (item.fromId === user.id) item.senderProfileBadges = publicBadges;
  if (persist) saveStore();
  const counts = profileBadgeCounts();
  io.to(`user:${user.id}`).emit('profile-badges:updated',{userId:user.id,badges,message});
  io.emit('profile:updated',{user:safeUser(user,false)});
  io.to('admin').emit('admin:badges:update',{userId:user.id,badges,counts});
  emitEffectAccessUpdate(user);
  return counts;
}
function setProfileBadge(user, type, { grant = true, permanent = false, minutes = null } = {}) {
  if (!PROFILE_BADGES.includes(type)) throw new Error('Loại biểu tượng không hợp lệ.');
  if (!grant) {
    user.profileBadges[type] = null;
    if (!specialEffectEntitlement(user).allowed) {
      user.selectedEffect = 'none';
      disableStoredEffects(user.id, 'privilege-revoked');
    }
    scheduleBadgeExpiryCheck();
    const message = `Quyền hiển thị biểu tượng ${profileBadgeLabel(type)} đã được thu hồi.`;
    return { counts: emitProfileBadgeUpdate(user,message), message };
  }
  let expiresAt = null;
  if (!permanent) {
    const value = Number(minutes);
    if (!Number.isFinite(value) || value < 1 || value > MAX_BADGE_MINUTES) throw new Error('Thời gian cấp phải từ 1 phút đến 5 năm.');
    expiresAt = Date.now() + Math.floor(value) * 60000;
  }
  user.profileBadges[type] = { grantedAt: nowISO(), expiresAt };
  scheduleBadgeExpiryCheck();
  const durationText = permanent ? 'vĩnh viễn' : `đến ${new Date(expiresAt).toLocaleString('vi-VN')}`;
  const message = `Bạn đã được cấp biểu tượng ${profileBadgeLabel(type)} ${durationText} và có thể dùng hiệu ứng bong bóng trong thời gian đặc quyền còn hiệu lực.`;
  return { counts: emitProfileBadgeUpdate(user,message), message };
}
function parseBadgeRequest(body = {}) {
  const type = cleanText(body.type,20).toLowerCase();
  const grant = body.grant !== false && body.action !== 'revoke';
  const permanent = Boolean(body.permanent);
  const minutes = body.minutes;
  return { type, grant, permanent, minutes };
}
app.post('/api/admin/users/:userId/badges', requireAdmin, (req,res) => {
  const user=getUser(req.params.userId);
  if(!user)return res.status(404).json({ok:false,message:'Không tìm thấy người dùng.'});
  try {
    const options=parseBadgeRequest(req.body);
    const result=setProfileBadge(user,options.type,options);
    recordAdminAction(req,options.grant?'badge.grant':'badge.revoke',user.username,`${String(options.type).toUpperCase()}${options.grant?(options.permanent?' · vĩnh viễn':` · ${options.minutes} phút`):''}`);
    res.json({ok:true,message:result.message,user:safeUser(user,true),counts:result.counts});
  } catch (error) { res.status(400).json({ok:false,message:error.message}); }
});
app.post('/api/admin/badges', requireAdmin, (req,res) => {
  const user=getUserByUsername(req.body.username);
  if(!user)return res.status(404).json({ok:false,message:'Không tìm thấy tên đăng nhập.'});
  try {
    const options=parseBadgeRequest(req.body);
    const result=setProfileBadge(user,options.type,options);
    recordAdminAction(req,options.grant?'badge.grant':'badge.revoke',user.username,`${String(options.type).toUpperCase()}${options.grant?(options.permanent?' · vĩnh viễn':` · ${options.minutes} phút`):''}`);
    res.json({ok:true,message:result.message,user:safeUser(user,true),counts:result.counts});
  } catch (error) { res.status(400).json({ok:false,message:error.message}); }
});

let badgeExpiryTimer = null;
function scheduleBadgeExpiryCheck() {
  if (badgeExpiryTimer) clearTimeout(badgeExpiryTimer);
  const now = Date.now();
  let nearest = Infinity;
  for (const user of store.users) {
    ensureUserDefaults(user);
    for (const type of PROFILE_BADGES) {
      const expiresAt = Number(user.profileBadges[type]?.expiresAt || 0);
      if (expiresAt > now && expiresAt < nearest) nearest = expiresAt;
    }
  }
  const delay = Number.isFinite(nearest) ? Math.max(250, Math.min(30000, nearest - now + 80)) : 30000;
  badgeExpiryTimer = setTimeout(() => {
    cleanupExpiredProfileBadges();
    scheduleBadgeExpiryCheck();
  }, delay);
  badgeExpiryTimer.unref?.();
}

function cleanupExpiredProfileBadges() {
  const now=Date.now();
  const expired=[];
  const touchedUsers=new Set();
  for(const user of store.users) {
    ensureUserDefaults(user);
    for(const type of PROFILE_BADGES) {
      const grant=user.profileBadges[type];
      if(grant?.expiresAt && now>=Number(grant.expiresAt)) {
        user.profileBadges[type]=null;
        expired.push({user,type});
        touchedUsers.add(user.id);
      }
    }
  }
  if(!expired.length)return;
  for (const userId of touchedUsers) {
    const user=getUser(userId);
    if (user && !specialEffectEntitlement(user).allowed) {
      user.selectedEffect='none';
      disableStoredEffects(user.id,'privilege-expired');
    }
  }
  const expiredByUser = new Map();
  for (const item of expired) {
    if (!expiredByUser.has(item.user.id)) expiredByUser.set(item.user.id,{ user:item.user, types:[] });
    expiredByUser.get(item.user.id).types.push(profileBadgeLabel(item.type));
  }
  for (const { user, types } of expiredByUser.values()) {
    emitProfileBadgeUpdate(user,`Đặc quyền ${types.join(' và ')} đã hết thời hạn và được tự động ẩn. Hiệu ứng bong bóng cũng dừng nếu bạn không còn đặc quyền khác.`,{persist:false});
  }
  saveStore();
}

app.use('/api', (_req,res) => res.status(404).json({ok:false,message:'API không tồn tại.'}));
app.use((error,_req,res,_next) => {
  if(error instanceof multer.MulterError&&error.code==='LIMIT_FILE_SIZE')return res.status(413).json({ok:false,message:'Tệp vượt quá giới hạn 30 MB.'});
  if(error){
    console.error(`[${_req.requestId || 'no-request-id'}]`, error);
    const message=process.env.NODE_ENV==='production'?'Yêu cầu không hợp lệ.':(error.message||'Yêu cầu không hợp lệ.');
    return res.status(400).json({ok:false,message});
  }
  res.status(500).json({ok:false,message:'Đã xảy ra lỗi.'});
});

function joinUserToGroupRoom(userId, groupId) { io.in(`user:${userId}`).socketsJoin(`group:${groupId}`); }
function leaveUserFromGroupRoom(userId, groupId) { io.in(`user:${userId}`).socketsLeave(`group:${groupId}`); }
function addOnline(userId){onlineUsers.set(userId,(onlineUsers.get(userId)||0)+1);io.to('world').to('admin').emit('presence:update',{userId,online:true});}
function removeOnline(userId){const count=(onlineUsers.get(userId)||1)-1;if(count<=0){onlineUsers.delete(userId);const u=getUser(userId);if(u){u.lastSeenAt=nowISO();saveStore();}io.to('world').to('admin').emit('presence:update',{userId,online:false});}else onlineUsers.set(userId,count);}
io.engine.use(sessionMiddleware);
io.on('connection',(socket)=>{
  const auth=socket.request.session?.auth;
  const activeAnnouncements=systemState().activeAnnouncements;
  if(activeAnnouncements.length){
    socket.emit('server:announcements',activeAnnouncements);
    socket.emit('server:announcement',activeAnnouncements[0]);
  }
  if(!auth||!['user','recovery','admin'].includes(auth.role)){
    socket.data.guest=true;
    return;
  }
  const sessionId=socket.request.sessionID;
  if (!sessionId || !isPersistedSessionActive(sessionId)) { socket.disconnect(true); return; }
  socket.data.auth=auth;
  socket.data.sessionId=sessionId;
  socket.join(sessionRoom(sessionId));
  if (auth.role==='user') {
    const sessionUser=getUser(auth.userId);
    if (!sessionUser?.sessions?.some((item)=>item.id===sessionId && (!Number.isFinite(Number(item.expiresAt)) || Number(item.expiresAt)>Date.now()))) { socket.disconnect(true); return; }
  }
  socket.use((_packet,next)=>{
    if (isSocketSessionActive(socket)) return next();
    socket.disconnect(true);
    return next(new Error('Phiên đăng nhập đã hết hiệu lực.'));
  });
  socket.data.messageTimes=[];
  socket.data.worldMessageTimes=[];
  socket.data.worldTextHistory=[];
  socket.data.worldLastSentAt=0;
  socket.data.pageVisible=false;
  if(auth.role==='admin'){socket.join('admin');socket.join('world');}else{const u=getUser(auth.userId);if(!u){socket.disconnect(true);return;}if(auth.role==='user'){const r=restrictionPayload(u);if(r){socket.emit('account:restricted',r);socket.disconnect(true);return;}socket.join('world');socket.join(`user:${u.id}`);for(const g of store.groups.filter((g)=>g.memberIds.includes(u.id)))socket.join(`group:${g.id}`);addOnline(u.id);}socket.join(`support:${u.id}`);}
  socket.on('user:visibility',(payload={})=>{
    if(auth.role!=='user')return;
    const visible=Boolean(payload.visible);
    if(visible===socket.data.pageVisible)return;
    socket.data.pageVisible=visible;
    const current=visibleUserSockets.get(auth.userId)||0;
    if(visible)visibleUserSockets.set(auth.userId,current+1);
    else if(current<=1)visibleUserSockets.delete(auth.userId);else visibleUserSockets.set(auth.userId,current-1);
  });
  socket.on('chat:send',(payload={},callback=()=>{})=>{
    try{
      const current=socket.data.auth;
      if(current.role==='user'){const activeUser=getUser(current.userId);if(!activeUser?.sessions.some((sessionItem)=>sessionItem.id===socket.request.sessionID)){socket.disconnect(true);return callback({ok:false,message:'Phiên đăng nhập đã hết hiệu lực.'});}}
      const now=Date.now();
      socket.data.messageTimes=socket.data.messageTimes.filter((timestamp)=>now-timestamp<3000);
      if(socket.data.messageTimes.length>=20)return callback({ok:false,code:'RATE_LIMITED',message:'Bạn đang gửi quá nhanh. Hãy thử lại sau vài giây.'});
      socket.data.messageTimes.push(now);
      const text=cleanText(payload.text,MAX_MESSAGE_LENGTH),attachment=getAttachmentForSender(payload.attachmentId,current);const special=sanitizeSpecial(payload.special);const clientMessageId=cleanText(payload.clientMessageId,80)||null;const requestedEffect=cleanText(payload.effect,20);
      if(payload.special&&!special)return callback({ok:false,message:'Dữ liệu chia sẻ không hợp lệ.'});
      if(!text&&!attachment&&!special)return callback({ok:false,message:'Tin nhắn không được để trống.'});
      if(clientMessageId){const senderKey=current.role==='admin'?'admin':current.userId;const duplicate=store.messages.find((m)=>m.clientMessageId===clientMessageId&&m.fromId===senderKey);if(duplicate)return callback({ok:true,message:clientMessage(duplicate),duplicate:true});}
      if(payload.scope==='world'){
        const world = worldChatPayload();
        if(current.role==='admin'){
          if(world.mode==='read_only')return callback({ok:false,code:'WORLD_CHAT_READ_ONLY',worldChat:world,message:'Chat thế giới đang ở chế độ chỉ đọc.'});
          const m=pushMessage(createMessage({scope:'world',senderRole:'admin',senderId:'admin',senderName:'Quản trị viên',text,attachment,special,senderProfilePublic:false,clientMessageId}));
          m.isAdminBroadcast=true;
          const out=clientMessage(m);io.to('world').emit('chat:message',out);return callback({ok:true,message:out});
        }
        if(current.role!=='user')return callback({ok:false,message:'Không có quyền gửi vào chat thế giới.'});
        if(world.mode!=='open')return callback({ok:false,code:world.mode==='admin_only'?'WORLD_CHAT_ADMIN_ONLY':'WORLD_CHAT_READ_ONLY',worldChat:world,message:world.mode==='admin_only'?'Chat thế giới hiện chỉ cho quản trị viên gửi tin.':'Chat thế giới đang ở chế độ chỉ đọc. Bạn vẫn có thể xem lại lịch sử.'});
        const u=getUser(current.userId);if(!u||restrictionPayload(u))return callback({ok:false,message:'Tài khoản không thể gửi tin nhắn.'});
        const worldAccess=worldMessagingPayload(u);if(worldAccess.muted)return callback({ok:false,code:'WORLD_USER_MUTED',worldMessaging:worldAccess,message:worldAccess.reason||'Bạn đang bị hạn chế gửi tin ở chat thế giới.'});
        const retryAfter=Math.max(0,Math.ceil((socket.data.worldLastSentAt+world.slowModeSeconds*1000-now)/1000));
        if(retryAfter>0)return callback({ok:false,code:'WORLD_SLOW_MODE',retryAfter,worldChat:world,message:`Slow mode đang bật. Hãy chờ ${retryAfter} giây.`});
        if(world.antiSpamEnabled){
          const normalized=text.toLowerCase().replace(/\s+/g,' ').trim();
          socket.data.worldMessageTimes=socket.data.worldMessageTimes.filter((time)=>now-time<30000);
          socket.data.worldTextHistory=socket.data.worldTextHistory.filter((item)=>now-item.time<90000);
          const compact=normalized.replace(/\s/g,'');
          const spamLike=Boolean(
            normalized&&(
              (compact.length>12&&/(.)\1{10,}/u.test(compact))||
              (compact.length>28&&new Set([...compact]).size<=3)
            )
          );
          const repeatedCount=normalized?socket.data.worldTextHistory.filter((item)=>item.text===normalized).length:0;
          const spamLikeCount=socket.data.worldTextHistory.filter((item)=>item.spamLike).length;
          const tooFast=socket.data.worldMessageTimes.length>=9;
          const repeated=repeatedCount>=9;
          const repeatedPattern=spamLike&&spamLikeCount>=9;
          if(tooFast||repeated||repeatedPattern){
            return callback({ok:false,code:'WORLD_SPAM_BLOCKED',worldChat:world,message:'Vui lòng gửi tin nhắn chậm lại một chút để giữ cuộc trò chuyện ổn định. Bạn có thể thử lại sau giây lát.'});
          }
          socket.data.worldMessageTimes.push(now);
          if(normalized)socket.data.worldTextHistory.push({text:normalized,time:now,spamLike});
        }
        socket.data.worldLastSentAt=now;
        const m=pushMessage(createMessage({scope:'world',senderRole:'user',senderId:u.id,senderName:u.nickname,text,attachment,special,...messageEffectForUser(u,requestedEffect),senderAvatarUrl:u.profile.showAvatarInWorld?u.profile.avatarUrl:'',senderProfilePublic:u.profile.isPublic,senderProfileBadges:publicProfileBadges(u),clientMessageId}));const out=clientMessage(m);io.to('world').emit('chat:message',out);return callback({ok:true,message:out,worldChat:world,nextSendAt:world.slowModeSeconds?now+world.slowModeSeconds*1000:null});
      }
      if(payload.scope==='private'||payload.scope==='request'){
        if(current.role!=='user')return callback({ok:false,message:'Không có quyền nhắn tin riêng.'});const sender=getUser(current.userId),target=getUser(cleanText(payload.targetId,80));if(!sender||!target)return callback({ok:false,message:'Người dùng không tồn tại.'});if(isBlockedBetween(sender.id,target.id))return callback({ok:false,code:'CONTACT_BLOCKED',blocked:true,message:'Hiện không thể liên lạc với người này.',conversationState:{...blockStateFor(sender.id,target.id),canSend:false}});if(!canUseConversation(sender.id,'private',target.id))return callback({ok:false,code:'CONVERSATION_PENDING_DELETE',message:'Đoạn chat đang chờ xóa. Hãy khôi phục trước khi nhắn.'});
        let scope='private';if(!privateConversationAllowed(sender.id,target.id)){if(!canStrangerRequest(sender.id,target.id))return callback({ok:false,message:'Người này không nhận tin nhắn từ người lạ.'});scope='request';}
        const m=pushMessage(createMessage({scope,senderRole:'user',senderId:sender.id,senderName:sender.nickname,toId:target.id,text,attachment,special,...messageEffectForUser(sender,requestedEffect),senderProfileBadges:publicProfileBadges(sender),clientMessageId}));const out=clientMessage(m);io.to(`user:${sender.id}`).to(`user:${target.id}`).emit('chat:message',out);queueMessagePush(m);return callback({ok:true,message:out,request:scope==='request'});
      }
      if(payload.scope==='group'){
        if(current.role!=='user')return callback({ok:false,message:'Không có quyền nhắn nhóm.'});const g=getGroup(cleanText(payload.targetId,80));if(!g||!g.memberIds.includes(current.userId))return callback({ok:false,message:'Bạn không thuộc nhóm này.'});if(!canUseConversation(current.userId,'group',g.id))return callback({ok:false,message:'Đoạn chat đang chờ xóa. Hãy khôi phục trước khi nhắn.'});const u=getUser(current.userId);const m=pushMessage(createMessage({scope:'group',senderRole:'user',senderId:u.id,senderName:u.nickname,groupId:g.id,text,attachment,special,...messageEffectForUser(u,requestedEffect),senderAvatarUrl:u.profile.avatarUrl||'',senderProfilePublic:u.profile.isPublic,senderProfileBadges:publicProfileBadges(u),clientMessageId}));const out=clientMessage(m);io.to(`group:${g.id}`).emit('chat:message',out);queueMessagePush(m);return callback({ok:true,message:out});
      }
      if(payload.scope==='support'){
        if(!['user','recovery','admin'].includes(current.role))return callback({ok:false,message:'Không có quyền gửi tin hỗ trợ.'});
        let supportUserId,senderName,senderId;
        if(current.role==='admin'){
          supportUserId=cleanText(payload.targetId,80);if(!getUser(supportUserId))return callback({ok:false,message:'Người dùng không tồn tại.'});senderName='Quản trị viên';senderId='admin';
        }else{
          supportUserId=current.userId;const u=getUser(supportUserId);if(!u)return callback({ok:false,message:'Tài khoản không tồn tại.'});
          const restriction=restrictionPayload(u);if(restriction)return callback({ok:false,code:'ACCOUNT_RESTRICTED',restriction,message:restriction.message});
          const access=supportMessagingPayload(u);
          if(access.blocked)return callback({ok:false,code:'SUPPORT_BLOCKED',supportMessaging:access,message:access.reason||'Admin đang tạm chặn tin nhắn hỗ trợ từ tài khoản này.'});
          if(supportSpamDetected(u,text)){
            const moderation=registerSupportSpamIncident(u);
            const event={...moderation,supportMessaging:supportMessagingPayload(u,false),username:u.username,userId:u.id};
            io.to(`user:${u.id}`).to(`support:${u.id}`).emit('support:moderation',event);io.to('admin').emit('support:moderation',event);
            if(moderation.restriction){io.to(`user:${u.id}`).to(`support:${u.id}`).emit('account:restricted',moderation.restriction);setTimeout(async()=>{const sockets=await io.in(`user:${u.id}`).fetchSockets();for(const activeSocket of sockets)activeSocket.disconnect(true);},1800);}
            return callback({ok:false,code:'SUPPORT_SPAM',moderation,restriction:moderation.restriction||null,message:moderation.message});
          }
          senderName=u.nickname;senderId=u.id;
        }
        const supportEffect=current.role==='user'?messageEffectForUser(getUser(current.userId),requestedEffect):{};
        const m=pushMessage(createMessage({scope:'support',senderRole:current.role,senderId,senderName,supportUserId,text,attachment,special,...supportEffect,clientMessageId}));io.to(`support:${supportUserId}`).to('admin').emit('chat:message',clientMessage(m));if(current.role==='admin')queueMessagePush(m);return callback({ok:true,message:clientMessage(m)});
      }
      callback({ok:false,message:'Loại cuộc trò chuyện không hợp lệ.'});
    }catch(error){console.error(error);callback({ok:false,message:'Không thể gửi tin nhắn.'});}
  });
  socket.on('chat:read',(payload={})=>{
    const current=socket.data.auth;if(current.role!=='user'&&current.role!=='admin'&&current.role!=='recovery')return;
    if(payload.scope==='private'&&current.role==='user'){
      const u=getUser(current.userId);
      const targetId=cleanText(payload.targetId,80);
      const list=store.messages.filter((m)=>['private','request'].includes(m.scope)&&m.fromId===targetId&&m.toId===current.userId);
      const { receiptIds }=markMessagesRead(list,current.userId,u?.settings.showReadReceipts!==false);
      if(receiptIds.length)io.to(`user:${targetId}`).emit('chat:read',{scope:'private',readerId:current.userId,messageIds:receiptIds});
    }
    if(payload.scope==='group'&&current.role==='user'){
      const u=getUser(current.userId),g=getGroup(payload.targetId);
      if(!g?.memberIds.includes(current.userId))return;
      const { receiptIds }=markMessagesRead(store.messages.filter((m)=>m.scope==='group'&&m.groupId===g.id&&m.fromId!==current.userId),current.userId,u?.settings.showReadReceipts!==false);
      if(receiptIds.length)io.to(`group:${g.id}`).emit('chat:read',{scope:'group',readerId:current.userId,messageIds:receiptIds});
    }
    if(payload.scope==='support'){
      if(['user','recovery'].includes(current.role)){const recoveryCutoff=current.role==='recovery'?Number(current.recoveryStartedAt||Date.now()):0;const { receiptIds }=markMessagesRead(store.messages.filter((m)=>m.scope==='support'&&m.supportUserId===current.userId&&m.senderRole==='admin'&&new Date(m.createdAt).getTime()>=recoveryCutoff),current.userId,true);if(receiptIds.length)io.to('admin').emit('chat:read',{scope:'support',readerId:current.userId,supportUserId:current.userId,messageIds:receiptIds});}
      else{const uid=cleanText(payload.targetId,80);const { receiptIds }=markMessagesRead(store.messages.filter((m)=>m.scope==='support'&&m.supportUserId===uid&&m.senderRole!=='admin'),'admin',true);if(receiptIds.length)io.to(`support:${uid}`).emit('chat:read',{scope:'support',readerId:'admin',supportUserId:uid,messageIds:receiptIds});}
    }
  });
  socket.on('chat:typing',(payload={})=>{
    const current=socket.data.auth,isTyping=Boolean(payload.isTyping);
    if(current.role==='recovery'&&payload.scope==='support'){const u=getUser(current.userId);if(u)socket.to('admin').emit('chat:typing',{scope:'support',userId:u.id,username:u.nickname||u.username,isTyping});}if(current.role==='user'){const u=getUser(current.userId);if(!u?.settings.showTyping)return;if(payload.scope==='private'&&getUser(payload.targetId)&&!isBlockedBetween(u.id,payload.targetId)){socket.to(`user:${payload.targetId}`).emit('chat:typing',{scope:'private',userId:u.id,username:u.nickname,isTyping});}if(payload.scope==='group'){const g=getGroup(payload.targetId);if(g?.memberIds.includes(u.id))socket.to(`group:${g.id}`).emit('chat:typing',{scope:'group',groupId:g.id,userId:u.id,username:u.nickname,isTyping});}if(payload.scope==='support')socket.to('admin').emit('chat:typing',{scope:'support',userId:u.id,username:u.nickname,isTyping});}
    if(current.role==='admin'&&payload.scope==='support'&&getUser(payload.targetId))socket.to(`support:${payload.targetId}`).emit('chat:typing',{scope:'support',username:'Quản trị viên',isTyping});
  });
  socket.on('disconnect',()=>{if(auth.role==='user'){if(socket.data.pageVisible){const current=visibleUserSockets.get(auth.userId)||0;if(current<=1)visibleUserSockets.delete(auth.userId);else visibleUserSockets.set(auth.userId,current-1);}removeOnline(auth.userId);}});
});

cleanupExpiredProfileBadges();
scheduleBadgeExpiryCheck();
scheduleAnnouncementExpiry();
scheduleWorldChatExpiry();
const socketSessionSweep = setInterval(() => {
  for (const socket of io.sockets.sockets.values()) {
    if (socket.data.auth && !isSocketSessionActive(socket)) socket.disconnect(true);
  }
}, 60 * 1000);
socketSessionSweep.unref?.();
server.listen(PORT,'0.0.0.0',()=>{
  if (process.env.NODE_ENV === 'production') {
    if (ADMIN_PASSWORD === 'admin12' || ADMIN_SECOND_PASSWORD === 'admin36' || ADMIN_AUDIT_DELETE_PASSWORD === 'admin23') console.warn('[SECURITY] Hãy đặt toàn bộ mật khẩu Admin riêng trên môi trường triển khai.');
    if (!process.env.SESSION_SECRET) console.warn('[SECURITY] SESSION_SECRET chưa được cấu hình cố định; phiên đăng nhập có thể mất khi triển khai lại.');
    if (VAPID_KEYS.generated) console.warn('[PUSH] Khóa VAPID đang được lưu tự động; hãy dùng DATA_DIR bền vững hoặc biến môi trường cố định.');
  }
  console.log(`NexChat ${VERSION} đang chạy tại cổng ${PORT}`);
});

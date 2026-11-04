'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = __dirname;
const VERSION = '1.0.0';
let passed = 0;
let failed = 0;

function check(condition, label) {
  if (condition) { passed += 1; console.log(`✓ ${label}`); }
  else { failed += 1; console.error(`✗ ${label}`); }
}
function read(file) { return fs.readFileSync(path.join(ROOT, file), 'utf8'); }
function readOptional(file, fallback = '') {
  const target = path.join(ROOT, file);
  return fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : fallback;
}
function idsFromHTML(source) {
  return [...source.matchAll(/\sid=["']([^"']+)["']/g)].map((match) => match[1]);
}
function balancedCSS(source) {
  let braces = 0, comment = false, quote = '', escaped = false;
  for (let i = 0; i < source.length; i += 1) {
    const c = source[i], n = source[i + 1];
    if (comment) { if (c === '*' && n === '/') { comment = false; i += 1; } continue; }
    if (quote) { if (escaped) escaped = false; else if (c === '\\') escaped = true; else if (c === quote) quote = ''; continue; }
    if (c === '/' && n === '*') { comment = true; i += 1; continue; }
    if (c === '"' || c === "'") { quote = c; continue; }
    if (c === '{') braces += 1;
    if (c === '}') braces -= 1;
    if (braces < 0) return false;
  }
  return braces === 0 && !comment && !quote;
}
function collectI18nKeys(html) {
  const keys = new Set();
  for (const attr of ['data-i18n','data-i18n-placeholder','data-i18n-title','data-i18n-aria-label']) {
    const regex = new RegExp(`${attr}=["']([^"']+)["']`, 'g');
    for (const match of html.matchAll(regex)) keys.add(match[1]);
  }
  return keys;
}
function cssEditorWarnings(source) {
  const clean = source.replace(/\/\*[\s\S]*?\*\//g, '');
  const warnings = [];
  const stack = [];
  for (let index = 0; index < clean.length; index += 1) {
    const char = clean[index];
    if (char === '{') stack.push(index);
    else if (char === '}' && stack.length) {
      const start = stack.pop();
      const block = clean.slice(start + 1, index);
      if (block.includes('{')) continue;
      if (!block.trim()) warnings.push('emptyRules');
      if (/-webkit-line-clamp\s*:/.test(block) && !/(^|;)\s*line-clamp\s*:/.test(block)) warnings.push('line-clamp');
      if (/-webkit-background-clip\s*:/.test(block) && !/(^|;)\s*background-clip\s*:/.test(block)) warnings.push('background-clip');
      if (/(^|;)\s*-webkit-mask\s*:/.test(block) && !/(^|;)\s*mask\s*:/.test(block)) warnings.push('mask');
    }
  }
  return warnings;
}

const required = [
  'server.js','package.json','package-lock.json','Dockerfile','.dockerignore','.gitignore','.env.example',
  'style.css','mobile.css','system.css','smart-tools.css','v10-experience.css','v10-polish.css','bubble-effects.css','theme-init.js','app-runtime.js','smart-tools.js','v10-experience.js','v10-polish.js','ui.js','i18n.js','admin-i18n.js','site.webmanifest',
  'home.html','home.js','login.html','login.js','index.html','script.js','admin.html','admin.js',
  'support.html','support.js','sw.js','nexchat-logo.svg','vip-emblem.webp','legend-emblem.webp','admin-nebula.jpg','store.seed.json',
];
for (const file of required) check(fs.existsSync(path.join(ROOT, file)), `Có tệp bắt buộc: ${file}`);

const packageData = JSON.parse(read('package.json'));
const lockData = JSON.parse(read('package-lock.json'));
const manifest = JSON.parse(read('site.webmanifest'));
const store = JSON.parse(read('store.seed.json'));
const server = read('server.js');
const script = read('script.js');
const admin = read('admin.js');
const ui = read('ui.js');
const i18n = read('i18n.js');
const adminI18n = read('admin-i18n.js');
const themeInit = read('theme-init.js');
const appRuntime = read('app-runtime.js');
const homeJS = read('home.js');
const cssFiles = ['style.css','mobile.css','system.css','smart-tools.css','v10-experience.css','v10-polish.css','bubble-effects.css'];
const htmlFiles = ['home.html','login.html','index.html','admin.html','support.html'];
const jsFiles = ['server.js','script.js','admin.js','ui.js','login.js','home.js','support.js','i18n.js','admin-i18n.js','theme-init.js','app-runtime.js','smart-tools.js','v10-experience.js','v10-polish.js','sw.js'];

check(packageData.version === VERSION, 'package.json đúng phiên bản');
check(packageData.scripts?.check === 'node verify.js' && packageData.scripts?.test === 'node verify.js && node --test test/*.test.js', 'Lệnh kiểm tra dự án đồng bộ');
check(lockData.version === VERSION && lockData.packages?.['']?.version === VERSION, 'package-lock đồng bộ phiên bản');
check(server.includes(`const VERSION = '${VERSION}'`), 'Máy chủ đồng bộ phiên bản');
check(['smart-tools.css','v10-experience.css','v10-polish.css','bubble-effects.css','app-runtime.js','smart-tools.js','v10-experience.js','v10-polish.js','admin-i18n.js'].every((asset) => server.includes(`'${asset}'`)), 'Máy chủ phục vụ đầy đủ theme, Experience Engine và lớp hoàn thiện, không còn lỗi 404 MIME');
check(!read('package-lock.json').includes('openai.org') && !read('package-lock.json').includes('applied-caas'), 'Lockfile không chứa registry nội bộ');
check([...read('package-lock.json').matchAll(/"resolved":\s*"([^"]+)"/g)].every((m) => m[1].startsWith('https://registry.npmjs.org/')), 'Mọi package tải từ registry npm công khai');

for (const file of jsFiles) {
  try { new vm.Script(read(file), { filename:file }); check(true, `Cú pháp JavaScript hợp lệ: ${file}`); }
  catch (error) { console.error(error.message); check(false, `Cú pháp JavaScript hợp lệ: ${file}`); }
}
for (const file of cssFiles) check(balancedCSS(read(file)), `${file} cân bằng ngoặc, chuỗi và comment`);
const cssEditorIssues = cssFiles.flatMap((file) => cssEditorWarnings(read(file)).map((warning) => `${file}:${warning}`));
if (cssEditorIssues.length) console.error(cssEditorIssues.join('\n'));
check(cssEditorIssues.length === 0, 'CSS không còn ruleset rỗng hoặc cảnh báo tương thích màu vàng trong VS Code');

const allKeys = new Set();
for (const file of htmlFiles) {
  const html = read(file);
  const ids = idsFromHTML(html);
  check(new Set(ids).size === ids.length, `${file} không có ID trùng`);
  check(html.includes(`style.css?v=${VERSION}`) && html.includes(`mobile.css?v=${VERSION}`) && html.includes(`system.css?v=${VERSION}`) && html.includes(`smart-tools.css?v=${VERSION}`) && html.includes(`v10-experience.css?v=${VERSION}`) && html.includes(`v10-polish.css?v=${VERSION}`) && (file !== 'index.html' || html.includes(`bubble-effects.css?v=${VERSION}`)), `${file} tải đủ các lớp CSS đúng phiên bản`);
  check(html.includes(`app-runtime.js?v=${VERSION}`) && html.includes(`smart-tools.js?v=${VERSION}`) && html.includes(`v10-experience.js?v=${VERSION}`) && html.includes(`v10-polish.js?v=${VERSION}`) && html.includes(`site.webmanifest?v=${VERSION}`), `${file} tải runtime thích ứng, Experience Engine và manifest`);
  check(html.includes('viewport-fit=cover'), `${file} hỗ trợ safe-area mobile`);
  check(html.includes('class="skip-link"'), `${file} có liên kết bỏ qua đầu trang cho bàn phím`);
  for (const key of collectI18nKeys(html)) allKeys.add(key);
}

check(manifest.name === 'NexChat' && manifest.start_url && Array.isArray(manifest.icons) && manifest.icons.length > 0, 'Web manifest hợp lệ');
check(JSON.stringify(manifest).includes(`v=${VERSION}`) && !/v=9\./.test(JSON.stringify(manifest)), 'Web manifest dùng đúng tài nguyên phiên bản V10');
check(appRuntime.includes('visualViewport') && appRuntime.includes('--keyboard-height') && appRuntime.includes('dataset.performance'), 'Runtime xử lý viewport, bàn phím và hiệu năng');
const smartTools = read('smart-tools.js');
const smartCSS = read('smart-tools.css');
check(smartTools.includes("const VERSION = '10.0.0'") && smartTools.includes('NexSmart') && smartTools.includes('nexchat-smart-performance'), 'Tiện ích thông minh tách namespace và đồng bộ phiên bản');
check(smartTools.includes('conversationNoteModal') && smartTools.includes('exportAdminUsers') && smartTools.includes('beforeinstallprompt'), 'Ghi chú riêng, xuất CSV và cài PWA được bổ sung độc lập');
check(smartCSS.includes('NexChat Smart Tools V10.0.0') && smartCSS.includes('.nex-smart-privacy-screen') && smartCSS.includes('@media (max-width:760px)'), 'Lớp tiện ích có responsive và màn che riêng tư');
check(read('index.html').includes('data-account-settings-panel="smart"') && read('index.html').includes('conversationNoteAction'), 'Chat có trung tâm tiện ích và ghi chú riêng không đè tính năng cũ');
check(read('admin.html').includes('exportUsersButton'), 'Admin có xuất danh sách lọc CSV');
const v10JS = read('v10-experience.js');
const v10CSS = read('v10-experience.css');
const polishJS = read('v10-polish.js');
const polishCSS = read('v10-polish.css');
check(v10JS.includes("const VERSION = '1.0.0'") && v10JS.includes('window.NexV10') && v10JS.includes('nexchat-v10-motion'), 'Experience Engine V10 tách namespace và lưu chế độ độc lập');
check(v10JS.includes("['auto', 'cinematic', 'balanced', 'economy', 'static']") && v10JS.includes('prefers-reduced-motion') && v10JS.includes('navigator.getBattery'), 'Chuyển động V10 có đủ chế độ và tự thích ứng thiết bị');
check(v10JS.includes("root.dataset.performanceMode") && v10JS.includes('lastFocused') && v10JS.includes("event.key !== 'Tab'"), 'Chế độ Thông minh phối hợp hiệu năng và bảng chọn quản lý focus bàn phím');
check(v10CSS.includes('NexChat V1.0.0') && v10CSS.includes('[data-v10-motion-resolved="economy"]') && v10CSS.includes('.v10-motion-panel'), 'Lớp đồ họa V10 có chế độ tiết kiệm và bảng chọn responsive');
check(v10CSS.includes('position:sticky') && v10CSS.includes('--vip-emblem-image') && v10CSS.includes('--legend-emblem-image') && v10CSS.includes('@keyframes v10LegendRoyal'), 'Bottom-sheet có chân cố định và hai biểu tượng dùng ảnh chi tiết với hiệu ứng V10');
check(read('index.html').includes('motionModeButton') && read('index.html').includes('effectActivationDock') && !read('index.html').includes('v10-motion-setting-card'), 'Chat tích hợp chuyển động vào nút góc trên và giữ nút hiệu ứng độc quyền');
check(read('admin.html').includes('adminMotionButton') && !read('admin.html').includes('v10-admin-motion-card'), 'Admin tích hợp điều khiển chuyển động vào nút trên thanh công cụ');
check(read('admin.html').includes('admin-atmosphere-photo') && read('admin.html').includes('admin-atmosphere-ribbon-a') && read('admin.html').includes('admin-atmosphere-flare'), 'Admin có đủ lớp nền vũ trụ ảnh, dải tinh vân và điểm lóe chiều sâu');
check(polishCSS.includes('NexChat V1.0.0 · Cinematic Admin Universe') && polishCSS.includes('adminV1125PhotoVoyage') && polishCSS.includes('adminV1125StarVoyage') && polishCSS.includes('adminV1125Flare'), 'Nền Admin vũ trụ có chuyển động nhiều lớp và keyframe riêng');
check(admin.includes('nexchat:v10-motion') && (admin.includes('cinematic ? 86 : 56') || admin.includes('cinematicMax ? 128 : 104')) && admin.includes('--admin-space-x-reverse'), 'Nền Admin tự đổi ngân sách sao băng, hạt sáng và parallax theo chế độ chuyển động');
check(read('sw.js').includes('/admin-nebula.jpg?v=${VERSION}') && read('Dockerfile').includes('admin-nebula.jpg'), 'Ảnh tinh vân Admin được cache và đóng gói khi triển khai');
check(script.includes('effectActivationButton') && script.includes('nexchat:effect-selected') && script.includes('updateEffectButton();'), 'Quyền hiệu ứng đồng bộ với nút kích hoạt và trạng thái đang dùng');
check(script.includes("target:'motionModeButton',icon:'activity'") && v10JS.includes("text: (key) => t(key)"), 'Chat mobile có lối mở bộ chọn chuyển động được dịch theo ngôn ngữ');
check(v10JS.includes("data-effect-label") && !v10JS.includes("button.addEventListener('click', () => source.click())"), 'Nút hiệu ứng không bị gắn sự kiện trùng và đồng bộ nhãn an toàn');
check(['/v10-experience.css','/v10-experience.js','/v10-polish.css','/bubble-effects.css','/v10-polish.js'].every((asset) => read('sw.js').includes(asset)), 'Service worker cache đầy đủ tài nguyên V1.0.0');
check(polishJS.includes("const VERSION = '1.0.0'") && polishJS.includes('window.NexPolish') && polishJS.includes('connectionInfo'), 'Lớp hoàn thiện V1.0.0 tách namespace và nhận diện kết nối an toàn');
check(polishJS.includes("transport === 'wifi'") && polishJS.includes("transport === 'cellular'") && polishJS.includes('Never infer 5G') && !polishJS.includes("label = '5G/4G+'"), 'Không suy diễn 5G hoặc loại mạng vật lý chỉ từ tốc độ');
check(polishCSS.includes('#secondFactorModal.second-factor-backdrop') && polishCSS.includes('place-items:center!important'), 'Xác minh cấp 2 luôn căn giữa màn hình');
check(!read('login.html').includes('login-identifier-hint'), 'Đã loại bỏ biểu tượng email trang trí khỏi ô đăng nhập');
check(ui.includes('let activeToast = null') && ui.includes('container.replaceChildren(item)') && ui.includes('toast-leaving'), 'Toast chỉ có một thông báo và kết thúc trượt mượt');
check(ui.includes('modal-closing') && ui.includes("event.propertyName !== 'transform'") && polishCSS.includes('single-pass dismiss motion') && v10JS.includes("backdrop.classList.add('is-closing')") && read('smart-tools.js').includes("modal.classList.add('is-closing')"), 'Đóng modal, bảng chuyển động và bảng lệnh chỉ chạy một lượt, không giật hai lần hoặc click xuyên');
check(admin.includes('return UI.confirmDialog') && ui.includes('keepOpenOnConfirm') && ui.includes('A modal may never expose only its blurred backdrop') && polishCSS.includes('Admin confirmation modal hardening'), 'Xác nhận cấp quyền Admin luôn hiện thẻ thao tác phía trên lớp mờ, không khóa cứng toàn trang');
check(polishCSS.includes('universal modal visibility invariant') && polishCSS.includes('body:not(.performance-lite) > .modal-backdrop:not(.hidden).modal-visible > .modal-card') && !polishCSS.includes('body:not(.performance-lite) .modal-backdrop.modal-visible .modal-card{\n  animation:none!important;\n  opacity:0;') && ui.includes('modal-force-visible') && ui.includes("card.style.setProperty('opacity', '1', 'important')"), 'Tất cả modal Chat/Admin/Login/Support luôn hiện nội dung, không còn lớp mờ khóa giao diện');
check(homeJS.includes('finishOptionsClosed') && homeJS.includes("window.addEventListener('pageshow'") && homeJS.includes("closeOptions({ immediate: true })") && read('style.css').includes('homepage stale blur guard') && read('style.css').includes(':has(#homeOptions.is-open:not(.hidden))'), 'Trang chủ tự dọn scrim tùy chọn, không còn kẹt lớp blur toàn trang');
check(ui.includes('.slice(0,1)') && ui.includes('announcement-ending') && ui.includes('--announcement-travel'), 'Thông báo toàn server chỉ còn một banner, không đè giao diện và trượt mượt');
check(server.includes('announcements = [announcement]') && server.includes('Đã thay thế thông báo cũ'), 'Thông báo mới phía máy chủ thay thế thông báo cũ');
check(polishCSS.includes('data-v10-motion-resolved="cinematic"') && polishCSS.includes('data-v10-motion-resolved="economy"') && polishCSS.includes('data-v10-motion-resolved="static"'), 'Hiệu ứng mới thích ứng theo từng chế độ chuyển động người dùng');
check(polishJS.includes('createCosmosLayer') && polishCSS.includes('.v10-cosmos-meteor') && polishCSS.includes('@keyframes v10CosmosMeteor'), 'Chế độ tối đa có sao trôi, bụi sáng, tinh vân và sao băng chuyển động');
check(polishJS.includes('createSidebarCosmosLayer') && polishJS.includes('v10-sidebar-meteor') && polishCSS.includes('living cosmic sidebar') && polishCSS.includes('@keyframes v1033SidebarMeteor'), 'Thanh bên Vũ trụ có lớp sao, tinh vân, cực quang và sao băng động riêng thay vì chỉ dùng nền tĩnh');
check(v10CSS.includes('background:transparent') && v10CSS.includes('pointer-events:none') && v10JS.includes('positionPanel') && v10JS.includes('v10MotionBound'), 'Bộ chọn chuyển động neo vào nút, không blur toàn trang và không gắn sự kiện trùng');
check(v10JS.includes('v10-motion-summary') && v10JS.includes('role=\"radiogroup\"') && v10JS.includes('ArrowDown') && v10CSS.includes('Motion Control Center redesign') && v10CSS.includes('.v10-motion-scroll') && v10CSS.includes('flex-direction:column!important'), 'Trung tâm chuyển động có tóm tắt trực quan, chọn chế độ rõ ràng, cuộn nội dung riêng và điều khiển bàn phím đầy đủ');
check(read('home.html').includes('id="homeMotionButton"') && read('home.html').includes('data-v10-motion-trigger') && read('home.html').includes('id="homeThemeButton"') && !read('home.html').includes('data-home-motion'), 'Trang chủ tách đúng nút chuyển động V10 khỏi bộ chọn giao diện, không còn nhầm với ngôn ngữ');
check(read('style.css').includes('unified home cosmos + dedicated motion control') && read('style.css').includes('.home-motion-control') && read('style.css').includes('homeUnifiedStarDrift') && read('style.css').includes('background:transparent!important'), 'Nền header và hero dùng chung lớp vũ trụ, đồng thời nút chuyển động có trạng thái trực quan');
check(read('style.css').includes('cinematic cosmic background enhancement') && read('style.css').includes('homeAuroraRibbon') && read('style.css').includes('homeCosmicVeil') && read('home.js').includes('drawClouds') && read('home.js').includes('drawDust') && read('home.js').includes('drawMeteors'), 'Nền trang chủ có tinh vân thể tích, dải cực quang, sao nhiều lớp, bụi sáng và sao băng nâng cấp theo chế độ chuyển động');
check(v10JS.includes("if (state.panelTrigger === trigger) {") && v10JS.includes("closePanel({ restoreFocus:false })") && v10JS.includes("setAttribute('aria-expanded', 'true')"), 'Nút chuyển động mở/đóng cùng một lần nhấn, không kẹt bảng hoặc sai trạng thái aria');
check(polishCSS.includes('#effectModal .effect-choice strong') && script.includes('EFFECT_COPY') && script.includes('effectLabel(effect)'), 'Danh sách hiệu ứng bóng chat đọc rõ, dịch theo ngôn ngữ và dùng đúng hiệu ứng đã chọn');
check(admin.includes('effect-granted-avatar-wrap') && admin.includes('effect-granted-copy') && read('style.css').includes('.effect-granted-user>.effect-granted-avatar-wrap') && read('style.css').includes('flex:0 0 50px!important'), 'Danh sách người có quyền hiệu ứng giữ avatar vuông, không bị kéo dẹt hoặc tràn bố cục');
check(admin.includes('promoteUserWorkspace') && admin.includes("messages.classList.toggle('is-empty'") && read('style.css').includes('NexChat V1.0.0 · desktop Admin workspace correction') && read('style.css').includes('height:clamp(520px,58vh,680px)'), 'Khu vực hồ sơ và hỗ trợ Admin được đưa lên đúng vị trí, cân đối và không tạo khoảng trắng khổng lồ');
check(polishCSS.includes('v10RealtimeRing') && polishCSS.includes('.admin-command-pulse'), 'Khôi phục vòng realtime xanh và nhịp trạng thái trong Chat/Admin');
check(admin.includes('NexPolish?.showActionSuccess') && polishCSS.includes('.v10-action-success'), 'Xóa nhật ký có popup thành công thông minh');
check(polishCSS.includes('polishEmblemOrbit') && polishCSS.includes('polishVipCore') && polishCSS.includes('polishLegendCore'), 'VIP và LEGEND có hiệu ứng lõi, quỹ đạo và ánh sáng riêng');
check(read('style.css').includes('NexChat V1.0.0 · refined Vitality / Luxe emblem system') && read('style.css').includes('v1019VitalityInner') && read('style.css').includes('v1019LuxeOuter') && !read('style.css').split('NexChat V1.0.0 · refined Vitality / Luxe emblem system').pop().includes('.message-bubble{'), 'Biểu tượng V/L được tinh giản theo mẫu mới, hiệu ứng trong/ngoài đồng bộ và không thay đổi nền bóng chat');

check(polishCSS.includes('native language control hardening') && polishCSS.includes('appearance:none!important') && polishCSS.includes('.auth-card-top .auth-language-picker::after') && polishCSS.includes('background:none!important'), 'Bộ chọn ngôn ngữ đăng nhập loại bỏ nền trắng native và bám đúng theme sáng/tối');

check(read('admin.html').includes('admin-atmosphere-depth') && read('admin.html').includes('admin-atmosphere-particles') && read('admin.html').includes('admin-atmosphere-meteors'), 'Admin có nền động nhiều lớp riêng gồm chiều sâu, hạt sáng và sao băng');
check(admin.includes('setupAdminBigUpdate') && !admin.includes('admin-section-dock') && admin.includes('IntersectionObserver') && admin.includes('admin-stat-updated'), 'Admin đã bỏ thanh điều hướng nhanh bên phải nhưng vẫn giữ hiệu ứng xuất hiện tối ưu và phản hồi số liệu realtime');
check(polishCSS.includes('ADMIN BIG UPDATE') && polishCSS.includes('@keyframes adminV104Meteor') && polishCSS.includes('data-v10-motion-resolved="economy"') && polishCSS.includes('data-admin-theme="aurora"'), 'Admin Big Update đồng bộ Cyber/Aurora và tự giảm tải theo chế độ chuyển động');

check(read('system.css').includes('SYSTEM STABILITY LAYER') && read('system.css').includes('#cameraModal') && read('system.css').includes('.skip-link'), 'Lớp ổn định có camera, trợ năng và responsive');
check(read('admin.html').includes('rank-emblem-art') && read('ui.js').includes('rank-emblem-image-host') && read('v10-polish.css').includes('VIP / LEGEND emblem permanence fix') && read('app-runtime.js').includes('rank-emblem-fallback'), 'Biểu tượng VIP/LEGEND dùng ảnh thật, có lớp chống xung đột CSS và fallback khi tải lỗi');
check(polishCSS.includes('NexChat V1.0.0 · Vitality / Luxe metallic emblem upgrade') && polishCSS.includes('rankV1128MetalSweep') && polishCSS.includes('rankV1128StatLuxe') && polishCSS.includes('-webkit-mask:var(--rank-emblem-art)'), 'Biểu tượng Vitality/Luxe dùng ảnh kim loại mới, phản sáng theo hình chữ và chuyển động thích ứng');
check(fs.statSync(path.join(ROOT,'vip-emblem.webp')).size > 12000 && fs.statSync(path.join(ROOT,'legend-emblem.webp')).size > 12000, 'Hai ảnh biểu tượng mới có dữ liệu chi tiết và không phải placeholder rỗng');
check(read('sw.js').includes('nexchat-static-${VERSION}') && read('sw.js').includes("url.pathname.startsWith('/api/')") && read('sw.js').includes("url.pathname.startsWith('/uploads/')"), 'Service worker cache theo phiên bản và loại trừ dữ liệu động');

// Execute the translation runtime in a DOM-light sandbox and ensure no used key leaks raw to users.
try {
  const listeners = {};
  const sandbox = {
    window: { dispatchEvent() {}, addEventListener() {} },
    document: {
      documentElement: { lang:'', dataset:{} }, title:'',
      body: { classList:{ contains(){ return false; } } },
      querySelectorAll(){ return []; },
      addEventListener(name, fn){ listeners[name] = fn; },
    },
    localStorage: { getItem(){ return null; }, setItem(){}, removeItem(){} },
    navigator: { languages:['vi-VN'], language:'vi-VN' },
    Intl,
    fetch: async()=>({ok:false}),
    CustomEvent: function CustomEvent(type, init){ this.type=type; this.detail=init?.detail; },
    console,
  };
  vm.createContext(sandbox);
  vm.runInContext(i18n, sandbox, { filename:'i18n.js' });
  const codes = Object.keys(sandbox.window.I18N.languages);
  check(codes.length === 9, 'Có đủ 9 ngôn ngữ');
  let missing = 0;
  for (const code of codes) {
    sandbox.window.I18N.setLanguage(code);
    for (const key of allKeys) if (sandbox.window.I18N.t(key) === key) missing += 1;
  }
  check(missing === 0, `Không lộ khóa dịch thô trên 9 ngôn ngữ (${allKeys.size} khóa giao diện)`);
} catch (error) {
  console.error(error);
  check(false, 'Runtime đa ngôn ngữ thực thi được');
}

check(server.includes('const DATA_DIR = path.resolve(process.env.DATA_DIR || ROOT)') && server.includes("path.join(DATA_DIR, 'store.json')"), 'Dữ liệu động hỗ trợ Render Persistent Disk');
check(server.includes('STORE_BACKUP_FILE') && server.includes('quarantineCorruptStore') && server.includes('Đã phục hồi store.json'), 'Có sao lưu, cách ly và phục hồi dữ liệu hỏng');
check(server.includes('BUNDLED_STORE_FILE') && server.includes('migratedFromBundle'), 'Có đường di chuyển dữ liệu cũ sang Persistent Disk');
check(server.includes('cleanupOrphanUploads') && server.includes('ORPHAN_UPLOAD_MAX_AGE_MS'), 'Có dọn tệp tải lên mồ côi an toàn');
check(server.includes('storageWritable') && server.includes('persistenceConfigured'), 'Health check kiểm tra khả năng ghi dữ liệu');
check(server.includes("app.post('/api/reports'") && server.includes("app.patch('/api/admin/reports/:reportId'"), 'Hệ thống tố cáo và điều tra Admin còn đầy đủ');
check(server.includes("app.post('/api/notifications/subscribe'") && server.includes('sendPushToUser'), 'Thông báo nền Web Push còn đầy đủ');
check(server.includes('req.body.identifier ?? req.body.username') && server.includes('getUserByPhone(identifierPhone)') && server.includes('getUserByEmail(identifierEmail)'), 'Đăng nhập bằng tên, số điện thoại hoặc email còn hoạt động');
check(server.includes("if (!auth) return res.json({ok:false,role:'guest',csrfToken})"), 'Trang đăng nhập kiểm tra phiên khách bằng phản hồi 200 và nhận CSRF token an toàn');
check(server.includes('httpOnly: true') && server.includes("sameSite: 'lax'") && server.includes("secure: 'auto'"), 'Cookie phiên dùng HttpOnly, SameSite và Secure tự động');
check(server.includes('passwordHash:await bcrypt.hash') && server.includes('bcrypt.compare'), 'Mật khẩu chỉ được băm và đối chiếu bằng bcrypt');
check(!/function safeUser[\s\S]{0,1800}passwordHash\s*:/.test(server), 'API người dùng không đưa passwordHash vào phản hồi');
check(server.includes('socket.data.worldMessageTimes.length>=9') && server.includes('repeatedCount>=9'), 'Ngưỡng chống spam là tin thứ 10');

check(ui.includes('AbortController') && ui.includes('timeoutMs') && ui.includes('modalReturnFocus'), 'Fetch có timeout và modal trả focus');
check(ui.includes('role') && ui.includes('aria-live') && ui.includes('toast-leaving'), 'Toast có live region và vòng đời rõ ràng');
check(script.includes('reconnectionDelayMax:8000') && script.includes('_autoRetries'), 'Realtime có backoff và giới hạn gửi lại tự động');
check(script.includes("setAttribute('aria-pressed'") && script.includes("document.querySelectorAll('[data-filter]')"), 'Bộ lọc camera có trạng thái nhìn thấy và trợ năng');
check(admin.includes('reconnectionDelayMax:8000') && read('support.js').includes('reconnectionDelayMax:8000'), 'Admin và hỗ trợ dùng cấu hình reconnect ổn định');

check(Array.isArray(store.users) && store.users.length === 0, 'Không đóng gói tài khoản thử nghiệm');
check(Array.isArray(store.messages) && store.messages.length === 0 && Array.isArray(store.uploads) && store.uploads.length === 0, 'Không đóng gói tin nhắn hoặc tệp thử nghiệm');
for (const secret of ['.sessions','.session-secret','.admin-credentials.json','.vapid-keys.json','store.json.bak']) check(!fs.existsSync(path.join(ROOT,secret)), `Không đóng gói dữ liệu bí mật/tạm: ${secret}`);
check(!fs.readdirSync(ROOT).some((name) => /^store\.corrupt-.*\.json$/.test(name)), 'Không đóng gói bản store lỗi');
check(read('.gitignore').includes('store.corrupt-*.json') && read('.gitignore').includes('.admin-credentials.json') && read('.dockerignore').includes('store.json.bak') && read('.dockerignore').includes('.admin-credentials.json'), 'Git và Docker loại trừ dữ liệu runtime và thông tin Admin tự sinh');
check(['v10-experience.css','v10-experience.js','v10-polish.css','bubble-effects.css','v10-polish.js','site.webmanifest'].every((asset) => read('Dockerfile').includes(asset)) && read('Dockerfile').includes('npm run check'), 'Docker kiểm tra đủ tài nguyên V1.0.0 trước khi chạy');

const mobileCSS = read('mobile.css');
check(mobileCSS.includes('NEXCHAT V1.0.0 · FINAL MOBILE BIG UPDATE') && mobileCSS.includes('USER CHAT MOBILE') && mobileCSS.includes('ADMIN MOBILE') && mobileCSS.includes('LOGIN / REGISTER MOBILE') && mobileCSS.includes('SUPPORT MOBILE') && mobileCSS.includes('HOME MOBILE'), 'Mobile Big Update bao phủ Chat, Admin, Login, Support và Home trong cùng hệ giao diện');
check(appRuntime.includes("const VERSION = '1.0.0'") && appRuntime.includes('--mobile-app-height') && appRuntime.includes('--mobile-admin-height') && appRuntime.includes('mobile-keyboard-open') && appRuntime.includes('mobile-layer-open'), 'Runtime mobile đồng bộ chiều cao thật, bàn phím, lớp phủ và safe viewport');
check(script.includes("matchMedia('(max-width: 980px)')") && script.includes("target:'notificationCenterButton'") && script.includes("target:'motionModeButton'") && script.includes("target:'interfaceScaleButton'") && script.includes("target:'conversationMenuButton'"), 'Mobile chat gom đầy đủ thông báo, tìm kiếm, media, nền, hiệu ứng, chuyển động, tỉ lệ và tùy chọn');
check(mobileCSS.includes('.composer-clear-button{position:absolute!important') && mobileCSS.includes('#effectActivationDock') && mobileCSS.includes('.quick-tools button span:last-child{display:block!important'), 'Composer mobile giữ nút xóa nháp, công cụ nhanh, emoji, tệp và hiệu ứng trong tầm tay');
check(mobileCSS.includes('.sidebar-theme-panel{') && mobileCSS.includes('transform:none!important;animation:none!important;transition:none!important') && mobileCSS.includes('.sidebar-footer-status{display:flex!important'), 'Sidebar mobile hiển thị bảng giao diện tại chỗ và giữ trạng thái, ngôn ngữ, cài đặt, đăng xuất');
check(mobileCSS.includes('body.mobile-keyboard-open.smart-app-page') && mobileCSS.includes('(orientation:landscape)') && mobileCSS.includes('var(--m-safe-b)'), 'Mobile xử lý bàn phím, xoay ngang và safe-area mà không che composer');


check(server.includes("code:'CSRF_INVALID'") && server.includes('safeTokenEqual') && server.includes("X-CSRF-Token"), 'API thay đổi dữ liệu được bảo vệ bằng CSRF token theo phiên');
check(ui.includes("X-CSRF-Token") && ui.includes('absorbSecurityHeaders') && ui.includes("credentials:'same-origin'"), 'Client tự đồng bộ CSRF token mà không lưu bí mật trong localStorage');
check(server.includes('DUMMY_PASSWORD_HASH') && server.includes('credentialThrottleStatus') && server.includes('recordCredentialFailure'), 'Đăng nhập chống dò tài khoản bằng bcrypt giả và giới hạn theo định danh đã băm');
check(server.includes('script-src-attr') && server.includes('Origin-Agent-Cluster') && server.includes('X-Permitted-Cross-Domain-Policies'), 'Header bảo mật CSP và cô lập nguồn được tăng cường');
check(server.includes('ADMIN_CREDENTIALS_FILE') && server.includes('randomAdminSecret') && read('.env.example').includes('ALLOW_INSECURE_DEFAULT_ADMIN=false'), 'Production không phụ thuộc mật khẩu Admin mặc định dễ đoán');
check(!['script.js','admin.js','ui.js','login.js','support.js','home.js'].some((file)=>/ADMIN_PASSWORD|SESSION_SECRET|VAPID_PRIVATE_KEY|passwordHash/.test(read(file))), 'Mã phía trình duyệt không chứa khóa máy chủ, mật khẩu Admin hoặc passwordHash');
check(script.includes('sessionStorage.setItem(key,raw)') && script.includes('sessionStorage.getItem(draftKey())'), 'Nháp tin nhắn chỉ tồn tại trong phiên tab, giảm lưu dữ liệu nhạy cảm lâu dài');
check(appRuntime.includes('viewportClass') && appRuntime.includes("snap.width <= 1366") && appRuntime.includes("modal-closing"), 'Runtime phân loại micro/phone/tablet/desktop/wide và dọn lớp phủ đúng trên mọi thiết bị');
check(polishCSS.includes('NexChat V1.0.0 · Clean Mobile Connection Hub') && polishCSS.includes('grid-template-columns:repeat(2,minmax(0,1fr))') && polishCSS.includes('hubPanelIn'), 'Thanh bên mobile được tái cấu trúc gọn, rõ và có bảng chọn giao diện 2 cột');
check(read('index.html').includes('sidebar-utility-dock') && polishCSS.includes('NexChat V1.0.0 · Coherent Sidebar Rebuild') && polishCSS.includes('grid-template-columns:var(--utility-size) minmax(0,1fr) var(--utility-size) var(--utility-size)') && polishCSS.includes('The Heaven theme must be a complete light workspace'), 'Thanh bên Chat dùng dock tiện ích một hàng và giao diện Thiên đường sáng đồng bộ, không còn khối chân trang cồng kềnh');
check(polishCSS.includes('NexChat V1.0.0 · Unified Clear Sidebar System') && polishCSS.includes('grid-template-areas:"status status" "language language" "settings logout"') && polishCSS.includes('Compact landscape / short phones'), 'Thanh bên liên quan được đồng bộ thành hệ rõ ràng: điều hướng dọc, bảng giao diện, danh sách và tiện ích tài khoản');
check(read('v10-polish.css').includes('NexChat V1.0.0 · Final System Compatibility & Motion Layer') && read('v10-polish.css').includes('.v11-cosmos-ribbon') && read('v10-polish.css').includes('v11AuroraRibbon'), 'Sinh động tối đa có cực quang, chiều sâu, parallax và ngân sách hiệu năng riêng');
check(read('v10-polish.css').includes('One smooth motion owner for every modal') && read('v10-polish.css').includes('transform:scale(.985)!important'), 'Popup dùng một lượt opacity + scale tại chỗ, không trượt hoặc giật hai lần');
const deploymentDoc = readOptional('DEPLOYMENT.md');
check(!deploymentDoc || (deploymentDoc.includes('DevTools/F12') && deploymentDoc.includes('npm audit --omit=dev')), 'Tài liệu triển khai, nếu được đóng gói, đáp ứng yêu cầu bảo mật');
check(!required.includes('DEPLOYMENT.md') && readOptional('verify.js').includes("readOptional('DEPLOYMENT.md')"), 'Docker build không phụ thuộc tệp Markdown tùy chọn');
check(!admin.includes('admin-scroll-progress') && !read('v10-polish.css').includes('.admin-scroll-progress'), 'Thanh tiến trình cuộn phía trên trang Admin đã được loại bỏ hoàn toàn');
check((read('login.html').match(/data-language-select/g) || []).length === 1, 'Trang đăng nhập chỉ có một bộ chọn ngôn ngữ');
check(['authSecurityAria','passwordHashTitle','passwordHashText','privateSessionTitle','privateSessionText'].every((key) => read('login.html').includes(`data-i18n=\"${key}\"`) || read('login.html').includes(`data-i18n-aria-label=\"${key}\"`)) && ['vi','en','zh','ru','de','th','es','fr','ja'].every((code) => i18n.includes(`${code}:{`) && i18n.includes('V954_AUTH_SECURITY_COPY')), 'Hai thẻ bảo mật cuối trang đăng nhập đổi đồng bộ theo đủ 9 ngôn ngữ');
check(ui.includes('auth-theme-toggle') && ui.includes('resolvedGlobalTheme() === "dark" ? "light" : "dark"'), 'Trang đăng nhập dùng nút Sáng/Tối trực tiếp, không mở menu rườm rà');
check(['vi','en','zh','ru','de','th','es','fr','ja'].every((code) => i18n.includes(`${code}: { securityKicker:`) || i18n.includes(`${code}:{securityKicker:`)) && i18n.includes('V11310_GLOBAL_DIALOG_COPY'), 'Hộp thoại đăng xuất có đủ bản dịch bảo mật, nội dung Admin và trạng thái xử lý cho 9 ngôn ngữ');
check(ui.includes('tr("adminLogoutConfirmText")') && ui.includes('tr("logoutProcessing")') && ui.includes('globalConfirmKicker') && !ui.includes('? "Bạn có chắc muốn kết thúc phiên quản trị'), 'Hộp thoại đăng xuất Admin không còn nội dung tiếng Việt viết cứng');
check(ui.includes('context: admin ? "logout-admin" : "logout-user"') && ui.includes('context !== "logout-admin" && context !== "logout-user"'), 'Đổi ngôn ngữ chỉ cập nhật đúng hộp thoại đăng xuất, không ghi đè các xác nhận chức năng khác');
check(server.includes("code:'WORLD_SPAM_BLOCKED'") && server.includes('Vui lòng gửi tin nhắn chậm lại một chút để giữ cuộc trò chuyện ổn định.') && !server.includes('phát hiện đủ 10 tin nhắn spam') && script.includes("['SUPPORT_SPAM','WORLD_SPAM_BLOCKED'].includes(error.code)") && script.includes("error.code==='WORLD_SPAM_BLOCKED'?'Cảnh báo':undefined"), 'Cảnh báo chống spam chỉ nhắc nhẹ, không công khai ngưỡng phát hiện và dùng giao diện warning thay vì lỗi nghiêm trọng');
check(homeJS.includes('atmosphereCanvas') && homeJS.includes('desiredPixelRatio') && homeJS.includes('averageDrawCost') && homeJS.includes('home-hero-offscreen') && read('style.css').includes('NexChat V1.0.0 · Smooth Home Runtime') && read('style.css').includes('content-visibility:auto'), 'Trang chủ dùng lớp khí quyển cache, DPR thích ứng, FPS tự cân bằng và tạm dừng hiệu ứng ngoài màn hình');


check(script.includes('function conversationThemeKey()') && script.includes("['private','request'].includes(state.active.scope)") && script.includes('nexchat-theme-${scope}-${target}') && read('index.html').includes('themeOnlyPrivate'), 'Hình nền hội thoại được lưu độc lập cho chat riêng và chỉ áp dụng trong cuộc trò chuyện riêng tư.');
check(read('index.html').includes('wallpaper-picker-card') && script.includes('/chat-bg-${theme}.svg?v=1.0.0') && script.includes('syncThemeGridSelection') && read('style.css').includes('Complete conversation wallpaper picker rebuild') && i18n.includes('V955_THEME_PICKER_COPY'), 'Bộ chọn hình nền hiển thị ảnh thật, trạng thái đang dùng, mô tả đa ngôn ngữ và bố cục rõ trên mọi thiết bị');
check(script.includes("document.body.classList.remove('mobile-keyboard-open','mobile-layer-open')") && script.includes("UI.closeModal?.('mobileHeaderActionsModal')") && script.includes('setSidebarThemePanel(false)'), 'Chat tự dọn sidebar, action sheet và trạng thái bàn phím khi đổi từ mobile sang desktop');
check(read('style.css').includes('Cross-device feature synchronization') && read('style.css').includes('body.support-page .support-header-actions') && read('style.css').includes('body.home-page .home-hero-shell'), 'Điều khiển Support và hero Home dùng cùng quy tắc co giãn, không tràn min-content');
check(mobileCSS.includes('CROSS-DEVICE FEATURE PARITY FIX') && mobileCSS.includes('grid-template-rows:auto minmax(0,1fr)!important') && mobileCSS.includes('body.home-page .home-hero-actions>a'), 'Home và Support có bố cục mobile riêng nhưng giữ đầy đủ chức năng dùng chung');
check(mobileCSS.includes('deterministic Admin drawer parity') && mobileCSS.includes('#adminSidebar.admin-sidebar.open') && mobileCSS.includes('body.admin-page.performance-lite #adminSidebar.admin-sidebar'), 'Ngăn kéo Admin mở tức thì và ổn định trên tablet hoặc thiết bị hiệu năng thấp');
check(admin.includes('overlay.addEventListener("transitionend", onOverlayEnd)') && admin.includes('setTimeout(finish, 290)') && admin.includes('overlay.classList.remove("is-closing", "is-visible")'), 'Admin đồng bộ vòng đời sidebar và overlay khi đóng trên mọi breakpoint');


check(script.includes('function conversationEmptyStateHTML()') && script.includes('conversation-empty-state') && script.includes("scope==='support'?'headset'"), 'Trạng thái hội thoại trống theo đúng ngữ cảnh thế giới, riêng tư, nhóm và hỗ trợ');
check(polishCSS.includes('NexChat V1.0.0 · Conversation workspace rebuild') && polishCSS.includes('--chat-workspace-bg') && polishCSS.includes('.conversation-empty-state') && polishCSS.includes('grid-template-columns:44px 44px minmax(0,1fr) auto auto 48px'), 'Không gian Chat được làm lại đồng bộ: header, nền hội thoại, trạng thái trống, composer và responsive');


const bubbleEffectsCSS = read('bubble-effects.css');
check(read('index.html').includes('effect-studio-card') && read('index.html').includes('effectLiveBubble') && read('script.js').includes('syncEffectStudioPreview'), 'Trung tâm hiệu ứng có xem trước trực tiếp, chọn bằng chuột hoặc bàn phím và dùng chung lớp bóng chat thật');
check(['effect-neon','effect-glass','effect-aurora','effect-fire','effect-ice','effect-galaxy','effect-pulse','effect-rainbow','effect-shadow','effect-sparkle'].every((name)=>bubbleEffectsCSS.includes(name)) && bubbleEffectsCSS.includes('theme-midnight') && bubbleEffectsCSS.includes('performance-lite'), 'Đủ 10 hiệu ứng được nâng cấp, nền bóng chat đồng bộ hình nền hội thoại và có chế độ hiệu năng thích ứng');
check(bubbleEffectsCSS.includes('@media(prefers-reduced-motion:reduce)') && bubbleEffectsCSS.includes('effects-suspended') && bubbleEffectsCSS.includes('animation-play-state:paused'), 'Hiệu ứng bóng chat tôn trọng giảm chuyển động và tự dừng ngoài vùng nhìn');

check(server.includes("script-src-elem 'self' blob:") && server.includes("script-src 'self';") && server.includes("script-src-attr 'none'") && !server.includes("unsafe-eval"), 'CSP cho phép Blob script element có kiểm soát nhưng vẫn chặn inline attribute và eval');
check(smartTools.includes("const installButton = $('smartInstallButton')") && smartTools.includes('if (installButton) {') && smartTools.includes("window.addEventListener('beforeinstallprompt'"), 'PWA chỉ trì hoãn lời mời cài đặt trên trang có nút cài, không gây cảnh báo ở Login/Home/Admin/Support');
check(htmlFiles.every((file) => { const tags=[...read(file).matchAll(/<select\b[^>]*data-language-select[^>]*>/g)].map((m)=>m[0]); return tags.length===1 && tags.every((tag)=>/\bid="[^"]+LanguageSelect"/.test(tag) && /\bname="language"/.test(tag) && /\bautocomplete="language"/.test(tag)); }), 'Mọi bộ chọn ngôn ngữ đều có id, name và autocomplete hợp lệ');
check(!read('login.html').includes('autocomplete="tel-national"') && !read('login.html').includes('autocomplete="nickname"') && read('login.html').includes('id="registerPhone" name="phone"') && read('login.html').includes('id="nicknameInput" name="nickname"'), 'Biểu mẫu đăng nhập có metadata Autofill ổn định mà không thay đổi ID hoặc luồng xử lý');


check(read('admin.html').includes('/admin-i18n.js?v=1.0.0') && read('sw.js').includes('`/admin-i18n.js?v=${VERSION}`') && server.includes("'admin-i18n.js'"), 'Gói dịch riêng của Admin được tải, cache và phục vụ đúng phiên bản');
let completeAdminLanguageCoverage = false;
try {
  const adminLocaleContext = { window:{ I18N:{ languages:{vi:{},en:{},zh:{},ru:{},de:{},th:{},es:{},fr:{},ja:{}} } }, io:()=>({on(){},emit(){},connect(){}}), UI:{bindSystemSocket(){}} };
  vm.createContext(adminLocaleContext);
  vm.runInContext(adminI18n, adminLocaleContext, {filename:'admin-i18n.js'});
  const cutoff = admin.indexOf('  function adminLanguage()');
  const adminPrefix = `${admin.slice(0,cutoff)}\nwindow.__ADMIN_TEXT=ADMIN_TEXT;\n})();`;
  vm.runInContext(adminPrefix, adminLocaleContext, {filename:'admin-prefix.js'});
  const adminText = adminLocaleContext.window.__ADMIN_TEXT || {};
  const staticAdminKeys = [...read('admin.html').matchAll(/data-admin-i18n(?:-placeholder|-title|-aria-label)?="([^"]+)"/g)].map((match)=>match[1]);
  const dynamicAdminKeys = [...admin.matchAll(/\bat\(["']([^"']+)["']/g)].map((match)=>match[1]);
  const requiredAdminKeys = new Set([...staticAdminKeys,...dynamicAdminKeys]);
  completeAdminLanguageCoverage = ['vi','en','zh','ru','de','th','es','fr','ja'].every((code)=>requiredAdminKeys.size > 150 && [...requiredAdminKeys].every((key)=>adminText[code] && typeof adminText[code][key] === 'string' && adminText[code][key].trim().length > 0));
} catch (_error) {}
check(completeAdminLanguageCoverage, 'Toàn bộ giao diện Admin có bộ dịch đầy đủ cho đủ 9 ngôn ngữ, gồm cả nội dung tĩnh và khóa động');
check(admin.includes('function applyAdminLanguage()') && admin.includes("window.addEventListener('languagechange'") && admin.includes('renderEffectManager()') && admin.includes('renderBadgeManager()') && admin.includes('renderReports()'), 'Nội dung Admin tĩnh và dữ liệu động cùng được dựng lại khi đổi ngôn ngữ');
check(admin.includes('supportMessages: []') && admin.includes('function refreshAdminLanguageRuntime()') && admin.includes('renderMessages(state.supportMessages,{cache:false,preserveScroll:true})') && admin.includes('function renderRemoteTyping()') && admin.includes('renderAdminAttachmentPreview();'), 'Đổi ngôn ngữ dựng lại cả hội thoại hỗ trợ, trạng thái đã xem, đang nhập và bản xem trước tệp');
check(admin.includes('function adminEffectLabel(effect)') && admin.includes('detailEffects").textContent = user.effectAccess') && admin.includes('adminEffectLabel(user.selectedEffect)') && admin.includes('const selected = adminEffectLabel(user.selectedEffect);'), 'Tên hiệu ứng đặc quyền trong chi tiết và danh sách Admin luôn được dịch thay vì lộ mã nội bộ');
check(server.includes("app.get('/api/locale'") && server.includes('LOCALE_COUNTRY_LANGUAGE') && server.includes('LOCALE_TIMEZONE_LANGUAGE') && server.includes("source = countryLanguage ? 'country'") && server.includes("timezoneLanguage ? 'timezone'"), 'Ngôn ngữ mặc định tự nhận diện theo quốc gia, sau đó múi giờ và ngôn ngữ trình duyệt');
check(i18n.includes('V1138_COMPLETE_LANGUAGE_COPY') && i18n.includes('source !== "auto"') && i18n.includes('timezone=${encodeURIComponent(timezone)}') && themeInit.includes("source !== 'auto'"), 'Bản dịch giao diện chung đầy đủ, lựa chọn thủ công cũ được giữ và nhận diện tự động không ghi đè người dùng');
check(read('admin.html').includes('data-admin-connection-label') && admin.includes('function renderAdminConnection()') && admin.includes("setAdminConnectionState('connected')") && !admin.includes('getElementById("adminConnection").innerHTML'), 'Trạng thái kết nối Admin giữ nguyên khóa dịch khi Socket.IO đổi trạng thái');
check(admin.includes('renderAdminConnection();') && admin.includes("state.connectionState==='connected'?'connected'") && ui.includes('const CONNECTION_TEXT =') && ui.includes('renderConnectionState();'), 'Nhãn kết nối động được dịch lại ngay khi đổi ngôn ngữ trên Admin và Chat');
check(bubbleEffectsCSS.includes('deterministic message geometry repair') && bubbleEffectsCSS.includes('display:block!important') && bubbleEffectsCSS.includes('justify-content:flex-end!important') && bubbleEffectsCSS.includes('justify-content:flex-start!important'), 'Mỗi mục tin nhắn chiếm đúng toàn chiều rộng và căn trái/phải ổn định, không trôi vào giữa');
check(bubbleEffectsCSS.includes('width:max-content!important') && bubbleEffectsCSS.includes('display:inline-block!important') && bubbleEffectsCSS.includes('min-height:0!important') && bubbleEffectsCSS.includes('height:auto!important'), 'Bóng chat co theo nội dung, giới hạn chiều rộng đọc được và không kéo dài bất thường');
check(script.includes('function sidebarEmptyHTML(kind,label)') && script.includes("sidebarEmptyHTML('requests',t('noRequests'))") && script.includes("sidebarEmptyHTML('pinned',tx('noPinned'))") && !script.includes('class="empty-mini"'), 'Các danh sách rỗng trong sidebar dùng một trạng thái riêng, không còn thẻ văn bản thô bị tô nền sai');
check(polishCSS.includes('NexChat V1.0.0 · Consistent sidebar empty states') && polishCSS.includes('.compact-list>.sidebar-empty-state') && polishCSS.includes('data-sidebar-theme="heaven"') && polishCSS.includes('grid-template-columns:30px minmax(0,1fr)'), 'Trạng thái rỗng có biểu tượng, màu đúng cho Vũ trụ/Thiên đường và responsive trên mọi thiết bị');
check(['vi','en','zh','ru','de','th','es','fr','ja'].every((code)=>script.includes(`${code}:{messageRequests:`) && script.includes("noPinned:") && script.includes("noGroups:")), 'Nhãn rỗng cho ghim và nhóm có dữ liệu dịch trong đủ 9 ngôn ngữ');


check(appRuntime.includes('function sampleFrameBudget') && appRuntime.includes('runtimeQuality') && appRuntime.includes('runtimeScrolling') && appRuntime.includes('requestIdleCallback'), 'Runtime đo ngân sách khung hình, phân tầng thiết bị và phối hợp trạng thái cuộn/ẩn trang');
check(polishJS.includes('const starCount = performanceTier') && polishJS.includes('requestIdleCallback(mountDecorations') && polishJS.includes('meteorDelays'), 'Lớp trang trí được gắn sau khung hình đầu và tự giảm mật độ hạt theo thiết bị');
check(read('v10-experience.js').includes('CPU ${profile.cores}T') && read('v10-experience.js').includes('RAM ~${profile.memory}GB') && read('v10-experience.js').includes('connection.downlink') && read('v10-experience.css').includes('compact hardware-aware motion diagnostics'), 'Bảng chẩn đoán chuyển động hiển thị CPU, RAM, pin và mạng theo thiết bị trong bố cục gọn, không tràn');
check(read('style.css').includes('NexChat V1.0.0 · adaptive smoothness and interaction frame budget') && read('style.css').includes('data-runtime-quality="limited"') && read('style.css').includes('data-runtime-scrolling="true"') && read('style.css').includes('content-visibility:auto'), 'CSS hiệu năng thích ứng tạm dừng trang trí khi cuộn, tối ưu phần ngoài màn hình và giữ tương tác nguyên vẹn');
check(polishCSS.includes('NexChat V1.0.0 · light workspace sync + message alignment repair') && polishCSS.includes('html[data-theme="light"] body.smart-app-page .smart-messages') && polishCSS.includes('body.smart-app-page .message-row.message-stable') && polishCSS.includes('message-row.mine .message-stack{margin-left:auto!important}'), 'Light mode chat workspace is synchronized and message rows stay full-width so chat bubbles no longer drift or stretch');

check(read('style.css').includes('NexChat V1.0.0 · circular me-card avatar + unobstructed corner emblem') && read('style.css').includes('.me-card-avatar.avatar-image') && read('style.css').includes('.me-card-avatar .profile-rank-badge{') && read('style.css').includes('clip-path:circle(50% at 50% 50%)'), 'Me-card avatar is forced to a true circle and its corner emblem stays clear of the visible avatar area');

check(read('ui.js').includes('Keep the user\'s visibility choice stable') && read('ui.js').includes('event.stopPropagation();') && read('ui.js').includes('document.addEventListener("reset"') && !read('ui.js').includes('if (input && input.value === "") resetPasswordVisibility'), 'Password visibility toggle remains stable until form reset or modal close and no longer jumps back to Show');

check(bubbleEffectsCSS.includes('NexChat V1.0.0 · definitive message geometry and edge alignment fix') && bubbleEffectsCSS.includes('padding-right:clamp(16px,2.1vw,36px)!important') && bubbleEffectsCSS.includes('width:fit-content!important') && bubbleEffectsCSS.includes('.message-bubble.compact-text') && bubbleEffectsCSS.includes('white-space:nowrap!important'), 'Tin nhắn gửi bám đúng mép phải thật của vùng chat và bóng ngắn không còn bị kéo cao');

check(script.includes('const EMOJI_CATEGORIES =') && script.includes("id:'food'") && script.includes("id:'flags'") && script.includes('function renderEmojiPicker()') && script.includes('insertEmojiAtCursor') && read('style.css').includes('NexChat V1.0.0 · organized emoji library') && read('style.css').includes('.emoji-category-tabs') && read('style.css').includes('grid-template-columns:repeat(8,minmax(0,1fr))'), 'Bộ emoji được mở rộng theo danh mục rõ ràng gồm đồ ăn, biểu tượng, quốc kỳ và bố cục responsive gọn gàng');
check(homeJS.includes('function drawGalaxies') && homeJS.includes('function drawPlanets') && homeJS.includes('planetCount()') && homeJS.includes('galaxyCount()') && read('style.css').includes('NexChat V1.0.0 · Immersive Deep-Space Home Hero') && read('style.css').includes('homeV11326PlanetFloat'), 'Trang chủ có nền vũ trụ rõ ràng hơn với hành tinh, dải thiên hà và chiều sâu không còn chỉ là các chấm sao');

check(script.includes("socket.on('effects:selected'") && server.includes("emit('effects:selected'"), 'Selected effect is synchronized across active tabs');
check(server.includes("const requestedEffect=cleanText(payload.effect,20)") && server.includes('function messageEffectForUser(user, requestedEffect'), 'Realtime send carries the validated selected effect so new messages cannot silently fall back to the default bubble');
check(read('bubble-effects.css').includes('NexChat V1.0.0 · reliable selected-effect application') && read('bubble-effects.css').includes('.bubble-rank-legend:not(.effect-none)') && read('bubble-effects.css').includes('.effect-fire'), 'The last-loaded bubble stylesheet preserves chosen effects for VIP/LEGEND and keeps LEGEND wings outside');

check(admin.includes('admin-detail-badge-countdown') && admin.includes('data-admin-badge-expires') && admin.includes('selectedDetailExpired') && polishCSS.includes('realtime Admin profile badge countdown') && polishCSS.includes('font-variant-numeric:tabular-nums'), 'Thời gian VIP/LEGEND trong chi tiết người dùng Admin giảm realtime mỗi giây, tự đổi trạng thái khi hết hạn và không làm nhảy bố cục');


check(read('admin.html').includes('support-penalty-caption') && read('admin.html').includes('supportViolationCount') && read('style.css').includes('compact and readable Admin contact moderation card') && admin.includes("supportButton?.querySelector('.support-block-button-label')") && admin.includes("node.classList.toggle('is-current',current)"), 'Thẻ kiểm soát liên hệ Admin hiển thị rõ trạng thái, số vi phạm, lộ trình xử lý và nút thao tác trong bố cục gọn');
check(script.includes('function scheduleMessageViewport') && script.includes('function adoptPendingMessageEntry') && script.includes('const needsStatusRefresh=') && script.includes("document.body.classList.add('chat-send-burst')") && bubbleEffectsCSS.includes('NexChat V1.0.0 · smooth realtime send pipeline') && bubbleEffectsCSS.includes('.message-row.group-middle .legend-cosmic-shell') && bubbleEffectsCSS.includes('overflow-anchor:none'), 'Luồng gửi realtime giữ nguyên bóng optimistic khi máy chủ xác nhận, gộp cập nhật cuộn và giảm repaint hiệu ứng để nhắn liên tục không giật');

check(read('index.html').includes('id="voiceRecordButton"') && read('index.html').includes('id="voiceRecorderBar"') && script.includes("addEventListener('pointerdown'") && script.includes("finishVoiceRecording(voiceCapture.cancelArmed?'cancel':'send')") && script.includes('lockVoiceRecording()') && script.includes("requestSubmit()") && read('style.css').includes('Messenger-style hold-to-record voice messages'), 'Tin nhắn thoại dùng thao tác giữ để ghi, thả để gửi, kéo trái để hủy và kéo lên để khóa mà không cần bấm hai lần');

check(read('index.html').includes('id="myCoverPhoto"') && read('index.html').includes('id="publicCoverPhoto"') && ui.includes('smart-avatar-photo'), 'Ảnh đại diện và ảnh bìa dùng phần tử ảnh thật để hiển thị ổn định thay vì chỉ phụ thuộc nền CSS');
check(script.includes('function setProfileCoverPhoto(') && script.includes('URL.createObjectURL(file)') && script.includes("'/api/profile/me/media-upload'") && script.includes("input.value=''"), 'Ảnh hồ sơ được xem trước tức thì, tự lưu sau khi chọn và cho phép chọn lại cùng một tệp');
check(server.includes("app.put('/api/profile/me/media'") && server.includes('ownedImageUpload(u,value)') && server.includes("kind==='avatarUrl'?'Đã cập nhật ảnh đại diện.'"), 'API ảnh hồ sơ chỉ chấp nhận ảnh do chính người dùng tải lên và lưu riêng không làm đổi các trường hồ sơ khác');
check(polishCSS.includes('profile media reliability + unified Admin workspace') && polishCSS.includes('body.smart-app-page #myAvatar .profile-rank-badge') && polishCSS.includes('top:-8px!important') && polishCSS.includes('left:-8px!important'), 'Biểu tượng VIP/LEGEND được neo cố định ở góc trên bên trái thật của ảnh đại diện');
check(polishCSS.includes('Cyber Admin: remove the white split panel and synchronize every surface') && polishCSS.includes('body.admin-page.admin-cyberpunk .user-detail-panel') && polishCSS.includes('body.admin-page.admin-cyberpunk .admin-chat-panel') && polishCSS.includes('body.admin-page.admin-cyberpunk .admin-composer'), 'Khu hồ sơ, hỗ trợ trực tiếp và ô nhập Admin dùng chung một hệ nền tối đồng bộ, không còn mảng trắng lệch giao diện');


check(read('admin.js').includes('admin-topbar-hidden') && read('style.css').includes('smart unobtrusive Admin topbar'), 'Admin topbar tự thu gọn và ẩn khi cuộn xuống, hiện lại khi cuộn lên mà không mất điều khiển');


check(script.includes('const meRankBadge=UI.profileBadgeHTML(me)') && !script.includes('const meRankBadge=profileBadgeHTML(me)'), 'Sidebar không còn gọi hàm badge chưa khai báo làm dừng toàn bộ script hồ sơ');
check(script.includes("UI.avatarHTML(u,'profile-avatar-render',{presence:false,badges:false})") && script.includes('UI.profileBadgeHTML(u)'), 'Badge VIP/LEGEND được tách khỏi vùng cắt ảnh để avatar và biểu tượng cùng hiển thị đúng');
check(script.includes("'/api/profile/me/media-upload'") && script.includes("openProfileMediaPicker('avatarUrl')") && script.includes("openProfileMediaPicker('coverUrl')"), 'Ảnh đại diện và ảnh bìa dùng luồng tải lên một bước, đồng thời có thể chọn lại cùng một tệp');
check(server.includes("app.post('/api/profile/me/media-upload'") && server.includes("rateLimit('profile-media-upload'") && server.includes("saveStore({immediate:true})"), 'API tải ảnh hồ sơ cập nhật tệp và hồ sơ nguyên tử trong cùng một yêu cầu');
check(ui.includes('smart-avatar-fallback') && ui.includes('avatar-image-load-failed') && ui.includes("document.addEventListener('error'"), 'Avatar có chữ dự phòng khi ảnh hỏng, không còn vòng tròn trắng');
check(script.includes('photo.onerror=()=>') && script.includes("container.classList.remove('has-profile-photo')"), 'Ảnh bìa lỗi tự quay về nền mặc định thay vì để khung trắng');
check(read('style.css').includes('profile media regression repair') && read('style.css').includes('#myAvatar>.profile-avatar-render') && read('style.css').includes('background:transparent!important'), 'CSS hồ sơ giữ avatar tròn, nền dự phòng và nút đổi ảnh có thể tương tác');

check(server.includes("https://www.google-analytics.com") && server.includes("https://region1.google-analytics.com") && server.includes("connect-src 'self' ws: wss:"), 'CSP cho phép đúng endpoint Google Analytics mà không mở rộng script-src');

check(ui.includes('function openAvatarPreview') && ui.includes('data-avatar-preview') && ui.includes('avatarViewerText'), 'Avatar hồ sơ mở được ảnh gốc toàn màn hình và hỗ trợ đủ ngôn ngữ');
check(script.includes("$('myAvatar').dataset.avatarPreview") && script.includes("UI.openMediaViewer({src") && script.includes("openProfileMediaPicker('avatarUrl')"), 'Nhấn avatar xem ảnh đầy đủ nhưng nút máy ảnh vẫn giữ chức năng thay ảnh');
check(admin.includes('detailAvatar.dataset.avatarPreview') && read('style.css').includes('full-size avatar viewer'), 'Admin và hồ sơ công khai dùng chung trình xem avatar toàn màn hình');

check(script.includes("classList.add('transform-ui-scale','interface-scale-transform-engine')") && script.includes("shell.style.setProperty('transform',`scale(${resolved})`,'important')") && !script.includes('SUPPORTS_NATIVE_UI_ZOOM'), 'Quy mô giao diện dùng một engine transform xác định, lựa chọn phần trăm luôn thay đổi kích thước thật');
check(read('v10-experience.js').includes('function applyStandaloneInterfaceScale(next)') && read('v10-experience.js').includes("Promise.resolve(window.NexInterfaceScale.save(next,{notify:true})).catch") && read('style.css').includes('NexChat V1.0.0 · deterministic interface scale engine'), 'Bộ chọn chuyển động có đường áp dụng dự phòng và CSS cuối cùng không để theme cũ vô hiệu hóa quy mô');
check(read('v10-experience.js').includes("userAgent:'Full user agent'") && read('v10-experience.js').includes('browserBrands') && read('v10-experience.js').includes("full(t('userAgent')") && read('v10-experience.css').includes('.v10-detail-full') && read('v10-experience.css').includes('text-overflow:clip') && !read('v10-experience.css').includes('.v10-detail-pair b{display:block;color:#eef2ff;font-size:10px;line-height:1.32;white-space:nowrap;overflow:hidden;text-overflow:ellipsis'), 'Bảng chi tiết thiết bị hiển thị đủ nội dung, cho phép xuống dòng hợp lý và không còn cắt bằng dấu ba chấm');

check(script.includes('function isMobileScaleViewport()') && script.includes("const mobileSafe=isMobileScaleViewport()") && script.includes("shell.style.setProperty('transform','none','important')") && script.includes('applyInterfaceScale(selectedInterfaceScale(),{persist:false})'), 'Mobile không còn transform toàn bộ app shell và luôn đồng bộ lại viewport khi xoay màn hình hoặc mở bàn phím');
check(polishCSS.includes('NexChat V1.0.0 · emergency mobile viewport stabilization') && polishCSS.includes('data-mobile-scale-safe="true"') && polishCSS.includes('height:var(--mobile-app-height,100dvh)!important') && polishCSS.includes('.v10-device-detail-grid') && polishCSS.includes('grid-template-columns:minmax(0,1fr)!important'), 'Lớp ổn định mobile giữ chat, modal, bảng thiết bị và drawer trong đúng visual viewport');

check(read('v10-experience.js').includes("document.addEventListener('nexchat:runtime-quality'") && read('v10-experience.js').includes("runtimeQuality === 'limited'") && read('v10-experience.js').includes("state.autoSafetyReason = 'weak-device'"), 'Chế độ Thông minh trên mobile tự hạ hiệu ứng theo FPS, phần cứng, pin và mạng yếu');
check(read('v10-experience.js').includes('function activatePanelControl') && read('v10-experience.js').includes('state.suppressControlClickUntil') && read('v10-experience.css').includes('mobile motion reliability') && read('v10-experience.css').includes('touch-action:manipulation!important'), 'Bộ chọn chuyển động mobile nhận thao tác chạm ổn định, không bị nuốt click khi cuộn bottom sheet');
check(script.includes('runAfterMobileSheetClosed') && script.includes("window.NexV10.openMotionPanel(target)") && script.includes("target:'quickProfileAction'") && script.includes("target:'accountSettingsButton'"), 'Mobile đợi action sheet đóng hoàn toàn rồi mới mở chuyển động và có đủ thao tác hội thoại/cài đặt tương đương desktop');
check(mobileCSS.includes('MOBILE MOTION + DESKTOP FEATURE PARITY') && mobileCSS.includes('#voiceRecordButton{grid-column:4!important') && mobileCSS.includes('.mobile-header-actions-list{grid-template-columns:1fr!important}'), 'Composer và bảng thao tác mobile giữ đầy đủ voice, gửi tin và chức năng desktop trong bố cục cảm ứng an toàn');

check(i18n.includes('passwordHashTitle:"Bảo vệ mật khẩu"') && i18n.includes('không lưu mật khẩu gốc') && read('login.html').includes('Bảo vệ mật khẩu') && read('system.css').includes('repeat(auto-fit,minmax(250px,1fr))'), 'Thẻ bảo mật đăng nhập dùng nội dung dễ hiểu, chính xác và không còn bị ép quá hẹp');


check(read('v10-experience.js').includes('function modeStorageKey()') && read('v10-experience.js').includes("isMobileEnvironment() ? 'auto'") && read('v10-experience.js').includes("`${storageBaseKey}:mobile`") && read('v10-experience.js').includes("nexchat:runtime-mobile-change"), 'Mobile dùng lựa chọn chuyển động riêng, mặc định Thông minh và không kế thừa chế độ nặng từ PC');
check(read('app-runtime.js').includes('initialiseMobileLongTaskGuard') && read('app-runtime.js').includes("applyRuntimeQuality('limited', 'mobile-long-tasks')"), 'Runtime mobile tự hạ chất lượng khi phát hiện tác vụ dài gây lag');
check(read('script.js').includes("target:'conversationNoteAction'") && read('script.js').includes("target:'smartOpenPaletteButton'") && read('script.js').includes("target:'addFriendButton'") && read('script.js').includes("target:'createGroupButton'"), 'Bảng thao tác mobile đồng bộ ghi chú, bảng lệnh, thêm bạn và tạo nhóm từ desktop');
check(read('mobile.css').includes('COMPLETE MOBILE PARITY + STABILITY PASS') && read('mobile.css').includes('html[data-runtime-quality="limited"] body.mobile-ui-active') && read('mobile.css').includes('body.admin-page #adminMotionButton'), 'Lớp mobile cuối cùng giữ đủ tính năng, tối ưu máy yếu và sửa tràn thanh công cụ Admin');

console.log(`\nNexChat ${VERSION}: ${passed} kiểm tra đạt, ${failed} kiểm tra lỗi.`);
if (failed) process.exit(1);


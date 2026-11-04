'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const pkg = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));
const server = read('server.js');

test('release metadata and lockfile agree on NexChat 1.0.0', () => {
  assert.equal(pkg.name, 'nexchat');
  assert.equal(pkg.version, '1.0.0');
  assert.equal(lock.name, 'nexchat');
  assert.equal(lock.version, '1.0.0');
  assert.equal(lock.packages[''].version, '1.0.0');
  assert.equal(pkg.engines.node, '24.x');
});

test('security-sensitive dependencies are pinned to patched release lines', () => {
  const expected = {
    multer: '2.5.0',
    'socket.io': '4.8.4',
    'engine.io': '6.6.11',
    'socket.io-parser': '4.2.7',
    'body-parser': '2.4.0',
    compression: '1.8.2',
    'proxy-addr': '2.0.8',
    qs: '6.17.0'
  };
  for (const [name, version] of Object.entries(expected)) {
    assert.equal(lock.packages['node_modules/' + name]?.version, version, name + ' must be patched');
    assert.match(lock.packages['node_modules/' + name]?.integrity || '', /^sha512-/);
  }
  for (const [name, version] of Object.entries({
    'body-parser': '2.4.0', 'proxy-addr': '2.0.8', qs: '6.17.0',
    'engine.io': '6.6.11', 'socket.io-parser': '4.2.7'
  })) assert.equal(pkg.overrides[name], version);
  assert.equal(pkg.dependencies.compression, '^1.8.2');
});

test('Docker uses a supported Node LTS and a dedicated persistent data directory', () => {
  const docker = read('Dockerfile');
  assert.match(docker, /^FROM node:24-alpine/m);
  assert.match(docker, /DATA_DIR=\/data/);
  assert.match(docker, /store\.seed\.json/);
  assert.doesNotMatch(docker, /test -f \/app\/store\.json/);
  assert.match(read('.nvmrc').trim(), /^24$/);
});

test('runtime database, uploads, and credentials are excluded from source/container context', () => {
  for (const content of [read('.gitignore'), read('.dockerignore')]) {
    assert.match(content, /store\.json/);
    assert.match(content, /uploads/);
    assert.match(content, /\.admin-credentials\.json/);
    assert.match(content, /\.session-secret/);
    assert.match(content, /\.sessions/);
  }
  assert.equal(fs.existsSync(path.join(root, 'store.json')), false);
  const seed = JSON.parse(read('store.seed.json'));
  assert.deepEqual(seed.users, []);
  assert.deepEqual(seed.messages, []);
  assert.deepEqual(seed.uploads, []);
});

test('old local store is migrated before the clean seed is used', () => {
  const legacyRead = server.indexOf("readStoreCandidate(path.join(ROOT, 'store.json'))");
  const seedRead = server.indexOf('readStoreCandidate(BUNDLED_STORE_FILE)');
  assert.notEqual(legacyRead, -1);
  assert.notEqual(seedRead, -1);
  assert.ok(legacyRead < seedRead, 'legacy user data must take precedence over a blank seed');
  assert.match(server, /migratedFromLegacyRoot/);
});

test('production refuses to store user state in the deployable application directory', () => {
  assert.match(server, /NODE_ENV === 'production' && !process\.env\.DATA_DIR/);
  assert.match(server, /DATA_DIR ph\u1ea3i \u0111\u01b0\u1ee3c c\u1ea5u h\u00ecnh ri\u00eang trong production/);
});

test('recovery sends SMS only after matching the submitted phone and account', () => {
  const start = server.indexOf("app.post('/api/recovery/start'");
  const verify = server.indexOf("app.post('/api/recovery/verify'");
  const block = server.slice(start, verify);
  assert.match(block, /const candidate = getUserByPhone\(phone\)/);
  assert.match(block, /if \(!candidateMatches\) return res\.json/);
  assert.ok(block.indexOf('if (!candidateMatches)') < block.indexOf("twilioVerifyRequest('Verifications'"));
  assert.match(block, /RECOVERY_CODE_TTL_MS/);
  assert.match(server, /RECOVERY_CODE_MAX_ATTEMPTS/);
});

test('recovery cannot be enabled without a real Twilio Verify configuration', () => {
  assert.match(server, /TWILIO_VERIFY_CONFIGURED/);
  assert.match(server, /RECOVERY_NOT_CONFIGURED/);
  assert.match(server, /VerificationCheck/);
  assert.match(read('.env.example'), /TWILIO_VERIFY_SERVICE_SID/);
});

test('logout and every inbound Socket.IO event enforce session invalidation', () => {
  assert.match(server, /function disconnectSessionSockets\(sessionId\)/);
  assert.match(server, /app\.post\('\/api\/logout'[\s\S]*?disconnectSessionSockets\(sid\)/);
  assert.match(server, /socket\.use\(\(_packet,next\)=>\{[\s\S]*?isSocketSessionActive\(socket\)/);
  assert.match(server, /socketSessionSweep/);
  assert.match(server, /if \(!userHasActiveSession\(user, req\.sessionID\)\)/);
  assert.match(server, /if \(!user \|\| restrictionPayload\(user\)\) return false/);
  assert.match(server, /persistedAuth\.role !== auth\.role/);
  assert.match(server, /function requireSupportAccess[\s\S]*?userHasActiveSession\(user, req\.sessionID\)/);
  assert.match(server, /auth\.role==='user' && !userHasActiveSession\(user,req\.sessionID\)/);
});

test('upload endpoints apply per-user and global quota after file verification', () => {
  assert.match(server, /MAX_USER_UPLOAD_BYTES/);
  assert.match(server, /MAX_TOTAL_UPLOAD_BYTES/);
  assert.match(server, /limits: \{ fileSize: MAX_UPLOAD_SIZE, files: 1, fields: 20/);
  assert.match(server, /verifyUpload, enforceUploadQuota/);
});

test('store persistence no longer silently truncates user history', () => {
  assert.match(server, /function trimStoreForSave\(\)\s*\{\s*\/\/[\s\S]*?permanent data loss\./);
  assert.doesNotMatch(server, /store\.messages\s*=\s*store\.messages\.slice\(-12000\)/);
});

test('versioned recovery UI is wired to the two-step API', () => {
  const html = read('login.html');
  const js = read('login.js');
  assert.match(html, /id="recoveryCodeStep"/);
  assert.match(html, /autocomplete="one-time-code"/);
  assert.match(js, /\/api\/recovery\/start/);
  assert.match(js, /\/api\/recovery\/verify/);
});

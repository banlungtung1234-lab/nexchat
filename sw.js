'use strict';

const VERSION = '1.0.0';
const STATIC_CACHE = `nexchat-static-${VERSION}`;
const FALLBACK_ICON = `/nexchat-logo.svg?v=${VERSION}`;
const STATIC_ASSETS = [
  FALLBACK_ICON,
  `/style.css?v=${VERSION}`,
  `/mobile.css?v=${VERSION}`,
  `/system.css?v=${VERSION}`,
  `/smart-tools.css?v=${VERSION}`,
  `/v10-experience.css?v=${VERSION}`,
  `/v10-polish.css?v=${VERSION}`,
  `/bubble-effects.css?v=${VERSION}`,
  `/smart-tools.js?v=${VERSION}`,
  `/v10-experience.js?v=${VERSION}`,
  `/v10-polish.js?v=${VERSION}`,
  `/theme-init.js?v=${VERSION}`,
  `/app-runtime.js?v=${VERSION}`,
  `/i18n.js?v=${VERSION}`,
  `/admin-i18n.js?v=${VERSION}`,
  `/ui.js?v=${VERSION}`,
  `/site.webmanifest?v=${VERSION}`,
  `/vip-emblem.webp?v=${VERSION}`,
  `/legend-emblem.webp?v=${VERSION}`,
  `/admin-nebula.jpg?v=${VERSION}`,
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    await Promise.all(STATIC_ASSETS.map(async (asset) => {
      try { await cache.add(new Request(asset, { cache:'reload' })); } catch {}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith('nexchat-static-') && key !== STATIC_CACHE).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/uploads/') || url.pathname.startsWith('/socket.io/')) return;
  const staticRequest = url.searchParams.get('v') === VERSION
    || /\.(?:css|js|svg|webp|png|jpg|jpeg|gif|webmanifest)$/.test(url.pathname);
  if (!staticRequest) return;
  event.respondWith((async () => {
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(request);
    const network = fetch(request).then((response) => {
      if (response.ok && response.type === 'basic') cache.put(request, response.clone()).catch(() => {});
      return response;
    }).catch(() => null);
    return cached || await network || new Response('', { status:504, statusText:'Offline' });
  })());
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'NexChat';
  const important = ['account-restricted','report-action','security'].includes(data.type) || data.requireInteraction === true;
  const options = {
    body: data.body || 'Bạn có thông báo mới.',
    icon: data.icon || FALLBACK_ICON,
    badge: data.badge || FALLBACK_ICON,
    tag: data.tag || `nexchat-${data.type || 'notification'}`,
    renotify: Boolean(data.renotify),
    silent: Boolean(data.silent),
    timestamp: Number(data.timestamp) || Date.now(),
    requireInteraction: important,
    actions: [{ action:'open', title:'Mở NexChat' }, { action:'dismiss', title:'Đóng' }],
    data: { url: data.url || '/chat', type:data.type || 'notification', ...(data.data || {}) },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  const target = new URL(event.notification.data?.url || '/chat', self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type:'window', includeUncontrolled:true }).then(async (windows) => {
    const exact = windows.find((client) => client.url === target);
    if (exact) return exact.focus();
    const sameOrigin = windows.find((client) => client.url.startsWith(self.location.origin));
    if (sameOrigin) {
      if ('navigate' in sameOrigin) await sameOrigin.navigate(target);
      return sameOrigin.focus();
    }
    return self.clients.openWindow(target);
  }));
});

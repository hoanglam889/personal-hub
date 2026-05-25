const CACHE_NAME = 'lams-hub-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg'
];

// Lắng nghe sự kiện cài đặt để cache các file tĩnh cơ bản
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Kích hoạt service worker mới
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Cache-first chiến lược cho tài nguyên tĩnh
self.addEventListener('fetch', (e) => {
  // Bỏ qua các API kết nối tới backend (để dữ liệu tài chính luôn mới)
  if (e.request.url.includes('/api/')) {
    return;
  }
  
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    })
  );
});

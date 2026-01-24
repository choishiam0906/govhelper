// GovHelper Service Worker
const CACHE_NAME = 'govhelper-v1';
const STATIC_CACHE = 'govhelper-static-v1';
const DYNAMIC_CACHE = 'govhelper-dynamic-v1';

// 정적 자원 캐싱 (앱 셸)
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// 캐시하지 않을 경로
const EXCLUDE_PATHS = [
  '/api/',
  '/auth/',
  '/admin/',
  '/_next/webpack-hmr',
  '/sw.js',
];

// 설치 이벤트
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.log('[SW] Failed to cache some assets:', err);
      });
    })
  );
  self.skipWaiting();
});

// 활성화 이벤트 - 오래된 캐시 삭제
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch 이벤트 - Network First with Cache Fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 다른 도메인 요청은 무시
  if (url.origin !== location.origin) {
    return;
  }

  // 제외 경로는 네트워크만 사용
  if (EXCLUDE_PATHS.some((path) => url.pathname.startsWith(path))) {
    return;
  }

  // GET 요청만 캐싱
  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    // Network First 전략
    fetch(request)
      .then((response) => {
        // 성공적인 응답은 캐시에 저장
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // 네트워크 실패 시 캐시에서 반환
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // 캐시에도 없으면 오프라인 페이지 반환
          if (request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/offline');
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// 푸시 알림 이벤트 (향후 FCM 연동용)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || '새로운 알림이 있어요',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
    actions: [
      { action: 'open', title: '열기' },
      { action: 'close', title: '닫기' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'GovHelper', options)
  );
});

// 알림 클릭 이벤트
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // 이미 열린 창이 있으면 포커스
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // 없으면 새 창 열기
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

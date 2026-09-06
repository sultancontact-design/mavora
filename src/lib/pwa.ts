/**
 * Mavora - PWA Configuration & Service Worker
 * Arabic Marketplace Platform (Morocco)
 * 
 * Progressive Web App features:
 * - Service worker for offline support
 * - Web App Manifest
 * - Push notifications
 * - Install prompt handling
 */

// =============================================================================
// Manifest Configuration / إعداد البيان
// =============================================================================

export const manifest = {
  name: 'مافورا - سوق عربي للمغرب',
  short_name: 'مافورا',
  description: 'سوق عربي إلكتروني للمغرب - اشترِ وبيع بكل سهولة',
  start_url: '/',
  display: 'standalone' as const,
  background_color: '#ffffff',
  theme_color: '#7C3AED', // primary-600
  orientation: 'portrait-primary' as const,
  scope: '/',
  lang: 'ar-MA',
  dir: 'rtl' as const,
  categories: ['shopping', 'marketplace'],
  icons: [
    {
      src: '/icons/icon-72x72.png',
      sizes: '72x72',
      type: 'image/png',
      purpose: 'maskable any',
    },
    {
      src: '/icons/icon-96x96.png',
      sizes: '96x96',
      type: 'image/png',
      purpose: 'maskable any',
    },
    {
      src: '/icons/icon-128x128.png',
      sizes: '128x128',
      type: 'image/png',
      purpose: 'maskable any',
    },
    {
      src: '/icons/icon-144x144.png',
      sizes: '144x144',
      type: 'image/png',
      purpose: 'maskable any',
    },
    {
      src: '/icons/icon-152x152.png',
      sizes: '152x152',
      type: 'image/png',
      purpose: 'maskable any',
    },
    {
      src: '/icons/icon-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'maskable any',
    },
    {
      src: '/icons/icon-384x384.png',
      sizes: '384x384',
      type: 'image/png',
      purpose: 'maskable any',
    },
    {
      src: '/icons/icon-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable any',
    },
  ],
  shortcuts: [
    {
      name: 'تصفح الإعلانات',
      short_name: 'الإعلانات',
      description: 'تصفح أحدث الإعلانات',
      url: '/listings',
      icons: [{ src: '/icons/browse-icon.png', sizes: '96x96' }],
    },
    {
      name: 'إضافة إعلان',
      short_name: 'إضافة',
      description: 'أضف إعلاناً جديداً',
      url: '/listings/create',
      icons: [{ src: '/icons/add-icon.png', sizes: '96x96' }],
    },
    {
      name: 'الرسائل',
      short_name: 'الرسائل',
      description: 'عرض الرسائل',
      url: '/messages',
      icons: [{ src: '/icons/messages-icon.png', sizes: '96x96' }],
    },
  ],
  screenshots: [
    {
      src: '/screenshots/home.png',
      sizes: '1280x720',
      type: 'image/png',
      form_factor: 'wide' as const,
      label: 'الصفحة الرئيسية - مافورا',
    },
    {
      src: '/screenshots/listing.png',
      sizes: '1280x720',
      type: 'image/png',
      form_factor: 'wide' as const,
      label: 'صفحة الإعلان - مافورا',
    },
  ],
  related_applications: [],
  prefer_related_applications: false,
};

// =============================================================================
// Service Worker / عامل الخدمة
// =============================================================================

/**
 * Service worker code (would be saved as public/sw.js)
 */
export const SERVICE_WORKER_CODE = `
// Mavora Service Worker
const CACHE_NAME = 'mavora-v1';
const STATIC_CACHE = 'mavora-static-v1';
const DYNAMIC_CACHE = 'mavora-dynamic-v1';

// Assets to pre-cache
const PRECACHE_URLS = [
  '/',
  '/offline',
  '/manifest.json',
  // Add other critical assets
];

// Install event - pre-cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip external requests (except API)
  if (!request.url.startsWith(self.location.origin) && !request.url.includes('/api/')) return;

  // For navigation requests (HTML)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => {
          // Fallback to cached version or offline page
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || caches.match('/offline');
          });
        })
    );
    return;
  }

  // For API requests - network only with timeout
  if (request.url.includes('/api/')) {
    event.respondWith(
      Promise.race([
        fetch(request),
        new Promise((_, reject) => setTimeout(reject, 5000))
      ]).catch(() => {
        // Return cached API response or error
        return caches.match(request).then((cached) => {
          return cached || new Response(JSON.stringify({ error: 'أنت غير متصل بالإنترنت' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          });
        });
      })
    );
    return;
  }

  // For static assets - cache first, then network
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Update cache in background
        fetch(request).then((response) => {
          if (response.ok) {
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, response));
          }
        });
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, responseClone));
        }
        return response;
      });
    })
  );
});

// Push notification handler
self.addEventListener('push', (event) => {
  let data = {
    title: 'مافورا',
    body: 'إشعار جديد',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: {},
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, data)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url || '/');
      }
    })
  );
});

// Background sync handler
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  } else if (event.tag === 'sync-listings') {
    event.waitUntil(syncListings());
  }
});

async function syncMessages() {
  // Sync pending messages when back online
  console.log('[SW] Syncing messages...');
}

async function syncListings() {
  // Sync pending listings when back online
  console.log('[SW] syncing listings...');
}
`;

// =============================================================================
// PWA Utilities / أدوات PWA
// =============================================================================

/**
 * Check if PWA is installed
 */
export function isPWAInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://');
}

/**
 * Register service worker
 */
export async function registerServiceWorker(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  if (!('serviceWorker' in navigator)) {
    console.warn('[PWA] Service workers not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    
    console.log('[PWA] Service worker registered:', registration.scope);
    
    // Listen for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.controller) {
            // New content available, show update prompt
            window.dispatchEvent(new CustomEvent('pwa-update-available'));
          }
        });
      }
    });
    
    return true;
  } catch (error) {
    console.error('[PWA] Service worker registration failed:', error);
    return false;
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('[PWA] Notifications not supported');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  const permission = await Notification.requestPermission();
  
  if (permission === 'granted') {
    console.log('[PWA] Notification permission granted');
  }
  
  return permission;
}

/**
 * Show local notification
 */
export function showNotification(
  title: string,
  options?: NotificationOptions
): Notification | null {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return null;
  }

  return new Notification(title, {
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    dir: 'rtl',
    lang: 'ar-MA',
    ...options,
  });
}

/**
 * Get install prompt event
 */
export function getInstallPrompt(): Promise<BeforeInstallPromptEvent | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(null);
      return;
    }

    let deferredPrompt: BeforeInstallPromptEvent | null = null;

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
      window.removeEventListener('beforeinstallprompt', handler);
      resolve(deferredPrompt);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Resolve null after a timeout if no event fired
    setTimeout(() => {
      window.removeEventListener('beforeinstallprompt', handler);
      resolve(deferredPrompt);
    }, 5000);
  });
}

/**
 * Prompt user to install PWA
 */
export async function promptInstall(
  deferredPrompt: BeforeInstallPromptEvent
): Promise<boolean> {
  try {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('[PWA] User installed the app');
      return true;
    } else {
      console.log('[PWA] User dismissed the install prompt');
      return false;
    }
  } catch (error) {
    console.error('[PWA] Install prompt error:', error);
    return false;
  }
}

// =============================================================================
// Offline Page Content / محتوى صفحة عدم الاتصال
// =============================================================================

export const OFFLINE_PAGE_HTML = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>غير متصل بالإنترنت - مافورا</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-align: center;
      padding: 20px;
    }
    .container {
      max-width: 400px;
    }
    .icon {
      font-size: 80px;
      margin-bottom: 20px;
    }
    h1 {
      font-size: 24px;
      margin-bottom: 10px;
    }
    p {
      opacity: 0.9;
      margin-bottom: 20px;
      line-height: 1.6;
    }
    button {
      background: white;
      color: #667eea;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      font-weight: 600;
    }
    button:hover {
      transform: scale(1.05);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">📡</div>
    <h1>غير متصل بالإنترنت</h1>
    <p>يبدو أنك غير متصل بالإنترنت. تحقق من اتصالك وحاول مرة أخرى.</p>
    <button onclick="window.location.reload()">إعادة المحاولة</button>
  </div>
</body>
</html>`;

// =============================================================================
// Export Default / التصدير الافتراضي
// =============================================================================

export default {
  manifest,
  serviceWorkerCode: SERVICE_WORKER_CODE,
  registerServiceWorker,
  requestNotificationPermission,
  showNotification,
  getInstallPrompt,
  promptInstall,
  isPWAInstalled,
  offlinePageHTML: OFFLINE_PAGE_HTML,
};

/**
 * Mavora Service Worker
 * Provides offline support and caching for PWA
 * 
 * @version 1.0.0
 */

const CACHE_NAME = 'mavora-v1';
const STATIC_CACHE_NAME = 'mavora-static-v1';
const DYNAMIC_CACHE_NAME = 'mavora-dynamic-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// API endpoints to cache with network-first strategy
const API_CACHE_URLS = [
  '/api/listings',
  '/api/categories',
  '/api/cities',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name !== STATIC_CACHE_NAME && 
                     name !== DYNAMIC_CACHE_NAME &&
                     name.startsWith('mavora-');
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip external requests (except Supabase)
  if (!url.hostname.includes('vercel.app') && 
      !url.hostname.includes('supabase.co') &&
      !url.hostname.includes('localhost')) {
    return;
  }

  // Strategy selection based on request type
  if (isAPIRequest(url)) {
    // Network-first for API calls
    event.respondWith(networkFirst(request, DYNAMIC_CACHE_NAME));
  } else if (isStaticAsset(url)) {
    // Cache-first for static assets
    event.respondWith(cacheFirst(request, STATIC_CACHE_NAME));
  } else {
    // Stale-while-revalidate for other requests
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE_NAME));
  }
});

/**
 * Check if request is for an API endpoint
 */
function isAPIRequest(url) {
  return url.pathname.startsWith('/api/');
}

/**
 * Check if request is for a static asset
 */
function isStaticAsset(url) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.woff', '.woff2'];
  return staticExtensions.some(ext => url.pathname.endsWith(ext));
}

/**
 * Network-first strategy
 */
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html') || new Response('Offline', { status: 503 });
    }
    
    return new Response('Network error', { status: 503 });
  }
}

/**
 * Cache-first strategy
 */
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Cache and network failed for:', request.url);
    return new Response('Resource not available', { status: 404 });
  }
}

/**
 * Stale-while-revalidate strategy
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  // Fetch in background to update cache
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch((error) => {
      console.log('[SW] Background update failed:', error);
      return null;
    });

  // Return cached version immediately, or wait for network
  return cachedResponse || (await fetchPromise) || new Response('Not available', { status: 503 });
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-favorites') {
    event.waitUntil(syncFavorites());
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');
  
  let data = {
    title: 'مافورة',
    body: 'إشعار جديد',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-icon.png',
    data: { url: '/' },
  };
  
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  event.showNotification(data.title, {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    data: data.data,
    dir: 'rtl',
    lang: 'ar',
  });
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  
  event.notification.close();
  
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
  );
});

/**
 * Sync favorites when back online
 */
async function syncFavorites() {
  console.log('[SW] Syncing favorites...');
}

/**
 * Sync messages when back online
 */
async function syncMessages() {
  console.log('[SW] Syncing messages...');
}

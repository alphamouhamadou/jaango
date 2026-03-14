// Jaango - Service Worker for Push Notifications
const CACHE_NAME = 'jaango-cache-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installed');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activated');
  event.waitUntil(self.clients.claim());
});

// Push event - Handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received');
  
  let data = {
    title: 'Jaango',
    body: 'Vous avez une nouvelle notification',
    icon: '/logo.jpg',
    badge: '/logo.jpg',
    tag: 'jaango-notification',
    data: {
      url: '/notifications'
    }
  };
  
  if (event.data) {
    try {
      const pushData = event.data.json();
      data = {
        title: pushData.title || data.title,
        body: pushData.body || data.body,
        icon: pushData.icon || '/logo.jpg',
        badge: pushData.badge || '/logo.jpg',
        tag: pushData.tag || 'jaango-notification',
        data: {
          url: pushData.url || '/notifications',
          notificationId: pushData.notificationId
        },
        actions: pushData.actions || []
      };
    } catch (e) {
      console.error('[Service Worker] Error parsing push data:', e);
    }
  }
  
  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    vibrate: [100, 50, 100],
    data: data.data,
    actions: data.actions,
    requireInteraction: false,
    silent: false
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/notifications';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Open new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification closed');
});

// Fetch event - Basic caching strategy
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

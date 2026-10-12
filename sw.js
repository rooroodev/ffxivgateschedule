// Minimal service worker: lets the page show OS-level notifications
// (required on Android Chrome) and focuses the page when one is tapped.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) return c.focus();
      }
      return self.clients.openWindow('./');
    })
  );
});

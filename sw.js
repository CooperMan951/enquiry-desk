const CACHE_NAME = 'enquiry-desk-v2';
const ASSETS = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

// Network-first: always try to get the latest version online. Only fall back
// to the cached copy if there's no connection.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Show a real notification when a push arrives — this is what allows reminders
// to reach someone even while the app isn't open.
self.addEventListener('push', (event) => {
  let data = { title: 'Enquiry Desk', body: 'You have a reminder.' };
  try{ if(event.data) data = event.data.json(); }catch(e){
    if(event.data) data.body = event.data.text();
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Enquiry Desk', {
      body: data.body || '',
      icon: 'icon-192.png',
      badge: 'icon-192.png'
    })
  );
});

// Bring the app to the front when the notification is tapped.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientsArr) => {
      if(clientsArr.length > 0){ clientsArr[0].focus(); }
      else { self.clients.openWindow('./'); }
    })
  );
});

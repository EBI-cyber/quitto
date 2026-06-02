import { precacheAndRoute } from 'workbox-precaching'

// Workbox-Precache (von vite-plugin-pwa injiziert)
precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

// Push-Nachricht empfangen -> Benachrichtigung anzeigen
self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch { data = { title: 'Quitto', body: event.data && event.data.text() } }
  const title = data.title || 'Quitto'
  const options = {
    body: data.body || '',
    icon: '/quitto/icon.svg',
    badge: '/quitto/icon.svg',
    vibrate: [80, 40, 80],
    data: { url: data.url || '/quitto/' },
    tag: data.tag || 'quitto',
    renotify: true,
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

// Klick auf die Benachrichtigung -> App öffnen / fokussieren
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/quitto/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) { c.navigate(url); return c.focus() }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    })
  )
})

// Service worker: rete-prima, con la cache come riserva quando si è offline.
// Così durante lo sviluppo si vede sempre l'ultima versione, ma l'app
// continua ad aprirsi anche senza connessione.
const CACHE = "allenamento-cache-2";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil((async () => {
  // elimina le cache vecchie (così non restano in giro build datate) e prendi il controllo subito
  try { const keys = await caches.keys(); await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))); } catch (_) { }
  await self.clients.claim();
})()));

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copia = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copia)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// ---- Notifiche push (promemoria diario) ----
self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data ? e.data.text() : "" }; }
  const title = d.title || "Metis Performance";
  const opts = {
    body: d.body || "Hai un promemoria.",
    icon: d.icon || "icon-192.png",
    badge: d.badge || "icon-192.png",
    tag: d.tag || "metis",
    renotify: true,
    data: { url: d.url || "./" }
  };
  e.waitUntil(self.registration.showNotification(title, opts));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "./";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) { if ("focus" in c) return c.focus(); }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});

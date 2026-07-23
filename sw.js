// Service worker: rete-prima, con la cache come riserva quando si è offline.
// Così durante lo sviluppo si vede sempre l'ultima versione, ma l'app
// continua ad aprirsi anche senza connessione.
const CACHE = "allenamento-cache-1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

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

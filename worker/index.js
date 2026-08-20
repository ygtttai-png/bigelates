/* eslint-disable no-restricted-globals */
/** @type {ServiceWorkerGlobalScope} */
const sw = self;

/**
 * Sunucudan gelen Web Push mesajı.
 * Uygulama tamamen kapalıyken de çalışır — bildirimi işletim sistemi gösterir.
 */
sw.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "Bigelates", body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "Bigelates";
  const url = payload.url || "/dashboard";

  const options = {
    body: payload.body || "",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    // Her ders için ayrı etiket: art arda gelen bildirimler birbirini ezmesin
    tag: `bigelates:${url}`,
    renotify: true,
    silent: false,
    vibrate: [180, 90, 180],
    // Ders hatırlatması kullanıcı kapatana kadar ekranda kalsın
    requireInteraction: payload.kind === "reminder",
    timestamp: Date.now(),
    data: { url },
  };

  event.waitUntil(sw.registration.showNotification(title, options));
});

sw.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    sw.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      if (sw.clients.openWindow) {
        return sw.clients.openWindow(url);
      }
      return undefined;
    })
  );
});

/**
 * Tarayıcı aboneliği yenilediğinde eski kayıt geçersiz kalır.
 * Uygulama bir sonraki açılışında aboneliği yeniden kaydeder.
 */
sw.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    sw.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      clientList.forEach((client) => {
        client.postMessage({ type: "PUSH_SUBSCRIPTION_CHANGED" });
      });
    })
  );
});

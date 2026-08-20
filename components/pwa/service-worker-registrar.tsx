"use client";

import * as React from "react";

/**
 * Service worker'ı uygulama açılışında kaydeder.
 *
 * next-pwa'nın `register: true` seçeneği Pages Router için yazılmış; App
 * Router'da kayıt scriptini sayfaya eklemiyor. Kayıt olmayınca hem çevrimdışı
 * önbellek hem de push bildirimleri çalışmıyor — bu yüzden elle kaydediyoruz.
 *
 * updateViaCache: "none" → sw.js ve importScripts ile çektiği dosyalar her
 * seferinde ağdan alınır; eski/bozuk bir kurulum tarayıcı önbelleğinde takılı
 * kalmaz.
 */
export function ServiceWorkerRegistrar() {
  React.useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        if (cancelled) return;
        // Yeni sürüm varsa arka planda güncelle
        void registration.update().catch(() => {});
      } catch (err) {
        // Geliştirme modunda sw.js üretilmez; sessizce geç
        console.warn("Service worker kaydedilemedi", err);
      }
    };

    if (document.readyState === "complete") {
      void register();
    } else {
      window.addEventListener("load", register, { once: true });
      return () => {
        cancelled = true;
        window.removeEventListener("load", register);
      };
    }

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

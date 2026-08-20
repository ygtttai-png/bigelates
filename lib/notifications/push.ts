"use client";

/**
 * Web Push aboneliği — uygulama kapalıyken bildirim düşmesini sağlayan katman.
 *
 * Akış: izin iste → service worker'a abone ol → abonelik bilgisini Supabase'e
 * yaz. Gönderimi sunucudaki `notify` edge function'ı yapar.
 */

export const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

export interface PushSubscriptionKeys {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/** iOS'ta push yalnızca ana ekrana eklenmiş uygulamada çalışır */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const iosStandalone = (window.navigator as { standalone?: boolean }).standalone === true;
  return window.matchMedia("(display-mode: standalone)").matches || iosStandalone;
}

export function needsHomeScreenInstall(): boolean {
  return isIos() && !isStandalone();
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

function bufferToBase64Url(buffer: ArrayBuffer | null): string {
  if (!buffer) return "";
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return window
    .btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function toKeys(subscription: PushSubscription): PushSubscriptionKeys {
  return {
    endpoint: subscription.endpoint,
    p256dh: bufferToBase64Url(subscription.getKey("p256dh")),
    auth: bufferToBase64Url(subscription.getKey("auth")),
  };
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) return "denied";
  if (Notification.permission !== "default") return Notification.permission;
  return Notification.requestPermission();
}

/**
 * Service worker "activated" olmadan pushManager.subscribe() çalışmaz
 * ("no active Service Worker" hatası). Bu yüzden aktif olana kadar bekleriz.
 */
async function waitForActive(
  registration: ServiceWorkerRegistration,
  timeoutMs: number
): Promise<ServiceWorkerRegistration | null> {
  if (registration.active) return registration;

  return new Promise((resolve) => {
    let done = false;
    const finish = (value: ServiceWorkerRegistration | null) => {
      if (done) return;
      done = true;
      window.clearInterval(poll);
      window.clearTimeout(timer);
      resolve(value);
    };

    const check = () => {
      if (registration.active) finish(registration);
    };

    const pending = registration.installing ?? registration.waiting;
    pending?.addEventListener("statechange", check);
    registration.addEventListener("updatefound", check);

    // Durum değişimi olayını kaçırma ihtimaline karşı yoklama
    const poll = window.setInterval(check, 250);
    const timer = window.setTimeout(() => finish(null), timeoutMs);

    check();
  });
}

async function readyRegistration(
  timeoutMs = 15000
): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;

  let registration = await navigator.serviceWorker.getRegistration();

  if (!registration) {
    try {
      // next-pwa geliştirme modunda sw.js üretmez; orada bu adım başarısız olur
      registration = await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
    } catch {
      return null;
    }
  }

  const active = await waitForActive(registration, timeoutMs);
  if (active) return active;

  // Kurulum bozuk kalmış olabilir: sıfırdan kaydedip bir kez daha bekle
  try {
    await registration.unregister();
    const fresh = await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
    return await waitForActive(fresh, timeoutMs);
  } catch {
    return null;
  }
}

/** Mevcut aboneliği döner (varsa) — kayıt durumunu göstermek için */
export async function getExistingSubscription(): Promise<PushSubscriptionKeys | null> {
  if (!isPushSupported()) return null;
  const registration = await readyRegistration();
  if (!registration) return null;
  const subscription = await registration.pushManager.getSubscription();
  return subscription ? toKeys(subscription) : null;
}

export async function subscribeToPush(): Promise<PushSubscriptionKeys> {
  if (!isPushSupported()) throw new Error("Bu cihaz/tarayıcı push bildirimi desteklemiyor");
  if (!VAPID_PUBLIC_KEY) throw new Error("NEXT_PUBLIC_VAPID_PUBLIC_KEY tanımlı değil");

  const permission = await requestPermission();
  if (permission !== "granted") {
    throw new Error(
      permission === "denied"
        ? "Bildirim izni reddedilmiş. Tarayıcı ayarlarından izin vermen gerekiyor."
        : "Bildirim izni verilmedi"
    );
  }

  const registration = await readyRegistration();
  if (!registration?.active) {
    throw new Error(
      "Service worker hazır değil. Sayfayı yenileyip birkaç saniye sonra tekrar dene."
    );
  }

  const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
  const existing = await registration.pushManager.getSubscription();

  if (existing) {
    // Anahtar değiştiyse eski abonelik geçersizdir
    const sameKey =
      bufferToBase64Url(existing.options.applicationServerKey ?? null) === VAPID_PUBLIC_KEY;
    if (sameKey) return toKeys(existing);
    await existing.unsubscribe();
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: applicationServerKey as BufferSource,
  });

  return toKeys(subscription);
}

/**
 * Takılmış bir service worker kurulumunu temizler: tüm kayıtları siler,
 * önbellekleri boşaltır ve sıfırdan kaydeder.
 * Eski/bozuk bir kurulum yüzünden "hazır değil" hatası alındığında kullanılır.
 */
export async function resetServiceWorker(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) return false;

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((r) => r.unregister().catch(() => false)));

  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k).catch(() => false)));
  }

  const fresh = await readyRegistration();
  return !!fresh?.active;
}

/** Tarayıcı tarafındaki aboneliği iptal eder; endpoint'i döner */
export async function unsubscribeFromPush(): Promise<string | null> {
  const registration = await readyRegistration();
  if (!registration) return null;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return null;
  const { endpoint } = subscription;
  await subscription.unsubscribe();
  return endpoint;
}

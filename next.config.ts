import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

/**
 * next-pwa'nın tip tanımı buildExcludes'u içermiyor, ama çalışma zamanında
 * destekliyor (next-pwa/index.js içinde okunur). Tipi bu yüzden genişletiyoruz.
 */
type PwaOptions = Parameters<typeof withPWA>[0] & {
  buildExcludes?: (string | RegExp)[];
};

const pwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  customWorkerDir: "worker",
  // next-pwa, App Router'da üretimde SUNULMAYAN app-build-manifest.json'ı da
  // önbelleğe alma listesine koyuyor. İndirilemeyen tek bir dosya bile
  // service worker kurulumunu tümden başarısız yapar (install reddedilir) →
  // bildirimler ve çevrimdışı mod çalışmaz.
  buildExcludes: [/app-build-manifest\.json$/],
  fallbacks: {
    document: "/offline",
  },
} as PwaOptions);

export default pwaConfig(nextConfig);

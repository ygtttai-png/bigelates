# Bigelates — Eğitmen Paneli

Production-grade pilates stüdyosu yönetim paneli. Next.js 15, Supabase ve PWA desteği ile geliştirilmiştir.

## Özellikler

- Dashboard (günlük/haftalık/aylık kazanç, katılım)
- Haftalık & aylık takvim (sütun, saat, ajanda görünümleri)
- Öğrenci yönetimi & detay sayfası
- Ders ekleme/düzenleme
- Kazanç raporları
- Supabase Auth (login, register, forgot/reset password)
- Rol tabanlı erişim (admin, staff, user)
- PWA (offline, install prompt, standalone mode)
- Mobil-first responsive tasarım

## Hızlı Başlangıç

```bash
npm install
cp .env.example .env.local
# .env.local dosyasını Supabase bilgilerinizle doldurun
npm run dev
```

Detaylı kurulum: [docs/SETUP.md](docs/SETUP.md)  
Deployment: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## Proje Yapısı

```
app/
  (auth)/          # Login, register, password reset
  (dashboard)/     # Korumalı dashboard sayfaları
  api/             # API routes
components/        # UI & layout bileşenleri
features/          # Ekran bazlı feature modülleri
hooks/             # Custom React hooks
lib/               # Supabase, validations, utils
services/          # Veri servis katmanı
types/             # TypeScript tipleri
utils/             # Yardımcı fonksiyonlar
supabase/          # SQL migrations & RLS
public/            # Static assets, PWA manifest
legacy/            # Orijinal prototip (referans)
```

## Teknoloji

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS 4, Radix UI
- **Backend**: Supabase (Auth, Database, Realtime, Storage-ready)
- **Deployment**: Vercel
- **PWA**: next-pwa + Workbox

## Lisans

Private — Bige Pilates Studio

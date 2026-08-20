# Bigelates — Kurulum Rehberi

## Gereksinimler

- Node.js 20+
- npm 10+
- Supabase hesabı
- Vercel hesabı (deployment için)

## 1. Projeyi klonlayın

```bash
git clone <repo-url> bigelates
cd bigelates
npm install
```

## 2. Supabase projesi oluşturun

1. [supabase.com](https://supabase.com) üzerinde yeni proje oluşturun
2. **Settings → API** bölümünden URL ve anon key'i alın
3. **Settings → API → service_role** key'i alın (sadece sunucu tarafında kullanın)

## 3. Veritabanı migration'larını çalıştırın

Supabase Dashboard → **SQL Editor**'da **sırayla** çalıştırın (her dosyayı ayrı Run):

1. `supabase/migrations/20250609000001_initial_schema.sql` — tablolar
2. `supabase/migrations/20250609000002_rls_policies.sql` — güvenlik politikaları
3. `supabase/migrations/20250609000003_seed_data.sql` — (isteğe bağlı) demo veri
4. `supabase/migrations/20250609000004_lesson_recurrence.sql` — tekrar eden dersler
5. `supabase/migrations/20250609000005_fix_lesson_delete_rls.sql`
6. `supabase/migrations/20250609000006_soft_delete_lessons_rpc.sql`
7. `supabase/migrations/20250609000007_lesson_types.sql` — ayarlardan ders tipleri
8. `supabase/migrations/20250609000008_push_notifications.sql` — bildirim altyapısı

> Migration'lar **idempotent**'tir; hata aldıysanız aynı dosyayı tekrar çalıştırabilirsiniz.
> `user_role already exists` veya `studios does not exist` hatası aldıysanız: önce **01**, sonra **02** dosyasını tekrar çalıştırın.

## 4. Auth ayarları

Supabase Dashboard → **Authentication**:

**URL Configuration**
- **Site URL**: `http://localhost:3000` (dev) / `https://your-domain.vercel.app` (prod)
- **Redirect URLs**:
  - `http://localhost:3000/reset-password`
  - `https://your-domain.vercel.app/reset-password`

**Providers → Email**
- Email provider açık olmalı
- Kayıt için e-posta onayı zorunlu değil (API `email_confirm: true` ile oluşturur)
- İsteğe bağlı: "Confirm email" kapalı bırakılabilir (geliştirme için daha kolay)

**`.env.local` gerçek değerler içermeli** — `placeholder` değerleriyle kayıt çalışmaz:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...  (service_role — gizli tutun!)
```

## 5. Ortam değişkenleri

```bash
cp .env.example .env.local
```

`.env.local` dosyasını doldurun.

## 6. Geliştirme sunucusu

```bash
npm run dev
```

Tarayıcıda: http://localhost:3000

## 7. İlk kullanıcı

1. `/register` sayfasından kayıt olun
2. Stüdyo otomatik oluşturulur
3. **(İsteğe bağlı)** Paneli test etmek için kurgusal demo veri yükleyin:

```sql
SELECT seed_studio_data('<your-studio-id>');
```

> **Not:** `seed_studio_data` yalnızca örnek veri ekler (Örnek Öğrenci 1–5, sahte telefonlar `0500 000 00 XX`, örnek ücretler). Gerçek kişi bilgisi içermez. Tüm kayıtlar panelden düzenlenir veya silinir.

## 8. Bildirimler

Uygulama kapalıyken bildirim düşmesi için Web Push kurulumu gerekir —
adımlar ve sorun giderme: [NOTIFICATIONS.md](./NOTIFICATIONS.md).

Kısaca: `NEXT_PUBLIC_VAPID_PUBLIC_KEY` ortam değişkeni (Vercel'de de), Vault'ta
VAPID gizli anahtarı, `notify` edge function'ı ve `bigelates-notify` cron işi.

## Roller

| Rol | Yetki |
|-----|-------|
| `admin` | Stüdyo yönetimi, tüm CRUD |
| `staff` | Ders/öğrenci yönetimi |
| `user` | Salt okunur (gelecek) |

## Güvenlik

- RLS tüm tablolarda aktif
- Service role key asla client'a expose edilmez
- CSRF: Supabase Auth cookie tabanlı session kullanır
- Rate limiting: Vercel Edge + Supabase Auth rate limits önerilir

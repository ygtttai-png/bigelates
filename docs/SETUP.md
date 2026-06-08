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

Supabase Dashboard → SQL Editor'da sırayla çalıştırın:

1. `supabase/migrations/20250609000001_initial_schema.sql`
2. `supabase/migrations/20250609000002_rls_policies.sql`
3. `supabase/migrations/20250609000003_seed_data.sql`

## 4. Auth ayarları

Supabase Dashboard → Authentication → URL Configuration:

- **Site URL**: `http://localhost:3000` (dev) / `https://your-domain.vercel.app` (prod)
- **Redirect URLs**:
  - `http://localhost:3000/reset-password`
  - `https://your-domain.vercel.app/reset-password`

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

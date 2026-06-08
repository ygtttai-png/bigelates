# Bigelates — Vercel Deployment Rehberi

## One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

## Manuel Deployment

### 1. Vercel projesi oluşturun

```bash
npx vercel
```

### 2. Environment Variables (Vercel Dashboard)

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |

### 3. Supabase production URL'leri

Authentication → URL Configuration:

- Site URL: `https://your-app.vercel.app`
- Redirect URLs: `https://your-app.vercel.app/reset-password`

### 4. Deploy

```bash
npm run build
npx vercel --prod
```

## PWA Production Checklist

- [ ] `manifest.json` erişilebilir (`/manifest.json`)
- [ ] Service worker build sonrası `public/sw.js` oluşuyor
- [ ] HTTPS aktif (Vercel otomatik)
- [ ] Icons `public/icons/` altında mevcut
- [ ] Lighthouse PWA audit geçiyor

## Performance Hedefleri

- Lighthouse Performance: 90+
- Mobile Performance: 90+
- Accessibility: 90+

## Önerilen Vercel Ayarları

- **Framework Preset**: Next.js
- **Node.js Version**: 22.x
- **Build Command**: `npm run build`
- **Output**: Standalone (default)

## Rate Limiting Önerisi

Vercel `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" }
      ]
    }
  ]
}
```

API route'ları için ek olarak Upstash Redis rate limiter önerilir.

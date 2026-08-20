# Bildirimler (Web Push)

Amaç: uygulama tamamen kapalıyken bile telefona bildirim düşmesi.

- **Ders hatırlatması** — ders başlamadan X dakika önce (varsayılan 30)
- **Yarınki dersler özeti** — her gün seçilen saatte (varsayılan 21:00)

## Nasıl çalışıyor

```
pg_cron (5 dakikada bir)
   └─ pg_net → Edge Function "notify"  (x-cron-secret ile doğrulanır)
        ├─ get_due_notifications()      → zamanı gelen bildirimler
        ├─ notification_deliveries      → aynı bildirim iki kez gitmesin
        └─ web-push → Google/Apple push servisi → telefon
                                                   └─ service worker → bildirim
```

Eskiden bildirimler tarayıcıda `setInterval` ile üretiliyordu; uygulama kapalıyken
hiçbir şey çalışmadığı için bildirim düşmüyordu. Artık gönderimi sunucu yapıyor.

## Parçalar

| Yer | Dosya / nesne |
| --- | --- |
| Şema | `supabase/migrations/20250609000008_push_notifications.sql` |
| Zamanlayıcı | `cron.job` → `bigelates-notify` (`*/5 * * * *`), `bigelates-notify-purge` (günlük) |
| Gönderici | `supabase/functions/notify/index.ts` (Edge Function, `verify_jwt = false`) |
| Service worker | `worker/index.js` → build sırasında `public/sw.js` içine gömülür |
| İstemci | `lib/notifications/push.ts`, `hooks/use-push-notifications.ts` |
| Ekran | `/notifications` → `features/notifications/notifications-view.tsx` |

## Anahtarlar

VAPID anahtar çifti `node scripts/generate-vapid-keys.mjs` ile üretilir.

| Değer | Nerede durur |
| --- | --- |
| Açık anahtar | `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (Vercel + `.env.local`) ve Vault `vapid_public_key` |
| Gizli anahtar | Yalnızca Vault: `vapid_private_key` |
| Cron parolası | Vault: `notify_cron_secret` |
| İletişim adresi | Vault: `vapid_subject` |

Vault'taki değerleri görmek/değiştirmek için:

```sql
SELECT name, decrypted_secret FROM vault.decrypted_secrets;
SELECT vault.update_secret(id, 'yeni-deger') FROM vault.secrets WHERE name = 'vapid_subject';
```

> Açık anahtar değişirse tüm cihazların yeniden abone olması gerekir
> (uygulama bunu kendisi yapar, kullanıcı yalnızca uygulamayı açar).

## Kurulum kontrol listesi

1. `NEXT_PUBLIC_VAPID_PUBLIC_KEY` Vercel'de tanımlı mı? (Production + Preview)
2. Uygulama HTTPS'te yayında mı? Push yalnızca https ve `localhost`'ta çalışır;
   `next dev` sırasında service worker devre dışı olduğu için bildirim çalışmaz.
3. Kullanıcı `/notifications` ekranından "Bildirimleri aç" dedi mi?
4. iPhone: Safari → Paylaş → **Ana Ekrana Ekle**. iOS'ta web push yalnızca ana
   ekrana eklenmiş uygulamada çalışır (iOS 16.4+).

## Sorun giderme

```sql
-- Cron çalışıyor mu
SELECT status, return_message, start_time
FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- Edge Function ne cevap verdi
SELECT status_code, content, created FROM net._http_response
ORDER BY created DESC LIMIT 10;

-- Kayıtlı cihazlar
SELECT user_id, user_agent, last_success_at, failure_count FROM push_subscriptions;

-- Gönderilenler
SELECT kind, title, body, delivered_count, sent_at
FROM notification_deliveries ORDER BY sent_at DESC LIMIT 20;

-- Şu an gönderilecek olanlar
SELECT * FROM get_due_notifications();
```

`delivered_count = 0` ise bildirim üretildi ama cihaza ulaşmadı: abonelik
düşmüş olabilir (uygulama silinmiş / izin geri alınmış). Uygulamayı açıp
bildirimleri yeniden açmak yeni abonelik oluşturur.

## Bilinen sınırlar

- **Custom bildirim sesi yok.** Web Push'ta ses işletim sisteminin bildirim
  sesidir; uygulamaya özel mp3 çalınamaz. Android'de sesi bildirim kanalından,
  iPhone'da uygulama bildirim ayarlarından değiştirilebilir.
- **Telefon tamamen kapalıysa** bildirim, telefon açılıp internete bağlandığında
  düşer (TTL süresi içindeyse). Hatırlatmalar için TTL 45 dakika.
- Bildirim tercihleri kullanıcı bazlıdır, cihaz bazlı değil; cihazlar yalnızca
  "kayıtlı / kayıtsız" olur.

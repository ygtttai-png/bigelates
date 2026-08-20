/**
 * Bigelates — bildirim gönderici (Web Push)
 *
 * mode = "cron"  → pg_cron her 5 dakikada bir çağırır; zamanı gelen
 *                  ders hatırlatmalarını ve "yarınki dersler" özetini gönderir.
 * mode = "test"  → uygulamadan, giriş yapmış kullanıcının kendi cihazına
 *                  test bildirimi gönderir.
 *
 * Gizli anahtarlar Supabase Vault'ta tutulur (get_push_secret).
 * verify_jwt kapalıdır; yetkilendirme bu dosyada yapılır:
 *   cron  → x-cron-secret başlığı Vault'taki değerle karşılaştırılır
 *   test  → Authorization: Bearer <kullanıcı JWT'si> doğrulanır
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

/** Bildirim türüne göre yaşam süresi — bayat bildirim düşmesin */
const TTL_BY_KIND: Record<string, number> = {
  reminder: 60 * 45,
  summary: 60 * 60 * 10,
  test: 60,
};

interface DueNotification {
  user_id: string;
  kind: string;
  dedupe_key: string;
  title: string;
  body: string;
  url: string;
}

interface SubscriptionRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Supabase API anahtarı doğrulaması düğümler arası saat kaymasında
 * ara sıra "JWT issued at future" hatası veriyor. Kısa bir beklemeyle
 * yeniden denemek bunu geçiyor.
 */
async function withRetry<T>(
  label: string,
  run: () => Promise<{ data: T | null; error: { message: string } | null }>,
  attempts = 3
): Promise<T | null> {
  let lastError = "";
  for (let i = 0; i < attempts; i++) {
    const { data, error } = await run();
    if (!error) return data;
    lastError = error.message;
    if (i < attempts - 1) await sleep(700 * (i + 1));
  }
  throw new Error(`${label}: ${lastError}`);
}

/** Vault'tan okunan değerler örnek ömrü boyunca saklanır */
const secretCache = new Map<string, string>();

async function secret(name: string): Promise<string> {
  const cached = secretCache.get(name);
  if (cached) return cached;

  const value = await withRetry<string>(`Vault okunamadı (${name})`, () =>
    admin.rpc("get_push_secret", { p_name: name })
  );

  if (!value) throw new Error(`Vault'ta ${name} yok`);
  secretCache.set(name, value);
  return value;
}

async function configureVapid(): Promise<void> {
  const subject = await secret("vapid_subject");
  const publicKey = await secret("vapid_public_key");
  const privateKey = await secret("vapid_private_key");
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

async function subscriptionsFor(userId: string): Promise<SubscriptionRow[]> {
  const data = await withRetry<SubscriptionRow[]>("Abonelikler okunamadı", () =>
    admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", userId)
      .eq("enabled", true)
  );

  return data ?? [];
}

/** Bir kullanıcının tüm cihazlarına gönderir, ölü abonelikleri temizler */
async function sendToUser(
  userId: string,
  payload: { title: string; body: string; url: string; kind: string }
): Promise<number> {
  const subs = await subscriptionsFor(userId);
  if (subs.length === 0) return 0;

  const body = JSON.stringify(payload);
  const ttl = TTL_BY_KIND[payload.kind] ?? 3600;
  let delivered = 0;

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        body,
        { TTL: ttl, urgency: payload.kind === "reminder" ? "high" : "normal" }
      );
      delivered++;
      await admin
        .from("push_subscriptions")
        .update({ last_success_at: new Date().toISOString(), failure_count: 0 })
        .eq("id", sub.id);
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode;
      // 404/410: abonelik artık geçersiz (uygulama silinmiş, izin geri alınmış)
      if (status === 404 || status === 410) {
        await admin.from("push_subscriptions").delete().eq("id", sub.id);
      } else {
        console.error("push hatası", sub.endpoint.slice(0, 40), status, String(err));
      }
    }
  }

  return delivered;
}

async function runCron(): Promise<Response> {
  const data = await withRetry<DueNotification[]>("Bildirimler hesaplanamadı", () =>
    admin.rpc("get_due_notifications")
  );

  const due = data ?? [];
  let sent = 0;
  let skipped = 0;

  for (const item of due) {
    // Kaydı önce yaz: aynı bildirim ikinci kez gönderilmesin.
    // 23505 = bu bildirim zaten gönderilmiş; diğer hatalar geçici sayılır ve
    // bir sonraki turda yeniden denenir.
    let inserted: { id: string } | null = null;
    try {
      inserted = await withRetry<{ id: string }>("Gönderim kaydı yazılamadı", async () => {
        const result = await admin
          .from("notification_deliveries")
          .insert({
            user_id: item.user_id,
            kind: item.kind,
            dedupe_key: item.dedupe_key,
            title: item.title,
            body: item.body,
          })
          .select("id")
          .maybeSingle();

        if (result.error?.code === "23505") return { data: null, error: null };
        return result;
      });
    } catch (err) {
      console.error("kayıt hatası", item.dedupe_key, String(err));
    }

    if (!inserted) {
      skipped++;
      continue;
    }

    const delivered = await sendToUser(item.user_id, {
      title: item.title,
      body: item.body,
      url: item.url,
      kind: item.kind,
    });

    sent += delivered;
    await admin
      .from("notification_deliveries")
      .update({ delivered_count: delivered })
      .eq("id", inserted.id);
  }

  return Response.json({ due: due.length, sent, skipped });
}

async function runTest(req: Request): Promise<Response> {
  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return Response.json({ error: "Yetkisiz" }, { status: 401 });

  const { data: userData, error } = await admin.auth.getUser(token);
  if (error || !userData?.user) {
    return Response.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const delivered = await sendToUser(userData.user.id, {
    title: "Bigelates bildirim testi",
    body: "Bildirimler çalışıyor. Ders hatırlatmaların bu şekilde düşecek.",
    url: "/notifications",
    kind: "test",
  });

  return Response.json({ delivered });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return Response.json({ error: "POST bekleniyor" }, { status: 405 });
  }

  try {
    const payload = (await req.json().catch(() => ({}))) as { mode?: string };
    const mode = payload.mode ?? "cron";

    await configureVapid();

    if (mode === "test") return await runTest(req);

    const expected = await secret("notify_cron_secret");
    if (req.headers.get("x-cron-secret") !== expected) {
      return Response.json({ error: "Yetkisiz" }, { status: 401 });
    }

    return await runCron();
  } catch (err) {
    console.error(err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
});

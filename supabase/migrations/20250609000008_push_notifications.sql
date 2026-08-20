-- Web Push bildirimleri (idempotent — güvenle tekrar çalıştırılabilir)
--
-- Uygulama KAPALIYKEN de bildirim düşmesi için gerekli altyapı:
--   push_subscriptions      → cihazların push adresleri
--   notification_prefs      → kullanıcı tercihleri (saat, kaç dk önce)
--   notification_deliveries → aynı bildirimin iki kez gitmesini engeller
--   get_due_notifications() → o an gönderilmesi gereken bildirimleri döner
--
-- Gönderimi Edge Function (notify) yapar, onu pg_cron tetikler.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'lessons'
  ) THEN
    RAISE EXCEPTION 'lessons tablosu bulunamadı. Önce önceki migration dosyalarını çalıştırın.';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Cihaz abonelikleri
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  failure_count INTEGER NOT NULL DEFAULT 0,
  last_success_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user
  ON push_subscriptions(user_id) WHERE enabled;

DROP TRIGGER IF EXISTS push_subscriptions_updated_at ON push_subscriptions;
CREATE TRIGGER push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- Kullanıcı tercihleri
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notification_prefs (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  -- Ders başlamadan kaç dakika önce hatırlatılsın
  reminder_minutes INTEGER NOT NULL DEFAULT 30 CHECK (reminder_minutes BETWEEN 5 AND 240),
  -- "Yarın şu kadar dersin var" özetinin gönderileceği yerel saat (0-23)
  summary_hour INTEGER NOT NULL DEFAULT 21 CHECK (summary_hour BETWEEN 0 AND 23),
  timezone TEXT NOT NULL DEFAULT 'Europe/Istanbul',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS notification_prefs_updated_at ON notification_prefs;
CREATE TRIGGER notification_prefs_updated_at
  BEFORE UPDATE ON notification_prefs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- Gönderim kaydı — aynı bildirim iki kez gitmesin
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notification_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  dedupe_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_notification_deliveries_user
  ON notification_deliveries(user_id, sent_at DESC);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users manage own push subscriptions"
  ON push_subscriptions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users manage own notification prefs" ON notification_prefs;
CREATE POLICY "Users manage own notification prefs"
  ON notification_prefs FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own deliveries" ON notification_deliveries;
CREATE POLICY "Users can view own deliveries"
  ON notification_deliveries FOR SELECT
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Gönderilecek bildirimler
-- ---------------------------------------------------------------------------
-- Ders saatleri yerel duvar saati olarak tutulduğu için (DATE + TIME),
-- kullanıcının saat dilimiyle timestamptz'e çevrilir.
CREATE OR REPLACE FUNCTION get_due_notifications(p_now TIMESTAMPTZ DEFAULT NOW())
RETURNS TABLE (
  user_id UUID,
  kind TEXT,
  dedupe_key TEXT,
  title TEXT,
  body TEXT,
  url TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH prefs AS (
    SELECT
      p.id AS user_id,
      p.studio_id,
      COALESCE(np.enabled, TRUE) AS enabled,
      COALESCE(np.reminder_minutes, 30) AS reminder_minutes,
      COALESCE(np.summary_hour, 21) AS summary_hour,
      COALESCE(np.timezone, 'Europe/Istanbul') AS tz
    FROM profiles p
    LEFT JOIN notification_prefs np ON np.user_id = p.id
    WHERE p.deleted_at IS NULL
      AND p.studio_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM push_subscriptions s
        WHERE s.user_id = p.id AND s.enabled
      )
  ),
  reminders AS (
    SELECT
      pr.user_id,
      'reminder'::TEXT AS kind,
      'reminder:' || pr.user_id::TEXT || ':' || l.id::TEXT AS dedupe_key,
      'Ders başlıyor'::TEXT AS title,
      to_char(l.time, 'HH24:MI') || ' · '
        || COALESCE(NULLIF(btrim(l.type_label), ''),
                    CASE WHEN l.type = 'ozel' THEN 'Özel ders' ELSE 'Grup dersi' END)
        || COALESCE(' · ' || names.list, '') AS body,
      '/lessons/' || l.id::TEXT || '/edit' AS url
    FROM prefs pr
    JOIN lessons l
      ON l.studio_id = pr.studio_id
     AND l.deleted_at IS NULL
     AND l.status = 'planlandi'
    LEFT JOIN LATERAL (
      SELECT string_agg(st.name, ', ' ORDER BY st.name) AS list
      FROM lesson_students ls
      JOIN students st ON st.id = ls.student_id AND st.deleted_at IS NULL
      WHERE ls.lesson_id = l.id
    ) names ON TRUE
    WHERE pr.enabled
      AND ((l.date + l.time) AT TIME ZONE pr.tz)
            - make_interval(mins => pr.reminder_minutes) <= p_now
      AND ((l.date + l.time) AT TIME ZONE pr.tz) > p_now
  ),
  summaries AS (
    -- Gece yarısı ve sonrası seçilirse "yarın" içinde bulunulan gün demektir;
    -- akşam saatlerinde ise ertesi gün.
    SELECT
      pr.user_id,
      'summary'::TEXT AS kind,
      'summary:' || pr.user_id::TEXT || ':' || to_char(hedef.gun, 'YYYY-MM-DD') AS dedupe_key,
      CASE WHEN pr.summary_hour <= 4 THEN 'Bugünkü derslerin' ELSE 'Yarınki derslerin' END AS title,
      CASE WHEN pr.summary_hour <= 4 THEN 'Bugün ' ELSE 'Yarın ' END
        || agg.total::TEXT || ' dersin var · ilk ders '
        || to_char(agg.first_time, 'HH24:MI') AS body,
      '/calendar/weekly'::TEXT AS url
    FROM prefs pr
    CROSS JOIN LATERAL (
      SELECT (p_now AT TIME ZONE pr.tz)::DATE
             + CASE WHEN pr.summary_hour <= 4 THEN 0 ELSE 1 END AS gun
    ) hedef
    JOIN LATERAL (
      SELECT COUNT(*) AS total, MIN(l.time) AS first_time
      FROM lessons l
      WHERE l.studio_id = pr.studio_id
        AND l.deleted_at IS NULL
        AND l.status = 'planlandi'
        AND l.date = hedef.gun
    ) agg ON agg.total > 0
    WHERE pr.enabled
      AND EXTRACT(HOUR FROM (p_now AT TIME ZONE pr.tz))::INT = pr.summary_hour
  )
  SELECT * FROM reminders
  UNION ALL
  SELECT * FROM summaries;
$$;

REVOKE ALL ON FUNCTION get_due_notifications(TIMESTAMPTZ) FROM PUBLIC;
REVOKE ALL ON FUNCTION get_due_notifications(TIMESTAMPTZ) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION get_due_notifications(TIMESTAMPTZ) TO service_role;

-- ---------------------------------------------------------------------------
-- Vault'taki gizli anahtarları Edge Function'a açan yardımcı
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_push_secret(p_name TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, vault
AS $$
  SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = p_name LIMIT 1;
$$;

REVOKE ALL ON FUNCTION get_push_secret(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION get_push_secret(TEXT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION get_push_secret(TEXT) TO service_role;

-- ---------------------------------------------------------------------------
-- Eski gönderim kayıtlarını temizle
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION purge_old_notification_deliveries()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  removed INTEGER;
BEGIN
  DELETE FROM notification_deliveries WHERE sent_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS removed = ROW_COUNT;
  RETURN removed;
END;
$$;

REVOKE ALL ON FUNCTION purge_old_notification_deliveries() FROM PUBLIC;
REVOKE ALL ON FUNCTION purge_old_notification_deliveries() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION purge_old_notification_deliveries() TO service_role;

-- Ders tipleri (idempotent — güvenle tekrar çalıştırılabilir)
-- Stüdyo kendi ders tiplerini tanımlar: ad + ücret + tekil/grup davranışı.
--
-- GEÇMİŞ KAYITLAR KORUNUR: ders kaydedilirken o anki ad (lessons.type_label) ve
-- ücret (lessons.fee) derse yazılır. Ayarlardan fiyat/ad değiştirmek yalnızca
-- bundan sonra eklenecek dersleri etkiler.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'studios'
  ) THEN
    RAISE EXCEPTION 'studios tablosu bulunamadı. Önce 20250609000001_initial_schema.sql dosyasını çalıştırın.';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Tablo
-- ---------------------------------------------------------------------------
-- kind: mevcut lesson_type enum'u — 'ozel' tek kişilik, 'grup' çok kişilik
-- (grup tiplerinde ücret kişi başı hesaplanır).
CREATE TABLE IF NOT EXISTS lesson_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(btrim(name)) > 0),
  kind lesson_type NOT NULL DEFAULT 'ozel',
  price NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  sort_order INTEGER NOT NULL DEFAULT 0,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_lesson_types_studio
  ON lesson_types(studio_id, sort_order) WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_lesson_types_unique_name
  ON lesson_types(studio_id, lower(btrim(name))) WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS lesson_types_updated_at ON lesson_types;
CREATE TRIGGER lesson_types_updated_at
  BEFORE UPDATE ON lesson_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- Derse ders tipi bağı + ad anlık görüntüsü
-- ---------------------------------------------------------------------------
-- Ders tipi silinse/pasife alınsa bile ders kaydı adını korur (type_label).
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS lesson_type_id UUID
  REFERENCES lesson_types(id) ON DELETE SET NULL;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS type_label TEXT;

CREATE INDEX IF NOT EXISTS idx_lessons_lesson_type
  ON lessons(lesson_type_id) WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE lesson_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view lesson_types" ON lesson_types;
CREATE POLICY "Staff can view lesson_types"
  ON lesson_types FOR SELECT
  USING (studio_id = get_user_studio_id() AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Staff can insert lesson_types" ON lesson_types;
CREATE POLICY "Staff can insert lesson_types"
  ON lesson_types FOR INSERT
  WITH CHECK (studio_id = get_user_studio_id() AND has_role('staff'));

DROP POLICY IF EXISTS "Staff can update lesson_types" ON lesson_types;
CREATE POLICY "Staff can update lesson_types"
  ON lesson_types FOR UPDATE
  USING (studio_id = get_user_studio_id() AND has_role('staff'))
  WITH CHECK (studio_id = get_user_studio_id());

-- ---------------------------------------------------------------------------
-- Varsayılan tipler — stüdyonun mevcut ayarlarındaki fiyatlarla
-- ---------------------------------------------------------------------------
INSERT INTO lesson_types (studio_id, name, kind, price, sort_order)
SELECT s.id, 'Özel ders', 'ozel', COALESCE((s.settings->>'price_ozel')::NUMERIC, 750), 0
FROM studios s
WHERE s.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM lesson_types t
    WHERE t.studio_id = s.id AND t.deleted_at IS NULL AND lower(btrim(t.name)) = 'özel ders'
  );

INSERT INTO lesson_types (studio_id, name, kind, price, sort_order)
SELECT s.id, 'Grup dersi', 'grup', COALESCE((s.settings->>'price_grup')::NUMERIC, 250), 1
FROM studios s
WHERE s.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM lesson_types t
    WHERE t.studio_id = s.id AND t.deleted_at IS NULL AND lower(btrim(t.name)) = 'grup dersi'
  );

-- ---------------------------------------------------------------------------
-- Geçmiş dersleri etiketle — ücretlerine DOKUNULMAZ
-- ---------------------------------------------------------------------------
UPDATE lessons l
SET lesson_type_id = t.id,
    type_label = t.name
FROM lesson_types t
WHERE l.lesson_type_id IS NULL
  AND t.studio_id = l.studio_id
  AND t.kind = l.type
  AND t.deleted_at IS NULL
  AND lower(btrim(t.name)) = CASE WHEN l.type = 'ozel' THEN 'özel ders' ELSE 'grup dersi' END;

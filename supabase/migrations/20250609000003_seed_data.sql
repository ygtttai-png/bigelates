-- =============================================================================
-- DEMO SEED — Yalnızca paneli test etmek için kurgusal örnek veriler
-- =============================================================================
-- Bu dosyadaki TÜM kayıtlar sahte/örnektir. Gerçek kişi veya iletişim bilgisi içermez.
-- Öğrenciler, ücretler, paketler ve dersler panel üzerinden düzenlenecektir.
--
-- Kullanım (kayıt sonrası, isteğe bağlı):
--   SELECT seed_studio_data('<studio_id>');
--
-- Ücretler stüdyo varsayılanlarıyla uyumludur (price_ozel: 500, price_grup: 200).
-- Gerçek fiyatlar panel → Stüdyo ayarlarından güncellenir.
-- =============================================================================

CREATE OR REPLACE FUNCTION seed_studio_data(p_studio_id UUID)
RETURNS void AS $$
DECLARE
  s1 UUID; s2 UUID; s3 UUID; s4 UUID; s5 UUID;
  price_ozel NUMERIC := 500;   -- örnek özel ders ücreti (TL)
  price_grup NUMERIC := 200;   -- örnek grup dersi kişi başı ücret (TL)
  l_id UUID;
BEGIN
  -- Örnek öğrenciler (kurgusal isimler, sahte telefonlar)
  INSERT INTO students (studio_id, name, phone, type, package_total, remaining, payment_status, join_date, notes, color, initials) VALUES
    (p_studio_id, 'Örnek Öğrenci 1', '0500 000 00 01', 'ozel', 8, 5, 'odendi', CURRENT_DATE - 30, 'Demo veri — panelden düzenleyin veya silin.', '#8FA688', 'Ö1') RETURNING id INTO s1;
  INSERT INTO students (studio_id, name, phone, type, package_total, remaining, payment_status, join_date, notes, color, initials) VALUES
    (p_studio_id, 'Örnek Öğrenci 2', '0500 000 00 02', 'grup', 12, 8, 'odendi', CURRENT_DATE - 45, 'Demo veri — panelden düzenleyin veya silin.', '#C9A6A0', 'Ö2') RETURNING id INTO s2;
  INSERT INTO students (studio_id, name, phone, type, package_total, remaining, payment_status, join_date, notes, color, initials) VALUES
    (p_studio_id, 'Örnek Öğrenci 3', '0500 000 00 03', 'ozel', 10, 2, 'bekliyor', CURRENT_DATE - 14, 'Demo veri — panelden düzenleyin veya silin.', '#A8A29A', 'Ö3') RETURNING id INTO s3;
  INSERT INTO students (studio_id, name, phone, type, package_total, remaining, payment_status, join_date, notes, color, initials) VALUES
    (p_studio_id, 'Örnek Öğrenci 4', '0500 000 00 04', 'grup', 16, 12, 'odendi', CURRENT_DATE - 60, 'Demo veri — panelden düzenleyin veya silin.', '#9FB0AE', 'Ö4') RETURNING id INTO s4;
  INSERT INTO students (studio_id, name, phone, type, package_total, remaining, payment_status, join_date, notes, color, initials) VALUES
    (p_studio_id, 'Örnek Öğrenci 5', '0500 000 00 05', 'ozel', 8, 1, 'bekliyor', CURRENT_DATE - 7, 'Demo veri — panelden düzenleyin veya silin.', '#C4B59A', 'Ö5') RETURNING id INTO s5;

  -- Örnek ödemeler (kurgusal tutarlar)
  INSERT INTO payments (studio_id, student_id, amount, package_label, status, payment_date) VALUES
    (p_studio_id, s1, price_ozel * 8, 'Örnek paket — 8 özel ders', 'odendi', CURRENT_DATE - 30),
    (p_studio_id, s2, price_grup * 12, 'Örnek paket — 12 grup dersi', 'odendi', CURRENT_DATE - 45),
    (p_studio_id, s3, price_ozel * 10, 'Örnek paket — yeni paket (bekliyor)', 'bekliyor', CURRENT_DATE);

  -- Örnek dersler (bugün ve yarın — ücretler varsayılan örnek fiyatlardan)
  INSERT INTO lessons (studio_id, date, time, type, status, fee, note) VALUES
    (p_studio_id, CURRENT_DATE, '09:00', 'ozel', 'geldi', price_ozel, 'Demo ders — panelden düzenleyin') RETURNING id INTO l_id;
  INSERT INTO lesson_students (lesson_id, student_id) VALUES (l_id, s1);

  INSERT INTO lessons (studio_id, date, time, type, status, fee, note) VALUES
    (p_studio_id, CURRENT_DATE, '10:30', 'grup', 'planlandi', price_grup * 3, 'Demo grup dersi — 3 öğrenci') RETURNING id INTO l_id;
  INSERT INTO lesson_students (lesson_id, student_id) VALUES (l_id, s2), (l_id, s4);

  INSERT INTO lessons (studio_id, date, time, type, status, fee, note) VALUES
    (p_studio_id, CURRENT_DATE + 1, '18:00', 'ozel', 'planlandi', price_ozel, 'Demo ders — panelden düzenleyin') RETURNING id INTO l_id;
  INSERT INTO lesson_students (lesson_id, student_id) VALUES (l_id, s3);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

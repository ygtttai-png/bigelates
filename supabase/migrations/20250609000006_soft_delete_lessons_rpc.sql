-- Ders silme: RLS bypass ile güvenli soft-delete RPC
-- Supabase SQL Editor'da çalıştırın (idempotent)

CREATE OR REPLACE FUNCTION soft_delete_lessons(p_lesson_ids UUID[])
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_studio_id UUID;
  v_count INTEGER;
BEGIN
  IF p_lesson_ids IS NULL OR array_length(p_lesson_ids, 1) IS NULL THEN
    RETURN 0;
  END IF;

  v_studio_id := get_user_studio_id();

  IF v_studio_id IS NULL THEN
    RAISE EXCEPTION 'Stüdyo bulunamadı';
  END IF;

  IF NOT has_role('staff') THEN
    RAISE EXCEPTION 'Yetkisiz işlem';
  END IF;

  UPDATE lessons
  SET
    deleted_at = NOW(),
    updated_at = NOW()
  WHERE id = ANY(p_lesson_ids)
    AND studio_id = v_studio_id
    AND deleted_at IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION soft_delete_lessons(UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION soft_delete_lessons(UUID[]) TO authenticated;

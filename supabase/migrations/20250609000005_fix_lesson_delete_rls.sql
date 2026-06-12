-- Ders soft-delete RLS düzeltmesi
-- Sorun: UPDATE + RETURNING, silinen satır SELECT politikasını (deleted_at IS NULL) geçemiyordu.

DROP POLICY IF EXISTS "Staff can update lessons" ON lessons;
CREATE POLICY "Staff can update lessons"
  ON lessons FOR UPDATE
  USING (
    studio_id = get_user_studio_id()
    AND has_role('staff')
    AND deleted_at IS NULL
  )
  WITH CHECK (
    studio_id = get_user_studio_id()
    AND has_role('staff')
  );

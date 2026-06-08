-- Row Level Security Policies

ALTER TABLE studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Studios
CREATE POLICY "Users can view own studio"
  ON studios FOR SELECT
  USING (id = get_user_studio_id() OR owner_id = auth.uid());

CREATE POLICY "Admins can insert studio"
  ON studios FOR INSERT
  WITH CHECK (owner_id = auth.uid() AND has_role('admin'));

CREATE POLICY "Admins can update own studio"
  ON studios FOR UPDATE
  USING (owner_id = auth.uid() AND has_role('admin'))
  WITH CHECK (owner_id = auth.uid());

-- Profiles
CREATE POLICY "Users can view profiles in same studio"
  ON profiles FOR SELECT
  USING (
    id = auth.uid()
    OR studio_id = get_user_studio_id()
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can update studio profiles"
  ON profiles FOR UPDATE
  USING (has_role('admin') AND studio_id = get_user_studio_id());

-- Students
CREATE POLICY "Staff can view students"
  ON students FOR SELECT
  USING (studio_id = get_user_studio_id() AND deleted_at IS NULL);

CREATE POLICY "Staff can insert students"
  ON students FOR INSERT
  WITH CHECK (studio_id = get_user_studio_id() AND has_role('staff'));

CREATE POLICY "Staff can update students"
  ON students FOR UPDATE
  USING (studio_id = get_user_studio_id() AND has_role('staff'))
  WITH CHECK (studio_id = get_user_studio_id());

CREATE POLICY "Admins can soft-delete students"
  ON students FOR UPDATE
  USING (studio_id = get_user_studio_id() AND has_role('admin'));

-- Lessons
CREATE POLICY "Staff can view lessons"
  ON lessons FOR SELECT
  USING (studio_id = get_user_studio_id() AND deleted_at IS NULL);

CREATE POLICY "Staff can insert lessons"
  ON lessons FOR INSERT
  WITH CHECK (studio_id = get_user_studio_id() AND has_role('staff'));

CREATE POLICY "Staff can update lessons"
  ON lessons FOR UPDATE
  USING (studio_id = get_user_studio_id() AND has_role('staff'))
  WITH CHECK (studio_id = get_user_studio_id());

-- Lesson students
CREATE POLICY "Staff can view lesson_students"
  ON lesson_students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lessons l
      WHERE l.id = lesson_id
        AND l.studio_id = get_user_studio_id()
        AND l.deleted_at IS NULL
    )
  );

CREATE POLICY "Staff can manage lesson_students"
  ON lesson_students FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM lessons l
      WHERE l.id = lesson_id
        AND l.studio_id = get_user_studio_id()
        AND has_role('staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lessons l
      WHERE l.id = lesson_id
        AND l.studio_id = get_user_studio_id()
        AND has_role('staff')
    )
  );

-- Payments
CREATE POLICY "Staff can view payments"
  ON payments FOR SELECT
  USING (studio_id = get_user_studio_id() AND deleted_at IS NULL);

CREATE POLICY "Staff can insert payments"
  ON payments FOR INSERT
  WITH CHECK (studio_id = get_user_studio_id() AND has_role('staff'));

CREATE POLICY "Staff can update payments"
  ON payments FOR UPDATE
  USING (studio_id = get_user_studio_id() AND has_role('staff'))
  WITH CHECK (studio_id = get_user_studio_id());

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE lessons;
ALTER PUBLICATION supabase_realtime ADD TABLE students;
ALTER PUBLICATION supabase_realtime ADD TABLE payments;

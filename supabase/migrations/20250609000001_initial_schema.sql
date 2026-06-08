-- Bigelates Production Schema
-- UUID primary keys, soft delete, RLS, indexes

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE user_role AS ENUM ('admin', 'staff', 'user');
CREATE TYPE lesson_type AS ENUM ('ozel', 'grup');
CREATE TYPE lesson_status AS ENUM ('planlandi', 'geldi', 'gelmedi', 'iptal');
CREATE TYPE payment_status AS ENUM ('odendi', 'bekliyor');

-- Studios (multi-tenant root)
CREATE TABLE studios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Varsayılan ücretler örnektir; panelden güncellenir
  settings JSONB NOT NULL DEFAULT '{"price_ozel": 500, "price_grup": 200, "work_slots": 12, "accent_color": "#7C9A6F"}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_studios_owner ON studios(owner_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_studios_slug ON studios(slug) WHERE deleted_at IS NULL;

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  role user_role NOT NULL DEFAULT 'staff',
  studio_id UUID REFERENCES studios(id) ON DELETE SET NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_profiles_studio ON profiles(studio_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_profiles_role ON profiles(role) WHERE deleted_at IS NULL;

-- Students
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  type lesson_type NOT NULL DEFAULT 'ozel',
  package_total INTEGER NOT NULL DEFAULT 8 CHECK (package_total > 0),
  remaining INTEGER NOT NULL DEFAULT 8 CHECK (remaining >= 0),
  payment_status payment_status NOT NULL DEFAULT 'odendi',
  join_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  color TEXT NOT NULL DEFAULT '#8FA688',
  initials TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_students_studio ON students(studio_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_students_payment ON students(studio_id, payment_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_students_name ON students(studio_id, name) WHERE deleted_at IS NULL;

-- Lessons
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME NOT NULL,
  type lesson_type NOT NULL,
  status lesson_status NOT NULL DEFAULT 'planlandi',
  fee NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (fee >= 0),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_lessons_studio_date ON lessons(studio_id, date) WHERE deleted_at IS NULL;
CREATE INDEX idx_lessons_status ON lessons(studio_id, status) WHERE deleted_at IS NULL;

-- Lesson-Student junction
CREATE TABLE lesson_students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(lesson_id, student_id)
);

CREATE INDEX idx_lesson_students_lesson ON lesson_students(lesson_id);
CREATE INDEX idx_lesson_students_student ON lesson_students(student_id);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  package_label TEXT NOT NULL,
  status payment_status NOT NULL DEFAULT 'bekliyor',
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_payments_studio ON payments(studio_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_student ON payments(student_id) WHERE deleted_at IS NULL;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER studios_updated_at BEFORE UPDATE ON studios FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER lessons_updated_at BEFORE UPDATE ON lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'staff')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Helper: get user's studio_id
CREATE OR REPLACE FUNCTION get_user_studio_id()
RETURNS UUID AS $$
  SELECT studio_id FROM profiles WHERE id = auth.uid() AND deleted_at IS NULL;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: check role
CREATE OR REPLACE FUNCTION has_role(required_role user_role)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND deleted_at IS NULL
      AND (
        role = required_role
        OR (required_role = 'staff' AND role = 'admin')
        OR (required_role = 'user' AND role IN ('admin', 'staff', 'user'))
      )
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Bigelates Production Schema (idempotent — güvenle tekrar çalıştırılabilir)
-- Sıra: Bu dosyayı ÖNCE çalıştırın, sonra 20250609000002_rls_policies.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Enums (zaten varsa atla)
-- ---------------------------------------------------------------------------
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('admin', 'staff', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE lesson_type AS ENUM ('ozel', 'grup');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE lesson_status AS ENUM ('planlandi', 'geldi', 'gelmedi', 'iptal');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE payment_status AS ENUM ('odendi', 'bekliyor');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS studios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{"price_ozel": 750, "price_grup": 200, "work_slots": 12, "accent_color": "#7C9A6F"}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS profiles (
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

CREATE TABLE IF NOT EXISTS students (
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

CREATE TABLE IF NOT EXISTS lessons (
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

CREATE TABLE IF NOT EXISTS lesson_students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(lesson_id, student_id)
);

CREATE TABLE IF NOT EXISTS payments (
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

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_studios_owner ON studios(owner_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_studios_slug ON studios(slug) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_studio ON profiles(studio_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_students_studio ON students(studio_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_students_payment ON students(studio_id, payment_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_students_name ON students(studio_id, name) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lessons_studio_date ON lessons(studio_id, date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lessons_status ON lessons(studio_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lesson_students_lesson ON lesson_students(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_students_student ON lesson_students(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_studio ON payments(studio_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id) WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- Functions
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'staff')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION get_user_studio_id()
RETURNS UUID AS $$
  SELECT studio_id FROM profiles WHERE id = auth.uid() AND deleted_at IS NULL;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

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
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- ---------------------------------------------------------------------------
-- Triggers (önce sil, sonra oluştur)
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS studios_updated_at ON studios;
CREATE TRIGGER studios_updated_at
  BEFORE UPDATE ON studios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS students_updated_at ON students;
CREATE TRIGGER students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS lessons_updated_at ON lessons;
CREATE TRIGGER lessons_updated_at
  BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS payments_updated_at ON payments;
CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

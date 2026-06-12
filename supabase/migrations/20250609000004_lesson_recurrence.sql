-- Tekrarlayan dersler (haftalık / aylık)

DO $$ BEGIN
  CREATE TYPE lesson_recurrence AS ENUM ('none', 'weekly', 'monthly');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS recurrence lesson_recurrence NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS recurrence_group_id UUID;

CREATE INDEX IF NOT EXISTS idx_lessons_recurrence_group
  ON lessons(recurrence_group_id)
  WHERE deleted_at IS NULL AND recurrence_group_id IS NOT NULL;

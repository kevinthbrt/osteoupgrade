-- Encyclopedia module: subjects (matières) and entries (recursive tree)

-- 1. Subjects table (matières: sémiologie, anatomie, etc.)
CREATE TABLE IF NOT EXISTS encyclopedia_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,              -- lucide icon name (optional)
  color TEXT,             -- gradient color class (optional)
  order_index INTEGER NOT NULL DEFAULT 0,
  is_free_access BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Entries table (recursive: chapitres, parties, sous-parties…)
CREATE TABLE IF NOT EXISTS encyclopedia_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES encyclopedia_subjects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES encyclopedia_entries(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_html TEXT,          -- rich text content (HTML)
  vimeo_url TEXT,             -- optional Vimeo video URL
  images JSONB DEFAULT '[]',  -- array of {url, caption}
  order_index INTEGER NOT NULL DEFAULT 0,
  is_free_access BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_encyclopedia_entries_subject ON encyclopedia_entries(subject_id);
CREATE INDEX IF NOT EXISTS idx_encyclopedia_entries_parent ON encyclopedia_entries(parent_id);
CREATE INDEX IF NOT EXISTS idx_encyclopedia_subjects_order ON encyclopedia_subjects(order_index);
CREATE INDEX IF NOT EXISTS idx_encyclopedia_entries_order ON encyclopedia_entries(subject_id, parent_id, order_index);

-- 3. Row Level Security
ALTER TABLE encyclopedia_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE encyclopedia_entries ENABLE ROW LEVEL SECURITY;

-- Read policies: authenticated users can read
CREATE POLICY "Authenticated users can read encyclopedia subjects"
  ON encyclopedia_subjects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read encyclopedia entries"
  ON encyclopedia_entries FOR SELECT
  TO authenticated
  USING (true);

-- Write policies: only admins
CREATE POLICY "Admins can insert encyclopedia subjects"
  ON encyclopedia_subjects FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update encyclopedia subjects"
  ON encyclopedia_subjects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete encyclopedia subjects"
  ON encyclopedia_subjects FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert encyclopedia entries"
  ON encyclopedia_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update encyclopedia entries"
  ON encyclopedia_entries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete encyclopedia entries"
  ON encyclopedia_entries FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 4. Updated_at trigger
CREATE OR REPLACE FUNCTION update_encyclopedia_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_encyclopedia_subjects_updated_at
  BEFORE UPDATE ON encyclopedia_subjects
  FOR EACH ROW EXECUTE FUNCTION update_encyclopedia_updated_at();

CREATE TRIGGER trg_encyclopedia_entries_updated_at
  BEFORE UPDATE ON encyclopedia_entries
  FOR EACH ROW EXECUTE FUNCTION update_encyclopedia_updated_at();

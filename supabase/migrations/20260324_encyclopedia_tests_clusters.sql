-- Migration: associate ortho tests and clusters to encyclopedia entries
-- Pattern follows pathology_tests and pathology_clusters

-- 1. Junction table: encyclopedia entries <-> orthopedic tests
CREATE TABLE IF NOT EXISTS public.encyclopedia_entry_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.encyclopedia_entries(id) ON DELETE CASCADE,
  test_id UUID NOT NULL REFERENCES public.orthopedic_tests(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(entry_id, test_id)
);

CREATE INDEX IF NOT EXISTS idx_encyclopedia_entry_tests_entry ON public.encyclopedia_entry_tests(entry_id);
CREATE INDEX IF NOT EXISTS idx_encyclopedia_entry_tests_test ON public.encyclopedia_entry_tests(test_id);

-- 2. Junction table: encyclopedia entries <-> orthopedic test clusters
CREATE TABLE IF NOT EXISTS public.encyclopedia_entry_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.encyclopedia_entries(id) ON DELETE CASCADE,
  cluster_id UUID NOT NULL REFERENCES public.orthopedic_test_clusters(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(entry_id, cluster_id)
);

CREATE INDEX IF NOT EXISTS idx_encyclopedia_entry_clusters_entry ON public.encyclopedia_entry_clusters(entry_id);
CREATE INDEX IF NOT EXISTS idx_encyclopedia_entry_clusters_cluster ON public.encyclopedia_entry_clusters(cluster_id);

-- 3. RLS
ALTER TABLE encyclopedia_entry_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE encyclopedia_entry_clusters ENABLE ROW LEVEL SECURITY;

-- Read: authenticated
CREATE POLICY "Authenticated users can read encyclopedia_entry_tests"
  ON encyclopedia_entry_tests FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read encyclopedia_entry_clusters"
  ON encyclopedia_entry_clusters FOR SELECT TO authenticated USING (true);

-- Write: admins only
CREATE POLICY "Admins can insert encyclopedia_entry_tests"
  ON encyclopedia_entry_tests FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update encyclopedia_entry_tests"
  ON encyclopedia_entry_tests FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete encyclopedia_entry_tests"
  ON encyclopedia_entry_tests FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can insert encyclopedia_entry_clusters"
  ON encyclopedia_entry_clusters FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update encyclopedia_entry_clusters"
  ON encyclopedia_entry_clusters FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete encyclopedia_entry_clusters"
  ON encyclopedia_entry_clusters FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

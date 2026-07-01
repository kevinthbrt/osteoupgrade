-- Attestations de complétion pour les formations e-learning (elearning_formations)

CREATE TABLE IF NOT EXISTS course_certificates (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL,
  formation_id       uuid NOT NULL REFERENCES elearning_formations(id) ON DELETE CASCADE,
  certificate_number text NOT NULL UNIQUE,
  issued_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, formation_id)
);

CREATE INDEX IF NOT EXISTS idx_course_certs_user ON course_certificates(user_id);

ALTER TABLE course_certificates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'course_certificates' AND policyname = 'course_certs_own'
  ) THEN
    CREATE POLICY course_certs_own ON course_certificates
      FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE SEQUENCE IF NOT EXISTS course_certificate_seq START 1;

CREATE OR REPLACE FUNCTION next_course_certificate_number()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE seq_val bigint; year_val text; BEGIN
  seq_val := nextval('course_certificate_seq');
  year_val := to_char(now(), 'YYYY');
  RETURN 'OSTEOUPGRADE-FORM-' || year_val || '-' || lpad(seq_val::text, 5, '0');
END; $$;

-- OsteoFlash: Certificates + Achievement seeds

CREATE TABLE IF NOT EXISTS flashcard_certificates (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL,
  deck_id            uuid NOT NULL REFERENCES flashcard_decks(id) ON DELETE CASCADE,
  certificate_number text NOT NULL UNIQUE,
  issued_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, deck_id)
);

CREATE INDEX IF NOT EXISTS idx_flashcard_certs_user ON flashcard_certificates(user_id);

ALTER TABLE flashcard_certificates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'flashcard_certificates' AND policyname = 'certs_own'
  ) THEN
    CREATE POLICY certs_own ON flashcard_certificates
      FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE SEQUENCE IF NOT EXISTS flashcard_certificate_seq START 1;

CREATE OR REPLACE FUNCTION next_certificate_number(deck_theme text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE seq_val bigint; year_val text; BEGIN
  seq_val := nextval('flashcard_certificate_seq');
  year_val := to_char(now(), 'YYYY');
  RETURN 'OSTEOFLASH-' || upper(deck_theme) || '-' || year_val || '-' || lpad(seq_val::text, 5, '0');
END; $$;

INSERT INTO achievements (slug, name, description, icon, category, unlock_condition, points, gradient_from, gradient_to, is_active, display_order)
VALUES ('osteoflash_lombalgie', 'Maître de la Lombalgie', '115 cartes cliniques OsteoFlash maîtrisées', 'Brain', 'special', '{"type":"osteoflash_deck","deck_theme":"lombalgie"}', 200, 'from-violet-500', 'to-indigo-600', true, 100)
ON CONFLICT (slug) DO NOTHING;

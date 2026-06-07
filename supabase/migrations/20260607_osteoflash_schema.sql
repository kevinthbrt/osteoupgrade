-- OsteoFlash: flashcard tables schema + Lombalgie seed
-- Safe to run on a fresh database; all statements are idempotent.

-- ─── SCHEMA ─────────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS flashcard_decks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  description text,
  theme       text,
  total_cards integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS flashcards (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id     uuid NOT NULL REFERENCES flashcard_decks(id) ON DELETE CASCADE,
  position    integer NOT NULL DEFAULT 0,
  module_name text,
  question    text NOT NULL,
  answer      text NOT NULL,
  explanation text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS flashcard_progress (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL,
  card_id        uuid NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
  deck_id        uuid NOT NULL REFERENCES flashcard_decks(id) ON DELETE CASCADE,
  repetition     integer NOT NULL DEFAULT 0,
  ease_factor    numeric NOT NULL DEFAULT 2.5,
  interval_days  integer NOT NULL DEFAULT 1,
  next_review_at timestamptz NOT NULL DEFAULT now(),
  last_rating    integer,
  reviewed_at    timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, card_id)
);

CREATE INDEX IF NOT EXISTS idx_flashcards_deck_id ON flashcards(deck_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_progress_user_id ON flashcard_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_progress_card_id ON flashcard_progress(card_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_progress_deck_id ON flashcard_progress(deck_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_progress_next_review ON flashcard_progress(next_review_at);

-- ─── RLS ──────────────────────────────────────────────────────────────────────────────────────

ALTER TABLE flashcard_decks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards         ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_progress ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'flashcard_decks' AND policyname = 'flashcard_decks_read'
  ) THEN
    CREATE POLICY flashcard_decks_read ON flashcard_decks FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'flashcards' AND policyname = 'flashcards_read'
  ) THEN
    CREATE POLICY flashcards_read ON flashcards FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'flashcard_progress' AND policyname = 'flashcard_progress_own'
  ) THEN
    CREATE POLICY flashcard_progress_own ON flashcard_progress
      FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ─── SEED — Lombalgie deck ────────────────────────────────────────────────────────────────────

INSERT INTO flashcard_decks (id, title, description, theme, total_cards)
VALUES ('4b9c53ad-9e9b-416e-95db-d0d0f0b7720d', 'Lombalgie',
        'Épidémiologie, diagnostic, traitement et réhabilitation de la lombalgie',
        'lombalgie', 115)
ON CONFLICT (id) DO UPDATE SET total_cards = EXCLUDED.total_cards;

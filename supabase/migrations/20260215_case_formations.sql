ALTER TABLE elearning_formations
  ADD COLUMN IF NOT EXISTS content_type text NOT NULL DEFAULT 'course'
  CHECK (content_type IN ('course', 'case'));

ALTER TABLE elearning_subparts
  ADD COLUMN IF NOT EXISTS image_url text;

CREATE OR REPLACE FUNCTION search_elearning_formations(search_term text)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  content_type text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ef.id,
    ef.title,
    ef.description,
    ef.content_type
  FROM elearning_formations ef
  WHERE
    f_unaccent(ef.title) ILIKE f_unaccent('%' || search_term || '%')
    OR f_unaccent(COALESCE(ef.description, '')) ILIKE f_unaccent('%' || search_term || '%')
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION search_elearning_chapters(search_term text)
RETURNS TABLE (
  id uuid,
  title text,
  formation_id uuid
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ec.id,
    ec.title,
    ec.formation_id
  FROM elearning_chapters ec
  JOIN elearning_formations ef ON ef.id = ec.formation_id
  WHERE
    ef.content_type = 'course'
    AND f_unaccent(ec.title) ILIKE f_unaccent('%' || search_term || '%')
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION search_elearning_subparts(search_term text)
RETURNS TABLE (
  id uuid,
  title text,
  chapter_id uuid
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    es.id,
    es.title,
    es.chapter_id
  FROM elearning_subparts es
  JOIN elearning_chapters ec ON ec.id = es.chapter_id
  JOIN elearning_formations ef ON ef.id = ec.formation_id
  WHERE
    ef.content_type = 'course'
    AND f_unaccent(es.title) ILIKE f_unaccent('%' || search_term || '%')
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

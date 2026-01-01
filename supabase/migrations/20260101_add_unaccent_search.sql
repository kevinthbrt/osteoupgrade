-- Enable unaccent extension for accent-insensitive search
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Create a helper function for accent and case insensitive search
CREATE OR REPLACE FUNCTION f_unaccent(text)
RETURNS text AS
$func$
SELECT unaccent('unaccent', $1)
$func$ LANGUAGE sql IMMUTABLE;

-- Create a custom operator for easier searching
CREATE OR REPLACE FUNCTION f_unaccent_ilike(text, text)
RETURNS boolean AS
$func$
SELECT f_unaccent($1) ILIKE f_unaccent($2)
$func$ LANGUAGE sql IMMUTABLE;

-- Create search function for formations
CREATE OR REPLACE FUNCTION search_elearning_formations(search_term text)
RETURNS TABLE (
  id uuid,
  title text,
  description text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ef.id,
    ef.title,
    ef.description
  FROM elearning_formations ef
  WHERE
    f_unaccent(ef.title) ILIKE f_unaccent('%' || search_term || '%')
    OR f_unaccent(COALESCE(ef.description, '')) ILIKE f_unaccent('%' || search_term || '%')
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Create search function for pathologies
CREATE OR REPLACE FUNCTION search_pathologies(search_term text)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  region text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.description,
    p.region
  FROM pathologies p
  WHERE
    f_unaccent(p.name) ILIKE f_unaccent('%' || search_term || '%')
    OR f_unaccent(COALESCE(p.description, '')) ILIKE f_unaccent('%' || search_term || '%')
    OR f_unaccent(COALESCE(p.region, '')) ILIKE f_unaccent('%' || search_term || '%')
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Create search function for orthopedic tests
CREATE OR REPLACE FUNCTION search_orthopedic_tests(search_term text)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  category text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ot.id,
    ot.name,
    ot.description,
    ot.category
  FROM orthopedic_tests ot
  WHERE
    f_unaccent(ot.name) ILIKE f_unaccent('%' || search_term || '%')
    OR f_unaccent(COALESCE(ot.description, '')) ILIKE f_unaccent('%' || search_term || '%')
    OR f_unaccent(COALESCE(ot.category, '')) ILIKE f_unaccent('%' || search_term || '%')
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Create search function for practice videos
CREATE OR REPLACE FUNCTION search_practice_videos(search_term text)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  region text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pv.id,
    pv.title,
    pv.description,
    pv.region
  FROM practice_videos pv
  WHERE
    f_unaccent(pv.title) ILIKE f_unaccent('%' || search_term || '%')
    OR f_unaccent(COALESCE(pv.description, '')) ILIKE f_unaccent('%' || search_term || '%')
    OR f_unaccent(COALESCE(pv.region, '')) ILIKE f_unaccent('%' || search_term || '%')
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Comment for documentation
COMMENT ON FUNCTION f_unaccent(text) IS 'Remove accents from text for search purposes';
COMMENT ON FUNCTION f_unaccent_ilike(text, text) IS 'Case and accent insensitive LIKE comparison';
COMMENT ON FUNCTION search_elearning_formations(text) IS 'Search formations with accent-insensitive matching';
COMMENT ON FUNCTION search_pathologies(text) IS 'Search pathologies with accent-insensitive matching';
COMMENT ON FUNCTION search_orthopedic_tests(text) IS 'Search orthopedic tests with accent-insensitive matching';
COMMENT ON FUNCTION search_practice_videos(text) IS 'Search practice videos with accent-insensitive matching';

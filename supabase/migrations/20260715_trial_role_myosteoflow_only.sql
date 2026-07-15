-- Essai gratuit 7 jours : le rôle 'trial' déverrouille UNIQUEMENT MyOsteoFlow
-- (login + accès à l'app), pas le contenu premium (cours e-learning,
-- flashcards, formations). Un compte 'trial' est donc traité comme 'free'
-- partout sauf dans les deux points d'entrée MyOsteoFlow (auth + verify).
--
-- Ce fichier :
--   1. Autorise 'trial' dans profiles.role
--   2. Ajoute une table de fingerprints de carte pour empêcher un même moyen
--      de paiement de déclencher plusieurs essais gratuits sous des comptes
--      différents
--   3. Fait filtrer par is_free_access les RPC utilisées par MyOsteoFlow pour
--      servir les formations (cours), pour tout rôle autre que
--      premium/admin — donc y compris 'trial'

-- 1. Rôle 'trial'
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role = ANY (ARRAY['free'::text, 'trial'::text, 'premium'::text, 'admin'::text]));

-- 2. Anti-abus essai gratuit par empreinte de carte Stripe
CREATE TABLE IF NOT EXISTS trial_card_fingerprints (
  fingerprint text PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE trial_card_fingerprints ENABLE ROW LEVEL SECURITY;
-- Aucune policy : accessible uniquement via la clé service_role (webhook Stripe).

-- 3. Verrouiller les cours/formations premium pour les rôles autres que
--    premium/admin dans les RPC utilisées par MyOsteoFlow (contournent RLS
--    via SECURITY DEFINER, donc le filtrage doit être fait ici explicitement)

CREATE OR REPLACE FUNCTION public.get_all_formations_with_progress(p_email text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_role    text;
  v_result  json;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email LIMIT 1;
  SELECT role INTO v_role FROM profiles WHERE id = v_user_id;

  SELECT json_agg(
    json_build_object(
      'id',                    f.id,
      'title',                 f.title,
      'description',           f.description,
      'photo_url',             f.photo_url,
      'is_featured_osteoflow', f.is_featured_osteoflow,
      'total', (
        SELECT COUNT(*)
        FROM elearning_subparts s
        JOIN elearning_chapters c ON c.id = s.chapter_id
        WHERE c.formation_id = f.id
      ),
      'completed', (
        SELECT COUNT(*)
        FROM elearning_subpart_progress sp
        JOIN elearning_subparts s ON s.id = sp.subpart_id
        JOIN elearning_chapters c ON c.id = s.chapter_id
        WHERE c.formation_id = f.id AND sp.user_id = v_user_id
      )
    ) ORDER BY f.title
  ) INTO v_result
  FROM elearning_formations f
  WHERE NOT COALESCE(f.is_private, false)
    AND (COALESCE(v_role, '') IN ('premium', 'admin') OR COALESCE(f.is_free_access, false));

  RETURN COALESCE(v_result, '[]'::json);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_formation_full(p_email text, p_formation_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_role    text;
  v_is_free_access boolean;
  v_result  json;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email LIMIT 1;
  SELECT role INTO v_role FROM profiles WHERE id = v_user_id;

  SELECT is_free_access INTO v_is_free_access FROM elearning_formations WHERE id = p_formation_id;

  IF v_is_free_access IS NULL THEN
    RETURN NULL; -- formation introuvable
  END IF;

  IF NOT (COALESCE(v_role, '') IN ('premium', 'admin') OR COALESCE(v_is_free_access, false)) THEN
    RETURN NULL; -- contenu premium verrouillé pour ce rôle (ex: essai gratuit MyOsteoFlow)
  END IF;

  SELECT json_build_object(
    'id',          f.id,
    'title',       f.title,
    'description', f.description,
    'photo_url',   f.photo_url,
    'total', (
      SELECT COUNT(*) FROM elearning_subparts s2
      JOIN elearning_chapters c2 ON c2.id = s2.chapter_id
      WHERE c2.formation_id = f.id
    ),
    'completed', (
      SELECT COUNT(*) FROM elearning_subpart_progress sp2
      JOIN elearning_subparts s2 ON s2.id = sp2.subpart_id
      JOIN elearning_chapters c2 ON c2.id = s2.chapter_id
      WHERE c2.formation_id = f.id AND sp2.user_id = v_user_id
    ),
    'chapters', (
      SELECT json_agg(
        json_build_object(
          'id',          c.id,
          'title',       c.title,
          'order_index', c.order_index,
          'subparts', (
            SELECT json_agg(
              json_build_object(
                'id',               s.id,
                'title',            s.title,
                'order_index',      s.order_index,
                'vimeo_url',        s.vimeo_url,
                'description_html', s.description_html,
                'pdf_url',          s.pdf_url,
                'pdf_name',         s.pdf_name,
                'completed', (
                  SELECT COUNT(*) > 0
                  FROM elearning_subpart_progress sp
                  WHERE sp.subpart_id = s.id AND sp.user_id = v_user_id
                ),
                'quiz', (
                  SELECT json_build_object(
                    'id',            q.id,
                    'title',         q.title,
                    'description',   q.description,
                    'passing_score', q.passing_score,
                    'quiz_passed', (
                      SELECT COUNT(*) > 0
                      FROM elearning_quiz_attempts qa
                      WHERE qa.quiz_id = q.id AND qa.user_id = v_user_id AND qa.passed = true
                    ),
                    'questions', (
                      SELECT json_agg(
                        json_build_object(
                          'id',            qq.id,
                          'question_text', qq.question_text,
                          'question_type', qq.question_type,
                          'points',        qq.points,
                          'order_index',   qq.order_index,
                          'explanation',   qq.explanation,
                          'answers', (
                            SELECT json_agg(
                              json_build_object(
                                'id',           qa2.id,
                                'answer_text',  qa2.answer_text,
                                'is_correct',   qa2.is_correct,
                                'order_index',  qa2.order_index
                              ) ORDER BY qa2.order_index
                            )
                            FROM elearning_quiz_answers qa2
                            WHERE qa2.question_id = qq.id
                          )
                        ) ORDER BY qq.order_index
                      )
                      FROM elearning_quiz_questions qq
                      WHERE qq.quiz_id = q.id
                    )
                  )
                  FROM elearning_quizzes q
                  WHERE q.subpart_id = s.id
                  LIMIT 1
                )
              ) ORDER BY s.order_index
            )
            FROM elearning_subparts s
            WHERE s.chapter_id = c.id
          )
        ) ORDER BY c.order_index
      )
      FROM elearning_chapters c
      WHERE c.formation_id = f.id
    )
  ) INTO v_result
  FROM elearning_formations f
  WHERE f.id = p_formation_id;

  RETURN v_result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_formation_progress_full(p_email text, p_formation_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  v_user_id uuid;
  v_role    text;
  v_is_free_access boolean;
  v_result  json;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email LIMIT 1;
  SELECT role INTO v_role FROM profiles WHERE id = v_user_id;

  SELECT is_free_access INTO v_is_free_access FROM elearning_formations WHERE id = p_formation_id;

  IF v_is_free_access IS NULL OR NOT (COALESCE(v_role, '') IN ('premium', 'admin') OR COALESCE(v_is_free_access, false)) THEN
    RETURN NULL;
  END IF;

  WITH chapter_rows AS (
    SELECT
      c.id,
      c.title,
      c.order_index,
      json_agg(
        json_build_object(
          'id',          s.id,
          'title',       s.title,
          'order_index', s.order_index,
          'completed',   (sp.subpart_id IS NOT NULL)
        ) ORDER BY s.order_index
      ) AS subparts
    FROM elearning_chapters c
    JOIN elearning_subparts s ON s.chapter_id = c.id
    LEFT JOIN elearning_subpart_progress sp
           ON sp.subpart_id = s.id
          AND sp.user_id = v_user_id
    WHERE c.formation_id = p_formation_id
    GROUP BY c.id, c.title, c.order_index
  ),
  totals AS (
    SELECT
      COUNT(DISTINCT s.id)             AS total_subparts,
      COUNT(DISTINCT sp.subpart_id)    AS completed_subparts
    FROM elearning_chapters c
    JOIN elearning_subparts s ON s.chapter_id = c.id
    LEFT JOIN elearning_subpart_progress sp
           ON sp.subpart_id = s.id
          AND sp.user_id = v_user_id
    WHERE c.formation_id = p_formation_id
  )
  SELECT json_build_object(
    'total',     t.total_subparts,
    'completed', t.completed_subparts,
    'chapters',  (
      SELECT json_agg(
        json_build_object(
          'id',          r.id,
          'title',       r.title,
          'order_index', r.order_index,
          'subparts',    r.subparts
        ) ORDER BY r.order_index
      )
      FROM chapter_rows r
    )
  ) INTO v_result
  FROM totals t;

  RETURN v_result;
END;
$function$;

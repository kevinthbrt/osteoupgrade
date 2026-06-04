-- Mise à jour de get_formation_full pour inclure pdf_url et pdf_name dans les sous-parties

CREATE OR REPLACE FUNCTION public.get_formation_full(p_email text, p_formation_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_result  json;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email LIMIT 1;

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
$$;

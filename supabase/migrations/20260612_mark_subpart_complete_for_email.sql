-- RPC functions used by the OsteoFlow proxy API (app/api/osteoflow/mark-complete/route.ts)
-- to mark a course subpart as complete or incomplete, identified by user email.

CREATE OR REPLACE FUNCTION public.mark_subpart_complete_for_email(
  p_email TEXT,
  p_subpart_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Resolve email to user id
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found for email: %', p_email;
  END IF;

  -- Upsert completion record
  INSERT INTO public.elearning_subpart_progress (user_id, subpart_id, completed_at)
  VALUES (v_user_id, p_subpart_id, NOW())
  ON CONFLICT (user_id, subpart_id) DO UPDATE
    SET completed_at = EXCLUDED.completed_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_subpart_incomplete_for_email(
  p_email TEXT,
  p_subpart_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Resolve email to user id
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found for email: %', p_email;
  END IF;

  -- Remove completion record
  DELETE FROM public.elearning_subpart_progress
  WHERE user_id = v_user_id
    AND subpart_id = p_subpart_id;
END;
$$;

-- Grant execute to authenticated and service roles
GRANT EXECUTE ON FUNCTION public.mark_subpart_complete_for_email(TEXT, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_subpart_incomplete_for_email(TEXT, UUID) TO service_role;

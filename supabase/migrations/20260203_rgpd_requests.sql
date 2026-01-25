-- RGPD: request tracking for access/deletion

CREATE TABLE IF NOT EXISTS public.gdpr_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  request_type text NOT NULL CHECK (request_type IN ('access', 'deletion', 'rectification', 'portability', 'objection')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  details jsonb DEFAULT '{}'::jsonb,
  requested_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  processed_by uuid REFERENCES public.profiles(id),
  notes text
);

ALTER TABLE public.gdpr_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own gdpr requests" ON public.gdpr_requests;
DROP POLICY IF EXISTS "Admins manage gdpr requests" ON public.gdpr_requests;

CREATE POLICY "Users manage own gdpr requests"
ON public.gdpr_requests
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage gdpr requests"
ON public.gdpr_requests
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Threaded support messages for real-time chat between user and admin
CREATE TABLE IF NOT EXISTS public.support_messages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   UUID        NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender      TEXT        NOT NULL CHECK (sender IN ('user', 'admin')),
  content     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS support_messages_ticket_created
  ON public.support_messages (ticket_id, created_at ASC);

-- Track last admin message timestamp for unread badge in Osteoflow widget
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS last_admin_message_at TIMESTAMPTZ;

-- Migrate existing admin replies to new messages table
INSERT INTO public.support_messages (ticket_id, sender, content, created_at)
SELECT id, 'admin', admin_reply, COALESCE(admin_replied_at, updated_at)
FROM public.support_tickets
WHERE admin_reply IS NOT NULL AND trim(admin_reply) <> '';

UPDATE public.support_tickets
SET last_admin_message_at = COALESCE(admin_replied_at, updated_at)
WHERE admin_reply IS NOT NULL AND trim(admin_reply) <> '';

-- RLS: accessed only via service_role API routes
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all" ON public.support_messages;
CREATE POLICY "service_role_all" ON public.support_messages
  USING (true) WITH CHECK (true);

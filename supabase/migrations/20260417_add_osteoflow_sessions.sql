-- Migration: Add osteoflow_sessions table for desktop app license management
-- Each row represents a device session tied to a user's active subscription.

CREATE TABLE IF NOT EXISTS osteoflow_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  device_id text NOT NULL,
  device_name text,
  last_active_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_osteoflow_sessions_token
  ON osteoflow_sessions(token);

CREATE INDEX IF NOT EXISTS idx_osteoflow_sessions_user_active
  ON osteoflow_sessions(user_id, last_active_at DESC);

-- Only the service role (API routes) can read/write sessions.
-- Regular authenticated users have no access.
ALTER TABLE osteoflow_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only"
  ON osteoflow_sessions
  USING (false)
  WITH CHECK (false);

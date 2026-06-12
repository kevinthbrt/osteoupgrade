ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS referred_by_source TEXT;

-- Create communication_documents table
CREATE TABLE IF NOT EXISTS public.communication_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size integer,
  category text CHECK (category = ANY (ARRAY['courrier'::text, 'attestation'::text, 'facture'::text, 'autre'::text])),
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT communication_documents_pkey PRIMARY KEY (id),
  CONSTRAINT communication_documents_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);

-- Enable Row Level Security
ALTER TABLE public.communication_documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read active communication documents" ON public.communication_documents;
DROP POLICY IF EXISTS "Admins can read all communication documents" ON public.communication_documents;
DROP POLICY IF EXISTS "Only admins can insert communication documents" ON public.communication_documents;
DROP POLICY IF EXISTS "Only admins can update communication documents" ON public.communication_documents;
DROP POLICY IF EXISTS "Only admins can delete communication documents" ON public.communication_documents;

-- Policy: Users can read active documents
CREATE POLICY "Anyone can read active communication documents"
  ON public.communication_documents
  FOR SELECT
  USING (is_active = true);

-- Policy: Admins can read all documents (active and inactive)
CREATE POLICY "Admins can read all communication documents"
  ON public.communication_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Only admins can insert
CREATE POLICY "Only admins can insert communication documents"
  ON public.communication_documents
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Only admins can update
CREATE POLICY "Only admins can update communication documents"
  ON public.communication_documents
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Only admins can delete
CREATE POLICY "Only admins can delete communication documents"
  ON public.communication_documents
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS communication_documents_category_idx ON public.communication_documents(category);
CREATE INDEX IF NOT EXISTS communication_documents_active_idx ON public.communication_documents(is_active);
CREATE INDEX IF NOT EXISTS communication_documents_display_order_idx ON public.communication_documents(display_order);

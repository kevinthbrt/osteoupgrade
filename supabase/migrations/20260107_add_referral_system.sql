-- Migration: Add Referral System for Premium Gold Members
-- Description: This migration creates the tables needed for the referral system
-- where Premium Gold members can invite people and earn 10% commission on annual subscriptions

-- Table: referral_codes
-- Stores unique referral codes for each Premium Gold member
CREATE TABLE public.referral_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  referral_code text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT referral_codes_pkey PRIMARY KEY (id),
  CONSTRAINT referral_codes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT referral_codes_unique_per_user UNIQUE (user_id)
);

-- Index for faster lookups by referral_code
CREATE INDEX idx_referral_codes_code ON public.referral_codes(referral_code);
CREATE INDEX idx_referral_codes_user_id ON public.referral_codes(user_id);

-- Table: referral_transactions
-- Records each subscription made with a referral code and the commission earned
CREATE TABLE public.referral_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL, -- The user who owns the referral code
  referred_user_id uuid NOT NULL, -- The user who subscribed using the code
  referral_code text NOT NULL,
  subscription_type text NOT NULL CHECK (subscription_type = ANY (ARRAY['premium_silver'::text, 'premium_gold'::text])),
  subscription_plan text NOT NULL CHECK (subscription_plan = ANY (ARRAY['monthly'::text, 'annual'::text])),
  subscription_amount integer NOT NULL, -- Amount in cents (e.g., 49900 for 499€)
  commission_amount integer NOT NULL, -- 10% of subscription_amount in cents
  commission_status text NOT NULL DEFAULT 'pending' CHECK (commission_status = ANY (ARRAY['pending'::text, 'available'::text, 'paid'::text, 'cancelled'::text])),
  stripe_subscription_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT referral_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT referral_transactions_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT referral_transactions_referred_user_id_fkey FOREIGN KEY (referred_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Indexes for faster queries
CREATE INDEX idx_referral_transactions_referrer_id ON public.referral_transactions(referrer_id);
CREATE INDEX idx_referral_transactions_referred_user_id ON public.referral_transactions(referred_user_id);
CREATE INDEX idx_referral_transactions_status ON public.referral_transactions(commission_status);

-- Table: referral_payouts
-- Tracks when users claim their referral earnings
CREATE TABLE public.referral_payouts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount integer NOT NULL, -- Total amount paid out in cents
  transaction_ids uuid[] NOT NULL DEFAULT '{}', -- Array of transaction IDs included in this payout
  payout_method text NOT NULL DEFAULT 'bank_transfer' CHECK (payout_method = ANY (ARRAY['bank_transfer'::text, 'paypal'::text, 'stripe'::text, 'credit'::text])),
  payout_status text NOT NULL DEFAULT 'requested' CHECK (payout_status = ANY (ARRAY['requested'::text, 'processing'::text, 'completed'::text, 'failed'::text, 'cancelled'::text])),
  payout_details jsonb DEFAULT '{}', -- Store bank details, PayPal email, etc.
  notes text,
  requested_at timestamp with time zone NOT NULL DEFAULT now(),
  processed_at timestamp with time zone,
  completed_at timestamp with time zone,
  CONSTRAINT referral_payouts_pkey PRIMARY KEY (id),
  CONSTRAINT referral_payouts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Index for faster queries
CREATE INDEX idx_referral_payouts_user_id ON public.referral_payouts(user_id);
CREATE INDEX idx_referral_payouts_status ON public.referral_payouts(payout_status);

-- Table: referral_earnings_summary
-- View to calculate total earnings per user (for performance)
CREATE OR REPLACE VIEW public.referral_earnings_summary AS
SELECT
  rt.referrer_id,
  COUNT(rt.id) as total_referrals,
  COUNT(rt.id) FILTER (WHERE rt.commission_status = 'available') as available_referrals,
  COALESCE(SUM(rt.commission_amount) FILTER (WHERE rt.commission_status = 'pending'), 0) as pending_amount,
  COALESCE(SUM(rt.commission_amount) FILTER (WHERE rt.commission_status = 'available'), 0) as available_amount,
  COALESCE(SUM(rt.commission_amount) FILTER (WHERE rt.commission_status = 'paid'), 0) as paid_amount,
  COALESCE(SUM(rt.commission_amount), 0) as total_earned
FROM public.referral_transactions rt
GROUP BY rt.referrer_id;

-- Function: Generate a unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code(user_full_name text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  base_code text;
  final_code text;
  code_exists boolean;
BEGIN
  -- Create base code from user's name (first 4 letters uppercase) + random 4 chars
  base_code := UPPER(SUBSTRING(REGEXP_REPLACE(COALESCE(user_full_name, 'USER'), '[^a-zA-Z]', '', 'g'), 1, 4));

  -- If name is too short, pad with 'X'
  IF LENGTH(base_code) < 4 THEN
    base_code := RPAD(base_code, 4, 'X');
  END IF;

  -- Try to generate a unique code
  FOR i IN 1..100 LOOP
    final_code := base_code || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0');

    SELECT EXISTS(SELECT 1 FROM public.referral_codes WHERE referral_code = final_code) INTO code_exists;

    IF NOT code_exists THEN
      RETURN final_code;
    END IF;
  END LOOP;

  -- If all attempts fail, use UUID
  RETURN UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 8));
END;
$$;

-- Function: Automatically create referral code for new Premium Gold users
CREATE OR REPLACE FUNCTION public.create_referral_code_for_gold_user()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  new_code text;
BEGIN
  -- Only create referral code if user is Premium Gold and doesn't have one yet
  IF NEW.role = 'premium_gold' AND NOT EXISTS (
    SELECT 1 FROM public.referral_codes WHERE user_id = NEW.id
  ) THEN
    new_code := public.generate_referral_code(NEW.full_name);

    INSERT INTO public.referral_codes (user_id, referral_code)
    VALUES (NEW.id, new_code);
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger: Create referral code when user becomes Premium Gold
CREATE TRIGGER trigger_create_referral_code_on_gold_upgrade
AFTER INSERT OR UPDATE OF role ON public.profiles
FOR EACH ROW
WHEN (NEW.role = 'premium_gold')
EXECUTE FUNCTION public.create_referral_code_for_gold_user();

-- Add comments for documentation
COMMENT ON TABLE public.referral_codes IS 'Stores unique referral codes for Premium Gold members';
COMMENT ON TABLE public.referral_transactions IS 'Records subscriptions made with referral codes and commissions earned';
COMMENT ON TABLE public.referral_payouts IS 'Tracks payout requests and processing for referral earnings';
COMMENT ON VIEW public.referral_earnings_summary IS 'Summary view of referral earnings per user for quick lookups';

-- Grant necessary permissions (adjust as needed)
GRANT SELECT, INSERT, UPDATE ON public.referral_codes TO authenticated;
GRANT SELECT ON public.referral_transactions TO authenticated;
GRANT SELECT, INSERT ON public.referral_payouts TO authenticated;
GRANT SELECT ON public.referral_earnings_summary TO authenticated;

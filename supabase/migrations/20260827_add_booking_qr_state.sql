ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS token_number integer,
  ADD COLUMN IF NOT EXISTS farmer_name text,
  ADD COLUMN IF NOT EXISTS centre_name text,
  ADD COLUMN IF NOT EXISTS crop text,
  ADD COLUMN IF NOT EXISTS weight_qtl numeric(6,2),
  ADD COLUMN IF NOT EXISTS appointment_time text,
  ADD COLUMN IF NOT EXISTS qr_code_token text,
  ADD COLUMN IF NOT EXISTS qr_code_payload text,
  ADD COLUMN IF NOT EXISTS qr_used_at timestamptz,
  ADD COLUMN IF NOT EXISTS checked_in_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirmation_status text DEFAULT 'confirmed';

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_qr_code_token
  ON public.bookings (qr_code_token)
  WHERE qr_code_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_qr_used_at
  ON public.bookings (qr_used_at);

CREATE INDEX IF NOT EXISTS idx_bookings_checked_in_at
  ON public.bookings (checked_in_at);

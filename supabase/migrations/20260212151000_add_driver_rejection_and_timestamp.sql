-- Add columns for rejection reason and registration submission timestamp
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS driver_rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS driver_registration_submitted_at TIMESTAMP WITH TIME ZONE;

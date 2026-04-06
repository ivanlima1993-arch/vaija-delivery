-- Update profiles table with driver-related columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS driver_address TEXT,
ADD COLUMN IF NOT EXISTS driver_birth_date DATE,
ADD COLUMN IF NOT EXISTS driver_id_photo_url TEXT,
ADD COLUMN IF NOT EXISTS driver_registration_submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS driver_rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS driver_vehicle_plate TEXT,
ADD COLUMN IF NOT EXISTS face_photo_url TEXT,
ADD COLUMN IF NOT EXISTS is_driver_approved BOOLEAN DEFAULT false;

-- Add index for driver approval status
CREATE INDEX IF NOT EXISTS idx_profiles_driver_approved ON public.profiles(is_driver_approved);

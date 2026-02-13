-- Add column for ID photo (RG)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS driver_id_photo_url TEXT;

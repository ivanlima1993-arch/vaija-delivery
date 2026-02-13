-- Add driver-specific columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS driver_vehicle_plate TEXT,
ADD COLUMN IF NOT EXISTS driver_birth_date DATE,
ADD COLUMN IF NOT EXISTS driver_address TEXT,
ADD COLUMN IF NOT EXISTS face_photo_url TEXT,
ADD COLUMN IF NOT EXISTS is_driver_approved BOOLEAN DEFAULT false;

-- Create storage bucket for driver documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('driver-documents', 'driver-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own driver documents
CREATE POLICY "Drivers can upload their own documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'driver-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to update their own driver documents
CREATE POLICY "Drivers can update their own documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'driver-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to delete their own driver documents
CREATE POLICY "Drivers can delete their own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'driver-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to driver documents
CREATE POLICY "Driver documents are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'driver-documents');

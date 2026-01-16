-- Create storage bucket for establishment images
INSERT INTO storage.buckets (id, name, public)
VALUES ('establishments', 'establishments', true);

-- Allow anyone to view establishment images (public bucket)
CREATE POLICY "Public can view establishment images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'establishments');

-- Allow authenticated users to upload their establishment images
CREATE POLICY "Authenticated users can upload establishment images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'establishments' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own establishment images
CREATE POLICY "Users can update own establishment images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'establishments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own establishment images
CREATE POLICY "Users can delete own establishment images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'establishments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
-- Create home_banners table
CREATE TABLE IF NOT EXISTS public.home_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL,
    title TEXT,
    subtitle TEXT,
    button_text TEXT DEFAULT 'Ver Mais',
    link_url TEXT,
    position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.home_banners ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read-only access to home_banners
CREATE POLICY "Allow public read-only access to home_banners" 
ON public.home_banners 
FOR SELECT 
USING (true);

-- Create policy to allow admin to manage home_banners
CREATE POLICY "Allow admin to manage home_banners" 
ON public.home_banners 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  )
);

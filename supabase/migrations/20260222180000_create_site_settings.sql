-- Create table for global site settings
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Admins can manage all settings
CREATE POLICY "Admins can manage all settings"
ON public.site_settings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Anyone (authenticated users) can read settings
CREATE POLICY "Anyone can read settings"
ON public.site_settings
FOR SELECT
TO authenticated
USING (true);

-- Insert default support settings
INSERT INTO public.site_settings (key, value)
VALUES ('support', '{
    "whatsapp": "5579988320546",
    "email": "suporte@vaijadelivery.com",
    "chatUrl": "",
    "days": ["1", "2", "3", "4", "5"],
    "startTime": "08:00",
    "endTime": "22:00"
}')
ON CONFLICT (key) DO NOTHING;

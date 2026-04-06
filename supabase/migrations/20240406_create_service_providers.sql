-- Create service_providers table
CREATE TABLE IF NOT EXISTS public.service_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    phone TEXT,
    email TEXT,
    image_url TEXT,
    rating DECIMAL(2, 1) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    city_id UUID REFERENCES public.cities(id),
    neighborhood_id UUID REFERENCES public.neighborhoods(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view active service providers"
ON public.service_providers
FOR SELECT
USING (is_active = true);

CREATE POLICY "Service providers can edit their own profile"
ON public.service_providers
FOR ALL
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all service providers"
ON public.service_providers
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_service_providers_updated_at
BEFORE UPDATE ON public.service_providers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed some initial data (Optional)
-- INSERT INTO public.service_providers (name, category, rating, is_active)
-- VALUES ('Ricardo Silva', 'Eletricista', 4.9, true), ('Ana Oliveira', 'Diarista', 5.0, true);

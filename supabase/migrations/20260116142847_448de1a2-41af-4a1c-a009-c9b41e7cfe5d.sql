-- Create table for active cities
CREATE TABLE public.cities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for neighborhoods/regions within cities
CREATE TABLE public.neighborhoods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  delivery_fee NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;

-- Cities policies
CREATE POLICY "Anyone can view active cities"
ON public.cities
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage all cities"
ON public.cities
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Neighborhoods policies
CREATE POLICY "Anyone can view active neighborhoods"
ON public.neighborhoods
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage all neighborhoods"
ON public.neighborhoods
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add city reference to establishments
ALTER TABLE public.establishments 
ADD COLUMN city_id UUID REFERENCES public.cities(id);

-- Triggers for updated_at
CREATE TRIGGER update_cities_updated_at
BEFORE UPDATE ON public.cities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_neighborhoods_updated_at
BEFORE UPDATE ON public.neighborhoods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
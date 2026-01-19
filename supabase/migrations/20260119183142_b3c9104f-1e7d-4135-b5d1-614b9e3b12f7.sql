-- Create coupons table
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL,
  min_order_value NUMERIC DEFAULT 0,
  max_discount NUMERIC,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  city_id UUID REFERENCES public.cities(id),
  neighborhood_id UUID REFERENCES public.neighborhoods(id),
  establishment_id UUID REFERENCES public.establishments(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Anyone can view active coupons
CREATE POLICY "Anyone can view active coupons" 
ON public.coupons 
FOR SELECT 
USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));

-- Admins can manage all coupons
CREATE POLICY "Admins can manage all coupons" 
ON public.coupons 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Establishment owners can manage their coupons
CREATE POLICY "Owners can manage establishment coupons" 
ON public.coupons 
FOR ALL 
USING (establishment_id IS NOT NULL AND owns_establishment(auth.uid(), establishment_id));

-- Create regional promotions table
CREATE TABLE public.promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed', 'free_delivery')),
  discount_value NUMERIC DEFAULT 0,
  banner_url TEXT,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  city_id UUID REFERENCES public.cities(id),
  neighborhood_id UUID REFERENCES public.neighborhoods(id),
  establishment_id UUID REFERENCES public.establishments(id),
  min_order_value NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- Anyone can view active promotions
CREATE POLICY "Anyone can view active promotions" 
ON public.promotions 
FOR SELECT 
USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));

-- Admins can manage all promotions
CREATE POLICY "Admins can manage all promotions" 
ON public.promotions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Establishment owners can manage their promotions
CREATE POLICY "Owners can manage establishment promotions" 
ON public.promotions 
FOR ALL 
USING (establishment_id IS NOT NULL AND owns_establishment(auth.uid(), establishment_id));

-- Create index for faster coupon code lookups
CREATE INDEX idx_coupons_code ON public.coupons(code);
CREATE INDEX idx_coupons_city ON public.coupons(city_id);
CREATE INDEX idx_promotions_city ON public.promotions(city_id);

-- Create trigger for updated_at
CREATE TRIGGER update_coupons_updated_at
BEFORE UPDATE ON public.coupons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_promotions_updated_at
BEFORE UPDATE ON public.promotions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
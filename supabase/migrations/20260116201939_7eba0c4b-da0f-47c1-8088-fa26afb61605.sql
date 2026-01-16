-- Create reviews table for establishments and drivers
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL,
  establishment_id UUID REFERENCES public.establishments(id) ON DELETE CASCADE,
  driver_id UUID,
  establishment_rating INTEGER CHECK (establishment_rating >= 1 AND establishment_rating <= 5),
  establishment_comment TEXT,
  driver_rating INTEGER CHECK (driver_rating >= 1 AND driver_rating <= 5),
  driver_comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(order_id)
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Customers can create reviews for their delivered orders
CREATE POLICY "Customers can create reviews for their orders"
ON public.reviews
FOR INSERT
WITH CHECK (
  auth.uid() = customer_id AND
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_id 
    AND orders.customer_id = auth.uid() 
    AND orders.status = 'delivered'
  )
);

-- Customers can view their own reviews
CREATE POLICY "Customers can view own reviews"
ON public.reviews
FOR SELECT
USING (auth.uid() = customer_id);

-- Establishments can view reviews about them
CREATE POLICY "Establishments can view their reviews"
ON public.reviews
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM establishments 
    WHERE establishments.id = reviews.establishment_id 
    AND establishments.owner_id = auth.uid()
  )
);

-- Drivers can view reviews about them
CREATE POLICY "Drivers can view their reviews"
ON public.reviews
FOR SELECT
USING (auth.uid() = driver_id);

-- Admins can view all reviews
CREATE POLICY "Admins can view all reviews"
ON public.reviews
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Anyone can view reviews for public display (average ratings)
CREATE POLICY "Anyone can view reviews for establishments"
ON public.reviews
FOR SELECT
USING (establishment_id IS NOT NULL);

-- Customers can update their own reviews (within 24 hours)
CREATE POLICY "Customers can update own reviews"
ON public.reviews
FOR UPDATE
USING (
  auth.uid() = customer_id AND 
  created_at > now() - interval '24 hours'
);

-- Add trigger to update updated_at
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update establishment rating after review
CREATE OR REPLACE FUNCTION public.update_establishment_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE establishments
  SET 
    rating = (
      SELECT COALESCE(AVG(establishment_rating), 0)
      FROM reviews
      WHERE establishment_id = NEW.establishment_id
      AND establishment_rating IS NOT NULL
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE establishment_id = NEW.establishment_id
      AND establishment_rating IS NOT NULL
    )
  WHERE id = NEW.establishment_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger to update establishment rating on new review
CREATE TRIGGER update_establishment_rating_trigger
AFTER INSERT OR UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_establishment_rating();
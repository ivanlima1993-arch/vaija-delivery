-- Create table for driver location tracking
CREATE TABLE public.driver_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  heading DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  accuracy DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;

-- Drivers can insert their own location
CREATE POLICY "Drivers can insert their own location"
ON public.driver_locations
FOR INSERT
WITH CHECK (auth.uid() = driver_id);

-- Drivers can view their own locations
CREATE POLICY "Drivers can view their own locations"
ON public.driver_locations
FOR SELECT
USING (auth.uid() = driver_id);

-- Customers can view driver location for their orders
CREATE POLICY "Customers can view driver location for their orders"
ON public.driver_locations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = driver_locations.order_id
    AND orders.customer_id = auth.uid()
    AND orders.status = 'out_for_delivery'
  )
);

-- Establishments can view driver location for their orders
CREATE POLICY "Establishments can view driver location for their orders"
ON public.driver_locations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.establishments e ON o.establishment_id = e.id
    WHERE o.id = driver_locations.order_id
    AND e.owner_id = auth.uid()
    AND o.status = 'out_for_delivery'
  )
);

-- Create index for faster queries
CREATE INDEX idx_driver_locations_order ON public.driver_locations(order_id);
CREATE INDEX idx_driver_locations_driver ON public.driver_locations(driver_id);
CREATE INDEX idx_driver_locations_created ON public.driver_locations(created_at DESC);

-- Enable realtime for driver_locations
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_locations;
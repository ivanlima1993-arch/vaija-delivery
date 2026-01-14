-- DRIVERS: allow drivers to view ready orders with no driver assigned
CREATE POLICY "Drivers can view ready orders without driver"
ON public.orders
FOR SELECT
USING (
  public.has_role(auth.uid(), 'driver'::public.app_role) 
  AND status = 'ready' 
  AND driver_id IS NULL
);

-- DRIVERS: allow drivers to accept orders (update ready orders without driver)
CREATE POLICY "Drivers can accept ready orders"
ON public.orders
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'driver'::public.app_role) 
  AND status = 'ready' 
  AND driver_id IS NULL
);
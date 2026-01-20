-- Drop and recreate the policy for drivers to view ready orders
DROP POLICY IF EXISTS "Drivers can view ready orders without driver" ON public.orders;

CREATE POLICY "Drivers can view ready orders without driver" 
ON public.orders 
FOR SELECT 
USING (
  has_role(auth.uid(), 'driver'::app_role) 
  AND status = 'ready'::order_status 
  AND driver_id IS NULL
);
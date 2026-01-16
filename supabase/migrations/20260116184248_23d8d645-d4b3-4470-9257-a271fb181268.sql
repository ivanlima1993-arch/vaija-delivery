-- Drop and recreate products SELECT policy as PERMISSIVE
DROP POLICY IF EXISTS "Anyone can view available products" ON public.products;
CREATE POLICY "Anyone can view available products" 
ON public.products 
FOR SELECT 
TO public
USING (is_available = true);

-- Drop and recreate establishments SELECT policy as PERMISSIVE
DROP POLICY IF EXISTS "Anyone can view approved establishments" ON public.establishments;
CREATE POLICY "Anyone can view approved establishments" 
ON public.establishments 
FOR SELECT 
TO public
USING (is_approved = true);

-- Drop and recreate product_categories SELECT policy as PERMISSIVE
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.product_categories;
CREATE POLICY "Anyone can view active categories" 
ON public.product_categories 
FOR SELECT 
TO public
USING (is_active = true);
-- DROP existing policies if they exist to prevent errors
DROP POLICY IF EXISTS "Franqueados podem atualizar estabelecimentos de suas cidades" ON public.establishments;
DROP POLICY IF EXISTS "Franqueados podem gerenciar categorias de suas cidades" ON public.product_categories;
DROP POLICY IF EXISTS "Franqueados podem gerenciar produtos de suas cidades" ON public.products;
DROP POLICY IF EXISTS "Franqueados podem gerenciar cupons de suas cidades" ON public.coupons;
DROP POLICY IF EXISTS "Franqueados podem gerenciar promocoes de suas cidades" ON public.promotions;
DROP POLICY IF EXISTS "Franqueados podem gerenciar prospects de suas cidades" ON public.prospects;

-- 1. Permitir que franqueados atualizem (UPDATE) os estabelecimentos de suas cidades (ex: abrir/fechar, editar dados)
CREATE POLICY "Franqueados podem atualizar estabelecimentos de suas cidades"
  ON public.establishments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cities c
      WHERE c.id = establishments.city_id
      AND c.franchisee_id = auth.uid()
      AND public.has_role(auth.uid(), 'franchisee')
    )
  );

-- 2. Permitir que franqueados gerenciem (ALL) categorias de produtos nos estabelecimentos de suas cidades
CREATE POLICY "Franqueados podem gerenciar categorias de suas cidades"
  ON public.product_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.establishments e
      JOIN public.cities c ON e.city_id = c.id
      WHERE e.id = product_categories.establishment_id
      AND c.franchisee_id = auth.uid()
      AND public.has_role(auth.uid(), 'franchisee')
    )
  );

-- 3. Permitir que franqueados gerenciem (ALL) produtos nos estabelecimentos de suas cidades
CREATE POLICY "Franqueados podem gerenciar produtos de suas cidades"
  ON public.products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.establishments e
      JOIN public.cities c ON e.city_id = c.id
      WHERE e.id = products.establishment_id
      AND c.franchisee_id = auth.uid()
      AND public.has_role(auth.uid(), 'franchisee')
    )
  );

-- 4. Permitir que franqueados gerenciem (ALL) cupons de suas cidades
CREATE POLICY "Franqueados podem gerenciar cupons de suas cidades"
  ON public.coupons FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cities c
      WHERE c.id = coupons.city_id
      AND c.franchisee_id = auth.uid()
      AND public.has_role(auth.uid(), 'franchisee')
    )
  );

-- 5. Permitir que franqueados gerenciem (ALL) promoções de suas cidades
CREATE POLICY "Franqueados podem gerenciar promocoes de suas cidades"
  ON public.promotions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cities c
      WHERE c.id = promotions.city_id
      AND c.franchisee_id = auth.uid()
      AND public.has_role(auth.uid(), 'franchisee')
    )
  );

-- 6. Permitir que franqueados gerenciem (ALL) leads/prospects de suas cidades
CREATE POLICY "Franqueados podem gerenciar prospects de suas cidades"
  ON public.prospects FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cities c
      WHERE c.name = prospects.city
      AND c.franchisee_id = auth.uid()
      AND public.has_role(auth.uid(), 'franchisee')
    )
  );

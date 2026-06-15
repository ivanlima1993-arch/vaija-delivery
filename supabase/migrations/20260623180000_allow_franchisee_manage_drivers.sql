-- Permissões para franqueados visualizarem e aprovarem entregadores em suas cidades

-- 1. Políticas RLS para profiles
DROP POLICY IF EXISTS "Franqueados podem ver perfis de entregadores de suas cidades" ON public.profiles;
CREATE POLICY "Franqueados podem ver perfis de entregadores de suas cidades"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'franchisee'::public.app_role)
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = profiles.user_id
      AND ur.role = 'driver'::public.app_role
    )
    AND EXISTS (
      SELECT 1 FROM public.cities c
      WHERE c.franchisee_id = auth.uid()
      AND profiles.driver_address ILIKE '%' || c.name || '%'
    )
  );

DROP POLICY IF EXISTS "Franqueados podem atualizar perfis de entregadores de suas cidades" ON public.profiles;
CREATE POLICY "Franqueados podem atualizar perfis de entregadores de suas cidades"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'franchisee'::public.app_role)
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = profiles.user_id
      AND ur.role = 'driver'::public.app_role
    )
    AND EXISTS (
      SELECT 1 FROM public.cities c
      WHERE c.franchisee_id = auth.uid()
      AND profiles.driver_address ILIKE '%' || c.name || '%'
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'franchisee'::public.app_role)
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = profiles.user_id
      AND ur.role = 'driver'::public.app_role
    )
    AND EXISTS (
      SELECT 1 FROM public.cities c
      WHERE c.franchisee_id = auth.uid()
      AND profiles.driver_address ILIKE '%' || c.name || '%'
    )
  );

-- 2. Políticas RLS para user_roles
DROP POLICY IF EXISTS "Franqueados podem ver roles de entregadores de suas cidades" ON public.user_roles;
CREATE POLICY "Franqueados podem ver roles de entregadores de suas cidades"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'franchisee'::public.app_role)
    AND role = 'driver'::public.app_role
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.cities c ON p.driver_address ILIKE '%' || c.name || '%'
      WHERE p.user_id = user_roles.user_id
      AND c.franchisee_id = auth.uid()
    )
  );

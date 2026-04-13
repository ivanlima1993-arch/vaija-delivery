
-- Adicionar 'provider' ao enum app_role
ALTER TYPE public.app_role ADD VALUE 'provider';

-- Política para permitir que o usuário veja seu próprio registro de profissional
DROP POLICY IF EXISTS "Service providers can view their own record" ON public.service_providers;
CREATE POLICY "Service providers can view their own record"
ON public.service_providers
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

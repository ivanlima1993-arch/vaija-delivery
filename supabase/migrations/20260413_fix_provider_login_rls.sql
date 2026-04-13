
-- Atualizar política de SELECT para permitir que o sistema localize o CPF durante o login, 
-- mesmo que o profissional ainda não tenha sido aprovado (is_active = false)
DROP POLICY IF EXISTS "Anyone can view active service providers" ON public.service_providers;
CREATE POLICY "Anyone can view service providers for login and display"
ON public.service_providers
FOR SELECT
TO public
USING (true);

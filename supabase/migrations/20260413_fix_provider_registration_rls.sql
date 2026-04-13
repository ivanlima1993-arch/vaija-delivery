
-- Habilitar inserção pública na tabela service_providers para permitir novos cadastros
DROP POLICY IF EXISTS "Anyone can register as a service provider" ON public.service_providers;
CREATE POLICY "Anyone can register as a service provider"
ON public.service_providers
FOR INSERT
TO public
WITH CHECK (true);

-- Habilitar upload público no bucket avatars especificamente para a pasta provider-leads
DROP POLICY IF EXISTS "Anyone can upload provider profile photos" ON storage.objects;
CREATE POLICY "Anyone can upload provider profile photos"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = 'provider-leads');

-- Garantir que as fotos em provider-leads sejam legíveis publicamente (se não for o padrão do bucket)
DROP POLICY IF EXISTS "Provider leads photos are publicly accessible" ON storage.objects;
CREATE POLICY "Provider leads photos are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = 'provider-leads');

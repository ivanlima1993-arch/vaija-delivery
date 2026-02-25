-- =====================================================
-- AUTO-ATRIBUIÇÃO DE ROLE PARA ESTABELECIMENTOS
-- Execute este arquivo no SQL Editor do Supabase
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  requested_role TEXT;
  est_name TEXT;
  user_phone TEXT;
BEGIN
  -- Extrair dados do metadado do Auth
  requested_role := NEW.raw_user_meta_data->>'role';
  est_name := NEW.raw_user_meta_data->>'establishment_name';
  user_phone := NEW.raw_user_meta_data->>'phone';

  -- 1. Criar perfil básico
  INSERT INTO public.profiles (user_id, full_name, phone, cpf_cnpj)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    user_phone,
    NEW.raw_user_meta_data->>'cpf_cnpj'
  );
  
  -- 2. Atribuir Role (Se for estabelecimento ou se não houver role, padrão é customer)
  IF requested_role = 'establishment' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'establishment');

    -- 3. Criar registro de estabelecimento PENDENTE
    INSERT INTO public.establishments (owner_id, name, phone, is_approved, is_open, category)
    VALUES (NEW.id, COALESCE(est_name, 'Novo Estabelecimento'), user_phone, false, false, 'restaurant');
  ELSE
    -- Opcional: Adiciona role customer para usuários normais
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'customer');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir que o trigger está ativo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

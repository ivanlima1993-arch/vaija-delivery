-- =====================================================
-- REMOVER AUTO-ATRIBUIÇÃO DA ROLE CUSTOMER
-- Execute este arquivo no SQL Editor do Supabase
-- =====================================================

-- 1. Remover o trigger que adiciona automaticamente a role 'customer'
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Criar novo trigger que APENAS cria o perfil, sem adicionar role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  -- NÃO adiciona role automaticamente
  -- A role será adicionada manualmente no código da aplicação
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recriar o trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- TRIGGER ATUALIZADO COM SUCESSO!
-- Agora novos usuários NÃO recebem automaticamente a role 'customer'
-- =====================================================

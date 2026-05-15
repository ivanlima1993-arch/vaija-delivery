-- ATENÇÃO: Execute este script no SQL Editor do seu painel do Supabase
-- para adicionar suporte completo a Franqueados (Franchisees)

-- 1. Adicionar o novo role 'franchisee'
-- (Como ENUMs não podem ser alterados em blocos de transação se já estiverem em uso,
-- garantimos o commit separado ou usamos ALTER TYPE)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'franchisee';

-- 2. Adicionar a coluna franchisee_id nas cidades
-- Isso vai vincular uma cidade a um franqueado específico
ALTER TABLE public.cities 
ADD COLUMN IF NOT EXISTS franchisee_id UUID REFERENCES auth.users(id);

-- 3. Criar a tabela de franqueados
CREATE TABLE IF NOT EXISTS public.franchisees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  commission_rate DECIMAL(5, 2) DEFAULT 5.00, -- Ex: 5%
  active BOOLEAN DEFAULT false,
  notes TEXT,
  bank_account_info JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Habilitar RLS na nova tabela
ALTER TABLE public.franchisees ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de Segurança para franqueados
-- O próprio franqueado pode ver seus dados
CREATE POLICY "Franqueados podem ver próprio perfil"
  ON public.franchisees FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Apenas admins podem criar/editar/deletar franqueados
CREATE POLICY "Admins podem gerenciar franqueados"
  ON public.franchisees FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger para atualizar o updated_at dos franqueados
CREATE TRIGGER update_franchisees_updated_at
  BEFORE UPDATE ON public.franchisees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Opcional: Atualizar políticas das cidades para franqueados
-- Permite que o franqueado veja as cidades que ele gerencia (se quisermos limitar, mas no momento a política 'Anyone can view active cities' já atende a visualização)

-- Permite que franqueados visualizem apenas os pedidos das SUAS cidades
CREATE POLICY "Franqueados podem ver pedidos de suas cidades"
  ON public.orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.establishments e
      JOIN public.cities c ON e.city_id = c.id
      WHERE e.id = orders.establishment_id
      AND c.franchisee_id = auth.uid()
      AND public.has_role(auth.uid(), 'franchisee')
    )
  );

-- Permite que franqueados visualizem os estabelecimentos de suas cidades
CREATE POLICY "Franqueados podem ver estabelecimentos de suas cidades"
  ON public.establishments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cities c
      WHERE c.id = establishments.city_id
      AND c.franchisee_id = auth.uid()
      AND public.has_role(auth.uid(), 'franchisee')
    )
  );

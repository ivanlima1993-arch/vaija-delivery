-- ============================================================
-- EXECUTE ESTE SCRIPT NO SQL EDITOR DO SUPABASE
-- Cria a tabela de leads de franqueados interessados
-- ============================================================

-- 1. Criar a tabela de leads de franqueados
CREATE TABLE IF NOT EXISTS public.franchise_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Novo',  -- Novo | Em Contato | Convertido | Recusado
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Habilitar RLS
ALTER TABLE public.franchise_leads ENABLE ROW LEVEL SECURITY;

-- 3. Permitir INSERT público (sem autenticação - landing page é pública)
CREATE POLICY "Qualquer pessoa pode enviar interesse de franquia"
  ON public.franchise_leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 4. Apenas admins podem visualizar e gerenciar os leads
CREATE POLICY "Admins podem ver todos os leads de franquia"
  ON public.franchise_leads FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem atualizar leads de franquia"
  ON public.franchise_leads FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem deletar leads de franquia"
  ON public.franchise_leads FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. Trigger para atualizar updated_at
CREATE TRIGGER update_franchise_leads_updated_at
  BEFORE UPDATE ON public.franchise_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

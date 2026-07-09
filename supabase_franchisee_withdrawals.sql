-- EXECUTE ESTE SCRIPT NO SQL EDITOR DO SEU PAINEL DO SUPABASE
-- Ele criará a tabela franchisee_withdrawals para gerenciar as solicitações de saque dos franqueados.

-- 1. Criar a tabela franchisee_withdrawals
CREATE TABLE IF NOT EXISTS public.franchisee_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchisee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  pix_key VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2. Habilitar RLS (Row Level Security)
ALTER TABLE public.franchisee_withdrawals ENABLE ROW LEVEL SECURITY;

-- 3. Criar Políticas de Segurança (RLS)
DROP POLICY IF EXISTS "Franqueados podem gerenciar seus proprios saques" ON public.franchisee_withdrawals;
CREATE POLICY "Franqueados podem gerenciar seus proprios saques" ON public.franchisee_withdrawals
  FOR SELECT TO authenticated
  USING (auth.uid() = franchisee_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Franqueados podem solicitar saques" ON public.franchisee_withdrawals;
CREATE POLICY "Franqueados podem solicitar saques" ON public.franchisee_withdrawals
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = franchisee_id);

DROP POLICY IF EXISTS "Admins podem atualizar todos os saques" ON public.franchisee_withdrawals;
CREATE POLICY "Admins podem atualizar todos os saques" ON public.franchisee_withdrawals
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

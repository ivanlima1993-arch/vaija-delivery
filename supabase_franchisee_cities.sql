-- EXECUTE ESTE SCRIPT NO SQL EDITOR DO SEU PAINEL DO SUPABASE
-- Ele criará a tabela franchisee_cities que está faltando e a manterá em sincronia automática com a tabela cities.

-- 1. Criar a tabela franchisee_cities
CREATE TABLE IF NOT EXISTS public.franchisee_cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchisee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(franchisee_id, city_id)
);

-- 2. Habilitar RLS (Row Level Security)
ALTER TABLE public.franchisee_cities ENABLE ROW LEVEL SECURITY;

-- 3. Criar Políticas de Segurança (RLS)
DROP POLICY IF EXISTS "Permitir leitura para o próprio franqueado" ON public.franchisee_cities;
CREATE POLICY "Permitir leitura para o próprio franqueado" ON public.franchisee_cities
  FOR SELECT TO authenticated USING (auth.uid() = franchisee_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Permitir gerenciar para admins" ON public.franchisee_cities;
CREATE POLICY "Permitir gerenciar para admins" ON public.franchisee_cities
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 4. Criar função de sincronização
CREATE OR REPLACE FUNCTION public.sync_franchisee_cities()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    IF (OLD.franchisee_id IS DISTINCT FROM NEW.franchisee_id) THEN
      -- Remover vinculo antigo
      IF (OLD.franchisee_id IS NOT NULL) THEN
        DELETE FROM public.franchisee_cities 
        WHERE franchisee_id = OLD.franchisee_id AND city_id = OLD.id;
      END IF;
      -- Inserir novo vinculo
      IF (NEW.franchisee_id IS NOT NULL) THEN
        INSERT INTO public.franchisee_cities (franchisee_id, city_id)
        VALUES (NEW.franchisee_id, NEW.id)
        ON CONFLICT (franchisee_id, city_id) DO NOTHING;
      END IF;
    END IF;
  ELSIF (TG_OP = 'INSERT') THEN
    IF (NEW.franchisee_id IS NOT NULL) THEN
      INSERT INTO public.franchisee_cities (franchisee_id, city_id)
      VALUES (NEW.franchisee_id, NEW.id)
      ON CONFLICT (franchisee_id, city_id) DO NOTHING;
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    IF (OLD.franchisee_id IS NOT NULL) THEN
      DELETE FROM public.franchisee_cities 
      WHERE franchisee_id = OLD.franchisee_id AND city_id = OLD.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Criar trigger na tabela cities
DROP TRIGGER IF EXISTS trigger_sync_franchisee_cities ON public.cities;
CREATE TRIGGER trigger_sync_franchisee_cities
AFTER INSERT OR UPDATE OR DELETE ON public.cities
FOR EACH ROW EXECUTE FUNCTION public.sync_franchisee_cities();

-- 6. Popular dados de cidades já associadas aos franqueados atualmente
INSERT INTO public.franchisee_cities (franchisee_id, city_id)
SELECT franchisee_id, id FROM public.cities
WHERE franchisee_id IS NOT NULL
ON CONFLICT (franchisee_id, city_id) DO NOTHING;

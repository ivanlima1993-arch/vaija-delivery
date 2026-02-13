-- Add cpf_cnpj to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT;

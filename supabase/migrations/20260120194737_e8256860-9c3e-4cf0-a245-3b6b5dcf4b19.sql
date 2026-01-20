-- Add CPF/CNPJ column to establishments table
ALTER TABLE public.establishments 
ADD COLUMN cpf_cnpj text;
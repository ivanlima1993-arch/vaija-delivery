-- =====================================================
-- MIGRATION CONSOLIDADA - DRIVER APPROVAL FLOW
-- Execute este arquivo no SQL Editor do Supabase
-- =====================================================

-- 1. Adicionar campo CPF/CNPJ
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT;

-- 2. Adicionar campos básicos do motorista
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS driver_vehicle_plate TEXT,
ADD COLUMN IF NOT EXISTS driver_birth_date DATE,
ADD COLUMN IF NOT EXISTS driver_address TEXT,
ADD COLUMN IF NOT EXISTS face_photo_url TEXT,
ADD COLUMN IF NOT EXISTS is_driver_approved BOOLEAN DEFAULT false;

-- 3. Adicionar campos de rejeição e timestamp
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS driver_rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS driver_registration_submitted_at TIMESTAMP WITH TIME ZONE;

-- 4. Adicionar campo para foto do RG
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS driver_id_photo_url TEXT;

-- =====================================================
-- MIGRATION APLICADA COM SUCESSO!
-- Agora você pode aprovar/reprovar motoristas no painel admin
-- =====================================================

-- =====================================================
-- CONFIGURAÇÃO DO STORAGE PARA DOCUMENTOS DE MOTORISTAS
-- Execute este arquivo no SQL Editor do Supabase
-- =====================================================

-- 1. Criar o bucket para documentos de motoristas (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('driver-documents', 'driver-documents', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all documents" ON storage.objects;
DROP POLICY IF EXISTS "Public can view documents" ON storage.objects;

-- 3. Criar novas políticas de acesso ao bucket
-- Permitir que usuários autenticados façam upload de seus próprios documentos
CREATE POLICY "Users can upload their own documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'driver-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir que usuários autenticados vejam seus próprios documentos
CREATE POLICY "Users can view their own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'driver-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir que admins vejam todos os documentos
CREATE POLICY "Admins can view all documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'driver-documents' 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Permitir acesso público para leitura (necessário para exibir as fotos no admin)
CREATE POLICY "Public can view documents"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'driver-documents');

-- =====================================================
-- STORAGE CONFIGURADO COM SUCESSO!
-- Agora os motoristas podem fazer upload de fotos
-- =====================================================

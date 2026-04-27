-- Add WhatsApp integration fields to establishments table
ALTER TABLE public.establishments 
ADD COLUMN whatsapp_enabled BOOLEAN DEFAULT false,
ADD COLUMN whatsapp_instance_name TEXT UNIQUE,
ADD COLUMN whatsapp_status TEXT DEFAULT 'disconnected',
ADD COLUMN whatsapp_welcome_message TEXT DEFAULT 'Olá! Seja bem-vindo ao nosso atendimento automático. Como posso te ajudar hoje?',
ADD COLUMN whatsapp_closing_message TEXT DEFAULT 'Pedido finalizado com sucesso! Em breve você receberá atualizações por aqui.';

-- Create an index to quickly find establishment by instance name
CREATE INDEX idx_establishments_whatsapp_instance ON public.establishments(whatsapp_instance_name);

-- Add comments
COMMENT ON COLUMN public.establishments.whatsapp_enabled IS 'Indica se o chatbot de WhatsApp está ativo para este estabelecimento';
COMMENT ON COLUMN public.establishments.whatsapp_instance_name IS 'Identificador único da instância na API de WhatsApp';
COMMENT ON COLUMN public.establishments.whatsapp_status IS 'Status da conexão (connected, disconnected, pairing)';

-- Create table to manage WhatsApp session states
CREATE TABLE public.whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_phone TEXT NOT NULL,
  establishment_id UUID REFERENCES public.establishments(id) ON DELETE CASCADE,
  current_state TEXT DEFAULT 'start', -- 'start', 'selecting_items', 'providing_address', 'confirming_order'
  order_id UUID REFERENCES public.orders(id),
  context JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(customer_phone, establishment_id)
);

-- Enable RLS for sessions
ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;

-- Handle updated_at for sessions
CREATE TRIGGER update_whatsapp_sessions_updated_at
BEFORE UPDATE ON public.whatsapp_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();


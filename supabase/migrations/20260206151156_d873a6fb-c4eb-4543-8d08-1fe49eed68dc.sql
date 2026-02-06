
-- Establishment payment methods
CREATE TABLE public.establishment_payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  method_key TEXT NOT NULL,
  method_name TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(establishment_id, method_key)
);

ALTER TABLE public.establishment_payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage own payment methods"
  ON public.establishment_payment_methods FOR ALL
  USING (owns_establishment(auth.uid(), establishment_id));

CREATE POLICY "Anyone can view establishment payment methods"
  ON public.establishment_payment_methods FOR SELECT
  USING (true);

-- Establishment settings (cashback + loyalty)
CREATE TABLE public.establishment_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE UNIQUE,
  cashback_enabled BOOLEAN NOT NULL DEFAULT false,
  cashback_percent NUMERIC NOT NULL DEFAULT 5,
  loyalty_enabled BOOLEAN NOT NULL DEFAULT false,
  loyalty_stamps_required INTEGER NOT NULL DEFAULT 10,
  loyalty_reward_description TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.establishment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage own settings"
  ON public.establishment_settings FOR ALL
  USING (owns_establishment(auth.uid(), establishment_id));

CREATE POLICY "Anyone can view establishment settings"
  ON public.establishment_settings FOR SELECT
  USING (true);

-- Bank accounts
CREATE TABLE public.establishment_bank_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE UNIQUE,
  bank_code TEXT,
  bank_name TEXT,
  account_type TEXT DEFAULT 'checking',
  agency TEXT,
  account_number TEXT,
  holder_name TEXT,
  holder_document TEXT,
  pix_key_type TEXT,
  pix_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.establishment_bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage own bank account"
  ON public.establishment_bank_accounts FOR ALL
  USING (owns_establishment(auth.uid(), establishment_id));

-- Withdrawals
CREATE TABLE public.establishment_withdrawals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.establishment_withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage own withdrawals"
  ON public.establishment_withdrawals FOR ALL
  USING (owns_establishment(auth.uid(), establishment_id));

-- Invoices
CREATE TABLE public.establishment_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  due_date DATE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.establishment_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view own invoices"
  ON public.establishment_invoices FOR SELECT
  USING (owns_establishment(auth.uid(), establishment_id));

CREATE POLICY "Admins can manage all invoices"
  ON public.establishment_invoices FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_establishment_payment_methods_updated_at
  BEFORE UPDATE ON public.establishment_payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_establishment_settings_updated_at
  BEFORE UPDATE ON public.establishment_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_establishment_bank_accounts_updated_at
  BEFORE UPDATE ON public.establishment_bank_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

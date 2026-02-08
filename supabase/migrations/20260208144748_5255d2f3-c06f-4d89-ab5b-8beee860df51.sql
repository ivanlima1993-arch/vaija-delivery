-- Allow admins to view and manage all withdrawals
CREATE POLICY "Admins can manage all withdrawals"
ON public.establishment_withdrawals
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all bank accounts (for withdrawal approval)
CREATE POLICY "Admins can view all bank accounts"
ON public.establishment_bank_accounts
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
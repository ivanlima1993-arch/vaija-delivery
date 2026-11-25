-- Prevent clients from changing wallet balances or inserting wallet transactions directly.
REVOKE UPDATE (wallet_balance) ON public.profiles FROM authenticated, anon;
REVOKE INSERT, UPDATE, DELETE ON public.wallet_transactions FROM authenticated, anon;

-- Only the server and SECURITY DEFINER functions may set a wallet or payment status.
CREATE OR REPLACE FUNCTION public.restrict_order_financial_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_role text := COALESCE(current_setting('request.jwt.claim.role', true), '');
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.payment_status = 'paid'
       OR NEW.payment_status NOT IN ('pending', 'awaiting_payment', 'processing') THEN
      RAISE EXCEPTION 'payment_status must be set by the payment server';
    END IF;
  ELSIF TG_OP = 'UPDATE'
        AND NEW.payment_status IS DISTINCT FROM OLD.payment_status
        AND request_role <> 'service_role'
        AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'payment_status may only be changed by a trusted server';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS restrict_order_financial_fields ON public.orders;
CREATE TRIGGER restrict_order_financial_fields
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.restrict_order_financial_fields();

-- Atomically debit the wallet, record the transaction and mark the order paid.
CREATE OR REPLACE FUNCTION public.pay_order_with_wallet(p_order_id uuid, p_amount numeric)
RETURNS TABLE(order_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_balance numeric;
  v_amount numeric := round(COALESCE(p_amount, 0), 2);
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
    AND customer_id = auth.uid()
  FOR UPDATE;

  IF v_order.id IS NULL THEN
    RAISE EXCEPTION 'order not found';
  END IF;

  IF v_order.payment_method IS DISTINCT FROM 'wallet' THEN
    RAISE EXCEPTION 'order does not use the wallet';
  END IF;

  IF v_order.payment_status = 'paid' THEN
    RETURN QUERY SELECT v_order.id;
    RETURN;
  END IF;

  IF v_amount <= 0 OR abs(v_order.total - v_amount) > 0.01 THEN
    RAISE EXCEPTION 'invalid payment amount';
  END IF;

  SELECT wallet_balance INTO v_balance
  FROM public.profiles
  WHERE user_id = auth.uid()
  FOR UPDATE;

  IF COALESCE(v_balance, 0) < v_amount THEN
    RAISE EXCEPTION 'insufficient wallet balance';
  END IF;

  INSERT INTO public.wallet_transactions (
    user_id,
    amount,
    type,
    status,
    description,
    order_id
  ) VALUES (
    auth.uid(),
    v_amount,
    'debit',
    'confirmed',
    'Pagamento do Pedido #' || v_order.order_number,
    v_order.id
  );

  UPDATE public.orders
  SET payment_status = 'paid'
  WHERE id = v_order.id;

  RETURN QUERY SELECT v_order.id;
END;
$$;

REVOKE ALL ON FUNCTION public.pay_order_with_wallet(uuid, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pay_order_with_wallet(uuid, numeric) TO authenticated;

CREATE OR REPLACE FUNCTION public.charge_provider_fee(p_amount numeric, p_description text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_amount numeric := round(COALESCE(p_amount, 0), 2);
  v_balance numeric;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'provider'
  ) THEN
    RAISE EXCEPTION 'provider role required';
  END IF;

  IF v_amount <= 0 THEN
    RAISE EXCEPTION 'invalid fee amount';
  END IF;

  SELECT wallet_balance INTO v_balance
  FROM public.profiles
  WHERE user_id = auth.uid()
  FOR UPDATE;

  IF COALESCE(v_balance, 0) < v_amount THEN
    RAISE EXCEPTION 'insufficient wallet balance';
  END IF;

  INSERT INTO public.wallet_transactions (
    user_id, amount, type, status, description
  ) VALUES (
    auth.uid(), v_amount, 'debit', 'confirmed', p_description
  );
END;
$$;

REVOKE ALL ON FUNCTION public.charge_provider_fee(numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.charge_provider_fee(numeric, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_adjust_wallet(p_user_id uuid, p_amount numeric, p_description text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_amount numeric := round(COALESCE(p_amount, 0), 2);
  v_balance numeric;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'admin role required';
  END IF;

  IF v_amount = 0 THEN
    RAISE EXCEPTION 'invalid adjustment amount';
  END IF;

  SELECT wallet_balance INTO v_balance
  FROM public.profiles
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_amount < 0 AND COALESCE(v_balance, 0) + v_amount < 0 THEN
    RAISE EXCEPTION 'adjustment would create a negative balance';
  END IF;

  INSERT INTO public.wallet_transactions (
    user_id, amount, type, status, description
  ) VALUES (
    p_user_id,
    abs(v_amount),
    CASE WHEN v_amount > 0 THEN 'credit' ELSE 'debit' END,
    'confirmed',
    p_description
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_adjust_wallet(uuid, numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_adjust_wallet(uuid, numeric, text) TO authenticated;

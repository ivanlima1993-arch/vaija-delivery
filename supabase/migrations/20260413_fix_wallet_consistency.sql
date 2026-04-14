
-- Update wallet_transactions table to ensure status and type coexist correctly
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='wallet_transactions' AND column_name='status') THEN
        ALTER TABLE public.wallet_transactions ADD COLUMN status TEXT DEFAULT 'confirmed';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='wallet_transactions' AND column_name='type') THEN
        ALTER TABLE public.wallet_transactions ADD COLUMN type TEXT; -- 'credit' or 'debit'
    END IF;
END $$;

-- Update the update_wallet_balance function to be state-aware
CREATE OR REPLACE FUNCTION public.update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update balance if status IS 'confirmed'
    -- If it was already confirmed before, don't update again (to avoid double counting on multiple updates)
    IF (NEW.status = 'confirmed') AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (OLD.status IS NULL OR OLD.status != 'confirmed'))) THEN
        
        -- Update profiles
        IF (NEW.type = 'credit') THEN
            UPDATE public.profiles
            SET wallet_balance = wallet_balance + NEW.amount
            WHERE user_id = NEW.user_id;
        ELSIF (NEW.type = 'debit') THEN
            UPDATE public.profiles
            SET wallet_balance = wallet_balance - NEW.amount
            WHERE user_id = NEW.user_id;
        END IF;

        -- Sync with service_providers if user is a provider
        IF EXISTS (SELECT 1 FROM public.service_providers WHERE user_id = NEW.user_id) THEN
            IF (NEW.type = 'credit') THEN
                UPDATE public.service_providers
                SET wallet_balance = wallet_balance + NEW.amount
                WHERE user_id = NEW.user_id;
            ELSIF (NEW.type = 'debit') THEN
                UPDATE public.service_providers
                SET wallet_balance = wallet_balance - NEW.amount
                WHERE user_id = NEW.user_id;
            END IF;
        END IF;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create triggers for both INSERT and UPDATE
DROP TRIGGER IF EXISTS on_wallet_transaction_inserted ON public.wallet_transactions;
CREATE TRIGGER on_wallet_transaction_inserted
    AFTER INSERT ON public.wallet_transactions
    FOR EACH ROW EXECUTE FUNCTION public.update_wallet_balance();

DROP TRIGGER IF EXISTS on_wallet_transaction_updated ON public.wallet_transactions;
CREATE TRIGGER on_wallet_transaction_updated
    AFTER UPDATE ON public.wallet_transactions
    FOR EACH ROW EXECUTE FUNCTION public.update_wallet_balance();

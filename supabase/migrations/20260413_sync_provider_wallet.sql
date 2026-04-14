
-- Step 1: Ensure wallet_balance exists in service_providers
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_providers' AND column_name='wallet_balance') THEN
        ALTER TABLE public.service_providers ADD COLUMN wallet_balance NUMERIC NOT NULL DEFAULT 0;
    END IF;
END $$;

-- Step 2: Update the update_wallet_balance function to keep both profiles and service_providers in sync
CREATE OR REPLACE FUNCTION public.update_wallet_balance()
RETURNS TRIGGER AS $$
DECLARE
    current_role public.app_role;
BEGIN
    -- Update profiles balance (Primary source)
    IF (NEW.type = 'credit') THEN
        UPDATE public.profiles
        SET wallet_balance = wallet_balance + NEW.amount
        WHERE user_id = NEW.user_id;
    ELSIF (NEW.type = 'debit') THEN
        UPDATE public.profiles
        SET wallet_balance = wallet_balance - NEW.amount
        WHERE user_id = NEW.user_id;
    END IF;

    -- If the user is a service provider, also sync their specific table
    -- Check if target user has the 'driver' or 'establishment' or 'provider' roles if applicable.
    -- For now, we sync if they exist in service_providers.
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

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Ensure current balances are synced (One-time sync)
UPDATE public.service_providers sp
SET wallet_balance = p.wallet_balance
FROM public.profiles p
WHERE sp.user_id = p.user_id;

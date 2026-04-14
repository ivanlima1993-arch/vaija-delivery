
-- Create service_request_status enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_request_status') THEN
        CREATE TYPE public.service_request_status AS ENUM ('pending', 'accepted', 'scheduled', 'completed', 'cancelled');
    END IF;
END $$;

-- Create service_requests table
CREATE TABLE IF NOT EXISTS public.service_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.profiles(user_id),
    provider_id UUID REFERENCES public.service_providers(id),
    customer_name TEXT,
    customer_phone TEXT,
    service_type TEXT NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    price DECIMAL(10, 2),
    status public.service_request_status DEFAULT 'pending',
    scheduled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- Policies for service_requests
CREATE POLICY "Customers can view their own requests"
ON public.service_requests FOR SELECT
TO authenticated
USING (auth.uid() = customer_id);

CREATE POLICY "Providers can view requests assigned to them"
ON public.service_requests FOR SELECT
TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.service_providers
    WHERE id = provider_id AND user_id = auth.uid()
));

CREATE POLICY "Providers can update their assigned requests"
ON public.service_requests FOR UPDATE
TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.service_providers
    WHERE id = provider_id AND user_id = auth.uid()
));

-- Trigger for updated_at
CREATE TRIGGER update_service_requests_updated_at
BEFORE UPDATE ON public.service_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

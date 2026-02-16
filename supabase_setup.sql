
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'customer', 'establishment', 'driver');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  cpf_cnpj TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create establishments table
CREATE TABLE public.establishments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  cover_url TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  neighborhood TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  category TEXT NOT NULL DEFAULT 'restaurant',
  rating DECIMAL(2, 1) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  delivery_fee DECIMAL(10, 2) DEFAULT 0,
  min_delivery_time INTEGER DEFAULT 30,
  max_delivery_time INTEGER DEFAULT 60,
  min_order_value DECIMAL(10, 2) DEFAULT 0,
  is_open BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  opening_hours JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create product categories table
CREATE TABLE public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID REFERENCES public.establishments(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID REFERENCES public.establishments(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2),
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  preparation_time INTEGER DEFAULT 15,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order status enum
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled');

-- Create payment method enum
CREATE TYPE public.payment_method AS ENUM ('pix', 'credit_card', 'debit_card', 'cash');

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number SERIAL,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  establishment_id UUID REFERENCES public.establishments(id) ON DELETE CASCADE NOT NULL,
  driver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status order_status NOT NULL DEFAULT 'pending',
  subtotal DECIMAL(10, 2) NOT NULL,
  delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  payment_method payment_method NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  delivery_address TEXT NOT NULL,
  delivery_latitude DECIMAL(10, 8),
  delivery_longitude DECIMAL(11, 8),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  notes TEXT,
  estimated_delivery_time TIMESTAMP WITH TIME ZONE,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  preparing_at TIMESTAMP WITH TIME ZONE,
  ready_at TIMESTAMP WITH TIME ZONE,
  out_for_delivery_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  subtotal DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create has_role security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check establishment ownership
CREATE OR REPLACE FUNCTION public.owns_establishment(_user_id UUID, _establishment_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.establishments
    WHERE id = _establishment_id
      AND owner_id = _user_id
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- User roles policies (read-only for users, admin can manage)
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Establishments policies
CREATE POLICY "Anyone can view approved establishments"
  ON public.establishments FOR SELECT
  USING (is_approved = true);

CREATE POLICY "Owners can view own establishments"
  ON public.establishments FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Owners can update own establishments"
  ON public.establishments FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Authenticated users can create establishments"
  ON public.establishments FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Admins can manage all establishments"
  ON public.establishments FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Product categories policies
CREATE POLICY "Anyone can view active categories"
  ON public.product_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Owners can manage own categories"
  ON public.product_categories FOR ALL
  TO authenticated
  USING (public.owns_establishment(auth.uid(), establishment_id));

-- Products policies
CREATE POLICY "Anyone can view available products"
  ON public.products FOR SELECT
  USING (is_available = true);

CREATE POLICY "Owners can manage own products"
  ON public.products FOR ALL
  TO authenticated
  USING (public.owns_establishment(auth.uid(), establishment_id));

-- Orders policies
CREATE POLICY "Customers can view own orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Customers can create orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Establishment owners can view their orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (public.owns_establishment(auth.uid(), establishment_id));

CREATE POLICY "Establishment owners can update their orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (public.owns_establishment(auth.uid(), establishment_id));

CREATE POLICY "Drivers can view assigned orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (driver_id = auth.uid());

CREATE POLICY "Drivers can update assigned orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (driver_id = auth.uid());

-- Order items policies
CREATE POLICY "Anyone can view order items for their orders"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND (
        orders.customer_id = auth.uid()
        OR public.owns_establishment(auth.uid(), orders.establishment_id)
        OR orders.driver_id = auth.uid()
      )
    )
  );

CREATE POLICY "Customers can create order items"
  ON public.order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.customer_id = auth.uid()
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_establishments_updated_at
  BEFORE UPDATE ON public.establishments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'), NEW.email);
  
  -- Default role is customer
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
-- Allow administrators to access the data needed for admin dashboards

-- PROFILES: admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ORDERS: admins can view and update all orders
CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update all orders"
ON public.orders
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ORDER ITEMS: admins can view all order items
CREATE POLICY "Admins can view all order items"
ON public.order_items
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));
-- DRIVERS: allow drivers to view ready orders with no driver assigned
CREATE POLICY "Drivers can view ready orders without driver"
ON public.orders
FOR SELECT
USING (
  public.has_role(auth.uid(), 'driver'::public.app_role) 
  AND status = 'ready' 
  AND driver_id IS NULL
);

-- DRIVERS: allow drivers to accept orders (update ready orders without driver)
CREATE POLICY "Drivers can accept ready orders"
ON public.orders
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'driver'::public.app_role) 
  AND status = 'ready' 
  AND driver_id IS NULL
);
-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to avatars
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');
-- Create storage bucket for establishment images
INSERT INTO storage.buckets (id, name, public)
VALUES ('establishments', 'establishments', true);

-- Allow anyone to view establishment images (public bucket)
CREATE POLICY "Public can view establishment images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'establishments');

-- Allow authenticated users to upload their establishment images
CREATE POLICY "Authenticated users can upload establishment images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'establishments' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own establishment images
CREATE POLICY "Users can update own establishment images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'establishments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own establishment images
CREATE POLICY "Users can delete own establishment images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'establishments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
-- Create table for active cities
CREATE TABLE public.cities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for neighborhoods/regions within cities
CREATE TABLE public.neighborhoods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  delivery_fee NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;

-- Cities policies
CREATE POLICY "Anyone can view active cities"
ON public.cities
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage all cities"
ON public.cities
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Neighborhoods policies
CREATE POLICY "Anyone can view active neighborhoods"
ON public.neighborhoods
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage all neighborhoods"
ON public.neighborhoods
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add city reference to establishments
ALTER TABLE public.establishments 
ADD COLUMN city_id UUID REFERENCES public.cities(id);

-- Triggers for updated_at
CREATE TRIGGER update_cities_updated_at
BEFORE UPDATE ON public.cities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_neighborhoods_updated_at
BEFORE UPDATE ON public.neighborhoods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Drop and recreate products SELECT policy as PERMISSIVE
DROP POLICY IF EXISTS "Anyone can view available products" ON public.products;
CREATE POLICY "Anyone can view available products" 
ON public.products 
FOR SELECT 
TO public
USING (is_available = true);

-- Drop and recreate establishments SELECT policy as PERMISSIVE
DROP POLICY IF EXISTS "Anyone can view approved establishments" ON public.establishments;
CREATE POLICY "Anyone can view approved establishments" 
ON public.establishments 
FOR SELECT 
TO public
USING (is_approved = true);

-- Drop and recreate product_categories SELECT policy as PERMISSIVE
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.product_categories;
CREATE POLICY "Anyone can view active categories" 
ON public.product_categories 
FOR SELECT 
TO public
USING (is_active = true);
-- Create table for driver location tracking
CREATE TABLE public.driver_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  heading DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  accuracy DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;

-- Drivers can insert their own location
CREATE POLICY "Drivers can insert their own location"
ON public.driver_locations
FOR INSERT
WITH CHECK (auth.uid() = driver_id);

-- Drivers can view their own locations
CREATE POLICY "Drivers can view their own locations"
ON public.driver_locations
FOR SELECT
USING (auth.uid() = driver_id);

-- Customers can view driver location for their orders
CREATE POLICY "Customers can view driver location for their orders"
ON public.driver_locations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = driver_locations.order_id
    AND orders.customer_id = auth.uid()
    AND orders.status = 'out_for_delivery'
  )
);

-- Establishments can view driver location for their orders
CREATE POLICY "Establishments can view driver location for their orders"
ON public.driver_locations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.establishments e ON o.establishment_id = e.id
    WHERE o.id = driver_locations.order_id
    AND e.owner_id = auth.uid()
    AND o.status = 'out_for_delivery'
  )
);

-- Create index for faster queries
CREATE INDEX idx_driver_locations_order ON public.driver_locations(order_id);
CREATE INDEX idx_driver_locations_driver ON public.driver_locations(driver_id);
CREATE INDEX idx_driver_locations_created ON public.driver_locations(created_at DESC);

-- Enable realtime for driver_locations
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_locations;
-- Create reviews table for establishments and drivers
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL,
  establishment_id UUID REFERENCES public.establishments(id) ON DELETE CASCADE,
  driver_id UUID,
  establishment_rating INTEGER CHECK (establishment_rating >= 1 AND establishment_rating <= 5),
  establishment_comment TEXT,
  driver_rating INTEGER CHECK (driver_rating >= 1 AND driver_rating <= 5),
  driver_comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(order_id)
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Customers can create reviews for their delivered orders
CREATE POLICY "Customers can create reviews for their orders"
ON public.reviews
FOR INSERT
WITH CHECK (
  auth.uid() = customer_id AND
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_id 
    AND orders.customer_id = auth.uid() 
    AND orders.status = 'delivered'
  )
);

-- Customers can view their own reviews
CREATE POLICY "Customers can view own reviews"
ON public.reviews
FOR SELECT
USING (auth.uid() = customer_id);

-- Establishments can view reviews about them
CREATE POLICY "Establishments can view their reviews"
ON public.reviews
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM establishments 
    WHERE establishments.id = reviews.establishment_id 
    AND establishments.owner_id = auth.uid()
  )
);

-- Drivers can view reviews about them
CREATE POLICY "Drivers can view their reviews"
ON public.reviews
FOR SELECT
USING (auth.uid() = driver_id);

-- Admins can view all reviews
CREATE POLICY "Admins can view all reviews"
ON public.reviews
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Anyone can view reviews for public display (average ratings)
CREATE POLICY "Anyone can view reviews for establishments"
ON public.reviews
FOR SELECT
USING (establishment_id IS NOT NULL);

-- Customers can update their own reviews (within 24 hours)
CREATE POLICY "Customers can update own reviews"
ON public.reviews
FOR UPDATE
USING (
  auth.uid() = customer_id AND 
  created_at > now() - interval '24 hours'
);

-- Add trigger to update updated_at
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update establishment rating after review
CREATE OR REPLACE FUNCTION public.update_establishment_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE establishments
  SET 
    rating = (
      SELECT COALESCE(AVG(establishment_rating), 0)
      FROM reviews
      WHERE establishment_id = NEW.establishment_id
      AND establishment_rating IS NOT NULL
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE establishment_id = NEW.establishment_id
      AND establishment_rating IS NOT NULL
    )
  WHERE id = NEW.establishment_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger to update establishment rating on new review
CREATE TRIGGER update_establishment_rating_trigger
AFTER INSERT OR UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_establishment_rating();
-- Create coupons table
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL,
  min_order_value NUMERIC DEFAULT 0,
  max_discount NUMERIC,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  city_id UUID REFERENCES public.cities(id),
  neighborhood_id UUID REFERENCES public.neighborhoods(id),
  establishment_id UUID REFERENCES public.establishments(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Anyone can view active coupons
CREATE POLICY "Anyone can view active coupons" 
ON public.coupons 
FOR SELECT 
USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));

-- Admins can manage all coupons
CREATE POLICY "Admins can manage all coupons" 
ON public.coupons 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Establishment owners can manage their coupons
CREATE POLICY "Owners can manage establishment coupons" 
ON public.coupons 
FOR ALL 
USING (establishment_id IS NOT NULL AND owns_establishment(auth.uid(), establishment_id));

-- Create regional promotions table
CREATE TABLE public.promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed', 'free_delivery')),
  discount_value NUMERIC DEFAULT 0,
  banner_url TEXT,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  city_id UUID REFERENCES public.cities(id),
  neighborhood_id UUID REFERENCES public.neighborhoods(id),
  establishment_id UUID REFERENCES public.establishments(id),
  min_order_value NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- Anyone can view active promotions
CREATE POLICY "Anyone can view active promotions" 
ON public.promotions 
FOR SELECT 
USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));

-- Admins can manage all promotions
CREATE POLICY "Admins can manage all promotions" 
ON public.promotions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Establishment owners can manage their promotions
CREATE POLICY "Owners can manage establishment promotions" 
ON public.promotions 
FOR ALL 
USING (establishment_id IS NOT NULL AND owns_establishment(auth.uid(), establishment_id));

-- Create index for faster coupon code lookups
CREATE INDEX idx_coupons_code ON public.coupons(code);
CREATE INDEX idx_coupons_city ON public.coupons(city_id);
CREATE INDEX idx_promotions_city ON public.promotions(city_id);

-- Create trigger for updated_at
CREATE TRIGGER update_coupons_updated_at
BEFORE UPDATE ON public.coupons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_promotions_updated_at
BEFORE UPDATE ON public.promotions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Drop and recreate the policy for drivers to view ready orders
DROP POLICY IF EXISTS "Drivers can view ready orders without driver" ON public.orders;

CREATE POLICY "Drivers can view ready orders without driver" 
ON public.orders 
FOR SELECT 
USING (
  has_role(auth.uid(), 'driver'::app_role) 
  AND status = 'ready'::order_status 
  AND driver_id IS NULL
);
-- Add CPF/CNPJ column to establishments table
ALTER TABLE public.establishments 
ADD COLUMN cpf_cnpj text;

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
-- Add wallet_balance to profiles
ALTER TABLE public.profiles ADD COLUMN wallet_balance NUMERIC NOT NULL DEFAULT 0;

-- Add wallet to payment_method enum
ALTER TYPE public.payment_method ADD VALUE 'wallet';

-- Create transaction types enum
CREATE TYPE public.wallet_transaction_type AS ENUM ('credit', 'debit');

-- Create wallet_transactions table
CREATE TABLE public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC NOT NULL,
    type public.wallet_transaction_type NOT NULL,
    description TEXT,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for wallet_transactions
CREATE POLICY "Users can view own wallet transactions"
    ON public.wallet_transactions FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Function to handle wallet balance updates automatically (optional but good for consistency)
CREATE OR REPLACE FUNCTION public.update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.type = 'credit') THEN
        UPDATE public.profiles
        SET wallet_balance = wallet_balance + NEW.amount
        WHERE user_id = NEW.user_id;
    ELSIF (NEW.type = 'debit') THEN
        UPDATE public.profiles
        SET wallet_balance = wallet_balance - NEW.amount
        WHERE user_id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_wallet_transaction_inserted
    AFTER INSERT ON public.wallet_transactions
    FOR EACH ROW EXECUTE FUNCTION public.update_wallet_balance();

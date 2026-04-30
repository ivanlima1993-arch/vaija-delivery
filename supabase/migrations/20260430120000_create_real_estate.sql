CREATE TYPE real_estate_transaction_type AS ENUM ('sale', 'rent');
CREATE TYPE real_estate_status AS ENUM ('available', 'reserved', 'sold', 'rented');

CREATE TABLE IF NOT EXISTS real_estate_properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  transaction_type real_estate_transaction_type NOT NULL,
  property_type TEXT NOT NULL, 
  price DECIMAL(10, 2) NOT NULL,
  condominium_fee DECIMAL(10, 2) DEFAULT 0,
  iptu_fee DECIMAL(10, 2) DEFAULT 0,
  area_sqm DECIMAL(10, 2),
  bedrooms INTEGER DEFAULT 0,
  bathrooms INTEGER DEFAULT 0,
  parking_spots INTEGER DEFAULT 0,
  address TEXT,
  city TEXT,
  state TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  status real_estate_status DEFAULT 'available',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS real_estate_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES real_estate_properties(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS real_estate_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES real_estate_properties(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  realtor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE real_estate_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE real_estate_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE real_estate_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Properties are viewable by everyone" ON real_estate_properties FOR SELECT USING (true);
CREATE POLICY "Users can insert their own properties" ON real_estate_properties FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update their own properties" ON real_estate_properties FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Images are viewable by everyone" ON real_estate_images FOR SELECT USING (true);
CREATE POLICY "Users can manage images of their properties" ON real_estate_images FOR ALL USING (
  EXISTS (SELECT 1 FROM real_estate_properties WHERE id = real_estate_images.property_id AND owner_id = auth.uid())
);

CREATE POLICY "Leads can be created by anyone" ON real_estate_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Leads viewable by realtor or customer" ON real_estate_leads FOR SELECT USING (auth.uid() = customer_id OR auth.uid() = realtor_id);

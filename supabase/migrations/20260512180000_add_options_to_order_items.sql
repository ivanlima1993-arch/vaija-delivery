
-- Add options column to order_items table
ALTER TABLE public.order_items ADD COLUMN options JSONB DEFAULT '[]';

-- Update RLS policies to include the new column if necessary (usually not needed for just adding a column unless policies are very specific)
-- The existing policies for order_items are based on the order_id, which remains the same.

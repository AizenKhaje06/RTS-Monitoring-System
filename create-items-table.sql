-- Create items table for dropdown list in order form
CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  item_name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  default_price DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert some sample items
INSERT INTO items (item_name, description, default_price) VALUES
  ('T-Shirt', 'Cotton T-Shirt', 299.00),
  ('Jeans', 'Denim Jeans', 899.00),
  ('Shoes', 'Running Shoes', 1499.00),
  ('Bag', 'Backpack', 799.00),
  ('Watch', 'Digital Watch', 599.00),
  ('Phone Case', 'Protective Phone Case', 199.00),
  ('Headphones', 'Wireless Headphones', 999.00),
  ('Wallet', 'Leather Wallet', 399.00)
ON CONFLICT (item_name) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_items_active ON items(is_active);

-- Add RLS (Row Level Security) policies
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access to items" ON items
  FOR SELECT
  USING (true);

-- Allow insert/update/delete for authenticated users (you can restrict this further)
CREATE POLICY "Allow insert items" ON items
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update items" ON items
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow delete items" ON items
  FOR DELETE
  USING (true);

-- Fix Supabase Row Level Security (RLS) for parcels table
-- Run this in Supabase SQL Editor

-- Enable RLS (if not already enabled)
ALTER TABLE parcels ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read access" ON parcels;
DROP POLICY IF EXISTS "Enable read access for all users" ON parcels;

-- Create policy to allow public read access
CREATE POLICY "Enable read access for all users" 
ON parcels 
FOR SELECT 
USING (true);

-- Verify the policy was created
SELECT * FROM pg_policies WHERE tablename = 'parcels';

-- Test query to verify data is accessible
SELECT COUNT(*) as total_parcels FROM parcels;
SELECT * FROM parcels LIMIT 5;

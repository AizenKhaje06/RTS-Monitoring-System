-- Fix RLS Policies for Items and Parcels tables

-- ============================================
-- FIX ITEMS TABLE POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Allow read access to items" ON items;
DROP POLICY IF EXISTS "Allow insert items" ON items;
DROP POLICY IF EXISTS "Allow update items" ON items;
DROP POLICY IF EXISTS "Allow delete items" ON items;

-- Create new policies that allow all operations
CREATE POLICY "Enable read access for all users" ON items
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for all users" ON items
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON items
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for all users" ON items
  FOR DELETE
  USING (true);

-- ============================================
-- FIX PARCELS TABLE POLICIES
-- ============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable read access for all users" ON parcels;
DROP POLICY IF EXISTS "Enable insert for all users" ON parcels;
DROP POLICY IF EXISTS "Enable update for all users" ON parcels;
DROP POLICY IF EXISTS "Enable delete for all users" ON parcels;

-- Enable RLS on parcels table
ALTER TABLE parcels ENABLE ROW LEVEL SECURITY;

-- Create policies for parcels table
CREATE POLICY "Enable read access for all users" ON parcels
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for all users" ON parcels
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON parcels
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for all users" ON parcels
  FOR DELETE
  USING (true);

-- ============================================
-- VERIFY POLICIES
-- ============================================

-- Check items table policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'items';

-- Check parcels table policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'parcels';

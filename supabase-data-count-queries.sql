-- ============================================
-- SUPABASE DATA COUNT QUERIES
-- ============================================
-- Copy and paste these queries in Supabase SQL Editor
-- to verify your data
-- ============================================

-- 1. TOTAL RECORD COUNT
-- Expected: 981 records
SELECT COUNT(*) as total_records FROM parcels;


-- 2. COUNT BY MONTH
-- Expected: ~327 per month (March, February, April 2026)
SELECT 
  TO_CHAR(parcel_date, 'YYYY-MM') as month,
  TO_CHAR(parcel_date, 'Month YYYY') as month_name,
  COUNT(*) as count
FROM parcels
GROUP BY TO_CHAR(parcel_date, 'YYYY-MM'), TO_CHAR(parcel_date, 'Month YYYY')
ORDER BY month;


-- 3. COUNT BY STATUS
-- Shows distribution of parcel statuses
SELECT 
  normalized_status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM parcels), 2) as percentage
FROM parcels
GROUP BY normalized_status
ORDER BY count DESC;


-- 4. COUNT BY PROVINCE
-- Shows top 20 provinces with most parcels
SELECT 
  province,
  COUNT(*) as count
FROM parcels
GROUP BY province
ORDER BY count DESC
LIMIT 20;


-- 5. COUNT BY REGION
-- Shows distribution across Philippine regions
SELECT 
  region,
  COUNT(*) as count
FROM parcels
GROUP BY region
ORDER BY count DESC;


-- 6. COUNT BY ISLAND
-- Shows Luzon, Visayas, Mindanao distribution
SELECT 
  island,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM parcels), 2) as percentage
FROM parcels
GROUP BY island
ORDER BY count DESC;


-- 7. CHECK FOR DUPLICATES
-- Shows records that appear more than once
SELECT 
  shipper_name,
  parcel_date,
  address,
  COUNT(*) as duplicate_count
FROM parcels
GROUP BY shipper_name, parcel_date, address
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC
LIMIT 20;


-- 8. COUNT BY MONTH AND STATUS
-- Detailed breakdown per month and status
SELECT 
  TO_CHAR(parcel_date, 'YYYY-MM') as month,
  normalized_status,
  COUNT(*) as count
FROM parcels
GROUP BY TO_CHAR(parcel_date, 'YYYY-MM'), normalized_status
ORDER BY month, count DESC;


-- 9. RECORDS WITH EMPTY CONTACT NUMBERS
-- Check how many records have no contact number
SELECT 
  COUNT(*) as records_without_contact,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM parcels), 2) as percentage
FROM parcels
WHERE contact_number IS NULL OR contact_number = '';


-- 10. FINANCIAL SUMMARY
-- Total amounts and costs
SELECT 
  COUNT(*) as total_parcels,
  SUM(cod_amount) as total_cod_amount,
  SUM(service_charge) as total_service_charge,
  SUM(total_cost) as total_cost,
  SUM(rts_fee) as total_rts_fee,
  AVG(cod_amount) as avg_cod_amount
FROM parcels;


-- 11. DATE RANGE CHECK
-- Shows earliest and latest dates
SELECT 
  MIN(parcel_date) as earliest_date,
  MAX(parcel_date) as latest_date,
  MAX(parcel_date) - MIN(parcel_date) as date_range_days
FROM parcels;


-- 12. SAMPLE RECORDS
-- View first 10 records to verify data
SELECT 
  id,
  parcel_date,
  shipper_name,
  address,
  contact_number,
  status,
  province,
  region,
  island
FROM parcels
ORDER BY id
LIMIT 10;


-- ============================================
-- QUICK VERIFICATION CHECKLIST
-- ============================================
-- Run these queries and check:
-- 
-- ✓ Total records = 981
-- ✓ 3 months only (Feb, Mar, Apr 2026)
-- ✓ No duplicates (query #7 returns 0 rows)
-- ✓ All provinces are valid Philippine provinces
-- ✓ Contact numbers are populated (not all empty)
-- ============================================

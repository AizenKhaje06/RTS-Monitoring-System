-- Update municipality field by extracting from address
-- This script handles various address formats (with or without commas)

-- Step 1: Update municipality from address field
UPDATE parcels
SET municipality = CASE
  -- Format with commas: "123, Municipality, Province"
  WHEN address IS NOT NULL AND address LIKE '%,%,%' THEN
    TRIM(BOTH ' ' FROM SPLIT_PART(
      address, 
      ',', 
      ARRAY_LENGTH(STRING_TO_ARRAY(address, ','), 1) - 1
    ))
  
  -- Format with commas (2 parts): "Municipality, Province"
  WHEN address IS NOT NULL AND address LIKE '%,%' THEN
    TRIM(BOTH ' ' FROM SPLIT_PART(address, ',', 1))
  
  -- Format without commas: Extract second-to-last word as municipality
  -- Example: "San Vicente binangonan rizal" -> "binangonan"
  WHEN address IS NOT NULL AND address LIKE '% % %' THEN
    TRIM(BOTH ' ' FROM SPLIT_PART(
      address,
      ' ',
      ARRAY_LENGTH(STRING_TO_ARRAY(TRIM(address), ' '), 1) - 1
    ))
  
  ELSE
    NULL
END
WHERE (municipality IS NULL OR municipality = '' OR municipality = 'Unknown')
  AND address IS NOT NULL
  AND address != '';

-- Step 2: Verify the update
SELECT 
  COUNT(*) as total_records,
  COUNT(CASE WHEN municipality IS NOT NULL AND municipality != '' AND municipality != 'NULL' THEN 1 END) as records_with_municipality,
  COUNT(CASE WHEN municipality IS NULL OR municipality = '' OR municipality = 'NULL' THEN 1 END) as records_without_municipality,
  ROUND(
    COUNT(CASE WHEN municipality IS NOT NULL AND municipality != '' AND municipality != 'NULL' THEN 1 END)::numeric / 
    NULLIF(COUNT(*), 0)::numeric * 100, 
    2
  ) as percentage_with_municipality
FROM parcels;

-- Step 3: Show sample of updated records
SELECT 
  id,
  address,
  municipality,
  province,
  region
FROM parcels
WHERE municipality IS NOT NULL AND municipality != '' AND municipality != 'NULL'
ORDER BY id
LIMIT 20;

-- Step 4: Show records that still don't have municipality
SELECT 
  id,
  address,
  municipality,
  province
FROM parcels
WHERE municipality IS NULL OR municipality = '' OR municipality = 'NULL'
LIMIT 10;

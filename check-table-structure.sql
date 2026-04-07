-- Check the table structure and column names
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'parcels'
ORDER BY ordinal_position;

-- Show sample data with all columns
SELECT *
FROM parcels
LIMIT 5;

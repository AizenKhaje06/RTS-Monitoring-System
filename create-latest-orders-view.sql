-- Create a view that shows orders sorted by latest first
-- This view will always show newest orders at the top

CREATE OR REPLACE VIEW latest_orders AS
SELECT *
FROM parcels
ORDER BY created_at DESC, id DESC;

-- Now you can view this in Supabase Table Editor
-- Go to: Table Editor → Views → latest_orders
-- This will always show newest orders first!

-- Optional: Create a view for today's orders only
CREATE OR REPLACE VIEW todays_orders AS
SELECT *
FROM parcels
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;

-- Optional: Create a view for this month's orders
CREATE OR REPLACE VIEW this_month_orders AS
SELECT *
FROM parcels
WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
ORDER BY created_at DESC;

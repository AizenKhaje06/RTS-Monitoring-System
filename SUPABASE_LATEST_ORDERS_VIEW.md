# Show Latest Orders First in Supabase

## Problem:
New orders appear on the last page (page 10) in Supabase Table Editor because default sort is by `id` ascending.

## Solution: Create a View

### Step 1: Run the SQL

1. Go to **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy contents of `create-latest-orders-view.sql`
4. Click **Run**

### Step 2: View the Results

After running the SQL, you'll have 3 new views:

#### 1. `latest_orders` - All Orders (Newest First)
- Go to **Table Editor** → **Views** → `latest_orders`
- Shows ALL orders sorted by newest first
- New orders will always appear at the top!

#### 2. `todays_orders` - Today's Orders Only
- Go to **Table Editor** → **Views** → `todays_orders`
- Shows only orders created today
- Sorted by newest first

#### 3. `this_month_orders` - This Month's Orders
- Go to **Table Editor** → **Views** → `this_month_orders`
- Shows only orders from current month
- Sorted by newest first

## How to Use:

### View Latest Orders:
1. Go to Supabase Dashboard
2. Click **Table Editor** (left sidebar)
3. Look for **Views** section (below Tables)
4. Click **latest_orders**
5. ✅ Newest orders are now at the top!

### Still Want to See Original Table:
- Click **Tables** → **parcels** (original table)
- Click `id` column header twice to sort descending
- Or click `created_at` column header twice

## Benefits of Using Views:

✅ **Always Sorted** - No need to manually click column headers
✅ **Fast** - Views are just saved queries, no extra storage
✅ **Filtered Options** - Can see today's or this month's orders only
✅ **Original Data Safe** - Views don't modify the actual table

## What's a View?

A view is like a "saved search" or "virtual table":
- It's NOT a copy of data (no extra storage)
- It's just a pre-defined query
- Always shows live data from the actual table
- You can't edit data in views (read-only)

## To Edit Orders:

If you need to edit an order:
1. Go to **Tables** → **parcels** (not the view)
2. Find the order
3. Edit it
4. Changes will appear in the view automatically

## Alternative: Bookmark a Sorted URL

1. Go to **parcels** table
2. Click `id` column twice (descending)
3. Bookmark the page
4. Next time, use the bookmark - sort is preserved!

## Summary:

- **For Viewing**: Use `latest_orders` view (always sorted)
- **For Editing**: Use `parcels` table (original)
- **For Today Only**: Use `todays_orders` view
- **For This Month**: Use `this_month_orders` view

Now you can easily see your latest orders first! 🎉

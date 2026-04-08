# Fix Supabase Issues - Delete & Create Not Working

## Issues Identified:

1. **Delete Item** - Deleted in system but NOT in Supabase
2. **Create Order** - Appears in dashboard but NOT saved in Supabase

## Root Cause:

The issue is with **Supabase Row Level Security (RLS) Policies**. The policies are blocking DELETE and INSERT operations.

## Solution:

### Step 1: Run the Fix SQL Script

1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `fix-supabase-policies.sql`
4. Click **Run**

This will:
- Fix RLS policies for `items` table (allow all operations)
- Fix RLS policies for `parcels` table (allow all operations)
- Verify the policies are correctly set

### Step 2: Verify the Fix

After running the SQL:

1. **Test Delete Item**:
   - Go to Orders page
   - Click "Manage Items"
   - Try deleting an item
   - Check Supabase Table Editor → items table
   - The item should have `is_active = false`

2. **Test Create Order**:
   - Click "New Order" button
   - Fill in the form
   - Submit
   - Check Supabase Table Editor → parcels table
   - The new order should appear

### Step 3: Check Browser Console

If still not working:

1. Open browser console (F12)
2. Try the operation again
3. Look for error messages:
   - `🗑️ Attempting to delete item:` - Shows delete attempt
   - `📥 Delete response:` - Shows API response
   - `❌ Error:` - Shows any errors

## What the SQL Script Does:

### For Items Table:
```sql
-- Drops old restrictive policies
-- Creates new policies that allow:
- SELECT (read) for all users
- INSERT (create) for all users  
- UPDATE (edit) for all users
- DELETE (soft delete) for all users
```

### For Parcels Table:
```sql
-- Enables RLS
-- Creates policies that allow:
- SELECT (read) for all users
- INSERT (create new orders) for all users
- UPDATE (edit orders) for all users
- DELETE (remove orders) for all users
```

## Alternative: Disable RLS (Not Recommended for Production)

If you're still testing and want to temporarily disable RLS:

```sql
-- Disable RLS on items table
ALTER TABLE items DISABLE ROW LEVEL SECURITY;

-- Disable RLS on parcels table
ALTER TABLE parcels DISABLE ROW LEVEL SECURITY;
```

⚠️ **Warning**: Only use this for testing! In production, you should have proper RLS policies.

## Troubleshooting:

### Issue: "permission denied for table items"
**Solution**: Run the fix SQL script to update policies

### Issue: "new row violates row-level security policy"
**Solution**: The INSERT policy is too restrictive. Run the fix SQL script.

### Issue: Still not working after running SQL
**Solution**: 
1. Check if you're using the correct Supabase project
2. Verify the table names are correct (items, parcels)
3. Check browser console for specific error messages
4. Try refreshing the page and clearing cache

## Expected Behavior After Fix:

✅ **Delete Item**: 
- Item disappears from list immediately
- Item's `is_active` set to `false` in Supabase
- Item won't appear in dropdown anymore

✅ **Create Order**:
- Order appears in dashboard immediately
- Order saved to Supabase `parcels` table
- Can see the order in Supabase Table Editor

## Need More Help?

Check the browser console logs:
- Look for `❌ Error` messages
- Check the Network tab for failed API calls
- Look at the Response tab to see exact error from Supabase

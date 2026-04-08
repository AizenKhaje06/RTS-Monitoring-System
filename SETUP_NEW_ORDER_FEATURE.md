# Setup Guide: New Order Feature

## Overview
This feature allows you to create new orders directly from the Orders page with a modal form. The items dropdown is populated from a Supabase `items` table.

## Setup Steps

### 1. Create Items Table in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `create-items-table.sql`
4. Click **Run** to execute the SQL

This will:
- Create the `items` table
- Insert 8 sample items (T-Shirt, Jeans, Shoes, etc.)
- Set up Row Level Security (RLS) policies
- Create necessary indexes

### 2. Verify Table Creation

1. Go to **Table Editor** in Supabase
2. You should see a new table called `items`
3. It should have 8 sample items with:
   - `id` (auto-generated)
   - `item_name` (e.g., "T-Shirt")
   - `description` (e.g., "Cotton T-Shirt")
   - `default_price` (e.g., 299.00)
   - `is_active` (true/false)
   - `created_at` and `updated_at` timestamps

### 3. Add More Items (Optional)

You can add more items through:

**Option A: Supabase Dashboard**
1. Go to Table Editor → items table
2. Click "Insert row"
3. Fill in the details
4. Click "Save"

**Option B: SQL**
```sql
INSERT INTO items (item_name, description, default_price) VALUES
  ('Your Item Name', 'Description', 999.00);
```

### 4. Test the Feature

1. Refresh your application
2. Go to the **Orders** page
3. Click the **"New Order"** button (top-right)
4. Fill in the form:
   - Date (auto-filled with today)
   - Customer Name (required)
   - Address (required)
   - Province (required)
   - Municipality (optional)
   - Region (dropdown with all PH regions)
   - Contact Number (required)
   - Items (dropdown - populated from items table)
   - Price (auto-filled when you select an item)
   - Tracking Number (auto-generated if empty)
   - Status (dropdown)
   - Service Charge (optional)
   - Shipping Cost (optional)
5. Click **"Create Order"**

### 5. What Happens After Creating an Order

1. ✅ Order is saved to Supabase `parcels` table
2. ✅ Toast notification appears: "Order Created"
3. ✅ Cache is cleared
4. ✅ Page refreshes to show the new order
5. ✅ Form resets for next order

## Features

### Auto-Fill Price
When you select an item from the dropdown, the price field automatically fills with the item's default price. You can still edit it if needed.

### Auto-Generate Tracking Number
If you leave the tracking number field empty, the system will automatically generate one in the format: `TRK-{timestamp}`

### Island Detection
The system automatically determines the island (Luzon/Visayas/Mindanao) based on the selected region.

### RTS Fee Calculation
The RTS fee is automatically calculated as 20% of the shipping cost.

## API Endpoints

### GET /api/items
Fetches all active items for the dropdown list.

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "item_name": "T-Shirt",
      "description": "Cotton T-Shirt",
      "default_price": 299.00,
      "is_active": true
    }
  ]
}
```

### POST /api/orders/create
Creates a new order in the database.

**Request Body:**
```json
{
  "parcel_date": "2026-04-08",
  "shipper_name": "John Doe",
  "address": "123 Main St, Manila",
  "contact_number": "09123456789",
  "cod_amount": 299.00,
  "items": "T-Shirt",
  "tracking_number": "TRK-123456",
  "status": "PENDING",
  "province": "Metro Manila",
  "municipality": "Manila",
  "region": "NCR",
  "island": "luzon",
  "service_charge": 50.00,
  "total_cost": 100.00
}
```

**Response:**
```json
{
  "success": true,
  "order": { /* created order data */ }
}
```

## Troubleshooting

### Items dropdown is empty
1. Check if the `items` table exists in Supabase
2. Verify that items have `is_active = true`
3. Check browser console for API errors
4. Verify RLS policies are set up correctly

### "Failed to create order" error
1. Check browser console for detailed error
2. Verify all required fields are filled
3. Check Supabase logs for database errors
4. Ensure RLS policies allow INSERT on `parcels` table

### Order created but not showing in table
1. The page should auto-refresh after creation
2. Try manually refreshing the page
3. Check if the order exists in Supabase Table Editor

## Managing Items

### Deactivate an Item
Instead of deleting items, set `is_active = false`:
```sql
UPDATE items SET is_active = false WHERE item_name = 'Old Item';
```

### Update Item Price
```sql
UPDATE items SET default_price = 399.00 WHERE item_name = 'T-Shirt';
```

### Add New Item
```sql
INSERT INTO items (item_name, description, default_price) 
VALUES ('New Product', 'Description here', 599.00);
```

## Files Created

1. `create-items-table.sql` - SQL script to create items table
2. `app/api/items/route.ts` - API to fetch items
3. `app/api/orders/create/route.ts` - API to create new order
4. `components/new-order-modal.tsx` - Modal form component
5. Updated `components/orders-table-view.tsx` - Added "New Order" button

## Next Steps

You can customize:
- Add more fields to the order form
- Add validation rules
- Add more items to the items table
- Customize the form layout
- Add image upload for items
- Add quantity field for multiple items

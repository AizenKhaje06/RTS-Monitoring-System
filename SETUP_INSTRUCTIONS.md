# CWAGO Analytics - Setup Instructions

## Google Sheets API Configuration

To connect your Google Sheets data to the dashboard, follow these steps:

### Step 1: Add Your Credentials to .env File

Open the `/app/.env` file and replace the placeholder values with your actual credentials:

\`\`\`bash
# Google Sheets API Configuration
GOOGLE_SHEETS_PRIVATE_KEY=your_private_key_here
GOOGLE_SHEETS_CLIENT_EMAIL=your_service_account_email@project.iam.gserviceaccount.com
GOOGLE_SHEET_ID=your_sheet_id_here
\`\`\`

### Step 2: Format Your Private Key

**IMPORTANT**: The private key from your service account JSON needs to be properly formatted:

1. Open your service account JSON file
2. Find the `private_key` field
3. Copy the entire key (including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`)
4. Paste it as a single line in the .env file
5. Keep the `\n` characters as they are (don't replace them with actual line breaks)

Example:
\`\`\`bash
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
\`\`\`

### Step 3: Get Your Client Email

From your service account JSON file, copy the `client_email` value:

\`\`\`bash
GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account@project-name.iam.gserviceaccount.com
\`\`\`

### Step 4: Get Your Sheet ID

The Sheet ID is found in your Google Sheets URL:

\`\`\`
https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_HERE/edit
                                        ^^^^^^^^^^^^^^^^^^
\`\`\`

Copy this ID and add it to .env:

\`\`\`bash
GOOGLE_SHEET_ID=1abc123def456ghi789jkl012mno345pqr678stu
\`\`\`

### Step 5: Share Your Sheet with Service Account

**CRITICAL**: You must share your Google Sheet with the service account email:

1. Open your Google Sheet
2. Click the "Share" button
3. Paste your service account email (from GOOGLE_SHEETS_CLIENT_EMAIL)
4. Give it "Viewer" permissions
5. Click "Done"

### Step 6: Verify Your Sheet Structure

Your Google Sheet should follow the CWAGO Tracking structure with columns A through AP:

**Core Data (A-F):**
- A: DATE
- B: AVERAGE SF
- C: TOTAL SF AMOUNT PER DAY
- D: ADS SPENT
- E: TOTAL NUMBER OF ORDERS
- F: AMOUNT (Total revenue)

**Order Stages (H-S):**
- H-J: Pending Not Printed (count, amount, %)
- K-M: Printed Waybill (count, amount, %)
- N-P: Fulfilled Order (count, amount, %)
- Q-S: Pending Printed Waybill (count, amount, %)

**Delivery Tracking (X-AI):**
- X-Z: In Transit (count, amount, %)
- AA-AC: On Delivery (count, amount, %)
- AD-AF: Detained (count, amount, %)
- AG-AI: Delivered (count, amount, %)

**Issues (AJ-AO):**
- AJ-AL: Cancelled (count, amount, %)
- AM-AO: Returned/RTS (count, amount, %)

**Additional:**
- AP: Not Yet Deliver %

See the uploaded file "COMPLETE COLUMN HEADERS - CWAGO TRA.txt" for full details.

### Step 7: Restart the Server

After updating the .env file, restart the Next.js server:

\`\`\`bash
sudo supervisorctl restart nextjs
\`\`\`

### Step 8: Test the Connection

Visit these endpoints to verify everything is working:

1. **Health Check**: `https://your-app-url.com/api/health`
2. **Analytics Data**: `https://your-app-url.com/api/analytics`
3. **Raw Sheet Data**: `https://your-app-url.com/api/sheets/raw`

## Dashboard Features

Once configured, your dashboard includes:

✅ **Real-time Auto-refresh** (every 30 seconds)
✅ **KPI Cards** - Total Page Views, Unique Visitors, Organic/Paid Traffic
✅ **Interactive Charts** - Line charts for trends, Bar charts for sources
✅ **Raw Data Table** - Complete data view
✅ **Dark Mode Support** - Beautiful modern UI
✅ **Manual Refresh** - Click refresh button anytime

## Troubleshooting

### Error: "Missing Google Sheets credentials"
- Check that all three environment variables are set in .env
- Make sure there are no extra spaces or quotes (except around the private key)

### Error: "Failed to fetch Google Sheets data"
- Verify you've shared the sheet with your service account email
- Check that the Sheet ID is correct
- Ensure the service account has viewer permissions

### Error: "Invalid private key"
- Make sure the private key includes BEGIN and END markers
- Keep the `\n` characters as `\n` (not actual line breaks)
- Try wrapping the entire key in double quotes

### No Data Showing
- Verify your sheet has the correct column headers: Date, MetricName, Value, Category
- Check that the first row contains headers
- Ensure date format is YYYY-MM-DD

## Need Help?

If you encounter any issues, check the server logs:
\`\`\`bash
tail -f /var/log/supervisor/nextjs.out.log
\`\`\`

# TODO: Add Google Sheets Integration with Service Account

## 1. Install Dependencies
- [x] Install next-auth for authentication
- [x] Install @auth/prisma-adapter if needed (optional for database sessions)
- [x] Ensure googleapis is installed (already in progress)

## 2. Set Up Google Service Account Credentials
- [x] Create Google Cloud Console project
- [x] Enable Google Sheets API
- [x] Create Service Account and download JSON key
- [x] Share the target spreadsheet with the service account email

## 3. Configure Environment Variables
- [x] Add GOOGLE_SHEETS_PRIVATE_KEY to .env.local (with \n replaced)
- [x] Add GOOGLE_SHEETS_CLIENT_EMAIL to .env.local
- [x] Add GOOGLE_SHEET_ID to .env.local (specific spreadsheet ID)

## 4. Create Google Sheets Processor
- [x] Update lib/google-sheets-processor.ts to use JWT authentication instead of OAuth
- [x] Implement function to fetch sheet data using googleapis with service account
- [x] Adapt processData function from excel-processor.ts for Google Sheets data

## 5. Update API Routes
- [x] Update app/api/google-sheets/process/route.ts to remove session checks
- [x] Update app/api/google-sheets/spreadsheets/route.ts to return configured spreadsheet
- [x] Update app/api/google-sheets/sheets/route.ts to use service account auth

## 6. Update Google Sheets Selector Component
- [x] Update components/google-sheets-selector.tsx to remove OAuth flow
- [x] Implement UI for selecting spreadsheets and sheets with service account

## 7. Testing and Verification
- [x] Test service account authentication flow
- [x] Test sheet selection and data fetching
- [x] Verify processed data matches Excel output
- [x] Test error handling for invalid sheets or permissions

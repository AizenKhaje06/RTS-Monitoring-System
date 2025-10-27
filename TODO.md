# TODO: Add Google Sheets Integration with OAuth

## 1. Install Dependencies
- [x] Install next-auth for authentication
- [x] Install @auth/prisma-adapter if needed (optional for database sessions)
- [x] Ensure googleapis is installed (already in progress)

## 2. Set Up Google OAuth Credentials
- [ ] Create Google Cloud Console project
- [ ] Enable Google Sheets API
- [ ] Create OAuth 2.0 credentials (Client ID and Secret)
- [ ] Configure authorized redirect URIs

## 3. Configure Environment Variables
- [x] Add NEXTAUTH_SECRET to .env.local
- [x] Add GOOGLE_CLIENT_ID to .env.local
- [x] Add GOOGLE_CLIENT_SECRET to .env.local
- [x] Add NEXTAUTH_URL to .env.local

## 4. Create NextAuth API Route
- [x] Create app/api/auth/[...nextauth]/route.ts
- [x] Configure Google provider
- [x] Set up session handling

## 5. Create Google Sheets Processor
- [x] Create lib/google-sheets-processor.ts
- [x] Implement function to fetch sheet data using googleapis
- [x] Adapt processData function from excel-processor.ts for Google Sheets data

## 6. Update Types (if needed)
- [ ] Add any new types to lib/types.ts for Google Sheets integration

## 7. Create Google Sheets Selector Component
- [x] Create components/google-sheets-selector.tsx
- [x] Implement UI for selecting spreadsheets and sheets after authentication

## 8. Update Upload Modal
- [x] Modify components/upload-modal.tsx to include "Connect Google Sheets" option
- [x] Handle authentication flow and sheet selection

## 9. Integrate with Main App
- [x] Update app/page.tsx or relevant components to handle Google Sheets data upload
- [x] Ensure processed data from Google Sheets matches Excel processing

## 10. Testing and Verification
- [ ] Test OAuth authentication flow
- [ ] Test sheet selection and data fetching
- [ ] Verify processed data matches Excel output
- [ ] Test error handling for invalid sheets or permissions

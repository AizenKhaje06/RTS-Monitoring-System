# Google Sheets Mapping Fixes

## Tasks
- [x] Update column mapping in `lib/google-sheets-processor.ts` to match UI expectations (Date, Status, Shipper, Consignee Region, COD Amount, Service Charge, Total Cost)
- [x] Add header validation to detect columns by name instead of fixed positions
- [x] Extract financial columns (COD Amount, Service Charge, Total Cost) and calculate RTS Fee
- [x] Clarify consignee region vs province handling
- [x] Update UI text in `components/upload-modal.tsx` and `components/google-sheets-selector.tsx` to reflect correct expected columns
- [ ] Test data processing with sample data to verify all columns are extracted correctly
- [ ] Confirm region/province mapping works as expected

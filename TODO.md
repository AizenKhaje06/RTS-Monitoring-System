# Optimize Data Loading Performance for Date Selection

## Tasks
- [ ] Implement client-side caching in app/page.js to store full dataset
- [ ] Modify lib/google-sheets.js to support date range filtering at API level
- [ ] Update app/api/[[...path]]/route.js to use cached data when available
- [ ] Add cache invalidation logic (time-based and manual refresh)
- [ ] Test performance improvements and data accuracy
- [ ] Add cache status indicator in UI

## Files to Modify
- app/page.js: Add caching state and logic
- lib/google-sheets.js: Add date range parameter to getSheetData
- app/api/[[...path]]/route.js: Implement cache-aware data fetching

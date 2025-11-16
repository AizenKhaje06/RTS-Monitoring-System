# TODO: Fix Total Parcel Data Discrepancy and Add Status Rate Cards

## Current Issue
- Parcel Page (dashboard-view.tsx): Shows total parcels as 31,817 for All Regions
- Performance Page (performance-report.tsx): Shows delivery rates based on resolved parcels (delivered + returned = 29,798), causing discrepancy

## Tasks
- [ ] Modify performance-report.tsx to calculate delivery and RTS rates based on total parcels instead of resolved parcels
- [ ] Add new rate cards for ONDELIVERY status (All Regions, Luzon, Visayas, Mindanao)
- [ ] Add new rate cards for PICKUP status (All Regions, Luzon, Visayas, Mindanao)
- [ ] Add new rate cards for INTRANSIT status (All Regions, Luzon, Visayas, Mindanao)
- [ ] Add new rate cards for CANCELLED status (All Regions, Luzon, Visayas, Mindanao)
- [ ] Add new rate cards for DETAINED status (All Regions, Luzon, Visayas, Mindanao)
- [ ] Add new rate cards for PROBLEMATIC status (All Regions, Luzon, Visayas, Mindanao)
- [ ] Verify that total parcel counts match between pages
- [ ] Test filtering and region switching functionality
